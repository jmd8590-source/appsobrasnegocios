import { GoogleGenAI } from '@google/genai';

// =====================================================
// ScrapLens — Gemini AI Client
// Server-side only — NEVER import in client components
// =====================================================

let geminiClient = null;

export function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export const GEMINI_MODEL = 'gemini-2.0-flash';
export const GEMINI_TIMEOUT_MS = 30000;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
