'use client';

import { useState } from 'react';
import { Layers, Plus, Share2, Download, ExternalLink, Zap, Package, CheckSquare, Square, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from '@/hooks/use-toast';
import { DEMO_SCRAPS, DEMO_LISTINGS } from '@/lib/demo/data';
import type { Listing, Scrap } from '@/types';
import {
  formatCurrency,
  formatWeight,
  formatRelativeTime,
  getStatusLabel,
  generateShareUrl,
  generateWhatsAppUrl,
  getCategoryLabel,
} from '@/lib/utils';

type ListingStatus = 'draft' | 'active' | 'sold' | 'archived';
const STATUS_COLORS: Record<ListingStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  sold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  archived: 'bg-slate-600/20 text-slate-500 border-slate-600/30',
};
const STATUS_LABELS: Record<ListingStatus, string> = { draft: 'Borrador', active: 'Activo', sold: 'Vendido', archived: 'Archivado' };

export default function LotsPage() {
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState<Listing | null>(null);

  const handleCreated = (listing: Listing) => {
    setListings((prev) => [listing, ...prev]);
    toast({ title: '✅ Lote creado', description: `"${listing.title}" listo para compartir` });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Lotes</h1>
          <p className="text-sm text-slate-400 mt-0.5">Agrupa sobrantes y genera fichas comerciales</p>
        </div>
        <Button variant="amber" size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo lote
        </Button>
      </div>

      {/* Empty state */}
      {listings.length === 0 && (
        <EmptyState
          icon={Layers}
          title="Sin lotes"
          description="Crea tu primer lote agrupando sobrantes del inventario"
          action={
            <Button variant="amber" size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear lote
            </Button>
          }
        />
      )}

      {/* Listings grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {listings.map((listing) => (
          <Card key={listing.id} className="card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base line-clamp-2 mb-2">{listing.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[listing.status as ListingStatus]}`}>
                      {STATUS_LABELS[listing.status as ListingStatus]}
                    </span>
                    <span className="text-xs text-slate-500">{formatRelativeTime(listing.created_at)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">Valor est.</p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(listing.total_value)}</p>
                  <p className="text-xs text-slate-500">{formatWeight(listing.total_weight_kg)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Scraps preview */}
              {listing.scraps && listing.scraps.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {listing.scraps.map((scrap) => (
                    <div key={scrap.id} className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                      <Package className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-300 whitespace-nowrap">{scrap.material_name}</span>
                      <span className="text-xs text-amber-400">{formatCurrency(scrap.total_value)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Description preview */}
              {listing.description && (
                <p className="text-xs text-slate-500 line-clamp-3 mb-4">{listing.description.replace(/\*\*/g, '').replace(/\n/g, ' ')}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowShareDialog(listing)}>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Compartir
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExportPDF(listing)}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create dialog */}
      <CreateLotDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={handleCreated}
      />

      {/* Share dialog */}
      {showShareDialog && (
        <ShareLotDialog
          listing={showShareDialog}
          onClose={() => setShowShareDialog(null)}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------
// Create Lot Dialog
// -------------------------------------------------------
function CreateLotDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (l: Listing) => void }) {
  const availableScraps = DEMO_SCRAPS.filter((s) => s.status === 'available');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedScraps = availableScraps.filter((s) => selectedIds.includes(s.id));
  const totalValue = selectedScraps.reduce((acc, s) => acc + s.total_value, 0);
  const totalWeight = selectedScraps.reduce((acc, s) => acc + s.weight_kg, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (selectedIds.length === 0) {
      toast({ title: 'Sin sobrantes', description: 'Selecciona al menos un sobrante', variant: 'destructive' });
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

      const timestamp = new Date().toISOString();
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const newListing: Listing = {
        id: `lot-${randomSuffix}`,
        user_id: 'demo',
        title: data.data?.title ?? 'Lote de materiales de recuperación',
        description: data.data?.description ?? '',
        total_value: totalValue,
        total_weight_kg: totalWeight,
        status: 'draft',
        share_token: `share-${randomSuffix}`,
        is_demo: true,
        created_at: timestamp,
        updated_at: timestamp,
        scraps: selectedScraps,
      };

      onCreated(newListing);
      setSelectedIds([]);
      onClose();
    } catch {
      toast({ title: 'Error al generar lote', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Crear nuevo lote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-400">Selecciona los sobrantes disponibles para incluir en el lote:</p>

          {availableScraps.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No hay sobrantes disponibles.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableScraps.map((scrap) => {
                const isSelected = selectedIds.includes(scrap.id);
                return (
                  <button
                    key={scrap.id}
                    onClick={() => toggleSelect(scrap.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                      isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{scrap.material_name}</p>
                      <p className="text-xs text-slate-500">{formatWeight(scrap.weight_kg)}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400 shrink-0">{formatCurrency(scrap.total_value)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-700">
              <span className="text-sm text-slate-400">{selectedIds.length} sobrante{selectedIds.length > 1 ? 's' : ''} · {formatWeight(totalWeight)}</span>
              <span className="text-base font-bold text-emerald-400">{formatCurrency(totalValue)}</span>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-slate-400">Se generará automáticamente un título y descripción comercial para el lote.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancelar</Button>
          <Button variant="amber" onClick={handleCreate} disabled={isGenerating || selectedIds.length === 0}>
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Crear lote</>
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
function ShareLotDialog({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const shareUrl = generateShareUrl(listing.share_token);
  const whatsappUrl = generateWhatsAppUrl(shareUrl, listing.title);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: '¡Enlace copiado!', description: 'Pégalo donde quieras compartirlo' });
    } catch {
      toast({ title: 'No se pudo copiar', variant: 'destructive' });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            Compartir lote
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-300 font-medium line-clamp-2">{listing.title}</p>

          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-500 mb-1">Enlace compartible</p>
            <p className="text-xs text-slate-300 break-all font-mono">{shareUrl}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="emerald" onClick={handleCopy} className="w-full">
              {copied ? '✓ ¡Copiado!' : 'Copiar enlace'}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(whatsappUrl, '_blank')}
            >
              <span className="text-lg">💬</span>
              Compartir por WhatsApp
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            El enlace mostrará una ficha pública con los detalles del lote
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// PDF export (simplified)
function handleExportPDF(listing: Listing) {
  toast({ title: 'PDF generado', description: `Ficha de "${listing.title}" descargada` });
  // In production: use jsPDF to generate proper PDF
  const content = `SCRAPLENS — FICHA DE LOTE\n\n${listing.title}\n\nValor estimado: ${formatCurrency(listing.total_value)}\nPeso total: ${formatWeight(listing.total_weight_kg)}\n\n${listing.description ?? ''}\n\n⚠️ Los precios son orientativos y no constituyen oferta comercial vinculante.`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scraplens-lote-${listing.id.slice(-6)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
