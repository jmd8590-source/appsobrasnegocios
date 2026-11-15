// =====================================================
// ScrapLens — Demo Catalog & Scanner Fallback Data
// User portals (scraps and lots) always start completely empty ([]).
// =====================================================

export const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000';

export const DEMO_MATERIALS = [
  {
    id: 'mat-cobre-limpio',
    name: 'Cobre limpio',
    category: 'metal',
    subtype: 'cobre',
    price_per_kg: 6.80,
    currency: 'EUR',
    unit: 'kg',
    description: 'Cobre puro sin aleaciones',
    color_hex: '#B87333',
    is_active: true,
    last_updated: '2024-01-15T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mat-aluminio',
    name: 'Aluminio perfiles',
    category: 'metal',
    subtype: 'aluminio',
    price_per_kg: 1.40,
    currency: 'EUR',
    unit: 'kg',
    description: 'Perfiles de aluminio extruidos',
    color_hex: '#A8A9AD',
    is_active: true,
    last_updated: '2024-01-15T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mat-acero',
    name: 'Acero estructural',
    category: 'metal',
    subtype: 'acero',
    price_per_kg: 0.22,
    currency: 'EUR',
    unit: 'kg',
    description: 'Vigas y estructuras de acero',
    color_hex: '#708090',
    is_active: true,
    last_updated: '2024-01-15T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// Kept empty so no portal ever renders pre-seeded fictitious scraps or lots.
export const DEMO_SCRAPS = [];

export const DEMO_LISTINGS = [];

export const DEMO_STATS = {
  total_value: 0,
  total_scraps: 0,
  total_weight_kg: 0,
  total_lots: 0,
  scraps_this_week: 0,
  value_this_week: 0,
};

export const DEMO_CHART_DATA = [];

// Demo AI analysis responses for scanner testing. Each one also carries the
// newer object_type/estimated_dimensions_cm/weight_reasoning fields so the
// demo experience matches exactly what a real Gemini response now looks
// like (see src/lib/gemini/prompts.js and src/lib/validations/scrap.js).
export const DEMO_ANALYSIS_RESPONSES = [
  {
    material_name: 'Cobre limpio',
    category: 'metal',
    subtype: 'cobre',
    object_type: 'loose_scrap',
    estimated_dimensions_cm: '40x15x15 cm aprox (referencia: mano)',
    weight_reasoning: 'Ovillo de cable suelto, mayormente hueco; densidad efectiva baja pese a ser cobre macizo en la sección del hilo.',
    confidence_score: 0.91,
    estimated_weight_kg: 5.2,
    suggested_price_per_kg: 6.80,
    estimated_total_value: 35.36,
    condition_notes: 'Cable de cobre en buen estado, sin oxidación. Probablemente procedente de instalación eléctrica. Se recomienda pelar el aislante para maximizar valor.',
  },
  {
    material_name: 'Aluminio perfiles',
    category: 'metal',
    subtype: 'aluminio',
    object_type: 'loose_scrap',
    estimated_dimensions_cm: '150x8x8 cm aprox (referencia: cinta métrica)',
    weight_reasoning: 'Perfiles huecos extruidos, no macizos; volumen real de aluminio mucho menor que el volumen aparente.',
    confidence_score: 0.87,
    estimated_weight_kg: 12.8,
    suggested_price_per_kg: 1.40,
    estimated_total_value: 17.92,
    condition_notes: 'Perfiles de aluminio anodizado, posiblemente marcos de ventana. Estado aceptable con algo de suciedad superficial fácil de limpiar.',
  },
  {
    material_name: 'Latón',
    category: 'metal',
    subtype: 'latón',
    object_type: 'loose_scrap',
    estimated_dimensions_cm: '10x10x8 cm aprox (referencia: moneda 2€)',
    weight_reasoning: 'Piezas macizas pequeñas (válvulas/racores); densidad de latón ~8.5 g/cm³ aplicada sobre volumen estimado.',
    confidence_score: 0.83,
    estimated_weight_kg: 2.1,
    suggested_price_per_kg: 3.60,
    estimated_total_value: 7.56,
    condition_notes: 'Componentes de latón (válvulas, racores). Color y aspecto característico del latón. Mix de diferentes tamaños.',
  },
  {
    // Demonstrates the exact failure mode a reviewer hit in production: a
    // complete, functional pallet truck confidently "priced" at an
    // impossible weight. Now flagged honestly instead of guessed.
    material_name: 'Transpaleta manual (equipo completo)',
    category: 'metal',
    subtype: 'acero',
    object_type: 'complete_equipment',
    estimated_dimensions_cm: '150x55x120 cm aprox (referencia: persona)',
    weight_reasoning: 'Se reconoce como transpaleta manual completa y funcional, no como material suelto; el peso real típico (65-100kg) no se puede fiar de una estimación volumétrica por foto.',
    confidence_score: 0.3,
    estimated_weight_kg: 75,
    suggested_price_per_kg: 0.22,
    estimated_total_value: 16.5,
    condition_notes: 'Esto parece un equipo completo y funcional (transpaleta), no un material de scrap suelto. Pésalo manualmente o confirma que realmente va a chatarra antes de usar esta estimación como referencia.',
  },
];

let demoAnalysisIndex = 0;
export function getNextDemoAnalysis() {
  const response = DEMO_ANALYSIS_RESPONSES[demoAnalysisIndex % DEMO_ANALYSIS_RESPONSES.length];
  demoAnalysisIndex++;
  return response;
}
