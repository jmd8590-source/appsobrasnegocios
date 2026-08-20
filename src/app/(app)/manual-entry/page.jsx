'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PenSquare,
  Camera,
  Save,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Tag,
  Scale,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import {
  CATALOG_MATERIALS,
  calculateValue,
} from '@/lib/pricing/service';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { createScrap } from '@/lib/scraps/service';

const CATEGORY_NAMES = {
  metal: 'Metales & Cables',
  wood: 'Madera & Tableros',
  plastic: 'Plásticos',
  construction: 'Residuos de Obra',
};

const CATEGORY_BADGES = {
  metal: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  wood: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  plastic: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  construction: 'bg-stone-500/15 text-stone-300 border-stone-500/30',
};

export default function ManualEntryPage() {
  const router = useRouter();

  // Categories & Materials
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMaterialName, setSelectedMaterialName] = useState(CATALOG_MATERIALS[0].name);
  
  // Custom material modal state
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('metal');
  const [customPrice, setCustomPrice] = useState(1.0);

  // Form fields
  const [quantity, setQuantity] = useState('10');
  const [unit, setUnit] = useState('kg');
  const [customRate, setCustomRate] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [status, setStatus] = useState('available');

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedScrap, setLastSavedScrap] = useState(null);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    if (selectedCategory === 'all') return CATALOG_MATERIALS;
    return CATALOG_MATERIALS.filter((m) => m.category === selectedCategory);
  }, [selectedCategory]);

  // Current selected material info
  const currentMaterial = useMemo(() => {
    if (isCustomMaterial && customName.trim()) {
      return {
        name: customName.trim(),
        category: customCategory,
        price: customPrice || 1.0,
        unit: unit,
        subtype: 'personalizado',
        description: 'Material añadido manualmente',
      };
    }
    const found = CATALOG_MATERIALS.find((m) => m.name === selectedMaterialName);
    return (
      found ?? {
        name: selectedMaterialName,
        category: 'metal',
        price: 1.0,
        unit: 'kg',
        subtype: 'otros',
      }
    );
  }, [isCustomMaterial, customName, customCategory, customPrice, selectedMaterialName, unit]);

  // Active price: either customized rate or official catalog price
  const activePrice = useMemo(() => {
    if (customRate !== '' && !isNaN(Number(customRate))) {
      return Number(customRate);
    }
    return currentMaterial.price;
  }, [customRate, currentMaterial]);

  const numQuantity = parseFloat(quantity) || 0;
  const totalValue = calculateValue(numQuantity, activePrice);

  const handleSelectMaterial = (name) => {
    if (name === '__custom__') {
      setIsCustomMaterial(true);
      return;
    }
    setIsCustomMaterial(false);
    setSelectedMaterialName(name);
    const mat = CATALOG_MATERIALS.find((m) => m.name === name);
    if (mat) {
      setUnit(mat.unit);
      setCustomRate(''); // Reset to official rate
    }
  };

  const handleQuickAddQty = (amount) => {
    const current = parseFloat(quantity) || 0;
    setQuantity((current + amount).toString());
  };

  const handleSave = async (addAnother = false) => {
    if (numQuantity <= 0) {
      toast({
        title: 'Cantidad requerida',
        description: 'Introduce un peso o número de unidades válido mayor a 0.',
        variant: 'destructive',
      });
      return;
    }

    if (isCustomMaterial && !customName.trim()) {
      toast({
        title: 'Nombre requerido',
        description: 'Escribe el nombre del material personalizado.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const savedScrap = await createScrap({
        material_name: currentMaterial.name,
        category: currentMaterial.category,
        subtype: currentMaterial.subtype,
        image_url: null,
        image_path: null,
        material_id: null,
        weight_kg: numQuantity,
        price_per_kg: activePrice,
        total_value: totalValue,
        currency: 'EUR',
        ai_confidence: null,
        condition_notes: conditionNotes.trim() || `${unit === 'ud' ? `${numQuantity} unidades` : `${numQuantity} kg`} entrada manual`,
        reference_object: null,
        status: status,
      });

      setLastSavedScrap(savedScrap);

      toast({
        title: '¡Material guardado!',
        description: `${savedScrap.material_name} (${numQuantity} ${unit}) añadido al inventario.`,
      });

      if (addAnother) {
        // Reset inputs for next item
        setQuantity('10');
        setCustomRate('');
        setConditionNotes('');
        setIsCustomMaterial(false);
        setCustomName('');
      } else {
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Error saving scrap:', err);
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar el material. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PenSquare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">Entrar a mano</h1>
          </div>
          <p className="text-sm text-slate-400">
            Añade materiales y pesadas directamente con precios oficiales de mercado actualizados.
          </p>
        </div>

        <Link href="/scanner">
          <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto text-slate-300 hover:text-amber-400">
            <Camera className="w-4 h-4 text-amber-400" />
            Escanear con cámara
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Selección de Material */}
          <Card className="border-slate-800 bg-slate-900/90 shadow-lg">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  1. Selecciona el material
                </Label>
                <Badge className={CATEGORY_BADGES[currentMaterial.category]}>
                  {CATEGORY_NAMES[currentMaterial.category]}
                </Badge>
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-amber-500 text-slate-950 font-semibold border-amber-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Todos ({CATALOG_MATERIALS.length})
                </button>
                {['metal', 'wood', 'plastic', 'construction'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 font-semibold border-amber-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {CATEGORY_NAMES[cat]}
                  </button>
                ))}
              </div>

              {/* Material Dropdown */}
              {!isCustomMaterial ? (
                <div>
                  <select
                    value={selectedMaterialName}
                    onChange={(e) => handleSelectMaterial(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {filteredMaterials.map((mat) => (
                      <option key={mat.name} value={mat.name}>
                        {mat.name} — {mat.price.toFixed(2)} €/{mat.unit} ({CATEGORY_NAMES[mat.category]})
                      </option>
                    ))}
                    <option value="__custom__">➕ + Añadir otro material personalizado...</option>
                  </select>

                  {currentMaterial.description && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                      <span className="text-amber-400">ℹ️</span> {currentMaterial.description}
                    </p>
                  )}
                </div>
              ) : (
                /* Custom Material Sub-Form */
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400">Nuevo material personalizado</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomMaterial(false)}
                      className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      Volver a catálogo
                    </button>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-400">Nombre del material</Label>
                    <Input
                      placeholder="Ej. Tubería multicapa, Baterías plomo..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-400">Categoría</Label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full h-10 mt-1 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="metal">Metal / Cable</option>
                        <option value="wood">Madera</option>
                        <option value="plastic">Plástico</option>
                        <option value="construction">Obra</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-400">Precio base (€/{unit})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Cantidad y Unidad */}
          <Card className="border-slate-800 bg-slate-900/90 shadow-lg">
            <CardContent className="p-5 space-y-4">
              <Label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                2. Cantidad y tipo de medida
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-400 mb-1 block">
                    Cantidad ({unit === 'kg' ? 'Pesada en Kilogramos' : 'Número de unidades'})
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="0.00"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="text-lg font-bold pl-4 pr-12 text-slate-100"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      {unit}
                    </span>
                  </div>
                </div>

                {/* Unit Switcher */}
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">Unidad de medida</Label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setUnit('kg')}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        unit === 'kg'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('ud')}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        unit === 'ud'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Unidades
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Add Buttons */}
              <div>
                <span className="text-[11px] text-slate-500 block mb-1.5">Suma rápida:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 5, 10, 25, 50, 100, 250, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAddQty(val)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      +{val} {unit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuantity('0')}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Detalles y Tarifa (Opcional) */}
          <Card className="border-slate-800 bg-slate-900/90 shadow-lg">
            <CardContent className="p-5 space-y-4">
              <Label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Hash className="w-4 h-4 text-amber-400" />
                3. Tarifa y notas (Opcional)
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">
                    Precio aplicado (€/{unit})
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={`Oficial: ${currentMaterial.price.toFixed(2)}`}
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Por defecto aplica tarifa oficial de mercado ({currentMaterial.price.toFixed(2)} €/{unit}).
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">Estado del material</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="available">Disponible en almacén</option>
                    <option value="in_lot">Asignado a lote</option>
                    <option value="sold">Vendido</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-400 mb-1 block">Notas de procedencia o condición</Label>
                <Textarea
                  placeholder="Ej: Procedente de desmonte nave 3, limpio, listo para recogida..."
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Calculation Summary Sidebar (Right 1 col) */}
        <div className="space-y-4">
          <Card className="border-amber-500/30 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl sticky top-6">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Cálculo Automático
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Tarifa oficial
                </span>
              </div>

              {/* Material selected */}
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Material</p>
                <p className="text-base font-bold text-slate-100 truncate">{currentMaterial.name}</p>
                <span className="text-xs text-slate-400">{CATEGORY_NAMES[currentMaterial.category]}</span>
              </div>

              {/* Metrics breakdown */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-500">Cantidad</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {numQuantity > 0 ? (unit === 'kg' ? formatWeight(numQuantity) : `${numQuantity} ud`) : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Precio unitario</p>
                  <p className="text-sm font-semibold text-amber-400">
                    {activePrice.toFixed(2)} €/{unit}
                  </p>
                </div>
              </div>

              {/* Big Total Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-950 border border-emerald-500/30 text-center">
                <p className="text-xs text-emerald-400 font-medium mb-1">VALOR TOTAL ESTIMADO</p>
                <p className="text-3xl font-extrabold text-emerald-400">
                  {formatCurrency(totalValue)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Calculado en tiempo real</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="amber"
                  className="w-full h-11 text-base font-semibold shadow-lg shadow-amber-500/20"
                  onClick={() => handleSave(false)}
                  disabled={isSaving || numQuantity <= 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar en inventario'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                  onClick={() => handleSave(true)}
                  disabled={isSaving || numQuantity <= 0}
                >
                  <PlusCircle className="w-4 h-4 mr-2 text-amber-400" />
                  Guardar y añadir otro
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tip */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Entrada rápida:</strong> Si tienes varios sacos o lotes, pulsa <em>&quot;Guardar y añadir otro&quot;</em> para registrar pesadas seguidas sin salir de esta pantalla.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && lastSavedScrap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">¡Material registrado con éxito!</h2>
              <p className="text-sm text-slate-400 mt-1">
                Se ha añadido <strong className="text-slate-200">{lastSavedScrap.material_name}</strong> a tu inventario.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Cantidad:</span>
                <span className="font-semibold text-slate-300">
                  {unit === 'kg' ? formatWeight(lastSavedScrap.weight_kg || 0) : `${lastSavedScrap.weight_kg} unidades`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Precio aplicado:</span>
                <span className="font-semibold text-slate-300">{lastSavedScrap.price_per_kg?.toFixed(2)} €/{unit}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-sm">
                <span className="text-slate-400">Total recuperado:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(lastSavedScrap.total_value || 0)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessModal(false);
                  setQuantity('10');
                  setCustomRate('');
                  setConditionNotes('');
                }}
              >
                Añadir otro
              </Button>
              <Button
                variant="amber"
                onClick={() => router.push('/inventory')}
              >
                Ver inventario
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
