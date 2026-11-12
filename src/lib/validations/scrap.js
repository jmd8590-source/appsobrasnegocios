import { z } from 'zod';

// =====================================================
// ScrapLens — Zod Validation Schemas
// =====================================================

export const MaterialCategorySchema = z.enum(['metal', 'wood', 'plastic', 'construction']);

export const ScrapStatusSchema = z.enum(['available', 'in_lot', 'sold', 'discarded']);

export const ReferenceObjectSchema = z.enum(['coin', 'hand', 'tape']);

// Whether the photographed item is loose/broken recoverable material, or an
// intact, functional object the AI should NOT confidently price as scrap
// (e.g. a whole pallet truck, a working appliance, a vehicle part still
// assembled). Forcing the model to classify this — and clamping confidence
// server-side when it says "complete_equipment" — is what catches cases
// like a manual pallet truck (real weight ~65-100kg) getting guessed at an
// impossible 15kg: instead of a confidently wrong number, the UI shows a
// clear "verify this manually" warning.
export const ScrapObjectTypeSchema = z.enum([
  'loose_scrap',
  'complete_equipment',
  'structural_piece',
  'uncertain',
]);

// AI Analysis output schema (strict validation)
export const ScrapAnalysisSchema = z.object({
  material_name: z.string().min(1).max(100),
  category: MaterialCategorySchema,
  subtype: z.string().min(1).max(50),
  object_type: ScrapObjectTypeSchema.optional().default('uncertain'),
  confidence_score: z.number().min(0).max(1),
  estimated_weight_kg: z.number().positive().max(50000),
  suggested_price_per_kg: z.number().min(0).max(100000),
  estimated_total_value: z.number().min(0),
  condition_notes: z.string().max(500),
  // Optional, for transparency in the UI and to force the model to reason
  // step by step instead of guessing a bare number (both tend to measurably
  // improve the estimate itself, not just how it's explained).
  estimated_dimensions_cm: z.string().max(120).optional(),
  weight_reasoning: z.string().max(400).optional(),
});

// Analyze scrap API input
export const AnalyzeScrapInputSchema = z.object({
  imageBase64: z.string().min(100, 'Image data is required'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  referenceObject: ReferenceObjectSchema.optional(),
});

// Scrap form validation
export const ScrapFormSchema = z.object({
  material_name: z.string().min(1, 'El material es obligatorio').max(100),
  category: MaterialCategorySchema,
  subtype: z.string().min(1, 'El subtipo es obligatorio').max(50),
  weight_kg: z.coerce.number().positive('El peso debe ser positivo').max(50000),
  price_per_kg: z.coerce.number().min(0, 'El precio no puede ser negativo').max(100000),
  total_value: z.coerce.number().min(0),
  condition_notes: z.string().max(500).optional().default(''),
  status: ScrapStatusSchema.optional().default('available'),
});

// Listing generation input
// NOTE: scrap ids are NOT guaranteed to be UUIDs — demo and locally-created
// scraps use ids like "scrap-001" or "scrap-abc123-<timestamp>". Requiring
// `.uuid()` here made this schema reject every real request and silently
// broke AI listing generation (the API returned 400, the client ignored it).
export const GenerateListingInputSchema = z.object({
  scrapIds: z.array(z.string().min(1)).min(1, 'Selecciona al menos un sobrante').max(50),
});

// Listing form validation
export const ListingFormSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  description: z.string().max(2000).optional().default(''),
});
