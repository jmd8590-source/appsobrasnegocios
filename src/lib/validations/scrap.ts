import { z } from 'zod';

// =====================================================
// ScrapLens — Zod Validation Schemas
// =====================================================

export const MaterialCategorySchema = z.enum(['metal', 'wood', 'plastic', 'construction']);

export const ScrapStatusSchema = z.enum(['available', 'in_lot', 'sold', 'discarded']);

export const ReferenceObjectSchema = z.enum(['coin', 'hand', 'tape']);

// AI Analysis output schema (strict validation)
export const ScrapAnalysisSchema = z.object({
  material_name: z.string().min(1).max(100),
  category: MaterialCategorySchema,
  subtype: z.string().min(1).max(50),
  confidence_score: z.number().min(0).max(1),
  estimated_weight_kg: z.number().positive().max(50000),
  suggested_price_per_kg: z.number().min(0).max(100000),
  estimated_total_value: z.number().min(0),
  condition_notes: z.string().max(500),
});

export type ScrapAnalysisOutput = z.infer<typeof ScrapAnalysisSchema>;

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

export type ScrapFormValues = z.infer<typeof ScrapFormSchema>;

// Listing generation input
export const GenerateListingInputSchema = z.object({
  scrapIds: z.array(z.string().uuid()).min(1, 'Selecciona al menos un sobrante').max(50),
});

// Listing form validation
export const ListingFormSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  description: z.string().max(2000).optional().default(''),
});

export type ListingFormValues = z.infer<typeof ListingFormSchema>;
