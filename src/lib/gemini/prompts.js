// =====================================================
// ScrapLens — Gemini Prompts
// =====================================================

export function buildScrapAnalysisPrompt(referenceObject) {
  const referenceContext = referenceObject
    ? `\n\nIn the image, the operator has placed a reference object for scale: ${
        referenceObject === 'coin'
          ? 'a 2€ coin (diameter ~26mm, weight 8.5g)'
          : referenceObject === 'hand'
          ? 'a human hand (average adult palm width ~80mm)'
          : 'a measuring tape or ruler'
      }. Use this reference to estimate the physical dimensions and weight.`
    : '\n\nNo scale reference is provided. Make your best estimate based on visual context.';

  return `You are an expert industrial scrap and waste material analyst for a recycling company in Spain/Europe.

Analyze this photograph of industrial waste or scrap material and provide a JSON response with the following structure:

{
  "material_name": "exact common name of the material in Spanish",
  "category": "one of: metal, wood, plastic, construction",
  "subtype": "specific subtype (e.g.: cobre, aluminio, latón, acero, inox, hierro, cables, pino, tablero, pet, hdpe, pp, pvc, eps, áridos, cerámica, hormigón, mixto)",
  "confidence_score": 0.0 to 1.0 (your confidence in the identification),
  "estimated_weight_kg": estimated weight in kilograms as a number,
  "suggested_price_per_kg": current European scrap market price in EUR per kg,
  "estimated_total_value": weight × price rounded to 2 decimal places,
  "condition_notes": "2-3 sentence description in Spanish of the material condition, origin clues, and any recommendations"
}
${referenceContext}

IMPORTANT RULES:
- Use ONLY real, current European scrap market prices (2024). Common ranges:
  • Cobre limpio: 6-7 €/kg | Cobre mezcla: 4-5.5 €/kg
  • Aluminio: 0.9-1.5 €/kg | Latón: 3.2-4 €/kg  
  • Acero/ferralla: 0.1-0.25 €/kg | Inox 304: 1-1.3 €/kg
  • Cables Cu≥40%: 2.5-3 €/kg | Cables mezcla: 1.2-2 €/kg
  • Madera nueva: 0.05-0.15 €/kg | Madera derribo: 0.02-0.06 €/kg
  • PET: 0.2-0.35 €/kg | HDPE: 0.25-0.45 €/kg
  • Áridos/hormigón: 0.005-0.02 €/kg
- If you cannot identify the material, set confidence_score below 0.5 and use the most probable category
- NEVER invent prices above the realistic ranges above
- Return ONLY the JSON object, no markdown, no additional text
- All text fields in Spanish except technical terms`;
}

export function buildListingGenerationPrompt(materials) {
  const materialsList = materials
    .map((m) => `- ${m.name}: ${m.weight.toFixed(1)}kg, valor aprox. ${m.value.toFixed(2)}€`)
    .join('\n');

  const totalValue = materials.reduce((acc, m) => acc + m.value, 0);
  const totalWeight = materials.reduce((acc, m) => acc + m.weight, 0);

  return `Eres un experto en compraventa de chatarra y materiales de recuperación industrial en España.

Crea un anuncio comercial profesional y atractivo para vender este lote de materiales de recuperación:

MATERIALES DEL LOTE:
${materialsList}

TOTALES: ${totalWeight.toFixed(1)}kg | Valor estimado: ${totalValue.toFixed(2)}€

Responde con este JSON exacto:
{
  "title": "Título del anuncio (máx 80 caracteres, atractivo y descriptivo)",
  "description": "Descripción completa del lote (200-400 palabras). Incluye: descripción de materiales, estado general, posibilidades de uso/reciclaje, información de recogida y condiciones de venta. Usa formato markdown con negritas y listas. Tono profesional pero cercano."
}

REGLAS:
- El título debe ser informativo y llamar la atención en marketplaces como Wallapop o Milanuncios
- La descripción debe destacar el valor real de los materiales
- Menciona siempre que los precios son orientativos de mercado
- NO incluyas precios exactos en el anuncio (el comprador negociará)
- Incluye sugerencias de para quién es interesante el lote (chatarrero, empresa reciclaje, particular)
- Solo el JSON, sin markdown exterior`;
}
