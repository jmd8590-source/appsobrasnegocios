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
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import {
  CATALOG_MATERIALS,
  calculateValue,
} from '@/lib/pricing/service';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { createScrap } from '@/lib/scraps/service';

const CATEGORY_BADGES = {
  metal: 'bg-accent/15 text-accent border-accent/30',
  wood: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  plastic: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  construction: 'bg-stone-500/15 text-stone-700 dark:text-stone-300 border-stone-500/30',
};

export default function ManualEntryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const CATEGORY_NAMES = {
    metal: t('manualEntry.categoryMetal'),
    wood: t('manualEntry.categoryWood'),
    plastic: t('manualEntry.categoryPlastic'),
    construction: t('manualEntry.categoryConstruction'),
  };

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
        description: t('manualEntry.customMaterialHint'),
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
  }, [isCustomMaterial, customName, customCategory, customPrice, selectedMaterialName, unit, t]);

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
        title: t('manualEntry.quantityRequiredTitle'),
        description: t('manualEntry.quantityRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (isCustomMaterial && !customName.trim()) {
      toast({
        title: t('manualEntry.nameRequiredTitle'),
        description: t('manualEntry.nameRequiredDesc'),
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
        title: t('manualEntry.savedToastTitle'),
        description: t('manualEntry.savedToastDesc', { name: savedScrap.material_name, qty: numQuantity, unit }),
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
        title: t('manualEntry.saveErrorTitle'),
        description: t('manualEntry.saveErrorDesc'),
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
            <span className="p-2 rounded-xl bg-accent/10 text-accent border border-accent/20">
              <PenSquare className="w-5 h-5" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-bold text-ink">{t('manualEntry.title')}</h1>
          </div>
          <p className="text-sm text-ink-muted">{t('manualEntry.subtitle')}</p>
        </div>

        <Link href="/scanner">
          <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto text-ink-muted hover:text-accent">
            <Camera className="w-4 h-4 text-accent" aria-hidden="true" />
            {t('manualEntry.scanWithCamera')}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Selección de Material */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="material-select" className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Tag className="w-4 h-4 text-accent" aria-hidden="true" />
                  {t('manualEntry.step1')}
                </Label>
                <Badge className={CATEGORY_BADGES[currentMaterial.category]}>
                  {CATEGORY_NAMES[currentMaterial.category]}
                </Badge>
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs" role="group" aria-label={t('manualEntry.categoryLabel')}>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  aria-pressed={selectedCategory === 'all'}
                  className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-accent text-accent-ink font-semibold border-accent-strong'
                      : 'bg-surface-2 text-ink-muted border-edge hover:bg-edge'
                  }`}
                >
                  {t('common.all')} ({CATALOG_MATERIALS.length})
                </button>
                {['metal', 'wood', 'plastic', 'construction'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    aria-pressed={selectedCategory === cat}
                    className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-accent text-accent-ink font-semibold border-accent-strong'
                        : 'bg-surface-2 text-ink-muted border-edge hover:bg-edge'
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
                    id="material-select"
                    value={selectedMaterialName}
                    onChange={(e) => handleSelectMaterial(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-edge-strong text-ink text-sm focus:outline-none focus:ring-2 focus:ring-focus"
                  >
                    {filteredMaterials.map((mat) => (
                      <option key={mat.name} value={mat.name}>
                        {mat.name} — {mat.price.toFixed(2)} €/{mat.unit} ({CATEGORY_NAMES[mat.category]})
                      </option>
                    ))}
                    <option value="__custom__">➕ {t('manualEntry.addCustom')}</option>
                  </select>

                  {currentMaterial.description && (
                    <p className="text-xs text-ink-muted mt-2 flex items-center gap-1.5">
                      <span className="text-accent" aria-hidden="true">ℹ️</span> {currentMaterial.description}
                    </p>
                  )}
                </div>
              ) : (
                /* Custom Material Sub-Form */
                <div className="p-4 rounded-xl bg-surface-2 border border-accent/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-accent">{t('manualEntry.newCustomMaterial')}</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomMaterial(false)}
                      className="text-xs text-ink-muted hover:text-ink underline cursor-pointer"
                    >
                      {t('manualEntry.backToCatalog')}
                    </button>
                  </div>

                  <div>
                    <Label htmlFor="custom-material-name" className="text-xs text-ink-muted">{t('manualEntry.customNameLabel')}</Label>
                    <Input
                      id="custom-material-name"
                      placeholder={t('manualEntry.customNamePlaceholder')}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="custom-material-category" className="text-xs text-ink-muted">{t('manualEntry.categoryLabel')}</Label>
                      <select
                        id="custom-material-category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-edge-strong text-ink text-xs focus:outline-none focus:ring-2 focus:ring-focus"
                      >
                        <option value="metal">{CATEGORY_NAMES.metal}</option>
                        <option value="wood">{CATEGORY_NAMES.wood}</option>
                        <option value="plastic">{CATEGORY_NAMES.plastic}</option>
                        <option value="construction">{CATEGORY_NAMES.construction}</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="custom-material-price" className="text-xs text-ink-muted">
                        {t('manualEntry.basePriceLabel', { unit })}
                      </Label>
                      <Input
                        id="custom-material-price"
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
          <Card>
            <CardContent className="p-5 space-y-4">
              <Label className="text-sm font-semibold text-ink flex items-center gap-2">
                <Scale className="w-4 h-4 text-accent" aria-hidden="true" />
                {t('manualEntry.step2')}
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <Label htmlFor="quantity-input" className="text-xs text-ink-muted mb-1 block">
                    {unit === 'kg' ? t('manualEntry.quantityWeightLabel') : t('manualEntry.quantityUnitsLabel')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="quantity-input"
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="0.00"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="text-lg font-bold pl-4 pr-12 text-ink"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">
                      {unit}
                    </span>
                  </div>
                </div>

                {/* Unit Switcher */}
                <div>
                  <span className="text-xs text-ink-muted mb-1 block">{t('manualEntry.unitMeasure')}</span>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-2 border border-edge" role="group" aria-label={t('manualEntry.unitMeasure')}>
                    <button
                      type="button"
                      onClick={() => setUnit('kg')}
                      aria-pressed={unit === 'kg'}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        unit === 'kg'
                          ? 'bg-accent text-accent-ink shadow'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {t('manualEntry.unitKg')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('ud')}
                      aria-pressed={unit === 'ud'}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        unit === 'ud'
                          ? 'bg-accent text-accent-ink shadow'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {t('manualEntry.unitUd')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Add Buttons */}
              <div>
                <span className="text-[11px] text-ink-faint block mb-1.5">{t('manualEntry.quickAdd')}</span>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 5, 10, 25, 50, 100, 250, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAddQty(val)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-surface-2 border border-edge text-ink-muted hover:bg-edge hover:text-accent transition-colors cursor-pointer"
                    >
                      +{val} {unit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuantity('0')}
                    className="px-2.5 py-1 text-xs rounded-lg bg-surface border border-edge text-ink-faint hover:text-danger transition-colors cursor-pointer"
                  >
                    {t('manualEntry.clearAmount')}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Detalles y Tarifa (Opcional) */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <Label className="text-sm font-semibold text-ink flex items-center gap-2">
                <Hash className="w-4 h-4 text-accent" aria-hidden="true" />
                {t('manualEntry.step3')}
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price-applied-input" className="text-xs text-ink-muted mb-1 block">
                    {t('manualEntry.priceAppliedLabel', { unit })}
                  </Label>
                  <Input
                    id="price-applied-input"
                    type="number"
                    step="0.01"
                    placeholder={currentMaterial.price.toFixed(2)}
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-ink-faint mt-1">
                    {t('manualEntry.officialDefault', { price: currentMaterial.price.toFixed(2), unit })}
                  </p>
                </div>

                <div>
                  <Label htmlFor="material-status-select" className="text-xs text-ink-muted mb-1 block">{t('manualEntry.materialStatus')}</Label>
                  <select
                    id="material-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-edge-strong text-ink text-sm focus:outline-none focus:ring-2 focus:ring-focus"
                  >
                    <option value="available">{t('manualEntry.statusAvailableWarehouse')}</option>
                    <option value="in_lot">{t('manualEntry.statusAssignedLot')}</option>
                    <option value="sold">{t('manualEntry.statusSold')}</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="condition-notes" className="text-xs text-ink-muted mb-1 block">{t('manualEntry.notesLabel')}</Label>
                <Textarea
                  id="condition-notes"
                  placeholder={t('manualEntry.notesPlaceholder')}
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
          <Card className="border-accent/30 sticky top-6">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-edge">
                <span className="text-xs uppercase tracking-wider font-semibold text-ink-muted">
                  {t('manualEntry.calcHeader')}
                </span>
                <span className="flex items-center gap-1 text-xs text-positive font-medium">
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('manualEntry.officialRate')}
                </span>
              </div>

              {/* Material selected */}
              <div>
                <p className="text-xs text-ink-faint mb-0.5">{t('inventory.material')}</p>
                <p className="text-base font-bold text-ink truncate">{currentMaterial.name}</p>
                <span className="text-xs text-ink-muted">{CATEGORY_NAMES[currentMaterial.category]}</span>
              </div>

              {/* Metrics breakdown */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-2 border border-edge">
                <div>
                  <p className="text-[11px] text-ink-faint">{t('manualEntry.quantity')}</p>
                  <p className="text-sm font-semibold text-ink">
                    {numQuantity > 0 ? (unit === 'kg' ? formatWeight(numQuantity) : `${numQuantity} ud`) : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-faint">{t('manualEntry.unitPrice')}</p>
                  <p className="text-sm font-semibold text-accent">
                    {activePrice.toFixed(2)} €/{unit}
                  </p>
                </div>
              </div>

              {/* Big Total Card */}
              <div className="p-4 rounded-xl bg-positive/10 border border-positive/30 text-center">
                <p className="text-xs text-positive font-medium mb-1 uppercase tracking-wide">{t('manualEntry.totalEstimated')}</p>
                <p className="text-3xl font-extrabold text-positive">
                  {formatCurrency(totalValue)}
                </p>
                <p className="text-[11px] text-ink-faint mt-1">{t('manualEntry.realtimeCalc')}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="amber"
                  className="w-full h-11 text-base font-semibold"
                  onClick={() => handleSave(false)}
                  disabled={isSaving || numQuantity <= 0}
                >
                  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                  {isSaving ? t('common.saving') : t('manualEntry.saveToInventory')}
                </Button>

                <Button
                  variant="outline"
                  className="w-full text-ink-muted hover:text-ink hover:bg-surface-2"
                  onClick={() => handleSave(true)}
                  disabled={isSaving || numQuantity <= 0}
                >
                  <PlusCircle className="w-4 h-4 mr-2 text-accent" aria-hidden="true" />
                  {t('manualEntry.saveAndAddAnother')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tip */}
          <div className="p-4 rounded-xl bg-surface border border-edge flex items-start gap-3">
            <span className="text-lg" aria-hidden="true">💡</span>
            <p className="text-xs text-ink-muted leading-relaxed">
              <strong>{t('manualEntry.quickTipTitle')}</strong> {t('manualEntry.quickTipBody')}
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && lastSavedScrap && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-entry-success-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-in"
        >
          <div className="w-full max-w-md bg-surface border border-edge rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-positive/15 text-positive border border-positive/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>

            <div>
              <h2 id="manual-entry-success-title" className="text-xl font-bold text-ink">{t('manualEntry.successTitle')}</h2>
              <p className="text-sm text-ink-muted mt-1">
                {t('manualEntry.successDesc', { name: lastSavedScrap.material_name })}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-2 border border-edge text-left space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-faint">{t('manualEntry.successQuantity')}</span>
                <span className="font-semibold text-ink-muted">
                  {unit === 'kg' ? formatWeight(lastSavedScrap.weight_kg || 0) : `${lastSavedScrap.weight_kg} unidades`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-faint">{t('manualEntry.successPrice')}</span>
                <span className="font-semibold text-ink-muted">{lastSavedScrap.price_per_kg?.toFixed(2)} €/{unit}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-edge text-sm">
                <span className="text-ink-muted">{t('manualEntry.successTotal')}</span>
                <span className="font-bold text-positive">{formatCurrency(lastSavedScrap.total_value || 0)}</span>
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
                {t('manualEntry.addAnother')}
              </Button>
              <Button
                variant="amber"
                onClick={() => router.push('/inventory')}
              >
                {t('manualEntry.viewInventory')}
                <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
