# ⚡ ScrapLens — Industrial Scrap AI Manager

<div align="center">

![ScrapLens](https://img.shields.io/badge/ScrapLens-v0.1.0-amber?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-green?style=for-the-badge&logo=supabase)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-orange?style=for-the-badge&logo=cloudflare)

**PWA/SaaS industrial que identifica materiales de recuperación mediante IA y calcula su valor económico.**

[Demo](#modo-demo) · [Instalación](#instalación-local) · [Deploy](#despliegue-cloudflare) · [Documentación](#arquitectura)

</div>

---

## 🎯 ¿Qué es ScrapLens?

ScrapLens permite a operarios industriales **fotografiar restos de materiales** (cobre, aluminio, acero, madera, plástico, etc.) y obtener en segundos:

- **Identificación automática** del material mediante Gemini Vision
- **Estimación de peso** usando referencias visuales (moneda 2€, mano, cinta métrica)
- **Precio de mercado** actualizable desde catálogo o API externa
- **Valor económico orientativo** de recuperación
- **Gestión de inventario** completa con búsqueda y filtros
- **Lotes marketplace** con descripción generada por IA y compartición por WhatsApp

---

## 🏗 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16+ App Router |
| Lenguaje | JavaScript (ES2022 / JSX) |
| Estilos | Tailwind CSS v4 |
| Componentes | shadcn/ui (Radix UI) + Lucide React |
| IA | Gemini 2.0 Flash (`@google/genai`) |
| Base de datos | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage |
| Deploy | Cloudflare Workers (`@opennextjs/cloudflare`) |
| Validación | Zod |
| Formularios | React Hook Form |
| Gráficos | Recharts |
| Cámara | react-webcam |

---

## ⚡ Instalación local

### Requisitos previos
- Node.js 18+
- npm o pnpm
- (Opcional) Cuenta Supabase
- (Opcional) API Key de Google Gemini

### 1. Clonar y instalar

```bash
git clone https://github.com/tu-usuario/scraplens.git
cd scraplens
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
GEMINI_API_KEY=tu-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **💡 Modo demo:** Si no configuras estas variables, la app funciona con datos de ejemplo sin conexión a ninguna API.

### 3. Configurar Supabase (opcional pero recomendado)

En el SQL Editor de Supabase, ejecuta:

```sql
-- 1. Schema completo con RLS
\i supabase/migrations/001_initial_schema.sql

-- 2. Catálogo de materiales con precios reales
\i supabase/seed.sql
```

### 4. Iniciar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) → acceso automático en modo demo.

### 5. Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción (Next.js)
npm run lint         # ESLint
npm run typecheck    # TypeScript check sin emit
npm run build:cf     # Build para Cloudflare Workers
npm run deploy       # Deploy en Cloudflare (requiere wrangler login)
```

---

## 🗄 Base de datos

### Tablas principales

```
profiles          → Perfil extendido del usuario
materials_catalog → Catálogo de materiales con precios €/kg
scraps            → Sobrantes escaneados (UUID, RLS por user_id)
listings          → Lotes/marketplace
listing_scraps    → Relación many-to-many listings ↔ scraps
```

### Seguridad RLS

Cada tabla tiene políticas Row Level Security que aíslan completamente los datos por usuario. Ningún usuario puede ver datos de otro.

### Catálogo de materiales incluido

- **Metales no férreos**: Cobre limpio (6.80€/kg), Cobre mezcla, Aluminio perfiles, Latón, Bronce, Plomo, Zinc, Estaño
- **Metales férreos**: Acero estructural, Chapa, Inox 304/316, Hierro fundido, Ferralla
- **Cables**: Cu≥40%, mezcla, aluminio, electrónica
- **Madera**: Pino, Dura, Palés EUR, Derribo
- **Tableros**: DM/MDF, Contrachapado, Aglomerado, OSB
- **Plásticos**: PET, HDPE, PP, PVC, ABS, EPS
- **Obra**: Áridos, Ladrillo, Hormigón armado, Yeso, RCD mixto

---

## 🤖 Integración Gemini AI

### Análisis de imagen (`/api/analyze-scrap`)

- Acepta imagen en base64 (JPEG, PNG, WebP, HEIC) hasta 10MB
- Retorna JSON validado con Zod: `material_name`, `category`, `subtype`, `confidence_score`, `estimated_weight_kg`, `suggested_price_per_kg`, `estimated_total_value`, `condition_notes`
- Timeout de 30 segundos
- Fallback automático a datos demo si `GEMINI_API_KEY` no está configurada

### Generación de listings (`/api/generate-listing`)

- Recibe array de scraps seleccionados
- Genera título comercial (≤80 chars) y descripción markdown (200-400 palabras)
- Fallback demo si no hay API key

### Precios

Los precios **nunca se inventan**. El flujo es:
1. La IA sugiere un precio basado en su conocimiento de mercado
2. El servicio de precios (`src/lib/pricing/service.ts`) busca una coincidencia en el catálogo
3. Si encuentra coincidencia, **sobreescribe** el precio de la IA con el del catálogo
4. Para integrar una API externa de precios (LME, Recupera, etc.): implementar `fetchLivePrices()` en `service.ts`

---

## 🌐 Despliegue Cloudflare

### Prerrequisitos
- Cuenta en [Cloudflare](https://cloudflare.com) (plan gratuito suficiente)
- Wrangler CLI configurado

### Proceso de deploy

```bash
# 1. Autenticarse en Cloudflare
npx wrangler login

# 2. Crear KV namespace para caché
npx wrangler kv namespace create "CACHE"
# Copia el ID y actualiza wrangler.toml

# 3. Configurar secrets en Cloudflare
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# 4. Build + Deploy
npm run build:cf
npm run deploy
```

### Variables de entorno en Cloudflare

Configura en el dashboard de Cloudflare Workers → Settings → Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (tu dominio workers.dev)

---

## 📱 PWA — Progressive Web App

ScrapLens es instalable como app nativa en móvil y escritorio:

- **Android**: Chrome → "Añadir a pantalla de inicio"
- **iOS**: Safari → Compartir → "En el inicio"
- **Desktop**: Chrome/Edge → icono de instalación en barra de direcciones

Características PWA:
- `manifest.json` con iconos, shortcuts y colores de tema
- Service Worker para soporte offline básico
- Mobile-first con bottom navigation y FAB de escáner

---

## 🏛 Arquitectura

```
src/
├── app/
│   ├── (auth)/          # Login, Register (rutas públicas)
│   ├── (app)/           # Layout con nav, rutas protegidas
│   │   ├── dashboard/   # KPIs, gráfico, últimos escaneos
│   │   ├── scanner/     # Cámara + análisis IA
│   │   ├── inventory/   # CRUD de sobrantes
│   │   └── lots/        # Marketplace y lotes
│   └── api/             # Routes: analyze-scrap, generate-listing
├── components/
│   ├── ui/              # Design system (Button, Card, Badge, etc.)
│   ├── scanner/         # Componentes del escáner
│   └── shared/          # AppNav, EmptyState
├── lib/
│   ├── supabase/        # client.ts, server.ts
│   ├── gemini/          # client.ts, prompts.ts
│   ├── pricing/         # service.ts (desacoplado, sustituible)
│   ├── demo/            # Datos demo realistas
│   ├── validations/     # Zod schemas
│   └── utils.ts         # Formatters, helpers, cn()
├── types/               # Tipos TypeScript globales
├── hooks/               # use-toast
└── middleware.ts         # Auth guard Supabase SSR
```

---

## 🔒 Seguridad

- **Claves privadas nunca en cliente**: `SUPABASE_SERVICE_ROLE_KEY` y `GEMINI_API_KEY` solo en servidor
- **RLS en todas las tablas**: Aislamiento completo de datos por usuario
- **Validación Zod en API**: Entrada y salida validadas estrictamente
- **Headers de seguridad**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Límite de tamaño de imagen**: 10MB máximo en API

---

## ⚠️ Descargo de responsabilidad

Las estimaciones de peso, precio y valor generadas por ScrapLens son **orientativas** y están basadas en:
- Análisis visual por IA (Gemini Vision)
- Precios de mercado aproximados de Europa 2024

**No constituyen una oferta comercial vinculante.** Los precios reales pueden variar según zona, estado del material, mercado actual y negociación con el chatarrero.

---

## 📄 Licencia

MIT — Libre para uso personal y comercial con atribución.

---

<div align="center">
Construido con ⚡ por ScrapLens · Powered by Gemini AI + Supabase + Cloudflare
</div>
