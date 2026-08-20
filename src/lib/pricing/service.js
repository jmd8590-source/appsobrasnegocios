// =====================================================
// ScrapLens — Pricing Service
// Decoupled from AI: swap mock prices for live API
// =====================================================
// To integrate a live price API (e.g., LME, Recupera, Ferroatlántica):
// 1. Add your API credentials to .env.local
// 2. Implement fetchLivePrices() below
// 3. Replace getMaterialPrice() to call fetchLivePrices()

// Static price table — mirrors the materials_catalog seed
// These are updated manually or via fetchLivePrices()
const STATIC_PRICES = {
  // Copper
  'cobre limpio': 6.80,
  'cobre mezcla': 5.20,
  // Aluminium
  'aluminio perfiles': 1.40,
  'aluminio fundición': 1.10,
  'aluminio latas': 0.90,
  // Other non-ferrous
  'latón': 3.60,
  'bronce': 4.10,
  'plomo': 1.65,
  'zinc': 2.30,
  'estaño': 18.50,
  // Ferrous
  'acero estructural': 0.22,
  'chapa de acero': 0.18,
  'acero inoxidable 304': 1.20,
  'acero inoxidable 316': 1.45,
  'hierro fundido': 0.14,
  'chatarra mixta hierro': 0.10,
  // Cables
  'cable eléctrico cu ≥40%': 2.80,
  'cable eléctrico mezcla': 1.60,
  'cable aluminio': 0.95,
  'cables electrónica': 0.85,
  // Wood
  'madera de pino nueva': 0.08,
  'madera dura (roble/haya)': 0.15,
  'palés de madera': 2.50,
  'madera de derribo': 0.04,
  // Boards
  'tablero dm/mdf': 0.05,
  'tablero contrachapado': 0.07,
  'tablero aglomerado': 0.03,
  'osb': 0.06,
  // Plastics
  'pet botellas': 0.28,
  'hdpe recipientes': 0.35,
  'polipropileno (pp)': 0.22,
  'pvc rígido': 0.12,
  'plástico mezcla/abs': 0.08,
  'poliestireno (eps)': 0.05,
  // Construction
  'áridos limpios': 0.015,
  'ladrillo y cerámica': 0.012,
  'hormigón armado': 0.010,
  'yeso y escayola': 0.008,
  'residuo obra mixto': 0.005,
};

// Category fallback prices (when exact material not found)
const CATEGORY_FALLBACK_PRICES = {
  metal: 0.50,
  wood: 0.05,
  plastic: 0.10,
  construction: 0.01,
};

/**
 * Get price per kg for a material by name
 * Falls back to category default if material not found
 */
export function getMaterialPrice(materialName, category) {
  const normalizedName = materialName.toLowerCase().trim();

  // Exact match
  if (STATIC_PRICES[normalizedName] !== undefined) {
    return STATIC_PRICES[normalizedName];
  }

  // Partial match
  const partialMatch = Object.keys(STATIC_PRICES).find((key) =>
    normalizedName.includes(key) || key.includes(normalizedName)
  );

  if (partialMatch) {
    return STATIC_PRICES[partialMatch];
  }

  // Subtype keyword match
  if (normalizedName.includes('cobre') || normalizedName.includes('copper')) return 5.20;
  if (normalizedName.includes('aluminio') || normalizedName.includes('aluminium')) return 1.10;
  if (normalizedName.includes('latón') || normalizedName.includes('brass')) return 3.60;
  if (normalizedName.includes('inox') || normalizedName.includes('stainless')) return 1.20;
  if (normalizedName.includes('acero') || normalizedName.includes('steel')) return 0.20;
  if (normalizedName.includes('hierro') || normalizedName.includes('iron')) return 0.12;
  if (normalizedName.includes('cable')) return 1.60;

  // Category fallback
  return CATEGORY_FALLBACK_PRICES[category] ?? 0.10;
}

/**
 * Calculate total value from weight and price
 */
export function calculateValue(weightKg, pricePerKg) {
  return Math.round(weightKg * pricePerKg * 100) / 100;
}

/**
 * Placeholder for live price API integration
 * Replace implementation to fetch from LME, Recupera, etc.
 */
export async function fetchLivePrices() {
  return null;
}

