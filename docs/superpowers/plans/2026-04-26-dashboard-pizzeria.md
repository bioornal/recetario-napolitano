# Dashboard Pizzería — El Fogon: Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir la Calculadora Napolitana hacia un dashboard profesional de pizzería con módulos de recetas, costos operativos, precios de venta y marketing IA.

**Architecture:** Multi-página Astro (output: server + prerender por página). Backend Insforge (PostgreSQL cloud) para persistencia de datos. OpenAI gpt-4o-mini para sugerencias de marketing server-side. Fórmula de precio en cascada: precio_efectivo = (costo_ingredientes + costos_operativos ÷ pizzas_mes) × markup.

**Tech Stack:** Astro 6, Tailwind CSS v4, @insforge/sdk, @astrojs/netlify, OpenAI API, Vitest

---

## Mapa de Archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/utils/pricing.ts` | Crear | Funciones puras de cálculo de precios |
| `src/utils/pricing.test.ts` | Crear | Tests de fórmulas de precio |
| `src/lib/insforge.ts` | Crear | Cliente Insforge singleton |
| `src/components/NavSidebar.astro` | Crear | Nav lateral (desktop) |
| `src/components/NavBottom.astro` | Crear | Nav inferior (mobile) |
| `src/layouts/Layout.astro` | Modificar | Agregar nav + prop title |
| `src/pages/masa.astro` | Crear | Calculadora de masa (movida de index) |
| `src/pages/index.astro` | Modificar | Dashboard con métricas resumen |
| `src/pages/recetas.astro` | Crear | Módulo de recetas y costos |
| `src/pages/costos.astro` | Crear | Módulo de costos operativos |
| `src/pages/precios.astro` | Crear | Módulo de lista de precios |
| `src/pages/marketing.astro` | Crear | Módulo de marketing IA |
| `src/pages/api/marketing.ts` | Crear | Endpoint OpenAI (server-side) |
| `astro.config.mjs` | Modificar | Agregar adapter Netlify + output server |
| `package.json` | Modificar | Agregar dependencias |
| `.env` | Modificar | Agregar vars Insforge |
| `.gitignore` | Modificar | Agregar .superpowers/ |

---

## Task 1: Reiniciar Claude Code para cargar MCP Insforge

> ⚠️ El instalador de Insforge modificó `.claude/settings.local.json`. El MCP no está activo hasta reiniciar Claude Code.

**Files:**
- Check: `.claude/settings.local.json`

- [ ] **Step 1: Verificar config MCP**

Verificar que `.claude/settings.local.json` contiene `"insforge"` en `enabledMcpjsonServers`.

- [ ] **Step 2: Reiniciar Claude Code**

Cerrar y reabrir Claude Code. Verificar que aparecen herramientas `insforge:*` disponibles.

- [ ] **Step 3: Verificar MCP activo**

Ejecutar via MCP: `get-backend-metadata` para confirmar conexión con `https://3agqcygs.us-east.insforge.app`.

---

## Task 2: Dependencias + .env + .gitignore

**Files:**
- Modify: `package.json`
- Modify: `.env`
- Modify: `.gitignore`

- [ ] **Step 1: Instalar dependencias**

```bash
npm install @insforge/sdk @astrojs/netlify
```

Salida esperada: `added N packages` sin errores.

- [ ] **Step 2: Agregar vars al .env**

Agregar al final del `.env` existente:
```bash
PUBLIC_INSFORGE_URL=https://3agqcygs.us-east.insforge.app
PUBLIC_INSFORGE_ANON_KEY=ik_86a90ff3a2a1c9ff3990745c703037ce
```
> `PUBLIC_` prefix = disponible en cliente Astro vía `import.meta.env`.

- [ ] **Step 3: Actualizar .gitignore**

Agregar al final de `.gitignore`:
```
# Brainstorm sessions
.superpowers/
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore .npmrc
git commit -m "chore: add insforge + netlify deps, update gitignore"
```

---

## Task 3: Pricing library — TDD

**Files:**
- Create: `src/utils/pricing.ts`
- Create: `src/utils/pricing.test.ts`

- [ ] **Step 1: Agregar script test a package.json**

Editar `package.json`, agregar en `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Escribir tests primero**

Crear `src/utils/pricing.test.ts`:
```typescript
import { describe, test, expect } from 'vitest';
import {
  calcCostoOperativoPorPizza,
  calcCostoRealTotal,
  calcPrecioEfectivo,
  calcCostoReceta,
} from './pricing';

describe('calcCostoOperativoPorPizza', () => {
  test('divide total mensual entre pizzas objetivo', () => {
    expect(calcCostoOperativoPorPizza(1_000_000, 800)).toBe(1250);
  });
  test('retorna 0 si pizzas = 0 (división por cero)', () => {
    expect(calcCostoOperativoPorPizza(1_000_000, 0)).toBe(0);
  });
});

describe('calcCostoRealTotal', () => {
  test('suma costo ingredientes + costo operativo', () => {
    expect(calcCostoRealTotal(4020, 1250)).toBe(5270);
  });
});

describe('calcPrecioEfectivo', () => {
  test('aplica markup al costo real total', () => {
    expect(calcPrecioEfectivo(5270, 1.6)).toBe(8432);
  });
  test('redondea al entero más cercano', () => {
    expect(calcPrecioEfectivo(1000, 1.333)).toBe(1333);
  });
});

describe('calcCostoReceta', () => {
  test('suma prepizza + salsa + ingredientes con merma', () => {
    const ingredientes = [
      { precio_kg: 16000, cantidad_kg: 0.2, merma_factor: 1.0 }, // 3200
      { precio_kg: 20000, cantidad_kg: 0.005, merma_factor: 1.0 }, // 100
    ];
    // prepizza 485 + salsa 236 + 3200 + 100 = 4021
    expect(calcCostoReceta(ingredientes, 485, 236)).toBe(4021);
  });
  test('aplica factor de merma a la cantidad', () => {
    const ingredientes = [
      { precio_kg: 10000, cantidad_kg: 0.1, merma_factor: 1.2 }, // 1200
    ];
    expect(calcCostoReceta(ingredientes, 0, 0)).toBe(1200);
  });
});
```

- [ ] **Step 3: Ejecutar tests — deben fallar**

```bash
npm test
```
Esperado: FAIL — `Cannot find module './pricing'`

- [ ] **Step 4: Implementar pricing.ts**

Crear `src/utils/pricing.ts`:
```typescript
export function calcCostoOperativoPorPizza(totalCostosMes: number, pizzasMes: number): number {
  if (pizzasMes === 0) return 0;
  return Math.round(totalCostosMes / pizzasMes);
}

export function calcCostoRealTotal(costoIngredientes: number, costoOperativoPorPizza: number): number {
  return costoIngredientes + costoOperativoPorPizza;
}

export function calcPrecioEfectivo(costoRealTotal: number, markup: number): number {
  return Math.round(costoRealTotal * markup);
}

export function calcCostoReceta(
  ingredientes: Array<{ precio_kg: number; cantidad_kg: number; merma_factor: number }>,
  precioPrepizza: number,
  precioSalsa: number
): number {
  const costoIngredientes = ingredientes.reduce((acc, ing) => {
    return acc + Math.round(ing.precio_kg * ing.cantidad_kg * ing.merma_factor);
  }, 0);
  return precioPrepizza + precioSalsa + costoIngredientes;
}
```

- [ ] **Step 5: Ejecutar tests — deben pasar**

```bash
npm test
```
Esperado: PASS — 6 tests passed

- [ ] **Step 6: Commit**

```bash
git add src/utils/pricing.ts src/utils/pricing.test.ts package.json
git commit -m "feat: add pricing calculation library with tests"
```

---

## Task 4: DB schema via Insforge MCP

> ⚠️ Requiere que Task 1 esté completo (MCP activo). Usa la herramienta `insforge:run-raw-sql`.

**Files:** Solo DB — no se tocan archivos del proyecto.

- [ ] **Step 1: Fetchear docs de DB**

Via MCP Insforge: `fetch-docs` con tipo `"instructions"` para confirmar conexión y obtener patrones de schema.

- [ ] **Step 2: Crear tabla ingredientes**

Via MCP `run-raw-sql`:
```sql
CREATE TABLE IF NOT EXISTS ingredientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  precio_kg numeric NOT NULL DEFAULT 0,
  unidad text NOT NULL DEFAULT 'kg',
  updated_at timestamptz DEFAULT now()
);
```

- [ ] **Step 3: Crear tabla recetas**

```sql
CREATE TABLE IF NOT EXISTS recetas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  precio_prepizza numeric NOT NULL DEFAULT 0,
  precio_salsa numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

