import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AnalyzeScrapInputSchema, ScrapAnalysisSchema } from '@/lib/validations/scrap';
import { getGeminiClient, isGeminiConfigured, GEMINI_MODEL, GEMINI_TIMEOUT_MS, MAX_IMAGE_SIZE_BYTES } from '@/lib/gemini/client';
import { buildScrapAnalysisPrompt } from '@/lib/gemini/prompts';
import { getMaterialPrice, calculateValue } from '@/lib/pricing/service';
import { getNextDemoAnalysis } from '@/lib/demo/data';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate input
    const parseResult = AnalyzeScrapInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de entrada inválidos',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType, referenceObject } = parseResult.data;

    // Check image size
    const imageBytes = Buffer.from(imageBase64, 'base64').length;
    if (imageBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'La imagen supera el límite de 10MB' },
        { status: 413 }
      );
    }

    // Demo mode — return realistic mock response
    if (!isGeminiConfigured()) {
      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const demoData = getNextDemoAnalysis();
      return NextResponse.json({
        success: true,
        data: demoData,
        isDemo: true,
      });
    }

    // Real Gemini API call
    const gemini = getGeminiClient();
    const prompt = buildScrapAnalysisPrompt(referenceObject);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    let rawResponse: string;
    try {
      const result = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      });

      rawResponse = result.text ?? '';
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Tiempo de espera agotado. Inténtalo de nuevo.' },
          { status: 504 }
        );
      }
      console.error('[analyze-scrap] Gemini error:', error);
      return NextResponse.json(
        { success: false, error: 'Error al analizar la imagen con IA' },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Parse Gemini JSON response
    let parsedAnalysis: unknown;
    try {
      // Strip markdown code blocks if present
      const cleanedResponse = rawResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsedAnalysis = JSON.parse(cleanedResponse);
    } catch {
      console.error('[analyze-scrap] Failed to parse Gemini response:', rawResponse);
      return NextResponse.json(
        { success: false, error: 'Respuesta de IA inválida. Inténtalo de nuevo.' },
        { status: 500 }
      );
    }

    // Validate AI output with Zod
    const validationResult = ScrapAnalysisSchema.safeParse(parsedAnalysis);
    if (!validationResult.success) {
      console.error('[analyze-scrap] Zod validation failed:', validationResult.error);
      return NextResponse.json(
        { success: false, error: 'Datos de análisis incompletos. Inténtalo de nuevo.' },
        { status: 500 }
      );
    }

    const analysis = validationResult.data;

    // Enrich with our pricing service (overrides AI price if we have a match)
    const catalogPrice = getMaterialPrice(analysis.material_name, analysis.category);
    if (catalogPrice > 0) {
      analysis.suggested_price_per_kg = catalogPrice;
      analysis.estimated_total_value = calculateValue(
        analysis.estimated_weight_kg,
        catalogPrice
      );
    }

    return NextResponse.json({ success: true, data: analysis, isDemo: false });
  } catch (error) {
    console.error('[analyze-scrap] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
