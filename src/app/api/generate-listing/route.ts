import { NextRequest, NextResponse } from 'next/server';
import { GenerateListingInputSchema } from '@/lib/validations/scrap';
import { getGeminiClient, isGeminiConfigured, GEMINI_MODEL } from '@/lib/gemini/client';
import { buildListingGenerationPrompt } from '@/lib/gemini/prompts';

export const runtime = 'nodejs';
export const maxDuration = 30;

const DEMO_LISTINGS = [
  {
    title: 'Lote metales no férreos — Cobre y aluminio procedencia obra',
    description: `**Lote de materiales de recuperación de alta calidad procedentes de reforma industrial.**

Ofrezco este interesante lote compuesto principalmente por **metales no férreos** con excelente ratio de recuperación:

**Contenido del lote:**
- Cobre limpio (cables y tuberías pelados)
- Perfiles de aluminio anodizado
- Accesorios y complementos varios de latón

**Estado y condiciones:**
- Material en buen estado general, clasificado y preparado para entrega
- Sin mezclas con material de baja calidad
- Procedencia documentada (reforma/rehabilitación)

**Ideal para:**
- Empresas de chatarra y reciclaje de metales
- Particulares con acceso a centros de recogida
- Intermediarios del sector de la recuperación

*Precios orientativos calculados según tarifas de mercado vigentes. Precio final a negociar según volumen y forma de pago. Posibilidad de recogida concertada.*`,
  },
];

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parseResult = GenerateListingInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { scrapIds } = parseResult.data;

    // Get scrap details from body if provided (to avoid DB query from API route)
    interface ScrapInfo { material_name: string; weight_kg: number; total_value: number }
    const scraps: ScrapInfo[] = (body as { scraps?: ScrapInfo[] }).scraps ?? [];

    // Demo mode
    if (!isGeminiConfigured() || scraps.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return NextResponse.json({
        success: true,
        data: DEMO_LISTINGS[0],
        isDemo: true,
      });
    }

    // Build materials summary for prompt
    const materials = scraps.map((s) => ({
      name: s.material_name,
      weight: s.weight_kg,
      value: s.total_value,
    }));

    const gemini = getGeminiClient();
    const prompt = buildListingGenerationPrompt(materials);

    const result = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.7, maxOutputTokens: 2048 },
    });

    const rawResponse = result.text ?? '';
    let parsedListing: { title: string; description: string };

    try {
      const cleanedResponse = rawResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsedListing = JSON.parse(cleanedResponse);

      if (!parsedListing.title || !parsedListing.description) {
        throw new Error('Missing required fields');
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Error al generar la descripción del lote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: parsedListing, isDemo: false });
  } catch (error) {
    console.error('[generate-listing] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