- [ ] **Step 4: Crear tabla receta_ingredientes**

```sql
CREATE TABLE IF NOT EXISTS receta_ingredientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  receta_id uuid NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  ingrediente_id uuid NOT NULL REFERENCES ingredientes(id) ON DELETE RESTRICT,
  cantidad_kg numeric NOT NULL DEFAULT 0,
  merma_factor numeric NOT NULL DEFAULT 1.0
);
```

- [ ] **Step 5: Crear tablas de costos**

```sql
CREATE TABLE IF NOT EXISTS costos_fijos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  monto numeric NOT NULL DEFAULT 0,
  periodo text NOT NULL DEFAULT 'mensual',
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS costos_variables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  monto_referencia numeric NOT NULL DEFAULT 0,
  categoria text NOT NULL DEFAULT 'otros'
);
```

- [ ] **Step 6: Crear config + precios**

```sql
CREATE TABLE IF NOT EXISTS config_negocio (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pizzas_objetivo_mes integer NOT NULL DEFAULT 800
);
INSERT INTO config_negocio (pizzas_objetivo_mes) VALUES (800)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS precios_venta (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  receta_id uuid REFERENCES recetas(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  markup numeric NOT NULL DEFAULT 1.6
);
```

- [ ] **Step 7: Verificar schema**

Via MCP `get-table-schema` para cada tabla creada — confirmar columnas y tipos.

- [ ] **Step 8: Seed de datos iniciales (ingredientes comunes)**

```sql
INSERT INTO ingredientes (nombre, precio_kg, unidad) VALUES
  ('Muzzarela', 16000, 'kg'),
  ('Orégano', 20000, 'kg'),
  ('Aceitunas', 3400, 'kg'),
  ('Tomate perita', 1800, 'kg'),
  ('Cebolla', 1500, 'kg'),
  ('Jamón', 11400, 'kg'),
  ('Panceta', 14500, 'kg'),
  ('Calabresa', 13340, 'kg'),
  ('Parmesano', 17000, 'kg'),
  ('Roquefort', 14400, 'kg')
ON CONFLICT DO NOTHING;

INSERT INTO costos_fijos (nombre, monto, periodo) VALUES
  ('Alquiler', 450000, 'mensual'),
  ('Luz', 30000, 'mensual'),
  ('Gas', 30000, 'mensual'),
  ('Cocinero 1', 110000, 'mensual'),
  ('Limpieza', 40000, 'mensual')
ON CONFLICT DO NOTHING;
```

---

## Task 5: Cliente Insforge

**Files:**
- Create: `src/lib/insforge.ts`

- [ ] **Step 1: Fetchear docs de DB SDK**

Via MCP `fetch-sdk-docs` con `feature: "db"` y `language: "typescript"`. Anotar métodos exactos de select/insert/update/delete.

- [ ] **Step 2: Crear cliente singleton**

Crear `src/lib/insforge.ts`:
```typescript
import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.PUBLIC_INSFORGE_URL as string;
const anonKey = import.meta.env.PUBLIC_INSFORGE_ANON_KEY as string;

export const insforge = createClient({ baseUrl, anonKey });
export const db = insforge.db;
```

