import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { resolveSupabaseTarget, pingSupabase } from '@/lib/supabase/keepalive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function isAuthorizedCronRequest(request, expectedSecret) {
  const authHeader = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${expectedSecret}`;
  const receivedBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expected);
  if (receivedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(receivedBuf, expectedBuf);
}

/**
 * Lightweight keep-alive endpoint for scheduled cron jobs to keep Supabase active.
 */
export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && !isAuthorizedCronRequest(request, cronSecret)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const target = resolveSupabaseTarget(process.env);
  if (!target) {
    return NextResponse.json(
      { ok: false, configured: false, error: 'Supabase is not configured' },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const result = await pingSupabase(target);
    return NextResponse.json(result, { status: 200, headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error('[keepalive] Supabase ping failed:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Supabase ping failed' },
      { status: 502, headers: NO_STORE_HEADERS }
    );
  }
}

