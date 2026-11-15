import { getCurrentUser } from '@/lib/supabase/client-auth';
import {
  LOCAL_LISTINGS_KEY,
  LOCAL_SCRAPS_KEY,
  readLocalCollection,
  writeLocalCollection,
  generateEntityId,
} from '@/lib/storage/local-store';

// =====================================================
// ScrapLens — Listings (Lotes) Service
//
// Authenticated accounts are backed exclusively by Supabase filtered by
// `user_id` (excluding any `is_demo` records). Demo/unauthenticated sessions
// start with an empty portal (`[]`) and store only user-created lots locally.
// =====================================================

/**
 * Fetches lots belonging exclusively to the current portal session.
 */
export async function getListings() {
  const { supabase, user } = await getCurrentUser();

  if (user) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*, listing_scraps(scrap_id, scraps(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? [])
        .filter((listing) => listing.is_demo !== true)
        .map((listing) => ({
          ...listing,
          scraps: (listing.listing_scraps ?? [])
            .map((ls) => ls.scraps)
            .filter((scrap) => scrap && scrap.is_demo !== true),
        }));
    } catch (err) {
      console.error('[listings] Supabase fetch failed for authenticated user:', err);
      // Fail closed: never show demo/local data to a real account.
      return [];
    }
  }

  return readLocalCollection(LOCAL_LISTINGS_KEY);
}

/**
 * Creates a new lot, links its selected scraps, and marks them as `in_lot`.
 */
export async function createListing(listing) {
  const { supabase, user } = await getCurrentUser();
  const scrapIds = (listing.scraps ?? []).map((s) => s.id).filter(Boolean);
  const timestamp = new Date().toISOString();

  if (user) {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        title: listing.title,
        description: listing.description ?? '',
        total_value: listing.total_value ?? 0,
        total_weight_kg: listing.total_weight_kg ?? 0,
        status: listing.status ?? 'draft',
        is_demo: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[listings] Supabase insert error:', error);
      throw error;
    }

    if (scrapIds.length > 0) {
      const { error: linkError } = await supabase
        .from('listing_scraps')
        .insert(scrapIds.map((scrap_id) => ({ listing_id: data.id, scrap_id })));
      if (linkError) {
        console.error('[listings] Supabase listing_scraps link error:', linkError);
      } else {
        const { error: statusError } = await supabase
          .from('scraps')
          .update({ status: 'in_lot', updated_at: timestamp })
          .in('id', scrapIds)
          .eq('user_id', user.id);
        if (statusError) {
          console.error('[listings] Supabase scrap status update error:', statusError);
        }
      }
    }

    return { ...data, scraps: listing.scraps ?? [] };
  }

  const newListing = {
    id: generateEntityId('lot'),
    user_id: 'local-user',
    title: listing.title,
    description: listing.description ?? '',
    total_value: listing.total_value ?? 0,
    total_weight_kg: listing.total_weight_kg ?? 0,
    status: listing.status ?? 'draft',
    share_token: `share-${generateEntityId('tok')}`,
    is_demo: false,
    created_at: timestamp,
    updated_at: timestamp,
    scraps: listing.scraps ?? [],
  };

  const existingListings = readLocalCollection(LOCAL_LISTINGS_KEY);
  writeLocalCollection(LOCAL_LISTINGS_KEY, [newListing, ...existingListings]);

  if (scrapIds.length > 0) {
    const scrapIdSet = new Set(scrapIds);
    const existingScraps = readLocalCollection(LOCAL_SCRAPS_KEY);
    writeLocalCollection(
      LOCAL_SCRAPS_KEY,
      existingScraps.map((s) =>
        scrapIdSet.has(s.id) ? { ...s, status: 'in_lot', updated_at: timestamp } : s
      )
    );
  }

  return newListing;
}

/**
 * Deletes a lot and returns any unlinked `in_lot` scraps back to `available`.
 */
export async function removeListing(listingOrId) {
  const id = typeof listingOrId === 'string' ? listingOrId : listingOrId?.id;
  if (!id) throw new Error('Listing id is required');

  const { supabase, user } = await getCurrentUser();
  const timestamp = new Date().toISOString();

  if (user) {
    const { data: linkedRows } = await supabase
      .from('listing_scraps')
      .select('scrap_id')
      .eq('listing_id', id);
    const candidateScrapIds = (linkedRows ?? []).map((row) => row.scrap_id).filter(Boolean);

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('[listings] Supabase delete error:', error);
      throw error;
    }

    if (candidateScrapIds.length > 0) {
      const { data: stillLinked } = await supabase
        .from('listing_scraps')
        .select('scrap_id')
        .in('scrap_id', candidateScrapIds);
      const stillLinkedSet = new Set((stillLinked ?? []).map((row) => row.scrap_id));
      const freedIds = candidateScrapIds.filter((scrapId) => !stillLinkedSet.has(scrapId));

      if (freedIds.length > 0) {
        await supabase
          .from('scraps')
          .update({ status: 'available', updated_at: timestamp })
          .in('id', freedIds)
          .eq('user_id', user.id)
          .eq('status', 'in_lot');
      }
    }

    return;
  }

  const existingListings = readLocalCollection(LOCAL_LISTINGS_KEY);
  const target = existingListings.find((l) => l.id === id);
  const remainingListings = existingListings.filter((l) => l.id !== id);
  writeLocalCollection(LOCAL_LISTINGS_KEY, remainingListings);

  const candidateIds = (target?.scraps ?? []).map((s) => s.id).filter(Boolean);
  if (candidateIds.length > 0) {
    const stillLinkedSet = new Set(
      remainingListings.flatMap((l) => (l.scraps ?? []).map((s) => s.id).filter(Boolean))
    );
    const freedSet = new Set(candidateIds.filter((scrapId) => !stillLinkedSet.has(scrapId)));

    if (freedSet.size > 0) {
      const existingScraps = readLocalCollection(LOCAL_SCRAPS_KEY);
      writeLocalCollection(
        LOCAL_SCRAPS_KEY,
        existingScraps.map((s) =>
          freedSet.has(s.id) && s.status === 'in_lot'
            ? { ...s, status: 'available', updated_at: timestamp }
            : s
        )
      );
    }
  }
}

/**
 * Updates the status of an existing lot.
 */
export async function updateListingStatus(id, status) {
  const { supabase, user } = await getCurrentUser();
  const timestamp = new Date().toISOString();

  if (user) {
    const { error } = await supabase
      .from('listings')
      .update({ status, updated_at: timestamp })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('[listings] Supabase update error:', error);
      throw error;
    }
    return;
  }

  const existing = readLocalCollection(LOCAL_LISTINGS_KEY);
  const updated = existing.map((l) =>
    l.id === id ? { ...l, status, updated_at: timestamp } : l
  );
  writeLocalCollection(LOCAL_LISTINGS_KEY, updated);
}
