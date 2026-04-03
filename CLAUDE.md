# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Calculadora Napolitana** is a professional Neapolitan pizza dough calculator built with Astro and Tailwind CSS. It provides precise calculations for:
- Dough mass based on desired ball weight and quantity
- Fresh yeast requirements (temperature-adjusted using Q10 biochemistry)
- Water temperature (Regla del 70)
- Bulk fermentation timing
- Poolish (preferment) configurations
- Tempering times (Newton's law of cooling)

The application is PWA-enabled and works offline.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server at http://localhost:4321 |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` or `npm run vitest` | Run tests (if vitest script added) |
| `npm run astro check` | Type-check Astro components |

**Running a single test:**
```bash
npm test -- src/utils/math.test.ts
```

**Watch mode for development:**
```bash
npm run dev
```

## Architecture

### Directory Structure
```
src/
  ├── pages/
  │   └── index.astro          # Main calculator UI (HTML + inline <script>)
  ├── layouts/
  │   └── Layout.astro         # Root HTML template with PWA meta tags
  ├── utils/
  │   ├── math.ts              # Core calculation engine (yeast, water temp, times)
  │   └── math.test.ts         # Unit tests for calculations
  └── styles/
      └── global.css           # Tailwind + theme variables
public/
  ├── favicon.svg
  └── favicon.ico
astro.config.mjs                # Astro + PWA + Tailwind integration
package.json
tsconfig.json                   # Strict Astro TypeScript config
```

### Core Modules

**`src/utils/math.ts`** — Mathematical engine
- `calculateYeast(flour, hours, tempC)` — Primary yeast calculation with Q10 temperature adjustment and safety clamping
- `calculatePoolishYeast(poolishFlour, tempC, type)` — Poolish-specific yeast (rapid ~3h or cold 12-16h)
- `yeastTempFactor(tempC, refTemp)` — Q10 law: yeast activity doubles every 10°C
- `temperingTime(tempC)` — Newton's cooling law for mass warm-up from fridge
- `waterTemp(tempC)` — Stadler Made rule: Twater = 70 - Tflour - Tambient
- `poolishRapidTime(tempC)` — Estimated rapid poolish fermentation time
- Utility formatters: `formatMinutes()`, `fmt()`

**`src/pages/index.astro`** — Interactive UI
- Configuration panel: ball count/weight, hydration %, fermentation hours, ambient temp
- Method toggle: direct fermentation vs. poolish
- Dynamic results and procedural steps (JavaScript-driven)
- Glassmorphism design with dark theme
- Responsive layout (mobile-first, sticky right column on desktop)

**`src/styles/global.css`** — Tailwind + custom theme
- Dark theme colors (dark-bg, dark-card, dark-surface, dark-border)
- Accent colors (gold, amber)
- Text colors (main, muted)
- Custom slider thumb styling
- `.glass-panel` utility for glassmorphism cards

### Design Patterns

**Fermentation Calculations:**
- Base yeast percentages calibrated at 22°C (standard room temp with ~45 min rest before cold)
- Log-linear interpolation for fermentation times between reference points (24h, 48h, 72h)
- Q10 clamping: factors clamped to 5°C (cold extreme) and 38°C (heat extreme) to prevent biological absurdity
- Safety bounds: 0.3g minimum (practical measurable amount), 2% maximum (overdose prevention)

**Scientific Backing:**
- See `math.ts` header for complete citations (Lesaffre, Stadler Made, Weekend Bakery, NLCST sources)
- All formulas validated against real-world pizzeria data

## Development Notes

**TypeScript Setup:**
- Strict Astro TypeScript config (`tsconfig.json` extends `astro/tsconfigs/strict`)
- No `@` path aliases configured — use relative imports

**Styling:**
- Tailwind CSS v4.2.2 with Vite plugin
- CSS variables defined in `@theme` block (global.css)
- Use `dark-*` and `accent-*` prefixes for theme colors
- Responsive breakpoints: `sm:`, `lg:` (Tailwind defaults)

**Testing:**
- Vitest 4.1.2 for unit tests
- Focus: mathematical correctness (Q10, boundary conditions, interpolation)
- Test data: 563g flour (4 balls × 230g) is a common scenario
- Run `npm test -- --watch` for TDD workflow

**PWA / Offline:**
- `@vite-pwa/astro` integration configured in `astro.config.mjs`
- Auto-update on reload
- Manifest defined in config (name: "Calculadora de Masa Napolitana", standalone display)
- Works fully offline after first load

**npm Configuration:**
- `.npmrc`: `legacy-peer-deps=true` (required for Netlify deploy compatibility)

## Common Tasks

**Adding a new calculation feature:**
1. Implement math function in `src/utils/math.ts`
2. Add unit tests in `src/utils/math.test.ts` (focus on boundary cases)
3. Call the function in `index.astro` within the `<script>` tag
4. Add UI input/output elements to the template

**Updating the dough formula or reference data:**
- Edit base percentages in `calculateYeast()` reference points
- Verify Q10 factor clamping logic still makes sense
- Run full test suite to catch regressions

**Styling adjustments:**
- Add theme colors to `src/styles/global.css` `@theme` block
- Use `.glass-panel` for card styling
- Test responsive behavior: mobile-first, check `lg:` breakpoint

## Deployment

- **Build output:** `./dist/` (static HTML/JS)
- **PWA service worker:** Auto-generated by `@vite-pwa/astro`
- **Netlify:** Compatible with `.npmrc` legacy-peer-deps flag
- **No server-side code:** Pure static + service worker