> Nota: usar los métodos exactos del SDK según docs fetcheadas en Step 1. El patrón es similar a Supabase: `db.from('tabla').select()`, `db.from('tabla').insert([{...}])`, `db.from('tabla').update({...}).eq('id', id)`, `db.from('tabla').delete().eq('id', id)`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/insforge.ts
git commit -m "feat: add insforge client singleton"
```

---

## Task 6: Astro config — output server + adapter Netlify

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Actualizar astro.config.mjs**

Reemplazar contenido completo de `astro.config.mjs`:
```javascript
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import astroPwa from '@vite-pwa/astro';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [
    astroPwa({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: {
        name: 'El Fogon — Dashboard Pizzería',
        short_name: 'El Fogon',
        description: 'Gestión profesional de pizzería napolitana',
        theme_color: '#1a1410',
        background_color: '#1a1410',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt}']
      }
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Esperado: build exitoso en `./dist/`. Si hay error con PWA + SSR, verificar compatibilidad de `@vite-pwa/astro` con output server.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs package.json package-lock.json
git commit -m "feat: add netlify adapter, switch to hybrid output"
```

---

## Task 7: Layout + navegación

**Files:**
- Create: `src/components/NavSidebar.astro`
- Create: `src/components/NavBottom.astro`
- Modify: `src/layouts/Layout.astro`

- [ ] **Step 1: Crear NavSidebar.astro**

Crear `src/components/NavSidebar.astro`:
```astro
---
export const prerender = true;
const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/masa', label: 'Calculadora', icon: '🧮' },
  { href: '/recetas', label: 'Recetas', icon: '📋' },
  { href: '/costos', label: 'Costos Op.', icon: '💼' },
  { href: '/precios', label: 'Precios', icon: '🏷️' },
  { href: '/marketing', label: 'Marketing', icon: '🎯' },
];
const current = Astro.url.pathname;
---
<nav class="hidden lg:flex flex-col fixed left-0 top-0 h-full w-48 bg-dark-card border-r border-dark-border/50 p-4 z-50">
  <div class="mb-6 px-2">
    <span class="font-['Outfit'] text-accent-gold font-bold text-lg">El Fogon</span>
    <p class="text-text-muted text-[0.6rem] uppercase tracking-widest">Pizzería Napolitana</p>
  </div>
  <ul class="flex flex-col gap-1">
    {navItems.map(item => (
      <li>
        <a
          href={item.href}
          class={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${current === item.href
              ? 'bg-accent-amber/20 text-accent-amber'
              : 'text-text-muted hover:text-text-main hover:bg-dark-surface'}`}
        >
          <span class="text-base">{item.icon}</span>
          {item.label}
        </a>
      </li>
    ))}
  </ul>
</nav>
```

- [ ] **Step 2: Crear NavBottom.astro**

Crear `src/components/NavBottom.astro`:
```astro
---
const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/masa', label: 'Masa', icon: '🧮' },
  { href: '/recetas', label: 'Recetas', icon: '📋' },
  { href: '/costos', label: 'Costos', icon: '💼' },
  { href: '/precios', label: 'Precios', icon: '🏷️' },
  { href: '/marketing', label: 'Marketing', icon: '🎯' },
];
const current = Astro.url.pathname;
---
<nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border/50 z-50">
  <ul class="flex justify-around items-center h-16 px-2">
    {navItems.map(item => (
      <li>
        <a
          href={item.href}
          class={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all
            ${current === item.href ? 'text-accent-amber' : 'text-text-muted'}`}
        >
          <span class="text-xl">{item.icon}</span>
          <span class="text-[0.55rem] font-medium uppercase tracking-wide">{item.label}</span>
        </a>
      </li>
    ))}
  </ul>
</nav>
```

- [ ] **Step 3: Actualizar Layout.astro**

Reemplazar `src/layouts/Layout.astro` con:
```astro
---
import '../styles/global.css';
import NavSidebar from '../components/NavSidebar.astro';
import NavBottom from '../components/NavBottom.astro';

interface Props {
  title?: string;
}
const { title = 'El Fogon' } = Astro.props;
---
<!DOCTYPE html>
<html lang="es" class="bg-dark-bg">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#1a1410">
  <title>{title} — El Fogon</title>
  <meta name="description" content="Dashboard profesional de pizzería napolitana.">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body class="font-['Inter',sans-serif] antialiased min-h-screen text-text-main">
  <NavSidebar />
  <NavBottom />
  <main class="lg:ml-48 min-h-screen flex flex-col items-center p-4 sm:p-6 pb-24 lg:pb-8">
    <div class="w-full max-w-2xl lg:max-w-5xl relative z-10">
      <slot />
    </div>
  </main>

  <div class="fixed inset-0 pointer-events-none z-0">
    <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-amber/10 blur-[100px]"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-gold/5 blur-[100px]"></div>
  </div>
</body>
</html>
```

- [ ] **Step 4: Verificar dev server**

```bash
npm run dev
```
Abrir `http://localhost:4321` — verificar que sidebar aparece en desktop y bottom nav en mobile.

- [ ] **Step 5: Commit**

```bash
git add src/components/ src/layouts/Layout.astro
git commit -m "feat: add navigation sidebar and bottom nav"
```

---

## Task 8: Mover masa a /masa + crear dashboard

**Files:**
- Create: `src/pages/masa.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Copiar calculadora a masa.astro**

Copiar TODO el contenido de `src/pages/index.astro` actual a `src/pages/masa.astro`. Agregar al inicio del frontmatter:
```astro
---
export const prerender = true;
import Layout from '../layouts/Layout.astro';
---
```
Y cambiar el `<Layout>` tag a `<Layout title="Calculadora">`.

- [ ] **Step 2: Reemplazar index.astro con dashboard**

Reemplazar `src/pages/index.astro` con:
```astro
---
export const prerender = true;
import Layout from '../layouts/Layout.astro';
---
<Layout title="Dashboard">
  <header class="text-center py-6 mb-6 border-b border-dark-border/50">
    <h1 class="font-['Outfit'] text-3xl font-bold bg-gradient-to-r from-accent-gold to-accent-amber text-transparent bg-clip-text mb-1">El Fogon</h1>
    <p class="text-sm text-text-muted uppercase tracking-widest">Dashboard de Pizzería</p>
  </header>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="metricas">
    <div class="glass-panel rounded-2xl p-4">
      <p class="text-[0.65rem] text-text-muted uppercase tracking-wider mb-1">Costo Prom. x Pizza</p>
      <p class="text-2xl font-bold text-accent-gold" id="m-costo-pizza">—</p>
    </div>
    <div class="glass-panel rounded-2xl p-4">
      <p class="text-[0.65rem] text-text-muted uppercase tracking-wider mb-1">Costos Op. / Mes</p>
      <p class="text-2xl font-bold text-purple-400" id="m-costos-op">—</p>
    </div>
    <div class="glass-panel rounded-2xl p-4">
      <p class="text-[0.65rem] text-text-muted uppercase tracking-wider mb-1">Recetas</p>
      <p class="text-2xl font-bold text-emerald-400" id="m-recetas">—</p>
    </div>
    <div class="glass-panel rounded-2xl p-4">
      <p class="text-[0.65rem] text-text-muted uppercase tracking-wider mb-1">Pizzas / Mes</p>
      <p class="text-2xl font-bold text-orange-400" id="m-pizzas">—</p>
    </div>
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
    <a href="/masa" class="glass-panel rounded-2xl p-5 hover:border-accent-amber/50 transition-all group">
      <div class="text-2xl mb-2">🧮</div>
      <h2 class="font-bold text-text-main group-hover:text-accent-amber transition-colors">Calculadora</h2>
      <p class="text-xs text-text-muted mt-1">Masa napolitana híbrida</p>
    </a>
    <a href="/recetas" class="glass-panel rounded-2xl p-5 hover:border-emerald-500/50 transition-all group">
      <div class="text-2xl mb-2">📋</div>
      <h2 class="font-bold text-text-main group-hover:text-emerald-400 transition-colors">Recetas</h2>
      <p class="text-xs text-text-muted mt-1">Costos de producción</p>
    </a>
    <a href="/costos" class="glass-panel rounded-2xl p-5 hover:border-purple-500/50 transition-all group">
      <div class="text-2xl mb-2">💼</div>
      <h2 class="font-bold text-text-main group-hover:text-purple-400 transition-colors">Costos Operativos</h2>
      <p class="text-xs text-text-muted mt-1">Fijos y variables del negocio</p>
    </a>
    <a href="/precios" class="glass-panel rounded-2xl p-5 hover:border-orange-500/50 transition-all group">
      <div class="text-2xl mb-2">🏷️</div>
      <h2 class="font-bold text-text-main group-hover:text-orange-400 transition-colors">Lista de Precios</h2>
      <p class="text-xs text-text-muted mt-1">Precios de venta calculados</p>
    </a>
    <a href="/marketing" class="glass-panel rounded-2xl p-5 hover:border-pink-500/50 transition-all group col-span-2 lg:col-span-1">
      <div class="text-2xl mb-2">🎯</div>
      <h2 class="font-bold text-text-main group-hover:text-pink-400 transition-colors">Marketing IA</h2>
      <p class="text-xs text-text-muted mt-1">Combos, promos y contenido</p>
    </a>
  </div>
</Layout>

<script>
  import { db } from '../lib/insforge';
  import { calcCostoOperativoPorPizza } from '../utils/pricing';

  async function loadMetricas() {
    const [recetas, costosFijos, costosVar, config] = await Promise.all([
      db.from('recetas').select('id'),
      db.from('costos_fijos').select('monto').eq('activo', true),
      db.from('costos_variables').select('monto_referencia'),
      db.from('config_negocio').select('pizzas_objetivo_mes').limit(1),
    ]);

    const totalOp = [
      ...(costosFijos.data ?? []).map((c: any) => c.monto),
      ...(costosVar.data ?? []).map((c: any) => c.monto_referencia),
    ].reduce((a: number, b: number) => a + b, 0);

    const pizzasMes = config.data?.[0]?.pizzas_objetivo_mes ?? 800;
    const costoPorPizza = calcCostoOperativoPorPizza(totalOp, pizzasMes);

    const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
    document.getElementById('m-costo-pizza')!.textContent = fmt(costoPorPizza);
    document.getElementById('m-costos-op')!.textContent = fmt(totalOp);
    document.getElementById('m-recetas')!.textContent = String(recetas.data?.length ?? 0);
    document.getElementById('m-pizzas')!.textContent = String(pizzasMes);
  }

  loadMetricas();
</script>
```

> ⚠️ Ajustar métodos de `db` según docs de Insforge fetcheadas en Task 5 Step 1 — el patrón `.from().select().eq()` puede variar.

- [ ] **Step 3: Verificar navegación**

```bash
npm run dev
```
Verificar `/` muestra dashboard con métricas, `/masa` muestra calculadora intacta.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro src/pages/masa.astro
git commit -m "feat: create dashboard, move masa calculator to /masa"
```

---

## Task 9: Módulo Recetas

**Files:**
- Create: `src/pages/recetas.astro`

- [ ] **Step 1: Crear recetas.astro**

Crear `src/pages/recetas.astro`:
```astro
---
export const prerender = true;
import Layout from '../layouts/Layout.astro';
---
<Layout title="Recetas">
  <header class="py-6 mb-4 border-b border-dark-border/50">
    <h1 class="font-['Outfit'] text-2xl font-bold text-accent-gold">📋 Recetas & Costos</h1>
    <p class="text-xs text-text-muted mt-1">Costos de producción por pizza — editá directamente en la tabla</p>
  </header>

  <!-- Lista de recetas -->
  <div class="flex items-center justify-between mb-4">
    <select id="select-receta" class="bg-dark-surface border border-dark-border text-text-main py-2 px-3 rounded-xl text-sm focus:ring-2 focus:ring-accent-amber/50 outline-none">
      <option value="">— Seleccioná una receta —</option>
    </select>
    <div class="flex gap-2">
      <button id="btn-nueva-receta" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">+ Nueva receta</button>
      <button id="btn-eliminar-receta" class="bg-red-900/50 hover:bg-red-800 text-red-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all hidden">Eliminar receta</button>
    </div>
  </div>

  <!-- Editor de receta -->
  <div id="editor-receta" class="hidden">
    <div class="glass-panel rounded-2xl p-5 mb-4">
      <div class="flex gap-4 mb-4">
        <div class="flex-1">
          <label class="text-[0.65rem] text-text-muted uppercase tracking-wider">Nombre de la pizza</label>
          <input id="inp-nombre" type="text" class="mt-1 w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-text-main text-sm focus:ring-2 focus:ring-accent-amber/50 outline-none">
        </div>
        <div class="w-32">
          <label class="text-[0.65rem] text-text-muted uppercase tracking-wider">Prepizza ($)</label>
          <input id="inp-prepizza" type="number" class="mt-1 w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-text-main text-sm focus:ring-2 focus:ring-accent-amber/50 outline-none">
        </div>
        <div class="w-32">
          <label class="text-[0.65rem] text-text-muted uppercase tracking-wider">Salsa ($)</label>
          <input id="inp-salsa" type="number" class="mt-1 w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-text-main text-sm focus:ring-2 focus:ring-accent-amber/50 outline-none">
        </div>
      </div>
    </div>

    <!-- Tabla de ingredientes -->
    <div class="glass-panel rounded-2xl overflow-hidden mb-4">
      <div class="flex items-center justify-between p-4 border-b border-dark-border/50">
        <h2 class="text-xs uppercase tracking-wider text-accent-amber font-bold">Ingredientes</h2>
        <button id="btn-add-ing" class="bg-emerald-600/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-600/40 transition-all">+ Agregar</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-text-muted text-[0.65rem] uppercase tracking-wider border-b border-dark-border/50">
              <th class="text-left p-3">Ingrediente</th>
              <th class="text-right p-3">$/kg</th>
              <th class="text-right p-3">Cant. (kg)</th>
              <th class="text-right p-3">Merma</th>
              <th class="text-right p-3">Costo</th>
              <th class="p-3"></th>
            </tr>
          </thead>
          <tbody id="tabla-ingredientes"></tbody>
        </table>
      </div>
      <div class="flex justify-between items-center p-4 border-t border-dark-border/50 bg-dark-surface/50">
        <span class="text-xs text-text-muted uppercase tracking-wider">Costo total pizza</span>
        <span class="text-xl font-bold text-emerald-400" id="costo-total">$0</span>
      </div>
    </div>

    <button id="btn-guardar" class="w-full bg-accent-amber text-dark-bg font-bold py-3 rounded-xl hover:bg-accent-gold transition-all">Guardar receta</button>
  </div>

  <!-- Tabla de todos los precios de ingredientes -->
  <div class="glass-panel rounded-2xl overflow-hidden mt-6">
    <div class="p-4 border-b border-dark-border/50">
      <h2 class="text-xs uppercase tracking-wider text-accent-amber font-bold">Precios de Ingredientes</h2>
      <p class="text-[0.65rem] text-text-muted mt-0.5">Editá el precio por kg — actualiza automáticamente todos los costos</p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-text-muted text-[0.65rem] uppercase tracking-wider border-b border-dark-border/50">
            <th class="text-left p-3">Ingrediente</th>
            <th class="text-right p-3">$/kg</th>
            <th class="text-right p-3">Unidad</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody id="tabla-ingredientes-precios"></tbody>
      </table>
    </div>
    <div class="p-4 border-t border-dark-border/50">
      <button id="btn-add-ingrediente-global" class="bg-dark-surface border border-dark-border text-text-muted text-xs px-3 py-1.5 rounded-lg hover:text-text-main hover:border-accent-amber/50 transition-all">+ Nuevo ingrediente</button>
    </div>
  </div>
</Layout>

<script>
  import { db } from '../lib/insforge';
  import { calcCostoReceta } from '../utils/pricing';

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

  let ingredientesGlobales: any[] = [];
  let recetaActual: any = null;
  let ingredientesReceta: any[] = [];

  async function init() {
    ingredientesGlobales = (await db.from('ingredientes').select('*').order('nombre')).data ?? [];
    await cargarSelectRecetas();
    await renderTablaIngredientesGlobales();
  }

  async function cargarSelectRecetas() {
    const { data } = await db.from('recetas').select('id, nombre').order('nombre');
    const sel = document.getElementById('select-receta') as HTMLSelectElement;
    sel.innerHTML = '<option value="">— Seleccioná una receta —</option>';
    (data ?? []).forEach((r: any) => {
      sel.innerHTML += `<option value="${r.id}">${r.nombre}</option>`;
    });
  }

  document.getElementById('select-receta')!.addEventListener('change', async (e) => {
    const id = (e.target as HTMLSelectElement).value;
    if (!id) { document.getElementById('editor-receta')!.classList.add('hidden'); return; }
    await cargarReceta(id);
  });

  async function cargarReceta(id: string) {
    const [{ data: receta }, { data: ings }] = await Promise.all([
      db.from('recetas').select('*').eq('id', id).single(),
      db.from('receta_ingredientes').select('*, ingredientes(nombre, precio_kg)').eq('receta_id', id),
    ]);
    recetaActual = receta;
    ingredientesReceta = ings ?? [];
    (document.getElementById('inp-nombre') as HTMLInputElement).value = receta.nombre;
    (document.getElementById('inp-prepizza') as HTMLInputElement).value = receta.precio_prepizza;
    (document.getElementById('inp-salsa') as HTMLInputElement).value = receta.precio_salsa;
    document.getElementById('editor-receta')!.classList.remove('hidden');
    document.getElementById('btn-eliminar-receta')!.classList.remove('hidden');
    renderTablaIngredientesReceta();
  }

  function renderTablaIngredientesReceta() {
    const tbody = document.getElementById('tabla-ingredientes')!;
    const prepizza = parseFloat((document.getElementById('inp-prepizza') as HTMLInputElement).value) || 0;
    const salsa = parseFloat((document.getElementById('inp-salsa') as HTMLInputElement).value) || 0;
    tbody.innerHTML = ingredientesReceta.map((ing: any, i: number) => `
      <tr class="border-b border-dark-border/30 hover:bg-dark-surface/30">
        <td class="p-3 text-text-main">${ing.ingredientes?.nombre ?? '?'}</td>
        <td class="p-3 text-right text-accent-amber">${fmt(ing.ingredientes?.precio_kg ?? 0)}</td>
        <td class="p-3 text-right">
          <input type="number" step="0.001" value="${ing.cantidad_kg}" data-idx="${i}" data-field="cantidad_kg"
            class="w-24 bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-right text-text-main text-xs focus:ring-1 focus:ring-accent-amber/50 outline-none ing-input">
        </td>
        <td class="p-3 text-right">
          <input type="number" step="0.01" value="${ing.merma_factor}" data-idx="${i}" data-field="merma_factor"
            class="w-20 bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-right text-text-main text-xs focus:ring-1 focus:ring-accent-amber/50 outline-none ing-input">
        </td>
        <td class="p-3 text-right text-text-main font-medium">${fmt((ing.ingredientes?.precio_kg ?? 0) * ing.cantidad_kg * ing.merma_factor)}</td>
        <td class="p-3">
          <button data-idx="${i}" class="text-red-400 text-xs hover:text-red-300 btn-del-ing">✕</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.ing-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const el = e.target as HTMLInputElement;
        const idx = parseInt(el.dataset.idx!);
        const field = el.dataset.field!;
        ingredientesReceta[idx][field] = parseFloat(el.value);
        renderTablaIngredientesReceta();
      });
    });

    document.querySelectorAll('.btn-del-ing').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.target as HTMLElement).dataset.idx!);
        ingredientesReceta.splice(idx, 1);
        renderTablaIngredientesReceta();
      });
    });

    const costo = calcCostoReceta(
      ingredientesReceta.map((i: any) => ({ precio_kg: i.ingredientes?.precio_kg ?? 0, cantidad_kg: i.cantidad_kg, merma_factor: i.merma_factor })),
      prepizza, salsa
    );
    document.getElementById('costo-total')!.textContent = fmt(costo);
  }

  document.getElementById('inp-prepizza')!.addEventListener('input', renderTablaIngredientesReceta);
  document.getElementById('inp-salsa')!.addEventListener('input', renderTablaIngredientesReceta);

  document.getElementById('btn-add-ing')!.addEventListener('click', () => {
    const nombre = prompt('Ingrediente (seleccioná de la lista):\n' + ingredientesGlobales.map((i: any) => i.nombre).join(', '));
    const ing = ingredientesGlobales.find((i: any) => i.nombre.toLowerCase() === nombre?.toLowerCase());
    if (!ing) return alert('Ingrediente no encontrado. Agregalo primero en la tabla de ingredientes.');
    ingredientesReceta.push({ ingrediente_id: ing.id, cantidad_kg: 0.1, merma_factor: 1.0, ingredientes: ing });
    renderTablaIngredientesReceta();
  });

  document.getElementById('btn-nueva-receta')!.addEventListener('click', () => {
    recetaActual = null;
    ingredientesReceta = [];
    (document.getElementById('inp-nombre') as HTMLInputElement).value = '';
    (document.getElementById('inp-prepizza') as HTMLInputElement).value = '485';
    (document.getElementById('inp-salsa') as HTMLInputElement).value = '236';
    (document.getElementById('select-receta') as HTMLSelectElement).value = '';
    document.getElementById('editor-receta')!.classList.remove('hidden');
    document.getElementById('btn-eliminar-receta')!.classList.add('hidden');
    renderTablaIngredientesReceta();
  });

  document.getElementById('btn-guardar')!.addEventListener('click', async () => {
    const nombre = (document.getElementById('inp-nombre') as HTMLInputElement).value.trim();
    const precio_prepizza = parseFloat((document.getElementById('inp-prepizza') as HTMLInputElement).value);
    const precio_salsa = parseFloat((document.getElementById('inp-salsa') as HTMLInputElement).value);
    if (!nombre) return alert('Nombre requerido');

    if (recetaActual) {
      await db.from('recetas').update({ nombre, precio_prepizza, precio_salsa }).eq('id', recetaActual.id);
      await db.from('receta_ingredientes').delete().eq('receta_id', recetaActual.id);
    } else {
      const { data } = await db.from('recetas').insert([{ nombre, precio_prepizza, precio_salsa }]).select('id').single();
      recetaActual = data;
    }
    if (ingredientesReceta.length > 0) {
      await db.from('receta_ingredientes').insert(ingredientesReceta.map((i: any) => ({
        receta_id: recetaActual.id, ingrediente_id: i.ingrediente_id,
        cantidad_kg: i.cantidad_kg, merma_factor: i.merma_factor,
      })));
    }
    await cargarSelectRecetas();
    alert('Receta guardada ✓');
  });

  document.getElementById('btn-eliminar-receta')!.addEventListener('click', async () => {
    if (!recetaActual || !confirm(`¿Eliminar "${recetaActual.nombre}"?`)) return;
    await db.from('recetas').delete().eq('id', recetaActual.id);
    recetaActual = null;
    ingredientesReceta = [];
    document.getElementById('editor-receta')!.classList.add('hidden');
    document.getElementById('btn-eliminar-receta')!.classList.add('hidden');
    await cargarSelectRecetas();
  });

  async function renderTablaIngredientesGlobales() {
    const tbody = document.getElementById('tabla-ingredientes-precios')!;
    tbody.innerHTML = ingredientesGlobales.map((ing: any) => `
      <tr class="border-b border-dark-border/30 hover:bg-dark-surface/30">
        <td class="p-3 text-text-main">${ing.nombre}</td>
        <td class="p-3 text-right">
          <input type="number" value="${ing.precio_kg}" data-id="${ing.id}"
            class="w-28 bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-right text-accent-amber text-sm focus:ring-1 focus:ring-accent-amber/50 outline-none precio-ing-input">
        </td>
        <td class="p-3 text-right text-text-muted text-xs">${ing.unidad}</td>
        <td class="p-3">
          <button data-id="${ing.id}" class="text-red-400 text-xs hover:text-red-300 btn-del-ing-global">✕</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.precio-ing-input').forEach(inp => {
      inp.addEventListener('change', async (e) => {
        const el = e.target as HTMLInputElement;
        await db.from('ingredientes').update({ precio_kg: parseFloat(el.value), updated_at: new Date().toISOString() }).eq('id', el.dataset.id!);
      });
    });

    document.querySelectorAll('.btn-del-ing-global').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).dataset.id!;
        if (!confirm('¿Eliminar ingrediente? Se eliminará de todas las recetas.')) return;
        await db.from('ingredientes').delete().eq('id', id);
        ingredientesGlobales = ingredientesGlobales.filter((i: any) => i.id !== id);
        renderTablaIngredientesGlobales();
      });
    });
  }

  document.getElementById('btn-add-ingrediente-global')!.addEventListener('click', async () => {
    const nombre = prompt('Nombre del ingrediente:');
    if (!nombre?.trim()) return;
    const precio_kg = parseFloat(prompt('Precio por kg ($):') ?? '0');
    const unidad = prompt('Unidad (kg/un/l):') ?? 'kg';
    const { data } = await db.from('ingredientes').insert([{ nombre: nombre.trim(), precio_kg, unidad }]).select('*').single();
    ingredientesGlobales.push(data);
    renderTablaIngredientesGlobales();
  });

  init();
</script>
```

> ⚠️ Ajustar métodos `.select().order()`, `.select().eq().single()`, `.insert().select().single()` según docs Insforge exactas.

- [ ] **Step 2: Verificar módulo**

```bash
npm run dev
```
Navegar a `/recetas`. Verificar: lista de recetas en select, editor aparece al seleccionar, inputs editables, costo total se recalcula.

- [ ] **Step 3: Commit**

```bash
git add src/pages/recetas.astro
git commit -m "feat: add recetas module with ingredient cost editor"
```

---

## Task 10: Módulo Costos Operativos

**Files:**
- Create: `src/pages/costos.astro`

- [ ] **Step 1: Crear costos.astro**

Crear `src/pages/costos.astro`:
```astro
---
export const prerender = true;
import Layout from '../layouts/Layout.astro';
---
<Layout title="Costos Operativos">
  <header class="py-6 mb-4 border-b border-dark-border/50">
    <h1 class="font-['Outfit'] text-2xl font-bold text-purple-400">💼 Costos Operativos</h1>
    <p class="text-xs text-text-muted mt-1">Editá los costos del negocio — afectan directamente los precios de venta</p>
  </header>

  <div class="grid lg:grid-cols-2 gap-6 mb-6">
    <!-- Costos Fijos -->
    <div class="glass-panel rounded-2xl overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b border-dark-border/50">
        <h2 class="text-xs uppercase tracking-wider text-purple-400 font-bold">Costos Fijos / Mes</h2>
        <button id="btn-add-fijo" class="bg-purple-600/20 text-purple-400 text-xs px-3 py-1.5 rounded-lg hover:bg-purple-600/40 transition-all">+ Agregar</button>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-text-muted text-[0.65rem] uppercase tracking-wider border-b border-dark-border/30">
            <th class="text-left p-3">Concepto</th>
            <th class="text-right p-3">Monto ($)</th>
            <th class="p-3">Activo</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody id="tbody-fijos"></tbody>
      </table>
      <div class="flex justify-between p-4 border-t border-dark-border/50 bg-dark-surface/50">
        <span class="text-xs text-text-muted uppercase tracking-wider">Total fijos</span>
        <span class="font-bold text-purple-400" id="total-fijos">$0</span>
      </div>
    </div>

    <!-- Costos Variables -->
    <div class="glass-panel rounded-2xl overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b border-dark-border/50">
        <h2 class="text-xs uppercase tracking-wider text-purple-400 font-bold">Costos Variables / Mes</h2>
        <button id="btn-add-var" class="bg-purple-600/20 text-purple-400 text-xs px-3 py-1.5 rounded-lg hover:bg-purple-600/40 transition-all">+ Agregar</button>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-text-muted text-[0.65rem] uppercase tracking-wider border-b border-dark-border/30">
            <th class="text-left p-3">Concepto</th>
            <th class="text-right p-3">Monto Ref. ($)</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody id="tbody-variables"></tbody>
      </table>
      <div class="flex justify-between p-4 border-t border-dark-border/50 bg-dark-surface/50">
        <span class="text-xs text-text-muted uppercase tracking-wider">Total variables</span>
        <span class="font-bold text-purple-400" id="total-variables">$0</span>
      </div>
    </div>
  </div>

  <!-- Resumen + pizzas objetivo -->
  <div class="glass-panel rounded-2xl p-5">
    <h2 class="text-xs uppercase tracking-wider text-accent-amber font-bold mb-4">Resumen Mensual</h2>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <p class="text-[0.65rem] text-text-muted uppercase tracking-wider">Total Fijos</p>
        <p class="text-xl font-bold text-purple-400" id="sum-fijos">$0</p>
      </div>
      <div>
        <p class="text-[0.65rem] text-text-muted uppercase tracking-wider">Total Variables</p>
        <p class="text-xl font-bold text-purple-400" id="sum-variables">$0</p>
      </div>
      <div>
        <p class="text-[0.65rem] text-text-muted uppercase tracking-wider">Total Operativo Mes</p>
        <p class="text-xl font-bold text-white" id="sum-total">$0</p>
      </div>
      <div>
        <p class="text-[0.65rem] text-text-muted uppercase tracking-wider">Costo Op. por Pizza</p>
        <p class="text-xl font-bold text-accent-gold" id="costo-por-pizza">$0</p>
      </div>
    </div>
    <div class="mt-4 flex items-center gap-3">
      <label class="text-xs text-text-muted uppercase tracking-wider">Pizzas objetivo / mes:</label>
      <input type="number" id="inp-pizzas-mes" value="800" min="1"
        class="w-24 bg-dark-surface border border-dark-border rounded-xl px-3 py-1.5 text-text-main text-sm focus:ring-2 focus:ring-accent-amber/50 outline-none">
      <button id="btn-guardar-pizzas" class="bg-accent-amber text-dark-bg text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-accent-gold transition-all">Guardar</button>
    </div>
  </div>
</Layout>

<script>
  import { db } from '../lib/insforge';
  import { calcCostoOperativoPorPizza } from '../utils/pricing';

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
  let pizzasMes = 800;

  function recalcular() {
    const totalFijosEl = document.getElementById('total-fijos')!;
    const totalVarEl = document.getElementById('total-variables')!;
    const tf = parseFloat(totalFijosEl.dataset.raw ?? '0');
    const tv = parseFloat(totalVarEl.dataset.raw ?? '0');
    const total = tf + tv;
    document.getElementById('sum-fijos')!.textContent = fmt(tf);
    document.getElementById('sum-variables')!.textContent = fmt(tv);
    document.getElementById('sum-total')!.textContent = fmt(total);
    document.getElementById('costo-por-pizza')!.textContent = fmt(calcCostoOperativoPorPizza(total, pizzasMes));
  }

  async function renderFijos() {
    const { data } = await db.from('costos_fijos').select('*').order('nombre');
    const items = data ?? [];
    const total = items.filter((i: any) => i.activo).reduce((a: number, b: any) => a + b.monto, 0);
    const el = document.getElementById('total-fijos')!;
    el.textContent = fmt(total);
    el.dataset.raw = String(total);

    document.getElementById('tbody-fijos')!.innerHTML = items.map((item: any) => `
      <tr class="border-b border-dark-border/30 hover:bg-dark-surface/30">
        <td class="p-3">
          <input type="text" value="${item.nombre}" data-id="${item.id}" data-field="nombre"
            class="w-full bg-transparent text-text-main text-sm focus:outline-none focus:border-b focus:border-accent-amber cf-input">
        </td>
        <td class="p-3 text-right">
          <input type="number" value="${item.monto}" data-id="${item.id}" data-field="monto"
            class="w-28 bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-right text-accent-amber text-sm focus:ring-1 focus:ring-accent-amber/50 outline-none cf-input">
        </td>
        <td class="p-3 text-center">
          <input type="checkbox" ${item.activo ? 'checked' : ''} data-id="${item.id}" data-field="activo"
            class="accent-purple-500 w-4 h-4 cf-check">
        </td>
        <td class="p-3">
          <button data-id="${item.id}" class="text-red-400 text-xs hover:text-red-300 btn-del-fijo">✕</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.cf-input').forEach(el => {
      el.addEventListener('change', async (e) => {
        const inp = e.target as HTMLInputElement;
        const val = inp.dataset.field === 'monto' ? parseFloat(inp.value) : inp.value;
        await db.from('costos_fijos').update({ [inp.dataset.field!]: val }).eq('id', inp.dataset.id!);
        renderFijos();
      });
    });
    document.querySelectorAll('.cf-check').forEach(el => {
      el.addEventListener('change', async (e) => {
        const inp = e.target as HTMLInputElement;
        await db.from('costos_fijos').update({ activo: inp.checked }).eq('id', inp.dataset.id!);
        renderFijos();
      });
    });
    document.querySelectorAll('.btn-del-fijo').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).dataset.id!;
        await db.from('costos_fijos').delete().eq('id', id);
        renderFijos();
      });
    });
    recalcular();
  }

  async function renderVariables() {
    const { data } = await db.from('costos_variables').select('*').order('nombre');
    const items = data ?? [];
    const total = items.reduce((a: number, b: any) => a + b.monto_referencia, 0);
    const el = document.getElementById('total-variables')!;
    el.textContent = fmt(total);
    el.dataset.raw = String(total);

    document.getElementById('tbody-variables')!.innerHTML = items.map((item: any) => `
      <tr class="border-b border-dark-border/30 hover:bg-dark-surface/30">
        <td class="p-3">
          <input type="text" value="${item.nombre}" data-id="${item.id}" data-field="nombre"
            class="w-full bg-transparent text-text-main text-sm focus:outline-none cv-input">
        </td>
        <td class="p-3 text-right">
          <input type="number" value="${item.monto_referencia}" data-id="${item.id}" data-field="monto_referencia"
            class="w-28 bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-right text-accent-amber text-sm focus:ring-1 focus:ring-accent-amber/50 outline-none cv-input">
        </td>
        <td class="p-3">
          <button data-id="${item.id}" class="text-red-400 text-xs hover:text-red-300 btn-del-var">✕</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.cv-input').forEach(el => {
      el.addEventListener('change', async (e) => {
        const inp = e.target as HTMLInputElement;
        const val = inp.dataset.field === 'monto_referencia' ? parseFloat(inp.value) : inp.value;
        await db.from('costos_variables').update({ [inp.dataset.field!]: val }).eq('id', inp.dataset.id!);
        renderVariables();
      });
    });
    document.querySelectorAll('.btn-del-var').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).dataset.id!;
        await db.from('costos_variables').delete().eq('id', id);
        renderVariables();
      });
    });
    recalcular();
  }

  document.getElementById('btn-add-fijo')!.addEventListener('click', async () => {
    const nombre = prompt('Nombre del costo fijo:');
    if (!nombre?.trim()) return;
    const monto = parseFloat(prompt('Monto mensual ($):') ?? '0');
    await db.from('costos_fijos').insert([{ nombre: nombre.trim(), monto, activo: true }]);
    renderFijos();
  });

  document.getElementById('btn-add-var')!.addEventListener('click', async () => {
    const nombre = prompt('Nombre del costo variable:');
    if (!nombre?.trim()) return;
    const monto_referencia = parseFloat(prompt('Monto de referencia mensual ($):') ?? '0');
    await db.from('costos_variables').insert([{ nombre: nombre.trim(), monto_referencia }]);
    renderVariables();
  });

  document.getElementById('btn-guardar-pizzas')!.addEventListener('click', async () => {
    pizzasMes = parseInt((document.getElementById('inp-pizzas-mes') as HTMLInputElement).value);
    await db.from('config_negocio').update({ pizzas_objetivo_mes: pizzasMes });
    recalcular();
  });

  async function init() {
    const { data: config } = await db.from('config_negocio').select('pizzas_objetivo_mes').limit(1);
    pizzasMes = config?.[0]?.pizzas_objetivo_mes ?? 800;
    (document.getElementById('inp-pizzas-mes') as HTMLInputElement).value = String(pizzasMes);
    await Promise.all([renderFijos(), renderVariables()]);
  }

  init();
</script>
```

- [ ] **Step 2: Verificar módulo**

```bash
npm run dev
```
Navegar a `/costos`. Verificar: costos se cargan, edición inline actualiza DB, totales y costo por pizza se recalculan.

- [ ] **Step 3: Commit**

```bash
git add src/pages/costos.astro
git commit -m "feat: add costos operativos module with inline editing"
```

---

## Task 11: Módulo Precios de Venta

**Files:**
- Create: `src/pages/precios.astro`

- [ ] **Step 1: Crear precios.astro**

Crear `src/pages/precios.astro`:
```astro
---
export const prerender = true;
import Layout from '../layouts/Layout.astro';
---
<Layout title="Lista de Precios">
  <header class="py-6 mb-4 border-b border-dark-border/50 flex items-center justify-between">
    <div>
      <h1 class="font-['Outfit'] text-2xl font-bold text-orange-400">🏷️ Lista de Precios</h1>
      <p class="text-xs text-text-muted mt-1">Precio efectivo = (costo ingredientes + costo operativo/pizza) × markup</p>
    </div>
    <button id="btn-print" class="bg-dark-surface border border-dark-border text-text-muted text-xs px-3 py-2 rounded-xl hover:text-text-main transition-all">🖨️ Imprimir</button>
  </header>

  <!-- Barra de contexto -->
  <div class="glass-panel rounded-2xl p-4 mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div>
      <p class="text-[0.6rem] text-text-muted uppercase tracking-wider">Total Op. Mes</p>
      <p class="font-bold text-purple-400" id="ctx-total-op">—</p>
    </div>
    <div>
      <p class="text-[0.6rem] text-text-muted uppercase tracking-wider">Pizzas / Mes</p>
      <p class="font-bold text-text-muted" id="ctx-pizzas">—</p>
    </div>
    <div>
      <p class="text-[0.6rem] text-text-muted uppercase tracking-wider">Costo Op. / Pizza</p>
      <p class="font-bold text-purple-400" id="ctx-costo-op">—</p>
    </div>
    <div>
      <p class="text-[0.6rem] text-text-muted uppercase tracking-wider">Última actualización</p>
      <p class="font-bold text-text-muted text-xs" id="ctx-updated">—</p>
    </div>
  </div>

  <!-- Tabla de precios -->
  <div class="glass-panel rounded-2xl overflow-hidden mb-4">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-text-muted text-[0.65rem] uppercase tracking-wider border-b border-dark-border/50">
            <th class="text-left p-3">Pizza</th>
            <th class="text-right p-3">Ingredientes</th>
            <th class="text-right p-3">+ Op/pizza</th>
            <th class="text-right p-3">= Costo Real</th>
            <th class="text-right p-3">Markup</th>
            <th class="text-right p-3 text-orange-400">Precio Efectivo</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody id="tbody-precios"></tbody>
      </table>
    </div>
  </div>

  <button id="btn-add-precio" class="glass-panel rounded-2xl px-4 py-3 text-sm text-text-muted hover:text-text-main hover:border-orange-500/50 transition-all w-full">+ Agregar producto a la lista</button>
</Layout>

<script>
  import { db } from '../lib/insforge';
  import { calcCostoOperativoPorPizza, calcCostoReceta, calcCostoRealTotal, calcPrecioEfectivo } from '../utils/pricing';

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
  let costoOpPorPizza = 0;

  async function init() {
    const [{ data: fijos }, { data: variables }, { data: config }] = await Promise.all([
      db.from('costos_fijos').select('monto').eq('activo', true),
      db.from('costos_variables').select('monto_referencia'),
      db.from('config_negocio').select('pizzas_objetivo_mes').limit(1),
    ]);

    const totalOp = [
      ...(fijos ?? []).map((c: any) => c.monto),
      ...(variables ?? []).map((c: any) => c.monto_referencia),
    ].reduce((a: number, b: number) => a + b, 0);

    const pizzasMes = config?.[0]?.pizzas_objetivo_mes ?? 800;
    costoOpPorPizza = calcCostoOperativoPorPizza(totalOp, pizzasMes);

    document.getElementById('ctx-total-op')!.textContent = fmt(totalOp);
    document.getElementById('ctx-pizzas')!.textContent = String(pizzasMes);
    document.getElementById('ctx-costo-op')!.textContent = fmt(costoOpPorPizza);
    document.getElementById('ctx-updated')!.textContent = new Date().toLocaleTimeString('es-AR');

    await renderTabla();
  }

  async function getCostoReceta(recetaId: string): Promise<number> {
    const [{ data: receta }, { data: ings }] = await Promise.all([
      db.from('recetas').select('precio_prepizza, precio_salsa').eq('id', recetaId).single(),
      db.from('receta_ingredientes').select('cantidad_kg, merma_factor, ingredientes(precio_kg)').eq('receta_id', recetaId),
    ]);
    if (!receta) return 0;
    return calcCostoReceta(
      (ings ?? []).map((i: any) => ({ precio_kg: i.ingredientes?.precio_kg ?? 0, cantidad_kg: i.cantidad_kg, merma_factor: i.merma_factor })),
      receta.precio_prepizza,
      receta.precio_salsa
    );
  }

  async function renderTabla() {
    const { data: precios } = await db.from('precios_venta').select('*').order('nombre');
    const items = precios ?? [];

    const rows = await Promise.all(items.map(async (item: any) => {
      const costoIng = item.receta_id ? await getCostoReceta(item.receta_id) : 0;
      const costoReal = calcCostoRealTotal(costoIng, costoOpPorPizza);
      const precioEfectivo = calcPrecioEfectivo(costoReal, item.markup);
      return { item, costoIng, costoReal, precioEfectivo };
    }));

    document.getElementById('tbody-precios')!.innerHTML = rows.map(({ item, costoIng, costoReal, precioEfectivo }) => `
      <tr class="border-b border-dark-border/30 hover:bg-dark-surface/30">
        <td class="p-3 text-text-main font-medium">${item.nombre}</td>
        <td class="p-3 text-right text-emerald-400">${fmt(costoIng)}</td>
        <td class="p-3 text-right text-purple-400">${fmt(costoOpPorPizza)}</td>
        <td class="p-3 text-right text-text-muted">${fmt(costoReal)}</td>
        <td class="p-3 text-right">
          <input type="number" step="0.01" value="${item.markup}" data-id="${item.id}"
            class="w-20 bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-right text-accent-amber text-sm focus:ring-1 focus:ring-accent-amber/50 outline-none markup-input">
        </td>
        <td class="p-3 text-right font-bold text-white text-base">${fmt(precioEfectivo)}</td>
        <td class="p-3">
          <button data-id="${item.id}" class="text-red-400 text-xs hover:text-red-300 btn-del-precio">✕</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.markup-input').forEach(inp => {
      inp.addEventListener('change', async (e) => {
        const el = e.target as HTMLInputElement;
        await db.from('precios_venta').update({ markup: parseFloat(el.value) }).eq('id', el.dataset.id!);
        renderTabla();
      });
    });

    document.querySelectorAll('.btn-del-precio').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).dataset.id!;
        await db.from('precios_venta').delete().eq('id', id);
        renderTabla();
      });
    });
  }

  document.getElementById('btn-add-precio')!.addEventListener('click', async () => {
    const nombre = prompt('Nombre del producto en la lista de precios:');
    if (!nombre?.trim()) return;
    const { data: recetas } = await db.from('recetas').select('id, nombre').order('nombre');
    const lista = (recetas ?? []).map((r: any, i: number) => `${i + 1}. ${r.nombre}`).join('\n');
    const idx = parseInt(prompt(`¿A qué receta corresponde? (número, 0 para ninguna)\n${lista}`) ?? '0') - 1;
    const receta_id = idx >= 0 ? (recetas ?? [])[idx]?.id ?? null : null;
    await db.from('precios_venta').insert([{ nombre: nombre.trim(), receta_id, markup: 1.6 }]);
    renderTabla();
  });

  document.getElementById('btn-print')!.addEventListener('click', () => window.print());

  init();
