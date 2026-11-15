'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, Share2, Download, Package, CheckSquare, Square, Zap, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { getScraps } from '@/lib/scraps/service';
import { getListings, createListing, removeListing } from '@/lib/listings/service';
import {
  formatCurrency,
  formatWeight,
  formatRelativeTime,
  generateShareUrl,
  generateWhatsAppUrl,
} from '@/lib/utils';

const STATUS_STYLES = {
  draft: 'bg-surface-2 text-ink-muted border-edge-strong',
  active: 'bg-positive/15 text-positive border-positive/30',
  sold: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  archived: 'bg-ink-faint/15 text-ink-faint border-ink-faint/30',
};

export default function LotsPage() {
  const { t } = useLanguage();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(null);
  const [deletingListing, setDeletingListing] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const STATUS_LABELS = {
    draft: t('lots.statusDraft'),
    active: t('lots.statusActive'),
    sold: t('lots.statusSold'),
    archived: t('lots.statusArchived'),
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getListings();
        setListings(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreated = (listing) => {
    setListings((prev) => [listing, ...prev]);
    toast({ title: t('lots.createdToastTitle'), description: t('lots.createdToastDesc', { title: listing.title }) });
  };

  const handleDeleteLot = async (listing) => {
    setIsDeleting(true);
    try {
      await removeListing(listing.id);
      setListings((prev) => prev.filter((item) => item.id !== listing.id));
      setDeletingListing(null);
      toast({
        title: t('lots.deletedToastTitle'),
        description: t('lots.deletedToastDesc', { title: listing.title }),
      });
    } catch {
      toast({ title: t('lots.deleteErrorTitle'), variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('lots.title')}</h1>
          <p className="text-sm text-ink-muted mt-0.5">{t('lots.subtitle')}</p>
        </div>
        <Button variant="amber" size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          {t('lots.newLot')}
        </Button>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && listings.length === 0 && (
        <EmptyState
          icon={Layers}
          title={t('lots.emptyTitle')}
          description={t('lots.emptyDesc')}
          action={
            <Button variant="amber" size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('lots.createLot')}
            </Button>
          }
        />
      )}

      {/* Listings grid */}
      {!isLoading && listings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-2 mb-2">{listing.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[listing.status]}`}>
                        {STATUS_LABELS[listing.status]}
                      </span>
                      <span className="text-xs text-ink-faint">{formatRelativeTime(listing.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-ink-faint">{t('lots.valueEst')}</p>
                    <p className="text-xl font-bold text-positive">{formatCurrency(listing.total_value)}</p>
                    <p className="text-xs text-ink-faint">{formatWeight(listing.total_weight_kg)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Scraps preview */}
                {listing.scraps && listing.scraps.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {listing.scraps.map((scrap) => (
                      <div key={scrap.id} className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-edge">
                        <Package className="w-3 h-3 text-ink-faint" aria-hidden="true" />
                        <span className="text-xs text-ink-muted whitespace-nowrap">{scrap.material_name}</span>
                        <span className="text-xs text-accent">{formatCurrency(scrap.total_value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Description preview */}
                {listing.description && (
                  <p className="text-xs text-ink-faint line-clamp-3 mb-4">{listing.description.replace(/\*\*/g, '').replace(/\n/g, ' ')}</p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowShareDialog(listing)}>
                    <Share2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    {t('lots.share')}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExportPDF(listing, t)}>
                    <Download className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    {t('lots.pdf')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger border-danger/30 hover:bg-danger/10 hover:text-danger hover:border-danger/50"
                    onClick={() => setDeletingListing(listing)}
                    aria-label={`${t('common.delete')} ${listing.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    {t('common.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      {showCreateDialog && (
        <CreateLotDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Share dialog */}
      {showShareDialog && (
        <ShareLotDialog
          listing={showShareDialog}
          onClose={() => setShowShareDialog(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deletingListing}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingListing(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('lots.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ink-muted">
            {t('lots.deleteConfirm', { title: deletingListing?.title ?? '' })}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingListing(null)}
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingListing && handleDeleteLot(deletingListing)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  {t('common.delete')}
                </>
              ) : (
                t('common.delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -------------------------------------------------------
// Create Lot Dialog
// -------------------------------------------------------
function CreateLotDialog({ onClose, onCreated }) {
  const { t } = useLanguage();
  const [allScraps, setAllScraps] = useState([]);
  const [isLoadingScraps, setIsLoadingScraps] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function loadScraps() {
      try {
        const data = await getScraps();
        setAllScraps(data);
      } finally {
        setIsLoadingScraps(false);
      }
    }
    loadScraps();
  }, []);

  const availableScraps = allScraps.filter((s) => s.status === 'available');
  const selectedScraps = availableScraps.filter((s) => selectedIds.includes(s.id));
  const totalValue = selectedScraps.reduce((acc, s) => acc + s.total_value, 0);
  const totalWeight = selectedScraps.reduce((acc, s) => acc + s.weight_kg, 0);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (selectedIds.length === 0) {
      toast({ title: t('lots.noScrapsSelectedTitle'), description: t('lots.noScrapsSelectedDesc'), variant: 'destructive' });
      return;
    }
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapIds: selectedIds,
          scraps: selectedScraps.map((s) => ({ material_name: s.material_name, weight_kg: s.weight_kg, total_value: s.total_value })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Listing generation failed');
      }

      const newListing = await createListing({
        title: data.data?.title ?? 'Lote de materiales de recuperación',
        description: data.data?.description ?? '',
        total_value: totalValue,
        total_weight_kg: totalWeight,
        status: 'draft',
        scraps: selectedScraps,
      });

      onCreated(newListing);
      setSelectedIds([]);
      onClose();
    } catch {
      toast({ title: t('lots.createErrorTitle'), variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" aria-hidden="true" />
            {t('lots.createDialogTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-ink-muted">{t('lots.selectScrapsHint')}</p>

          {isLoadingScraps ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : availableScraps.length === 0 ? (
            <p className="text-sm text-ink-faint text-center py-6">{t('lots.noAvailable')}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableScraps.map((scrap) => {
                const isSelected = selectedIds.includes(scrap.id);
                return (
                  <button
                    key={scrap.id}
                    onClick={() => toggleSelect(scrap.id)}
                    aria-pressed={isSelected}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected ? 'border-accent bg-accent/10' : 'border-edge bg-surface-2 hover:border-edge-strong'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                    ) : (
                      <Square className="w-4 h-4 text-ink-faint shrink-0" aria-hidden="true" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{scrap.material_name}</p>
                      <p className="text-xs text-ink-faint">{formatWeight(scrap.weight_kg)}</p>
                    </div>
                    <span className="text-sm font-semibold text-positive shrink-0">{formatCurrency(scrap.total_value)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-edge-strong">
              <span className="text-sm text-ink-muted">
                {t('lots.selectedSummary', {
                  count: selectedIds.length,
                  plural: selectedIds.length > 1 ? 's' : '',
                  weight: formatWeight(totalWeight),
                })}
              </span>
              <span className="text-base font-bold text-positive">{formatCurrency(totalValue)}</span>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/5 border border-accent/20">
            <Zap className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
            <p className="text-xs text-ink-muted">{t('lots.aiHint')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>{t('common.cancel')}</Button>
          <Button variant="amber" onClick={handleCreate} disabled={isGenerating || selectedIds.length === 0}>
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />{t('lots.generating')}</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" aria-hidden="true" />{t('lots.createLot')}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------
// Share Lot Dialog
// -------------------------------------------------------
function ShareLotDialog({ listing, onClose }) {
  const { t } = useLanguage();
  const shareUrl = generateShareUrl(listing.share_token);
  const whatsappUrl = generateWhatsAppUrl(shareUrl, listing.title);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t('common.copied'), description: t('lots.shareNote') });
    } catch {
      toast({ title: t('lots.copyErrorTitle'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-positive" aria-hidden="true" />
            {t('lots.shareDialogTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-ink-muted font-medium line-clamp-2">{listing.title}</p>

          <div className="p-3 rounded-xl bg-surface-2 border border-edge">
            <p className="text-xs text-ink-faint mb-1">{t('lots.shareableLink')}</p>
            <p className="text-xs text-ink-muted break-all font-mono">{shareUrl}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="emerald" onClick={handleCopy} className="w-full">
              {copied ? `✓ ${t('common.copied')}` : t('lots.copyLink')}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(whatsappUrl, '_blank')}
            >
              <span className="text-lg" aria-hidden="true">💬</span>
              {t('lots.shareWhatsapp')}
            </Button>
          </div>

          <p className="text-xs text-ink-faint text-center">{t('lots.shareNote')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// PDF export (simplified) — receives `t` from the calling component since
// this helper lives outside the component tree and has no hook access.
function handleExportPDF(listing, t) {
  toast({ title: t('lots.pdfGeneratedTitle'), description: t('lots.pdfGeneratedDesc', { title: listing.title }) });
  const content = `SCRAPLENS\n\n${listing.title}\n\n${t('lots.valueEst')}: ${formatCurrency(listing.total_value)}\n${formatWeight(listing.total_weight_kg)}\n\n${listing.description ?? ''}\n\n⚠️ ${t('common.disclaimer')}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scraplens-lote-${listing.id.slice(-6)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
