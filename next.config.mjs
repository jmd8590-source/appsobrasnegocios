/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable powered by header to avoid leaking server info
  poweredByHeader: false,

  // Disable Next.js dev indicator badge ("N" logo in dev)
  devIndicators: false,

  // Production hardening: strip console.* calls from client bundles
  // (keeps console.error for real crash diagnostics). SWC minification
  // is already on by default, and productionBrowserSourceMaps defaults
  // to false — together this is the safe ceiling for "obfuscation" on
  // this stack. A real JS obfuscator (identifier mangling, control-flow
  // flattening) run as a post-build step is NOT applied here: it tends
  // to break React hydration matching and the OpenNext/Cloudflare
  // Workers module format, trading a working app for a false sense of
  // security against a determined reverse-engineer anyway.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  // Cloudflare Workers compatibility
  experimental: {
    // Required for @opennextjs/cloudflare
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  // Enterprise Security Headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking by denying iframe embedding
          { key: "X-Frame-Options", value: "DENY" },
          // Enable XSS filter
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Control referrer information
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Enforce HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Restrict hardware features (allow camera for scrap scanner)
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
