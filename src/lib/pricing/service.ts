// =====================================================
// ScrapLens — Pricing Service
// Decoupled from AI: swap mock prices for live API
// =====================================================
// To integrate a live price API (e.g., LME, Recupera, Ferroatlántica):
// 1. Add your API credentials to .env.local
// 2. Implement fetchLivePrices() below
// 3. Replace getMaterialPrice() to call fetchLivePrices()

import type { MaterialCategory } from '@/types';

// Static price table — mirrors the materials_catalog seed
// These are updated manually or via fetchLivePrices()
const STATIC_PRICES: Record<string, number> = {
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
const CATEGORY_FALLBACK_PRICES: Record<MaterialCategory, number> = {
  metal: 0.50,
  wood: 0.05,
  plastic: 0.10,
  construction: 0.01,
};

/**
 * Get price per kg for a material by name
 * Falls back to category default if material not found
 */
export function getMaterialPrice(materialName: string, category: MaterialCategory): number {
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
  return CATEGORY_FALLBACK_PRICES[category];
}

/**
 * Calculate total value from weight and price
 */
export function calculateValue(weightKg: number, pricePerKg: number): number {
  return Math.round(weightKg * pricePerKg * 100) / 100;
}

/**
 * Placeholder for live price API integration
 * Replace implementation to fetch from LME, Recupera, etc.
 */
export async function fetchLivePrices(): Promise<Record<string, number> | null> {
  // TODO: Implement when live price API is available
  // Example:
  // const response = await fetch('https://api.lme.com/prices', {
  //   headers: { 'Authorization': `Bearer ${process.env.LME_API_KEY}` }
  // });
  // const data = await response.json();
  // return transformLMEData(data);
  return null;
}

/**
 * Get all available materials with their prices
 */
export function getAllMaterialPrices(): Array<{ name: string; price: number }> {
  return Object.entries(STATIC_PRICES).map(([name, price]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    price,
  }));
}
