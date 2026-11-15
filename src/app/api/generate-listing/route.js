import { NextResponse } from 'next/server';
import { GenerateListingInputSchema } from '@/lib/validations/scrap';
import { getGeminiClient, isGeminiConfigured, GEMINI_MODEL } from '@/lib/gemini/client';
import { buildListingGenerationPrompt } from '@/lib/gemini/prompts';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Generates an objective, commercial listing summary built strictly from the
 * user's selected scraps when Gemini is unavailable.
 */
function buildFallbackListing(scraps) {
  if (!Array.isArray(scraps) || scraps.length === 0) {
    return {
      title: 'Lote de materiales recuperados',
      description:
        'Lote de materiales clasificados para recuperación y reciclaje. Precio y entrega a convenir según volumen.',
    };
  }

  const names = [...new Set(scraps.map((s) => s.material_name).filter(Boolean))];
  const totalWeight = scraps.reduce((acc, s) => acc + (Number(s.weight_kg) || 0), 0);
  const totalValue = scraps.reduce((acc, s) => acc + (Number(s.total_value) || 0), 0);

  const summaryNames =
    names.length <= 2
      ? names.join(' y ')
      : `${names.slice(0, 2).join(', ')} y ${names.length - 2} más`;

  const lines = scraps.map((s) => {
    const w = (Number(s.weight_kg) || 0).toFixed(1);
    const v = (Number(s.total_value) || 0).toFixed(2);
    return `- ${s.material_name}: ${w} kg (${v} € est.)`;
  });

  return {
    title: summaryNames ? `Lote — ${summaryNames}` : 'Lote de materiales recuperados',
    description: `**Lote de materiales recuperados (${scraps.length} partidas · ${totalWeight.toFixed(1)} kg totales).**

**Contenido del lote:**
${lines.join('\n')}

Valoración orientativa total: ${totalValue.toFixed(2)} €. Disponible para entrega o recogida concertada.`,
  };
}

export async function POST(request) {
  try {
    let body;
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

    const { scrapIds: _scrapIds } = parseResult.data;

    // Sanitize scrap details passed in body
    const scraps = Array.isArray(body.scraps) ? body.scraps : [];

    // Dynamic fallback when Gemini is not configured or no details provided
    if (!isGeminiConfigured() || scraps.length === 0) {
      return NextResponse.json({
        success: true,
        data: buildFallbackListing(scraps),
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
    let parsedListing;

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
