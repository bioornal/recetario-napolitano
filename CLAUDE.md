# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**El Fogon — Dashboard Pizzería** is a full professional pizzeria management system built with Astro, Tailwind CSS, and InsForge (PostgreSQL backend). It combines:
- A Neapolitan/Argentine pizza dough calculator (with Q10 biochemistry, fermentation timing, poolish)
- A complete business management suite: ingredients, recipes, operating costs, pricing, and AI-driven marketing

The app is PWA-enabled (works offline for the calculator) and deployed on Netlify with server-side rendering.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server at http://localhost:4321 |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` or `npm run vitest` | Run unit tests |
| `npm run astro check` | Type-check Astro components |

**Running a single test file:**
```bash
npm test -- src/utils/math.test.ts
```

## Architecture

### Directory Structure
```
src/
  ├── pages/
  │   ├── index.astro          # Dashboard — business metrics overview
  │   ├── masa.astro           # Dough calculator (Napolitana, Poolish, Piedra, Molde)
  │   ├── ingredientes.astro   # Ingredient catalog with price + MR management
  │   ├── costos.astro         # Fixed + variable operating costs
  │   ├── precios.astro        # Sales price list (markup-based, auto-calculated)
  │   ├── recetas.astro        # Recipe builder with cost-per-unit calculations
  │   ├── marketing.astro      # AI marketing generator (combos, promos, social posts)
  │   └── api/
  │       └── marketing.ts     # POST endpoint — calls InsForge AI (GPT-4o-mini)
  ├── components/
  │   ├── NavSidebar.astro     # Fixed vertical nav (lg+ screens)
  │   └── NavBottom.astro      # Fixed bottom nav (mobile)
  ├── layouts/
  │   └── Layout.astro         # Root HTML template with PWA meta, nav wiring
  ├── lib/
  │   └── insforge.ts          # InsForge SDK client (baseUrl + anonKey from env)
  ├── utils/
  │   ├── math.ts              # Dough calculation engine (yeast, water temp, timing)
  │   ├── math.test.ts         # Unit tests for math functions
  │   ├── pricing.ts           # Cost/pricing utility functions
  │   └── pricing.test.ts      # Unit tests for pricing functions
  └── styles/
      └── global.css           # Tailwind v4 + dark glassmorphism theme
public/
  ├── favicon.svg
  └── favicon.ico
astro.config.mjs               # Astro + Netlify adapter + PWA + Tailwind
package.json
tsconfig.json                  # Strict Astro TypeScript config
.npmrc                         # legacy-peer-deps=true (Netlify compat)
```

### Pages

**`src/pages/index.astro`** — Business Dashboard
- Loads 4 key metrics from InsForge DB: avg cost/pizza, monthly operating cost, total recipes, pizzas target/month
- Navigation cards to all sections
- Queries: `recetas`, `costos_fijos`, `costos_variables`, `config_negocio`

**`src/pages/masa.astro`** — Dough Calculator
- Configuration panel: drum rollers for ball count/weight/ambient temp, hydration slider, fermentation hours select
- 4-method toggle: Napolitana · N. Poolish · Arg Piedra · Arg Molde
- Poolish sub-options: Rápido (~3h) / Frío (12-16h)
- Dynamic results, temperature diagnostics, step-by-step procedure, print/PDF button
- All calculation logic via `src/utils/math.ts`

**`src/pages/ingredientes.astro`** — Ingredient Catalog
- Editable table: name, $/kg, MR (Múltiplo de Rendimiento), unit, type group
- Grouped by: Quesos, Carnes, Fiambres, Verduras, Harinas, Salsas, Varios
- Full CRUD — price/MR changes cascade automatically to all recipe costs
- Queries: `ingredientes`

**`src/pages/costos.astro`** — Operating Costs
- Left panel: fixed monthly costs (toggleable active/inactive)
- Right panel: variable monthly reference costs
- Summary: fixed + variable = total operating cost, cost per pizza
- Input for pizzas objective/month
- Queries: `costos_fijos`, `costos_variables`, `config_negocio`

**`src/pages/precios.astro`** — Sales Price List
- Products grouped by subcategory (Pizzas, Calzones, Empanadas, Hamburguesas, Lomos, Otros)
- Columns: name, ingredient cost, op cost/pizza, total cost, margin %, effective price
- Editable markup per product or per category group
- Formula: `Precio = (CostoIng + CostoOp) × Markup`
- Empanadas: op cost = total_op ÷ 12 (per dozen)
- Print button
- Queries: `precios_venta`, `recetas`, `receta_ingredientes`, `ingredientes`

**`src/pages/recetas.astro`** — Recipe Builder
- Select/create/delete recipes
- Ingredient table: name, $/kg, net qty, MR, gross qty, line cost
- Two yield modes:
  - **Directo**: yields N units (pizzas, burgers)
  - **Peso**: total grams ÷ grams/unit (empanadas — shows dozens + loose units)