</script>
```

- [ ] **Step 2: Verificar módulo**

```bash
npm run dev
```
Navegar a `/precios`. Verificar: precios calculados correctamente, markup editable recalcula precio en tiempo real.

- [ ] **Step 3: Commit**

```bash
git add src/pages/precios.astro
git commit -m "feat: add precios module with cascading price formula"
```

---

## Task 12: Endpoint OpenAI + Módulo Marketing

**Files:**
- Create: `src/pages/api/marketing.ts`
- Create: `src/pages/marketing.astro`

- [ ] **Step 1: Verificar .env tiene OPENAI_API_KEY**

Confirmar que `.env` contiene `OPENAI_API_KEY=sk-proj-...` con la nueva key rotada.

- [ ] **Step 2: Crear endpoint server-side**

Crear `src/pages/api/marketing.ts`:
```typescript
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY no configurada' }), { status: 500 });
  }

  const { recetas, costoOpPorPizza, pizzasMes } = await request.json();

  const prompt = `Sos un experto en marketing gastronómico especializado en pizzerías argentinas.
Analizás datos reales de costos y márgenes para dar sugerencias accionables.
Respondé siempre en español argentino informal.

Datos actuales de la pizzería:
- Costo operativo por pizza: $${costoOpPorPizza}
- Pizzas objetivo por mes: ${pizzasMes}
- Recetas disponibles con sus precios de venta:
${recetas.map((r: any) => `  • ${r.nombre}: costo $${r.costoReal}, precio $${r.precioEfectivo}, margen ${r.margen}%`).join('\n')}

Generá sugerencias concretas. Respondé SOLO con JSON válido con esta estructura exacta:
{
  "combo": {
    "titulo": "nombre del combo",
    "pizzas": ["pizza1", "pizza2"],
    "precio_sugerido": 12000,
    "razon": "por qué este combo"
  },
  "promo": {
    "titulo": "nombre de la promo",
    "descripcion": "descripción breve",
    "razon": "por qué esta promo"
  },
  "post_instagram": "texto para instagram con emojis y hashtags (máx 200 chars)",
  "post_whatsapp": "mensaje para whatsapp (máx 120 chars)",
  "ranking_margenes": [
    {"nombre": "pizza", "margen": 60, "recomendacion": "promover más / mantener / revisar precio"}
  ]
}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: `OpenAI error: ${res.status}` }), { status: 502 });
  }

  const json = await res.json();
  const content = json.choices[0].message.content;

  return new Response(content, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 3: Crear marketing.astro**

Crear `src/pages/marketing.astro`:
```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Marketing IA">
  <header class="py-6 mb-4 border-b border-dark-border/50">
    <h1 class="font-['Outfit'] text-2xl font-bold text-pink-400">🎯 Marketing IA</h1>
    <p class="text-xs text-text-muted mt-1">Sugerencias generadas con IA basadas en tus costos y márgenes reales</p>
  </header>

  <div class="flex justify-center mb-6">
    <button id="btn-generar" class="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold px-8 py-3 rounded-2xl transition-all text-sm">
      ✨ Generar sugerencias
    </button>
  </div>

  <div id="loading" class="hidden text-center py-8 text-text-muted text-sm">Analizando tu pizzería con IA...</div>
  <div id="error-msg" class="hidden glass-panel rounded-2xl p-4 text-red-400 text-sm mb-4"></div>

  <div id="resultado" class="hidden space-y-4">
    <!-- Combo -->
    <div class="glass-panel rounded-2xl p-5 border-l-4 border-pink-500">
      <h2 class="text-xs uppercase tracking-wider text-pink-400 font-bold mb-2">🔥 Combo Sugerido</h2>
      <p class="font-bold text-text-main text-lg" id="combo-titulo"></p>
      <p class="text-text-muted text-sm mt-1" id="combo-pizzas"></p>
      <p class="text-text-muted text-xs mt-1" id="combo-razon"></p>
      <p class="text-accent-gold font-bold mt-2" id="combo-precio"></p>
    </div>

    <!-- Promo -->
    <div class="glass-panel rounded-2xl p-5 border-l-4 border-purple-500">
      <h2 class="text-xs uppercase tracking-wider text-purple-400 font-bold mb-2">📣 Promo de la Semana</h2>
      <p class="font-bold text-text-main" id="promo-titulo"></p>
      <p class="text-text-muted text-sm mt-1" id="promo-desc"></p>
      <p class="text-text-muted text-xs mt-1" id="promo-razon"></p>
    </div>

    <!-- Posts -->
    <div class="grid lg:grid-cols-2 gap-4">
      <div class="glass-panel rounded-2xl p-5">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xs uppercase tracking-wider text-pink-400 font-bold">📸 Instagram</h2>
          <button id="copy-ig" class="text-[0.65rem] text-text-muted hover:text-text-main bg-dark-surface px-2 py-1 rounded-lg">Copiar</button>
        </div>
        <p class="text-text-main text-sm leading-relaxed" id="post-ig"></p>
      </div>
      <div class="glass-panel rounded-2xl p-5">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xs uppercase tracking-wider text-emerald-400 font-bold">💬 WhatsApp</h2>
          <button id="copy-wa" class="text-[0.65rem] text-text-muted hover:text-text-main bg-dark-surface px-2 py-1 rounded-lg">Copiar</button>
        </div>
        <p class="text-text-main text-sm leading-relaxed" id="post-wa"></p>
      </div>
    </div>

    <!-- Ranking de márgenes -->
    <div class="glass-panel rounded-2xl p-5">
      <h2 class="text-xs uppercase tracking-wider text-accent-amber font-bold mb-4">📊 Análisis de Márgenes</h2>
      <div id="ranking-margenes" class="space-y-2"></div>
    </div>
  </div>