export const CATALOG_MATERIALS = [
  // Metales no férreos
  { name: 'Cobre limpio', category: 'metal', subtype: 'cobre', price: 6.80, unit: 'kg', description: 'Cobre puro pelado, tuberías limpias' },
  { name: 'Cobre mezcla', category: 'metal', subtype: 'cobre', price: 5.20, unit: 'kg', description: 'Cobre mezclado, cables aislados' },
  { name: 'Aluminio perfiles', category: 'metal', subtype: 'aluminio', price: 1.40, unit: 'kg', description: 'Perfiles de carpintería y marcos' },
  { name: 'Aluminio fundición', category: 'metal', subtype: 'aluminio', price: 1.10, unit: 'kg', description: 'Piezas y bloques fundidos' },
  { name: 'Aluminio latas', category: 'metal', subtype: 'aluminio', price: 0.90, unit: 'kg', description: 'Envases y chapa fina' },
  { name: 'Latón', category: 'metal', subtype: 'latón', price: 3.60, unit: 'kg', description: 'Grifería, llaves y válvulas' },
  { name: 'Bronce', category: 'metal', subtype: 'bronce', price: 4.10, unit: 'kg', description: 'Cojinetes y piezas mecánicas' },
  { name: 'Plomo', category: 'metal', subtype: 'plomo', price: 1.65, unit: 'kg', description: 'Tuberías de plomo y contrapesos' },
  { name: 'Zinc', category: 'metal', subtype: 'zinc', price: 2.30, unit: 'kg', description: 'Chapa galvanizada y canalones' },
  { name: 'Estaño', category: 'metal', subtype: 'estaño', price: 18.50, unit: 'kg', description: 'Soldaduras y varillas' },

  // Metales férreos
  { name: 'Acero estructural', category: 'metal', subtype: 'acero', price: 0.22, unit: 'kg', description: 'Vigas IPN, pilares y perfiles pesados' },
  { name: 'Chapa de acero', category: 'metal', subtype: 'acero', price: 0.18, unit: 'kg', description: 'Láminas y recortes de chapa' },
  { name: 'Acero inoxidable 304', category: 'metal', subtype: 'inox', price: 1.20, unit: 'kg', description: 'Inox calidad alimentaria/hostelería' },
  { name: 'Acero inoxidable 316', category: 'metal', subtype: 'inox', price: 1.45, unit: 'kg', description: 'Inox marino y químico' },
  { name: 'Hierro fundido', category: 'metal', subtype: 'hierro', price: 0.14, unit: 'kg', description: 'Radiadores y bloques' },
  { name: 'Chatarra mixta hierro', category: 'metal', subtype: 'hierro', price: 0.10, unit: 'kg', description: 'Ferralla y scrap general' },

  // Cables
  { name: 'Cable eléctrico Cu ≥40%', category: 'metal', subtype: 'cables', price: 2.80, unit: 'kg', description: 'Mangueras de cobre de alta sección' },
  { name: 'Cable eléctrico mezcla', category: 'metal', subtype: 'cables', price: 1.60, unit: 'kg', description: 'Cableado doméstico y armado' },
  { name: 'Cable aluminio', category: 'metal', subtype: 'cables', price: 0.95, unit: 'kg', description: 'Líneas de tendido en aluminio' },
  { name: 'Cables electrónica', category: 'metal', subtype: 'cables', price: 0.85, unit: 'kg', description: 'Cableado informático y conectores' },

  // Maderas & Palés
  { name: 'Palés de madera', category: 'wood', subtype: 'palés', price: 2.50, unit: 'ud', description: 'Palés tipo EUR/EPAL estándar' },
  { name: 'Madera de pino nueva', category: 'wood', subtype: 'pino', price: 0.08, unit: 'kg', description: 'Listones y vigas de pino' },
  { name: 'Madera dura (roble/haya)', category: 'wood', subtype: 'dura', price: 0.15, unit: 'kg', description: 'Maderas nobles y tablones macizos' },
  { name: 'Madera de derribo', category: 'wood', subtype: 'derribo', price: 0.04, unit: 'kg', description: 'Vigas antiguas y tarima usada' },
  { name: 'Tablero DM/MDF', category: 'wood', subtype: 'tablero', price: 0.05, unit: 'kg', description: 'Planchas de densidad media' },
  { name: 'Tablero contrachapado', category: 'wood', subtype: 'tablero', price: 0.07, unit: 'kg', description: 'Contrachapado fenólico y estándar' },
  { name: 'Tablero aglomerado', category: 'wood', subtype: 'tablero', price: 0.03, unit: 'kg', description: 'Recortes de aglomerado' },
  { name: 'OSB', category: 'wood', subtype: 'tablero', price: 0.06, unit: 'kg', description: 'Tableros de virutas orientadas' },

  // Plásticos
  { name: 'PET botellas', category: 'plastic', subtype: 'pet', price: 0.28, unit: 'kg', description: 'Botellas transparentes embaladas' },
  { name: 'HDPE recipientes', category: 'plastic', subtype: 'hdpe', price: 0.35, unit: 'kg', description: 'Garrafas y bidones rígidos' },
  { name: 'Polipropileno (PP)', category: 'plastic', subtype: 'pp', price: 0.22, unit: 'kg', description: 'Cajas de fruta y tapones' },
  { name: 'PVC rígido', category: 'plastic', subtype: 'pvc', price: 0.12, unit: 'kg', description: 'Tuberías de saneamiento y perfiles' },
  { name: 'Plástico mezcla/ABS', category: 'plastic', subtype: 'mixto', price: 0.08, unit: 'kg', description: 'Carcasas y componentes mixtos' },
  { name: 'Poliestireno (EPS)', category: 'plastic', subtype: 'eps', price: 0.05, unit: 'kg', description: 'Corcho blanco y protectores' },

  // Residuos de construcción
  { name: 'Áridos limpios', category: 'construction', subtype: 'áridos', price: 0.015, unit: 'kg', description: 'Grava, arena y zahorra triturada' },
  { name: 'Ladrillo y cerámica', category: 'construction', subtype: 'cerámica', price: 0.012, unit: 'kg', description: 'Escombros de ladrillo y gres' },
  { name: 'Hormigón armado', category: 'construction', subtype: 'hormigón', price: 0.010, unit: 'kg', description: 'Bloques de hormigón con varilla' },
  { name: 'Yeso y escayola', category: 'construction', subtype: 'yeso', price: 0.008, unit: 'kg', description: 'Placas de pladur y molduras' },
  { name: 'Residuo obra mixto', category: 'construction', subtype: 'mixto', price: 0.005, unit: 'kg', description: 'RCD mezclado sin clasificar' },
];

/**
 * Get all available materials with their prices
 */
export function getAllMaterialPrices() {
  return CATALOG_MATERIALS.map((item) => ({
    name: item.name,
    price: item.price,
  }));
}