- Cost per unit shown
- Queries: `recetas`, `receta_ingredientes`, `ingredientes`

**`src/pages/marketing.astro`** — AI Marketing
- "Generar sugerencias" button → POST `/api/marketing`
- Sends: all recipes (name, real cost, price, margin %), op cost/pizza, pizzas target/month
- Displays: suggested combo + price, weekly promo, Instagram post, WhatsApp message, margin ranking with sales tactics
- Copy-to-clipboard buttons for social content

**`src/pages/api/marketing.ts`** — Marketing API Endpoint
- POST handler, SSR only
- Uses `insforge.ai.chat.completions.create()` with `openai/gpt-4o-mini`
- Returns structured JSON with marketing suggestions

### Core Modules

**`src/utils/math.ts`** — Dough Calculation Engine
- `calculateYeast(flour, hours, tempC)` — Neapolitan yeast (Q10-adjusted, cold 24-72h)
- `calculatePoolishYeast(poolishFlour, tempC, type)` — Poolish yeast (rapid or cold)
- `yeastTempFactor(tempC, refTemp)` — Q10 law: activity doubles every 10°C
- `temperingTime(tempC)` — Newton's cooling law, warm-up from fridge
- `waterTemp(tempC)` — Stadler Made rule: Twater = 70 − Tflour − Tambient
- `poolishRapidTime(tempC)` — Rapid poolish estimated time
- `calculateMoldeYeast(flourWeight, tempC)` — Al Molde yeast (~3.5% base at 22°C)
- `moldeFirstFermentTime(tempC)` — Al Molde block ferment (~2h base)
- `moldeSecondFermentTime(tempC)` — Al Molde in-pan ferment (~1h base)
- `calculatePiedraYeast(flourWeight, tempC)` — A la Piedra yeast (~1.5% base at 22°C)
- `piedraFirstFermentTime(tempC)` — A la Piedra block ferment (~3h base)
- `piedraSecondFermentTime(tempC)` — A la Piedra ball rest (~1h base)
- `formatMinutes(mins)` — formats to "Xh Xmin" or "X min"
- `fmt(grams)` — formats grams to 1 decimal

**`src/utils/pricing.ts`** — Cost & Pricing Utilities
- `calcCostoOperativoPorPizza(totalCostosMes, pizzasMes)` — op cost ÷ pizzas
- `calcUnidadesReceta(ingredientes, gramosPorUnidad)` — units from MR
- `markupToMargen(markup)` — converts 1.6 → 37.5%
- `margenToMarkup(margenPct)` — converts 37.5% → 1.6
- `calcCostoRealTotal(costoIng, costoOp)` — sums both costs
- `calcPrecioEfectivo(costoReal, markup)` — price = cost × markup
- `calcCostoReceta(ingredientes, prepizza, salsa)` — total recipe cost

**`src/lib/insforge.ts`** — Backend Client
```typescript
import { createClient } from '@insforge/sdk';
export const insforge = createClient({
  baseUrl: import.meta.env.PUBLIC_INSFORGE_URL,
  anonKey: import.meta.env.PUBLIC_INSFORGE_ANON_KEY,
});
```

### Database Schema (InsForge / PostgreSQL)

| Table | Purpose |
|-------|---------|
| `ingredientes` | id, nombre, precio_kg, multiplo_rendimiento, unidad, tipo |
| `recetas` | id, nombre, precio_prepizza, precio_salsa, rend_tipo, rend_valor |
| `receta_ingredientes` | receta_id, ingrediente_id, cantidad_kg, merma_factor |
| `costos_fijos` | id, nombre, monto, activo |
| `costos_variables` | id, nombre, monto_referencia |
| `precios_venta` | id, nombre, subcategoria, receta_id, markup |
| `config_negocio` | pizzas_objetivo_mes (and other business config) |

### Components

**`NavSidebar.astro`** — Desktop vertical nav (fixed left, `lg:` only)
- Logo "El Fogon" + tagline "Pizzería Napolitana"
- Links: Home, Calculadora, Recetas, Ingredientes, Costos Op., Precios, Marketing
- Dynamic highlight of current page

**`NavBottom.astro`** — Mobile bottom nav (hidden on `lg:`)
- Icon + label for each section

**`Layout.astro`** — Root template
- PWA meta tags
- NavSidebar + NavBottom
- Main content: max-w-2xl (md) / max-w-5xl (lg)
- Bottom padding-24 on mobile (above bottom nav), padding-8 on lg
- Decorative amber/gold blur blobs

### Design System

**`src/styles/global.css`** — Theme variables (`@theme` block):

| Variable | Value | Use |
|----------|-------|-----|
| `dark-bg` | `#1a1410` | Page background |
| `dark-card` | `#2a2118` | Card backgrounds |
| `dark-surface` | `#332820` | Surface elements |
| `dark-border` | `#3d3228` | Borders |
| `accent-gold` | `#e8a665` | Primary accent |
| `accent-amber` | `#d4843e` | Secondary accent |
| `text-main` | `#f0e6da` | Body text |
| `text-muted` | `#a89880` | Secondary text |
| `status-danger` | `#d45050` | Errors/warnings |
| `status-success` | `#6bb86a` | Success states |