</Layout>

<script>
  import { db } from '../lib/insforge';
  import { calcCostoOperativoPorPizza, calcCostoRealTotal, calcPrecioEfectivo, calcCostoReceta } from '../utils/pricing';

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

  document.getElementById('btn-generar')!.addEventListener('click', async () => {
    document.getElementById('loading')!.classList.remove('hidden');
    document.getElementById('resultado')!.classList.add('hidden');
    document.getElementById('error-msg')!.classList.add('hidden');

    try {
      const [{ data: fijos }, { data: variables }, { data: config }, { data: precios }] = await Promise.all([
        db.from('costos_fijos').select('monto').eq('activo', true),
        db.from('costos_variables').select('monto_referencia'),
        db.from('config_negocio').select('pizzas_objetivo_mes').limit(1),
        db.from('precios_venta').select('*, recetas(id, precio_prepizza, precio_salsa)').order('nombre'),
      ]);

      const totalOp = [...(fijos ?? []).map((c: any) => c.monto), ...(variables ?? []).map((c: any) => c.monto_referencia)]
        .reduce((a: number, b: number) => a + b, 0);
      const pizzasMes = config?.[0]?.pizzas_objetivo_mes ?? 800;
      const costoOpPorPizza = calcCostoOperativoPorPizza(totalOp, pizzasMes);

      const recetasData = await Promise.all((precios ?? []).map(async (p: any) => {
        let costoIng = 0;
        if (p.receta_id) {
          const { data: ings } = await db.from('receta_ingredientes')
            .select('cantidad_kg, merma_factor, ingredientes(precio_kg)')
            .eq('receta_id', p.receta_id);
          costoIng = calcCostoReceta(
            (ings ?? []).map((i: any) => ({ precio_kg: i.ingredientes?.precio_kg ?? 0, cantidad_kg: i.cantidad_kg, merma_factor: i.merma_factor })),
            p.recetas?.precio_prepizza ?? 0, p.recetas?.precio_salsa ?? 0
          );
        }
        const costoReal = calcCostoRealTotal(costoIng, costoOpPorPizza);
        const precioEfectivo = calcPrecioEfectivo(costoReal, p.markup);
        const margen = costoReal > 0 ? Math.round(((precioEfectivo - costoReal) / precioEfectivo) * 100) : 0;
        return { nombre: p.nombre, costoReal, precioEfectivo, margen };
      }));

      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recetas: recetasData, costoOpPorPizza, pizzasMes }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();

      document.getElementById('combo-titulo')!.textContent = data.combo?.titulo ?? '';
      document.getElementById('combo-pizzas')!.textContent = data.combo?.pizzas?.join(' + ') ?? '';
      document.getElementById('combo-razon')!.textContent = data.combo?.razon ?? '';
      document.getElementById('combo-precio')!.textContent = data.combo?.precio_sugerido ? fmt(data.combo.precio_sugerido) : '';
      document.getElementById('promo-titulo')!.textContent = data.promo?.titulo ?? '';
      document.getElementById('promo-desc')!.textContent = data.promo?.descripcion ?? '';
      document.getElementById('promo-razon')!.textContent = data.promo?.razon ?? '';
      document.getElementById('post-ig')!.textContent = data.post_instagram ?? '';
      document.getElementById('post-wa')!.textContent = data.post_whatsapp ?? '';

      const ranking = document.getElementById('ranking-margenes')!;
      ranking.innerHTML = (data.ranking_margenes ?? []).map((r: any) => `
        <div class="flex items-center gap-3">
          <span class="text-text-muted text-xs w-28 truncate">${r.nombre}</span>
          <div class="flex-1 bg-dark-surface rounded-full h-2">
            <div class="h-2 rounded-full ${r.margen >= 50 ? 'bg-emerald-500' : r.margen >= 35 ? 'bg-amber-500' : 'bg-red-500'}"
              style="width: ${Math.min(r.margen, 100)}%"></div>
          </div>
          <span class="text-xs font-bold ${r.margen >= 50 ? 'text-emerald-400' : r.margen >= 35 ? 'text-amber-400' : 'text-red-400'}">${r.margen}%</span>
          <span class="text-[0.6rem] text-text-muted hidden lg:block">${r.recomendacion ?? ''}</span>
        </div>
      `).join('');

      document.getElementById('copy-ig')!.addEventListener('click', () =>
        navigator.clipboard.writeText(data.post_instagram ?? ''));
      document.getElementById('copy-wa')!.addEventListener('click', () =>
        navigator.clipboard.writeText(data.post_whatsapp ?? ''));

      document.getElementById('resultado')!.classList.remove('hidden');
    } catch (err: any) {
      const el = document.getElementById('error-msg')!;
      el.textContent = `Error: ${err.message}`;
      el.classList.remove('hidden');
    } finally {
      document.getElementById('loading')!.classList.add('hidden');
    }
  });
</script>
```

- [ ] **Step 4: Verificar endpoint**

```bash
npm run dev
```
Navegar a `/marketing`. Hacer click en "Generar sugerencias". Verificar que aparecen combo, promo, posts y ranking.

- [ ] **Step 5: Commit final**

```bash
git add src/pages/api/marketing.ts src/pages/marketing.astro
git commit -m "feat: add marketing AI module with OpenAI integration"
```

---

## Verificación Final

- [ ] `npm run build` — build exitoso sin errores TypeScript
- [ ] `npm run preview` — verificar todas las rutas funcionan
- [ ] Navegar a `/` — dashboard carga métricas
- [ ] Navegar a `/masa` — calculadora intacta
- [ ] Navegar a `/recetas` — CRUD de recetas funcional
- [ ] Navegar a `/costos` — edición inline de costos
- [ ] Navegar a `/precios` — precios calculados correctamente en cascada
- [ ] Navegar a `/marketing` — IA genera sugerencias
- [ ] Verificar mobile: bottom nav funciona, layouts responsive
- [ ] `npm test` — todos los tests de pricing pasan

```bash
git tag v2.0.0-dashboard
git push origin main --tags
```
