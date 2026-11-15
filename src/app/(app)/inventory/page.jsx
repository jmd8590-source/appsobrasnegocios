'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, Filter, Camera, PenSquare, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { getScraps, removeScrap, updateScrapItem } from '@/lib/scraps/service';
import { formatCurrency, formatWeight, formatRelativeTime } from '@/lib/utils';

const STATUS_OPTIONS = ['available', 'in_lot', 'sold', 'discarded'];
const CATEGORY_OPTIONS = ['metal', 'wood', 'plastic', 'construction'];

export default function InventoryPage() {
  const { t } = useLanguage();
  const [scraps, setScraps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingScrap, setEditingScrap] = useState(null);
  const [deletingScrap, setDeletingScrap] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getScraps();
        setScraps(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = scraps.filter((s) => {
    const matchesSearch =
      s.material_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.condition_notes ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalFilteredValue = filtered.reduce((acc, s) => acc + s.total_value, 0);
  const hasActiveFilters = Boolean(search) || categoryFilter !== 'all' || statusFilter !== 'all';

  const handleDelete = async (scrap) => {
    try {
      await removeScrap(scrap.id);
      setScraps((prev) => prev.filter((s) => s.id !== scrap.id));
      setDeletingScrap(null);
      toast({
        title: t('inventory.deletedToastTitle'),
        description: t('inventory.deletedToastDesc', { name: scrap.material_name }),
      });
    } catch {
      toast({ title: t('inventory.deleteErrorTitle'), variant: 'destructive' });
    }
  };

  const handleSaveEdit = async (updated) => {
    try {
      await updateScrapItem(updated.id, {
        material_name: updated.material_name,
        category: updated.category,
        subtype: updated.subtype || undefined,
        weight_kg: updated.weight_kg,
        price_per_kg: updated.price_per_kg,
        total_value: updated.total_value,
        condition_notes: updated.condition_notes || '',
        status: updated.status,
      });
      setScraps((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditingScrap(null);
      toast({ title: t('inventory.savedToastTitle'), description: t('inventory.savedToastDesc') });
    } catch {
      toast({ title: t('inventory.saveErrorTitle'), variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('inventory.title')}</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {t('inventory.subtitleCount', {
              count: filtered.length,
              plural: filtered.length !== 1 ? 's' : '',
              value: formatCurrency(totalFilteredValue),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/manual-entry">
            <Button variant="outline" size="sm" className="gap-2 hover:text-accent hover:border-accent/50">
              <PenSquare className="w-4 h-4 text-accent" aria-hidden="true" />
              {t('dashboard.manualEntry')}
            </Button>
          </Link>
          <Link href="/scanner">
            <Button variant="amber" size="sm">
              <Camera className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('dashboard.scan')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" aria-hidden="true" />
          <label htmlFor="inventory-search" className="sr-only">
            {t('inventory.searchPlaceholder')}
          </label>
          <Input
            id="inventory-search"
            placeholder={t('inventory.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36" aria-label={t('inventory.category')}>
              <Filter className="w-3.5 h-3.5 mr-1.5 text-ink-faint" aria-hidden="true" />
              <SelectValue placeholder={t('inventory.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{t(`categoryLabel.${c}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" aria-label={t('inventory.status')}>
              <SelectValue placeholder={t('inventory.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{t(`statusLabel.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="w-full h-32 rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Package}
          title={t('inventory.emptyTitle')}
          description={hasActiveFilters ? t('inventory.emptyDescFiltered') : t('inventory.emptyDescEmpty')}
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all'); }}>
                {t('inventory.clearFilters')}
              </Button>
            ) : (
              <Link href="/scanner"><Button variant="amber" size="sm"><Camera className="w-4 h-4 mr-2" aria-hidden="true" />{t('dashboard.scan')}</Button></Link>
            )
          }
        />
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((scrap) => (
          <Card key={scrap.id} className="card-hover group">
            <CardContent className="p-4">
              {/* Image placeholder */}
              <div className="w-full h-32 rounded-xl bg-surface-2 border border-edge flex items-center justify-center mb-3 overflow-hidden">
                {scrap.image_url ? (
                  <img src={scrap.image_url} alt={scrap.material_name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-10 h-10 text-ink-faint" aria-hidden="true" />
                )}
              </div>

              {/* Material info */}
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-ink truncate mb-1">{scrap.material_name}</h3>
                <div className="flex gap-1.5 flex-wrap">
                  <Badge variant={scrap.category}>{t(`categoryLabel.${scrap.category}`)}</Badge>
                  <Badge variant={scrap.status}>{t(`statusLabel.${scrap.status}`)}</Badge>
                </div>
              </div>

              {/* Values */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-surface-2 text-center">
                  <p className="text-[10px] text-ink-faint mb-0.5">{t('inventory.weight')}</p>
                  <p className="text-xs font-semibold text-ink">{formatWeight(scrap.weight_kg)}</p>
                </div>
                <div className="p-2 rounded-lg bg-positive/10 border border-positive/20 text-center">
                  <p className="text-[10px] text-positive mb-0.5">{t('inventory.value')}</p>
                  <p className="text-xs font-semibold text-positive">{formatCurrency(scrap.total_value)}</p>
                </div>
              </div>

              {/* Notes */}
              {scrap.condition_notes && (
                <p className="text-xs text-ink-faint line-clamp-2 mb-3">{scrap.condition_notes}</p>
              )}

              {/* Timestamp + actions */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink-faint">{formatRelativeTime(scrap.created_at)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingScrap(scrap)}
                    className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-edge flex items-center justify-center transition-colors cursor-pointer"
                    aria-label={`${t('common.edit')} ${scrap.material_name}`}
                    title={t('common.edit')}
                  >
                    <Pencil className="w-3 h-3 text-ink-muted" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setDeletingScrap(scrap)}
                    className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-danger/15 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label={`${t('common.delete')} ${scrap.material_name}`}
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-3 h-3 text-ink-muted hover:text-danger" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingScrap && (
        <EditScrapDialog
          scrap={editingScrap}
          onClose={() => setEditingScrap(null)}
          onSave={handleSaveEdit}
          t={t}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deletingScrap} onOpenChange={() => setDeletingScrap(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('inventory.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ink-muted">
            {t('inventory.deleteConfirm', { name: deletingScrap?.material_name ?? '' })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingScrap(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={() => deletingScrap && handleDelete(deletingScrap)}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline Edit Dialog
function EditScrapDialog({ scrap, onClose, onSave, t }) {
  const [form, setForm] = useState({
    material_name: scrap.material_name,
    weight_kg: scrap.weight_kg,
    price_per_kg: scrap.price_per_kg,
    condition_notes: scrap.condition_notes ?? '',
    status: scrap.status,
  });

  const totalValue = Math.round(Number(form.weight_kg) * Number(form.price_per_kg) * 100) / 100;

  const handleSave = () => {
    onSave({ ...scrap, ...form, total_value: totalValue, updated_at: new Date().toISOString() });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('inventory.editTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-material">{t('inventory.material')}</Label>
            <Input id="edit-material" value={form.material_name} onChange={(e) => setForm((p) => ({ ...p, material_name: e.target.value }))} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-weight">{t('inventory.weightKg')}</Label>
              <Input id="edit-weight" type="number" step="0.01" value={form.weight_kg} onChange={(e) => setForm((p) => ({ ...p, weight_kg: parseFloat(e.target.value) || 0 }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-price">{t('inventory.pricePerKg')}</Label>
              <Input id="edit-price" type="number" step="0.001" value={form.price_per_kg} onChange={(e) => setForm((p) => ({ ...p, price_per_kg: parseFloat(e.target.value) || 0 }))} className="mt-1" />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-positive/10 border border-positive/20 text-center">
            <p className="text-xs text-positive">{t('inventory.estimatedValue')}</p>
            <p className="text-xl font-bold text-positive">{formatCurrency(totalValue)}</p>
          </div>
          <div>
            <Label htmlFor="edit-status">{t('inventory.status')}</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger id="edit-status" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{t(`statusLabel.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-notes">{t('inventory.notes')}</Label>
            <textarea
              id="edit-notes"
              value={form.condition_notes}
              onChange={(e) => setForm((p) => ({ ...p, condition_notes: e.target.value }))}
              className="mt-1 w-full min-h-[80px] rounded-lg border border-edge-strong bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent resize-none"
              placeholder={t('inventory.notesPlaceholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="amber" onClick={handleSave}>{t('inventory.saveChanges')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
