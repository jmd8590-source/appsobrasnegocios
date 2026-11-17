// =====================================================
// ScrapLens — Supabase Keepalive Helper
//
// Shared by `/api/keepalive` and `scripts/supabase-keepalive.mjs` (GitHub
// Actions cron) to prevent Supabase Free-tier projects from entering pause
// mode after 7 days of inactivity.
// =====================================================

const PLACEHOLDER_VALUES = new Set([
  'https://your-project.supabase.co',
  'your-anon-key-here',
  'your-service-role-key-here',
  'placeholder-anon-key',
]);

/**
 * Returns a trimmed non-placeholder environment value, or null.
 */
export function getConfiguredValue(rawValue) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!value || PLACEHOLDER_VALUES.has(value)) return null;
  return value;
}

/**
 * Resolves the Supabase REST endpoint and best available API key from env.
 * When `fallbackUrl` is provided (e.g. from `supabase/config.toml`), allows
 * an unauthenticated keepalive ping (`mode: 'public'`) if no key secret is set.
 */
export function resolveSupabaseTarget(env = process.env, { fallbackUrl = null } = {}) {
  const supabaseUrl =
    getConfiguredValue(env.SUPABASE_URL) ??
    getConfiguredValue(env.NEXT_PUBLIC_SUPABASE_URL) ??
    getConfiguredValue(fallbackUrl);
  if (!supabaseUrl) return null;

  const normalizedUrl = supabaseUrl.replace(/\/+$/, '');

  const serviceKey = getConfiguredValue(env.SUPABASE_SERVICE_ROLE_KEY);
  if (serviceKey) {
    return {
      supabaseUrl: normalizedUrl,
      apiKey: serviceKey,
      mode: 'service_role',
    };
  }

  const anonKey =
    getConfiguredValue(env.SUPABASE_ANON_KEY) ??
    getConfiguredValue(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (anonKey) {
    return {
      supabaseUrl: normalizedUrl,
      apiKey: anonKey,
      mode: 'anon',
    };
  }

  if (fallbackUrl && normalizedUrl === fallbackUrl.replace(/\/+$/, '')) {
    return {
      supabaseUrl: normalizedUrl,
      apiKey: null,
      mode: 'public',
    };
  }

  return null;
}

/**
 * Executes a lightweight read-only query against PostgreSQL via Supabase
 * PostgREST plus an Auth health check so both services stay active.
 */
export async function pingSupabase({
  supabaseUrl,
  apiKey = null,
  mode = 'anon',
  fetchImpl = fetch,
  timeoutMs = 10000,
}) {
  const baseUrl = supabaseUrl.replace(/\/+$/, '');
  const signal =
    typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(timeoutMs)
      : undefined;

  let restStatus = null;

  if (apiKey) {
    const restResponse = await fetchImpl(
      `${baseUrl}/rest/v1/materials_catalog?select=id&limit=1`,
      {
        method: 'GET',
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal,
      }
    );

    if (!restResponse.ok) {
      throw new Error(`Supabase REST keepalive failed with HTTP ${restResponse.status}`);
    }
    restStatus = restResponse.status;
  }

  let authStatus = null;
  try {
    const authHeaders = apiKey ? { apikey: apiKey } : {};
    const authResponse = await fetchImpl(`${baseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: authHeaders,
      cache: 'no-store',
      signal,
    });
    authStatus = authResponse.status;
  } catch (err) {
    if (!apiKey) {
      throw err;
    }
    // Non-fatal when authenticated REST query already succeeded.
  }

  if (!apiKey && (authStatus === null || authStatus >= 500)) {
    throw new Error(`Supabase public health check failed with HTTP ${authStatus ?? 'network_error'}`);
  }

  return {
    ok: true,
    mode,
    restStatus,
    authStatus,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Resolves a deployed public app URL suitable for calling `/api/keepalive`.
 * Returns null for missing or localhost URLs so CI/local runs never fail on localhost.
 */
export function resolvePublicAppUrl(env = process.env) {
  const rawUrl =
    getConfiguredValue(env.KEEPALIVE_APP_URL) ??
    getConfiguredValue(env.NEXT_PUBLIC_APP_URL);
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1'
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Calls the deployed Next.js `/api/keepalive` route if an app URL is configured.
 */
export async function pingKeepaliveEndpoint({
  appUrl,
  cronSecret = null,
  fetchImpl = fetch,
  timeoutMs = 10000,
}) {
  const endpoint = `${appUrl.replace(/\/+$/, '')}/api/keepalive`;
  const headers = { Accept: 'application/json' };
  if (cronSecret) {
    headers.Authorization = `Bearer ${cronSecret}`;
  }

  const signal =
    typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(timeoutMs)
      : undefined;

  const response = await fetchImpl(endpoint, {
    method: 'GET',
    headers,
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`App keepalive endpoint returned HTTP ${response.status}`);
  }

  const payload = await response.json().catch(() => null);
  if (payload && payload.ok === false) {
    throw new Error(payload.error || 'App keepalive endpoint reported unhealthy status');
  }

  return {
    ok: true,
    endpointStatus: response.status,
    payload,
  };
}
