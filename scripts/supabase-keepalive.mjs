import fs from 'node:fs';
import path from 'node:path';
import {
  getConfiguredValue,
  resolveSupabaseTarget,
  resolvePublicAppUrl,
  pingSupabase,
  pingKeepaliveEndpoint,
} from '../src/lib/supabase/keepalive.js';

/**
 * Loads `.env.local` for local manual runs without overriding process.env.
 */
function loadLocalEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const rawValue = line.slice(eqIndex + 1).trim();
    const unquoted = rawValue.replace(/^(['"])(.*)\1$/, '$2');
    if (key && !(key in process.env)) {
      process.env[key] = unquoted;
    }
  }
}

/**
 * Reads `project_id` from `supabase/config.toml` as a fallback URL when
 * GitHub Secrets have not been configured yet.
 */
function readFallbackSupabaseUrl(workspaceDir) {
  const configPath = path.join(workspaceDir, 'supabase', 'config.toml');
  if (!fs.existsSync(configPath)) return null;
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const match = content.match(/^\s*project_id\s*=\s*"([a-z0-9]+)"/m);
    if (match?.[1]) {
      return `https://${match[1]}.supabase.co`;
    }
  } catch {
    // Ignore config read errors
  }
  return null;
}

/**
 * Appends a status block to GitHub Actions Step Summary when running in CI.
 */
function appendGitHubSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  try {
    fs.appendFileSync(summaryPath, `${markdown}\n`, 'utf8');
  } catch {
    // Ignore summary write errors
  }
}

async function main() {
  const workspaceDir = process.cwd();
  loadLocalEnvFile(path.join(workspaceDir, '.env.local'));

  const fallbackUrl = readFallbackSupabaseUrl(workspaceDir);
  const supabaseTarget = resolveSupabaseTarget(process.env, { fallbackUrl });
  const appUrl = resolvePublicAppUrl(process.env);
  const cronSecret = getConfiguredValue(process.env.CRON_SECRET);
  const strictMode = process.env.STRICT_KEEPALIVE === 'true';

  if (!supabaseTarget && !appUrl) {
    const msg =
      'No se encontraron credenciales de Supabase ni URL pública. ' +
      'Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en GitHub Secrets.';
    console.warn(`::warning title=Supabase Keepalive::${msg}`);
    appendGitHubSummary(`### ⚠️ Supabase Keepalive\n\n${msg}`);
    if (strictMode) process.exitCode = 1;
    return;
  }

  const summaryLines = ['### ⚡ Supabase Keepalive'];

  if (supabaseTarget) {
    try {
      const res = await pingSupabase(supabaseTarget);
      const line = `Supabase OK (mode=${res.mode}, rest=${res.restStatus ?? 'n/a'}, auth=${res.authStatus ?? 'n/a'}, at=${res.checkedAt})`;
      console.log(`[keepalive] ${line}`);
      summaryLines.push(`- ✅ **Supabase**: \`${line}\``);
      if (res.mode === 'public') {
        summaryLines.push(
          '- ℹ️ *Usando URL de `supabase/config.toml` sin clave API. Añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en GitHub Secrets para consultar también PostgreSQL (`materials_catalog`).*'
        );
      }
    } catch (err) {
      const causeCode = err?.cause?.code || '';
      const details = err?.message || String(err);
      const hint =
        causeCode === 'ENOTFOUND'
          ? `El dominio (${supabaseTarget.supabaseUrl}) no resuelve en DNS (ENOTFOUND). Si el proyecto ya entró en pausa en Supabase o cambió de URL, reactívalo en https://supabase.com/dashboard y actualiza NEXT_PUBLIC_SUPABASE_URL en GitHub Secrets.`
          : `Error al conectar con Supabase (${details}). Verifica que el proyecto esté activo y las claves en GitHub Secrets sean válidas.`;
      console.warn(`::warning title=Supabase Keepalive::${hint}`);
      console.warn(`[keepalive] Warning: ${hint}`);
      summaryLines.push(`- ⚠️ **Supabase**: ${hint}`);
      if (strictMode) process.exitCode = 1;
    }
  }

  if (appUrl) {
    try {
      const res = await pingKeepaliveEndpoint({ appUrl, cronSecret });
      console.log(`[keepalive] App endpoint OK (status=${res.endpointStatus})`);
      summaryLines.push(`- ✅ **App Endpoint**: HTTP ${res.endpointStatus} (${appUrl}/api/keepalive)`);
    } catch (err) {
      const msg = `No se pudo contactar con ${appUrl}/api/keepalive (${err?.message || err}).`;
      console.warn(`::warning title=App Keepalive::${msg}`);
      summaryLines.push(`- ⚠️ **App Endpoint**: ${msg}`);
      if (strictMode) process.exitCode = 1;
    }
  }

  appendGitHubSummary(summaryLines.join('\n'));
}

main().catch((err) => {
  console.error('[keepalive] Unexpected error:', err.message || err);
  if (process.env.STRICT_KEEPALIVE === 'true') {
    process.exitCode = 1;
  }
});