**Custom CSS components:**
- `.glass-panel` — glassmorphism card (bg-card/80 + backdrop-blur)
- `.glass-accent` — amber/10 accent variant
- `.drum-roller` — iOS-style scroll picker (36px items, snap scrolling, fade masks)
- `.drum-item` / `.drum-item-active` — roller item states
- `.drum-highlight` — top/bottom selection lines
- Custom slider thumb: gold, hover scale 110%, glow shadow

### Key Design Patterns

**Drum Roller (`data-drum-roller`):**
iOS-style scroll picker backed by a hidden `<input>`. Data attributes: `data-target` (input id), `data-min`, `data-max`, `data-step`. Used for ballCount, ballWeight, ambientTemp.

**Fermentation Calculations:**
- Base yeast % calibrated at 22°C (with ~45 min rest before cold storage)
- Log-linear interpolation between reference points (24h, 48h, 72h)
- Q10 clamping: 5–38°C (Napolitana), 14–38°C (Argentine styles)
- Safety bounds: 0.3g min; 2% max (Napolitana), 6% (Molde), 3% (Piedra)

**Argentine Pizza Styles:**
- **Al Molde** (~3.5% at 22°C): 2h block + 1h in-pan = 3-4h total
- **A la Piedra** (~1.5% at 22°C): 3h block + 1h ball rest = 4-6h total
- Both use Q10 with ref 22°C and two-stage timing functions

**Pricing Logic:**
- Markup = 1 ÷ (1 − margin%). Example: 37.5% margin → 1.6× markup
- Effective price = (ingredient cost + op cost/pizza) × markup
- Empanadas special: op cost = total monthly op ÷ 12 (per dozen unit)

## Environment Variables

```
PUBLIC_INSFORGE_URL=https://...insforge.app
PUBLIC_INSFORGE_ANON_KEY=ik_...
OPENAI_API_KEY=sk-proj-...   # used server-side by /api/marketing.ts
```

## Development Notes

**TypeScript Setup:**
- Strict Astro TypeScript config (`tsconfig.json` extends `astro/tsconfigs/strict`)
- No `@` path aliases — use relative imports

**SSR Mode:**
- `astro.config.mjs` uses `output: 'server'` with `@astrojs/netlify` adapter
- `/api/marketing.ts` is a server endpoint (not static)
- All other pages are server-rendered but can be cached

**Styling:**
- Tailwind CSS v4.2.2 via `@tailwindcss/vite`
- Theme defined in `@theme {}` block inside `global.css`
- Use `dark-*` and `accent-*` prefix classes for themed colors
- Responsive: mobile-first, `lg:` breakpoint for desktop layout

**Testing:**
- Vitest 4.1.2
- `math.test.ts`: Q10 correctness, boundary conditions, interpolation
- `pricing.test.ts`: markup/margin conversions, cost calculations
- Common test scenario: 563g flour (4 × 230g balls)
- Run `npm test -- --watch` for TDD workflow

**PWA / Offline:**
- `@vite-pwa/astro` — auto-update on reload
- Manifest: name "El Fogon — Dashboard Pizzería", short_name "El Fogon", theme `#1a1410`
- Calculator (`masa.astro`) works fully offline after first load
- DB-dependent pages (recetas, precios, etc.) require network

**npm Configuration:**
- `.npmrc`: `legacy-peer-deps=true` (Netlify deploy compatibility)

## Common Tasks

**Adding a new dough calculation:**
1. Implement function in `src/utils/math.ts`
2. Add unit tests in `src/utils/math.test.ts` (boundary cases first)
3. Call from `masa.astro` inline `<script>` block
4. Add UI elements to the template

**Adding a new DB-backed page:**
1. Create `src/pages/yourpage.astro`
2. Import `insforge` from `../../lib/insforge`
3. Add nav link in `NavSidebar.astro` and `NavBottom.astro`
4. Follow existing CRUD patterns (see `ingredientes.astro` for reference)

**Updating ingredient pricing formulas:**
- Edit `src/utils/pricing.ts`
- Update tests in `pricing.test.ts`
- Verify cascading behavior in `precios.astro` and `recetas.astro`

**Styling adjustments:**
- Add colors to `@theme {}` in `global.css`
- Use `.glass-panel` for card containers
- Test mobile (bottom nav) and desktop (`lg:` sidebar) layouts

## Deployment

- **Adapter:** `@astrojs/netlify` (SSR)
- **Build output:** `./dist/`
- **PWA service worker:** auto-generated by `@vite-pwa/astro`
- **Env vars required:** `PUBLIC_INSFORGE_URL`, `PUBLIC_INSFORGE_ANON_KEY`, `OPENAI_API_KEY`
