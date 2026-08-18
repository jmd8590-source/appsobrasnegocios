// =====================================================
// ScrapLens — Global TypeScript Types
// =====================================================

export type MaterialCategory = 'metal' | 'wood' | 'plastic' | 'construction';
export type MaterialSubtype =
  | 'cobre' | 'aluminio' | 'latón' | 'bronce' | 'plomo' | 'zinc' | 'estaño'
  | 'acero' | 'inox' | 'hierro' | 'cables'
  | 'pino' | 'dura' | 'palés' | 'derribo' | 'tablero'
  | 'pet' | 'hdpe' | 'pp' | 'pvc' | 'eps' | 'mixto'
  | 'áridos' | 'cerámica' | 'hormigón' | 'yeso';

export type ScrapStatus = 'available' | 'in_lot' | 'sold' | 'discarded';
export type ListingStatus = 'draft' | 'active' | 'sold' | 'archived';
export type ReferenceObject = 'coin' | 'hand' | 'tape';

// =====================================================
// Database Row Types
// =====================================================

export interface Profile {
  id: string;
  full_name: string | null;
  company: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialCatalog {
  id: string;
  name: string;
  category: MaterialCategory;
  subtype: string | null;
  price_per_kg: number;
  currency: string;
  unit: string;
  description: string | null;
  color_hex: string | null;
  is_active: boolean;
  last_updated: string;
  created_at: string;
}

export interface Scrap {
  id: string;
  user_id: string;
  material_id: string | null;
  material_name: string;
  category: MaterialCategory;
  subtype: string | null;
  image_url: string | null;
  image_path: string | null;
  weight_kg: number;
  price_per_kg: number;
  total_value: number;
  currency: string;
  ai_confidence: number | null;
  condition_notes: string | null;
  reference_object: ReferenceObject | null;
  status: ScrapStatus;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  total_value: number;
  total_weight_kg: number;
  status: ListingStatus;
  share_token: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  scraps?: Scrap[];
}

export interface ListingScrap {
  id: string;
  listing_id: string;
  scrap_id: string;
  created_at: string;
}

// =====================================================
// AI Analysis Types (Gemini Vision output)
// =====================================================

export interface ScrapAnalysis {
  material_name: string;
  category: MaterialCategory;
  subtype: string;
  confidence_score: number;       // 0.0 - 1.0
  estimated_weight_kg: number;
  suggested_price_per_kg: number;
  estimated_total_value: number;
  condition_notes: string;
}

// =====================================================
// API Response Types
// =====================================================

export interface AnalyzeScrapRequest {
  imageBase64: string;
  mimeType: string;
  referenceObject?: ReferenceObject;
}

export interface AnalyzeScrapResponse {
  success: boolean;
  data?: ScrapAnalysis;
  error?: string;
  isDemo?: boolean;
}

export interface GenerateListingRequest {
  scrapIds: string[];
  scraps?: Scrap[];
}

export interface GenerateListingResponse {
  success: boolean;
  data?: {
    title: string;
    description: string;
  };
  error?: string;
  isDemo?: boolean;
}

// =====================================================
// UI / Form Types
// =====================================================

export interface ScrapFormValues {
  material_name: string;
  category: MaterialCategory;
  subtype: string;
  weight_kg: number;
  price_per_kg: number;
  total_value: number;
  condition_notes: string;
  status: ScrapStatus;
}

export interface DashboardStats {
  total_value: number;
  total_scraps: number;
  total_weight_kg: number;
  total_lots: number;
  scraps_this_week: number;
  value_this_week: number;
}
