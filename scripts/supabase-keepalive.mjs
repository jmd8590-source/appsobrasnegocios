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

async function main() {
  loadLocalEnvFile(path.join(process.cwd(), '.env.local'));

  const supabaseTarget = resolveSupabaseTarget(process.env);
  const appUrl = resolvePublicAppUrl(process.env);
  const cronSecret = getConfiguredValue(process.env.CRON_SECRET);

  if (!supabaseTarget && !appUrl) {
    console.error(
      '[keepalive] No Supabase credentials or public app URL found. ' +
        'Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
        '(or SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_APP_URL) in GitHub Secrets or .env.local.'
    );
    process.exitCode = 1;
    return;
  }

  let succeeded = false;

  if (supabaseTarget) {
    const res = await pingSupabase(supabaseTarget);
    console.log(
      `[keepalive] Supabase OK (mode=${res.mode}, rest=${res.restStatus}, auth=${res.authStatus ?? 'n/a'}, at=${res.checkedAt})`
    );
    succeeded = true;
  }

  if (appUrl) {
    const res = await pingKeepaliveEndpoint({ appUrl, cronSecret });
    console.log(`[keepalive] App endpoint OK (status=${res.endpointStatus})`);
    succeeded = true;
  }

  if (!succeeded) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('[keepalive] Failed:', err.message || err);
  process.exitCode = 1;
});

