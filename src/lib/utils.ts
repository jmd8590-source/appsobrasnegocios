import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatWeight(weightKg: number): string {
  if (weightKg >= 1000) {
    return `${(weightKg / 1000).toFixed(2)} t`;
  }
  return `${weightKg.toFixed(1)} kg`;
}

export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'ahora mismo';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return formatDate(dateString);
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    metal: 'Metal',
    wood: 'Madera',
    plastic: 'Plástico',
    construction: 'Obra',
  };
  return labels[category] ?? category;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    metal: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    wood: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    plastic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    construction: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return colors[category] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Disponible',
    in_lot: 'En lote',
    sold: 'Vendido',
    discarded: 'Descartado',
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    in_lot: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    sold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    discarded: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

export function getConfidenceColor(score: number): string {
  if (score >= 0.85) return 'text-emerald-400';
  if (score >= 0.70) return 'text-amber-400';
  return 'text-red-400';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function generateShareUrl(shareToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://scraplens.app';
  return `${baseUrl}/share/${shareToken}`;
}

export function generateWhatsAppUrl(shareUrl: string, title: string): string {
  const message = encodeURIComponent(`🔩 Lote de materiales de recuperación en venta: *${title}*\n\n📋 Ver ficha completa: ${shareUrl}`);
  return `https://wa.me/?text=${message}`;
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getMimeType(file: File): string {
  return file.type || 'image/jpeg';
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co';
}
