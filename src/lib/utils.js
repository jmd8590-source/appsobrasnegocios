import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value, currency = 'EUR') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatWeight(weightKg) {
  if (weightKg >= 1000) {
    return `${(weightKg / 1000).toFixed(2)} t`;
  }
  return `${weightKg.toFixed(1)} kg`;
}

export function formatConfidence(score) {
  return `${Math.round(score * 100)}%`;
}

export function formatDate(dateString) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function formatRelativeTime(dateString) {
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

export function getCategoryLabel(category) {
  const labels = {
    metal: 'Metal',
    wood: 'Madera',
    plastic: 'Plástico',
    construction: 'Obra',
  };
  return labels[category] ?? category;
}

export function getCategoryColor(category) {
  const colors = {
    metal: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    wood: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    plastic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    construction: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return colors[category] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

export function getStatusLabel(status) {
  const labels = {
    available: 'Disponible',
    in_lot: 'En lote',
    sold: 'Vendido',
    discarded: 'Descartado',
  };
  return labels[status] ?? status;
}

export function getStatusColor(status) {
  const colors = {
    available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    in_lot: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    sold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    discarded: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

export function getConfidenceColor(score) {
  if (score >= 0.85) return 'text-emerald-400';
  if (score >= 0.70) return 'text-amber-400';
  return 'text-red-400';
}

// Aggregates scraps into a day-by-day recovered-value series for the
// dashboard chart. Computed from whatever scraps were actually loaded
// (real account or demo) instead of a separate hardcoded series, so a
// real account's chart reflects its real activity instead of fixed demo
// dates that don't even match its own data.
export function computeDailyValueChart(scraps, { days = 7, locale = 'es-ES' } = {}) {
  const now = new Date();
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({ date: d, value: 0, scraps: 0 });
  }

  for (const scrap of scraps) {
    const created = new Date(scrap.created_at);
    const bucket = buckets.find(
      (b) =>
        b.date.getFullYear() === created.getFullYear() &&
        b.date.getMonth() === created.getMonth() &&
        b.date.getDate() === created.getDate()
    );
    if (bucket) {
      bucket.value += Number(scrap.total_value) || 0;
      bucket.scraps += 1;
    }
  }

  const formatter = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' });
  return buckets.map((b) => ({
    date: formatter.format(b.date),
    value: Math.round(b.value * 100) / 100,
    scraps: b.scraps,
  }));
}

export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function generateShareUrl(shareToken) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://scraplens.app';
  return `${baseUrl}/share/${shareToken}`;
}

export function generateWhatsAppUrl(shareUrl, title) {
  const message = encodeURIComponent(`🔩 Lote de materiales de recuperación en venta: *${title}*\n\n📋 Ver ficha completa: ${shareUrl}`);
  return `https://wa.me/?text=${message}`;
}

export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getMimeType(file) {
  return file.type || 'image/jpeg';
}

// Whether Supabase has real credentials configured (vs. missing, or still
// the placeholder URL from .env.example). This reflects what the
// deployment is actually capable of — not whether any one visitor happens
// to be browsing anonymously.
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url) && url !== 'https://your-project.supabase.co';
}

// True only when there's no real backend to talk to at all. Used to gate
// "skip Supabase entirely" code paths (login/register/forgot-password
// bypass, local-only session check).
//
// Deliberately NOT driven by NEXT_PUBLIC_DEMO_MODE on its own anymore: that
// used to force every visitor — including someone who had just registered
// a real account — into the shared demo/local experience whenever the flag
// was left on, even after Supabase was fully configured. A real account
// must always be able to register and log in for real once a backend
// exists; the only legitimate way into the demo experience from here on is
// the explicit "Explorar versión demo" button (see scraplens_demo_session
// cookie in getAuthState()).
export function isDemoMode() {
  return !isSupabaseConfigured();
}
