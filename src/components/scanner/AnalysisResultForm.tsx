'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, RotateCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrapFormSchema, type ScrapFormValues } from '@/lib/validations/scrap';
import type { ScrapAnalysis } from '@/types';
import {
  formatCurrency,
  formatConfidence,
  formatWeight,
  getConfidenceColor,
  getCategoryLabel,
} from '@/lib/utils';
import { DEMO_SCRAPS } from '@/lib/demo/data';

interface AnalysisResultFormProps {
  analysis: ScrapAnalysis;
  imageData: string | null;
  isDemo: boolean;
  onSaved: () => void;
  onRetake: () => void;
}

export function AnalysisResultForm({ analysis, imageData, isDemo, onSaved, onRetake }: AnalysisResultFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [totalValue, setTotalValue] = useState(analysis.estimated_total_value);

  const form = useForm<ScrapFormValues>({
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

  const onSubmit = async (data: ScrapFormValues) => {
    setIsSaving(true);
    try {
      // In demo mode, simulate saving
      await new Promise((resolve) => setTimeout(resolve, 800));
      // In real mode: save to Supabase
      onSaved();
    } catch {
      console.error('Error saving scrap');
    } finally {
      setIsSaving(false);
    }
  };

  const confidencePercent = Math.round(analysis.confidence_score * 100);

  return (
    <div className="space-y-4">
      {/* AI Result header */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        {imageData && (
          <img src={imageData} alt="Captura" className="w-20 h-16 rounded-xl object-cover shrink-0 border border-slate-700" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-100 truncate">{analysis.material_name}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={analysis.category}>{getCategoryLabel(analysis.category)}</Badge>
            <Badge variant="outline">{analysis.subtype}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-medium ${getConfidenceColor(analysis.confidence_score)}`}>
              {formatConfidence(analysis.confidence_score)} confianza
            </span>
            <div className="flex-1">
              <Progress
                value={confidencePercent}
                indicatorClassName={
                  confidencePercent >= 85 ? 'bg-emerald-500' :
                  confidencePercent >= 70 ? 'bg-amber-500' : 'bg-red-500'
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Demo / disclaimer banner */}
      {isDemo ? (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200">
            <strong>Modo demo:</strong> Resultado simulado para demostración. Conecta Gemini API para análisis real.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-900 border border-slate-700">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300">Estimación orientativa.</strong> Los pesos, precios y valores son aproximaciones generadas por IA. Verifica antes de usar como referencia comercial.
          </p>
        </div>
      )}

      {/* Value summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <p className="text-xs text-slate-500 mb-1">Peso est.</p>
          <p className="text-base font-bold text-slate-100">{formatWeight(analysis.estimated_weight_kg)}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <p className="text-xs text-slate-500 mb-1">€/kg</p>
          <p className="text-base font-bold text-amber-400">{formatCurrency(analysis.suggested_price_per_kg)}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-800/40 text-center">
          <p className="text-xs text-emerald-500 mb-1">Valor total</p>
          <p className="text-base font-bold text-emerald-400">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Editable form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Editar datos antes de guardar</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="material_name">Material</Label>
              <Input id="material_name" {...form.register('material_name')} className="mt-1" />
              {form.formState.errors.material_name && <p className="text-xs text-red-400 mt-1">{form.formState.errors.material_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="weight_kg">Peso (kg)</Label>
              <Input id="weight_kg" type="number" step="0.01" {...form.register('weight_kg')} className="mt-1" />
              {form.formState.errors.weight_kg && <p className="text-xs text-red-400 mt-1">{form.formState.errors.weight_kg.message}</p>}
            </div>
            <div>
              <Label htmlFor="price_per_kg">Precio €/kg</Label>
              <Input id="price_per_kg" type="number" step="0.01" {...form.register('price_per_kg')} className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="condition_notes">Observaciones</Label>
            <Textarea id="condition_notes" {...form.register('condition_notes')} className="mt-1" rows={3} placeholder="Estado del material, procedencia, etc." />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onRetake} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Nueva foto
          </Button>
          <Button type="submit" variant="amber" disabled={isSaving} className="flex-1">
            {isSaving ? (
              <><span className="w-4 h-4 mr-2 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />Guardando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Guardar</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
