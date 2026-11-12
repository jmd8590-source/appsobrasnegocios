'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrapFormSchema } from '@/lib/validations/scrap';
import {
  formatCurrency,
  formatConfidence,
  formatWeight,
  getConfidenceColor,
  getCategoryLabel,
} from '@/lib/utils';
import { createScrap } from '@/lib/scraps/service';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export function AnalysisResultForm({ analysis, imageData, isDemo, onSaved, onRetake }) {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [totalValue, setTotalValue] = useState(analysis.estimated_total_value);

  const form = useForm({
    resolver: zodResolver(ScrapFormSchema),
    defaultValues: {
      material_name: analysis.material_name,
      category: analysis.category,
      subtype: analysis.subtype,
      weight_kg: analysis.estimated_weight_kg,
      price_per_kg: analysis.suggested_price_per_kg,
      total_value: analysis.estimated_total_value,
      condition_notes: analysis.condition_notes,
      status: 'available',
    },
  });

  const { watch, setValue } = form;
  const weight = watch('weight_kg');
  const price = watch('price_per_kg');

  // Recalculate total when weight or price changes
  useEffect(() => {
    const newTotal = Math.round(Number(weight) * Number(price) * 100) / 100;
    if (!isNaN(newTotal)) {
      setValue('total_value', newTotal);
      setTotalValue(newTotal);
    }
  }, [weight, price, setValue]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await createScrap({
        material_name: data.material_name,
        category: data.category,
        subtype: data.subtype || analysis.subtype,
        image_url: imageData,
        image_path: null,
        material_id: null,
        weight_kg: Number(data.weight_kg),
        price_per_kg: Number(data.price_per_kg),
        total_value: Number(data.total_value),
        currency: 'EUR',
        ai_confidence: analysis.confidence_score,
        condition_notes: data.condition_notes || analysis.condition_notes,
        reference_object: null,
        status: data.status,
      });
      onSaved();
    } catch (err) {
      console.error('Error saving scrap:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const confidencePercent = Math.round(analysis.confidence_score * 100);
  const needsVerification = analysis.confidence_score < 0.4 || analysis.object_type === 'complete_equipment';
  const hasReasoning = Boolean(analysis.estimated_dimensions_cm || analysis.weight_reasoning);

  return (
    <div className="space-y-4">
      {/* Low-confidence / complete-equipment warning — the safety net that
          replaces a confidently wrong number (e.g. "15kg" for a whole
          pallet truck) with an explicit prompt to verify manually. */}
      {needsVerification && (
        <div role="alert" className="flex items-start gap-3 p-4 rounded-xl bg-danger-ink border border-danger/40">
          <ShieldAlert className="w-5 h-5 text-danger mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-danger">{t('scanner.verifyWarningTitle')}</p>
            <p className="text-xs text-ink-muted mt-1">{t('scanner.verifyWarningBody')}</p>
          </div>
        </div>
      )}

      {/* AI Result header */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-edge">
        {imageData && (
          <img src={imageData} alt={t('scanner.previewBadge')} className="w-20 h-16 rounded-xl object-cover shrink-0 border border-edge" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-positive shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold text-ink truncate">{analysis.material_name}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={analysis.category}>{getCategoryLabel(analysis.category)}</Badge>
            <Badge variant="outline">{analysis.subtype}</Badge>
            {analysis.object_type === 'complete_equipment' && (
              <Badge className="bg-danger/15 text-danger border-danger/30">
                {t('scanner.completeEquipmentBadge')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-medium ${getConfidenceColor(analysis.confidence_score)}`}>
              {t('scanner.resultConfidence', { percent: formatConfidence(analysis.confidence_score) })}
            </span>
            <div className="flex-1">
              <Progress
                value={confidencePercent}
                indicatorClassName={
                  confidencePercent >= 85 ? 'bg-positive' :
                  confidencePercent >= 70 ? 'bg-accent' : 'bg-danger'
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-surface border border-edge">
        <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-xs text-ink-muted">
          <strong className="text-ink">{t('scanner.estimateDisclaimerStrong')}</strong> {t('scanner.estimateDisclaimerBody')}
        </p>
      </div>

      {/* Value summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-surface border border-edge text-center">
          <p className="text-xs text-ink-faint mb-1">{t('scanner.estWeight')}</p>
          <p className="text-base font-bold text-ink">{formatWeight(analysis.estimated_weight_kg)}</p>
        </div>
        <div className="p-3 rounded-xl bg-surface border border-edge text-center">
          <p className="text-xs text-ink-faint mb-1">{t('scanner.pricePerKg')}</p>
          <p className="text-base font-bold text-accent">{formatCurrency(analysis.suggested_price_per_kg)}</p>
        </div>
        <div className="p-3 rounded-xl bg-positive/10 border border-positive/30 text-center">
          <p className="text-xs text-positive mb-1">{t('scanner.totalValue')}</p>
          <p className="text-base font-bold text-positive">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Transparency: show the AI's reasoning instead of a black-box number */}
      {hasReasoning && (
        <div className="p-4 rounded-xl bg-surface border border-edge space-y-2">
          <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
            {t('scanner.howCalculated')}
          </p>
          {analysis.estimated_dimensions_cm && (
            <p className="text-xs text-ink-muted">
              <span className="text-ink-faint">{t('scanner.estimatedDimensions')}: </span>
              {analysis.estimated_dimensions_cm}
            </p>
          )}
          {analysis.weight_reasoning && (
            <p className="text-xs text-ink-muted">
              <span className="text-ink-faint">{t('scanner.weightReasoning')}: </span>
              {analysis.weight_reasoning}
            </p>
          )}
        </div>
      )}

      {/* Editable form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 rounded-xl bg-surface border border-edge space-y-4">
          <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide">{t('scanner.editBeforeSaving')}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="material_name">{t('inventory.material')}</Label>
              <Input id="material_name" {...form.register('material_name')} className="mt-1" />
              {form.formState.errors.material_name && <p className="text-xs text-danger mt-1">{form.formState.errors.material_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="weight_kg">{t('inventory.weightKg')}</Label>
              <Input id="weight_kg" type="number" step="0.01" {...form.register('weight_kg')} className="mt-1" />
              {form.formState.errors.weight_kg && <p className="text-xs text-danger mt-1">{form.formState.errors.weight_kg.message}</p>}
            </div>
            <div>
              <Label htmlFor="price_per_kg">{t('inventory.pricePerKg')}</Label>
              <Input id="price_per_kg" type="number" step="0.01" {...form.register('price_per_kg')} className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="condition_notes">{t('inventory.notes')}</Label>
            <Textarea id="condition_notes" {...form.register('condition_notes')} className="mt-1" rows={3} placeholder={t('inventory.notesPlaceholder')} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onRetake} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            {t('scanner.newPhoto')}
          </Button>
          <Button type="submit" variant="amber" disabled={isSaving} className="flex-1">
            {isSaving ? (
              <><span className="w-4 h-4 mr-2 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />{t('common.saving')}</>
            ) : (
              <><Save className="w-4 h-4 mr-2" aria-hidden="true" />{t('common.save')}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
