'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Search, Filter, Camera, PenSquare, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from '@/hooks/use-toast';
import { DEMO_SCRAPS } from '@/lib/demo/data';
import type { Scrap, MaterialCategory, ScrapStatus } from '@/types';
import {
  formatCurrency,
  formatWeight,
  formatRelativeTime,
  getCategoryLabel,
  getStatusLabel,
  getStatusColor,
  getCategoryColor,
} from '@/lib/utils';

const STATUS_OPTIONS: ScrapStatus[] = ['available', 'in_lot', 'sold', 'discarded'];
const CATEGORY_OPTIONS: MaterialCategory[] = ['metal', 'wood', 'plastic', 'construction'];

export default function InventoryPage() {
  const [scraps, setScraps] = useState<Scrap[]>(DEMO_SCRAPS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingScrap, setEditingScrap] = useState<Scrap | null>(null);
  const [deletingScrap, setDeletingScrap] = useState<Scrap | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = scraps.filter((s) => {
    const matchesSearch =
      s.material_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.condition_notes ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalFilteredValue = filtered.reduce((acc, s) => acc + s.total_value, 0);

  const handleDelete = (scrap: Scrap) => {
    setScraps((prev) => prev.filter((s) => s.id !== scrap.id));
    setDeletingScrap(null);
    toast({ title: 'Sobrante eliminado', description: `${scrap.material_name} eliminado del inventario` });
  };

  const handleSaveEdit = (updated: Scrap) => {
    setScraps((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingScrap(null);
    toast({ title: 'Cambios guardados', description: 'Sobrante actualizado correctamente' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Inventario</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} sobrante{filtered.length !== 1 ? 's' : ''} · {formatCurrency(totalFilteredValue)} valor total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/manual-entry">
            <Button variant="outline" size="sm" className="gap-2 border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50">
              <PenSquare className="w-4 h-4 text-amber-400" />
              Entrar a mano
            </Button>
          </Link>
          <Link href="/scanner">
            <Button variant="amber" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              Escanear
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Buscar por material u observaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <EmptyState
          icon={Package}
          title="Sin sobrantes"
          description={search || categoryFilter !== 'all' || statusFilter !== 'all' ? 'No hay resultados para tus filtros.' : 'Escanea tu primer material para empezar.'}
          action={
            search || categoryFilter !== 'all' || statusFilter !== 'all' ? (
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all'); }}>
                Limpiar filtros
              </Button>
            ) : (
              <Link href="/scanner"><Button variant="amber" size="sm"><Camera className="w-4 h-4 mr-2" />Escanear</Button></Link>
            )
          }
        />
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((scrap) => (
          <Card key={scrap.id} className="card-hover group">
            <CardContent className="p-4">
              {/* Image placeholder */}
              <div className="w-full h-32 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 overflow-hidden">
                {scrap.image_url ? (
                  <img src={scrap.image_url} alt={scrap.material_name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-10 h-10 text-slate-600" />
                )}
              </div>

              {/* Material info */}
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-100 truncate mb-1">{scrap.material_name}</h3>
                <div className="flex gap-1.5 flex-wrap">
                  <Badge variant={scrap.category}>{getCategoryLabel(scrap.category)}</Badge>
                  <Badge variant={scrap.status as 'available' | 'in_lot' | 'sold' | 'discarded'}>{getStatusLabel(scrap.status)}</Badge>
                </div>
              </div>

              {/* Values */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-slate-800 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">Peso</p>
                  <p className="text-xs font-semibold text-slate-200">{formatWeight(scrap.weight_kg)}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-900/30 border border-emerald-800/30 text-center">
                  <p className="text-[10px] text-emerald-500 mb-0.5">Valor</p>
                  <p className="text-xs font-semibold text-emerald-400">{formatCurrency(scrap.total_value)}</p>
                </div>
              </div>

              {/* Notes */}
              {scrap.condition_notes && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{scrap.condition_notes}</p>
              )}

              {/* Timestamp + actions */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600">{formatRelativeTime(scrap.created_at)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingScrap(scrap)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setDeletingScrap(scrap)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-900/40 flex items-center justify-center transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingScrap && (
        <EditScrapDialog
          scrap={editingScrap}
          onClose={() => setEditingScrap(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deletingScrap} onOpenChange={() => setDeletingScrap(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar sobrante</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            ¿Eliminar <strong className="text-slate-200">{deletingScrap?.material_name}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingScrap(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deletingScrap && handleDelete(deletingScrap)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline Edit Dialog
function EditScrapDialog({ scrap, onClose, onSave }: { scrap: Scrap; onClose: () => void; onSave: (s: Scrap) => void }) {
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
          <DialogTitle>Editar sobrante</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Material</Label>
            <Input value={form.material_name} onChange={(e) => setForm((p) => ({ ...p, material_name: e.target.value }))} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.01" value={form.weight_kg} onChange={(e) => setForm((p) => ({ ...p, weight_kg: parseFloat(e.target.value) || 0 }))} className="mt-1" />
            </div>
            <div>
              <Label>Precio €/kg</Label>
              <Input type="number" step="0.001" value={form.price_per_kg} onChange={(e) => setForm((p) => ({ ...p, price_per_kg: parseFloat(e.target.value) || 0 }))} className="mt-1" />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-900/20 border border-emerald-800/30 text-center">
            <p className="text-xs text-emerald-500">Valor estimado</p>
            <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalValue)}</p>
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as ScrapStatus }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observaciones</Label>
            <textarea
              value={form.condition_notes}
              onChange={(e) => setForm((p) => ({ ...p, condition_notes: e.target.value }))}
              className="mt-1 w-full min-h-[80px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Observaciones..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="amber" onClick={handleSave}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
