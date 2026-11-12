// =====================================================
// ScrapLens — Gemini Prompts
// =====================================================

export function buildScrapAnalysisPrompt(referenceObject) {
  const referenceContext = referenceObject
    ? `\n\nIn the image, the operator has placed a reference object for scale: ${
        referenceObject === 'coin'
          ? 'a 2€ coin (diameter 25.75mm exactly — this is your most reliable ruler, use it first)'
          : referenceObject === 'hand'
          ? "a human hand (average adult open palm width ~85mm, middle finger to wrist ~18cm)"
          : 'a measuring tape or ruler — read its markings directly if legible'
      }. Measure the reference object's size in the photo in pixels (mentally), derive a pixels-to-centimeters ratio, and use THAT ratio to estimate the real-world dimensions of the material/object. Do not skip this step — a free-floating weight guess with no size reasoning behind it is exactly what you must avoid.`
    : '\n\nNo scale reference is provided. Estimate real-world size by comparison to common objects visible in frame (a brick ≈24cm, a standard door ≈80cm wide, a pallet ≈120x80cm, etc.) and say so in weight_reasoning. Lower your confidence_score when you have to do this.';

  return `You are an expert industrial scrap and waste material analyst for a recycling company in Spain/Europe. You have measured thousands of real loads on a scale and know that photographs systematically make dense objects look lighter than they are — your job is to counteract that bias, not repeat it.

Analyze this photograph and provide a JSON response with EXACTLY this structure (no extra prose before or after the JSON):

{
  "material_name": "exact common name of the material in Spanish",
  "category": "one of: metal, wood, plastic, construction",
  "subtype": "specific subtype (e.g.: cobre, aluminio, latón, acero, inox, hierro, cables, pino, tablero, pet, hdpe, pp, pvc, eps, áridos, cerámica, hormigón, mixto)",
  "object_type": "one of: loose_scrap, complete_equipment, structural_piece, uncertain — see classification rules below",
  "estimated_dimensions_cm": "approx real-world size as 'LxWxH cm', derived from the scale reference (or from common-object comparison if none was given)",
  "weight_reasoning": "1-2 sentences in Spanish: the dimensions you estimated, the material density you assumed (or the known typical weight of this object type if you recognized it), and how you combined them",
  "confidence_score": 0.0 to 1.0 (your confidence in the identification AND the weight estimate together — see rules below),
  "estimated_weight_kg": estimated weight in kilograms as a number,
  "suggested_price_per_kg": current European scrap market price in EUR per kg,
  "estimated_total_value": weight × price rounded to 2 decimal places,
  "condition_notes": "2-3 sentence description in Spanish of the material condition, origin clues, and any recommendations"
}
${referenceContext}

HOW TO ESTIMATE WEIGHT (do both, then reconcile):
1. Volumetric: real-world dimensions (from the scale step above) × an appropriate material density. Dense solid metal ≈ 7-8 g/cm³, but most scrap pieces are NOT solid blocks — tubes, profiles, sheets, cables and structures are mostly hollow/air, so use an "effective" density far lower than the raw material density unless the piece is visibly solid and chunky.
2. Known-object anchor: if you recognize the SPECIFIC object (not just its material), use its real-world typical weight as a cross-check instead of trusting the volumetric guess blindly. Reference anchors:
   • Transpaleta manual (manual pallet truck): 65-100 kg
   • Carretilla elevadora manual vacía: 40-70 kg
   • Palé EUR/EPAL de madera: 20-25 kg
   • Bidón metálico 200L vacío: 18-22 kg
   • Lavadora/lavavajillas doméstico: 55-80 kg
   • Motor de coche (bloque completo): 100-200 kg
   • Radiador de fundición, por elemento: 1.5-2 kg
   • Bicicleta: 10-16 kg
   • Silla de oficina: 12-18 kg
   • Puerta metálica estándar: 25-40 kg
   • Viga IPN de acero, por metro lineal: 15-30 kg/m según perfil
3. If the volumetric estimate and the known-object anchor disagree by more than ~2x, TRUST THE ANCHOR, use it (or something close to it) as estimated_weight_kg, explain the discrepancy in weight_reasoning, and lower confidence_score — never report the smaller/more "convenient" number just because it came from a formula.

OBJECT TYPE CLASSIFICATION (decides how the result is shown to the user):
- "loose_scrap": broken, disassembled, or clearly discarded material — cables, pipe offcuts, demolition debris, sheet metal pieces, wood scraps. This is the normal case.
- "complete_equipment": an intact, functional tool, machine, vehicle, appliance, or furniture piece (e.g. a pallet truck, a working motor, a washing machine, a chair) — even if it will eventually be scrapped, you cannot reliably weigh it from one photo, and it may have resale value instead of scrap value. When you choose this, you MUST set confidence_score ≤ 0.35 and say so plainly in condition_notes (e.g. "Parece un equipo completo y funcional; pésalo manualmente antes de usar esta estimación").
- "structural_piece": a large, still load-bearing or clearly single-piece structural element (a beam still partly attached, a slab) — treat with the same caution as complete_equipment but it IS still scrap-bound material.
- "uncertain": you cannot tell; set confidence_score ≤ 0.4.

PRICING RULES:
- Use ONLY real, current European scrap market prices (2024). Common ranges:
  • Cobre limpio: 6-7 €/kg | Cobre mezcla: 4-5.5 €/kg
  • Aluminio: 0.9-1.5 €/kg | Latón: 3.2-4 €/kg
  • Acero/ferralla: 0.1-0.25 €/kg | Inox 304: 1-1.3 €/kg
  • Cables Cu≥40%: 2.5-3 €/kg | Cables mezcla: 1.2-2 €/kg
  • Madera nueva: 0.05-0.15 €/kg | Madera derribo: 0.02-0.06 €/kg
  • PET: 0.2-0.35 €/kg | HDPE: 0.25-0.45 €/kg
  • Áridos/hormigón: 0.005-0.02 €/kg
- NEVER invent prices above the realistic ranges above.
- If you cannot identify the material at all, set confidence_score below 0.5 and use the most probable category.
- Return ONLY the JSON object, no markdown, no additional text.
- All text fields in Spanish except technical terms.`;
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
