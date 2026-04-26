# Dashboard Pizzería — El Fogon: Spec de Diseño

**Fecha:** 2026-04-26  
**Estado:** Aprobado

---

## Resumen

Expandir la Calculadora Napolitana actual (PWA Astro + Tailwind) hacia un **dashboard profesional de gestión de pizzería**. La app pasa de ser una calculadora de masa a una herramienta integral que gestiona costos de producción, costos operativos, precios de venta y sugerencias de marketing con IA.

---

## Decisiones de Diseño

| Decisión | Elección |
|---|---|
| Estructura | Multi-página Astro (una página por módulo) |
| Backend datos | Insforge (PostgreSQL cloud via MCP) |
| IA marketing | OpenAI API (key en .env) |
| Autenticación | Single-user ahora, arquitectura preparada para multi-user |
| Precios | Solo efectivo (sin cuotas) |
| Persistencia | Insforge DB — editable desde la app, cambios persisten en nube |

---

## Arquitectura

### Páginas

```
src/pages/
  index.astro          → Dashboard (métricas resumen)
  masa.astro           → Calculadora de masa (código actual, sin cambios)
  recetas.astro        → Costos de producción por receta
  costos.astro         → Costos operativos del negocio
  precios.astro        → Lista de precios de venta
  marketing.astro      → Sugerencias IA de marketing gastronómico
  api/
    marketing.ts       → Endpoint server-side → OpenAI API
```

### Layout compartido

`src/layouts/Layout.astro` se extiende con navegación lateral (desktop) / bottom nav (mobile). Tema dark glassmorphism existente se mantiene.

### Cliente Insforge

```typescript
// src/lib/insforge.ts
import { createClient } from '@insforge/sdk';

export const db = createClient({
  baseUrl: import.meta.env.INSFORGE_URL,
  anonKey: import.meta.env.INSFORGE_ANON_KEY,
});
```

---

## Modelo de Datos (PostgreSQL / Insforge)

### `ingredientes`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| nombre | text | "Muzzarela", "Orégano" |
| precio_kg | numeric | Precio por kg en ARS |
| unidad | text | "kg", "un", "l" |
| updated_at | timestamptz | Última actualización |

### `recetas`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| nombre | text | "Pizza Muzzarela" |
| descripcion | text | Opcional |
| precio_prepizza | numeric | Costo fijo de prepizza |
| precio_salsa | numeric | Costo fijo de salsa |

### `receta_ingredientes`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| receta_id | uuid FK → recetas | |
| ingrediente_id | uuid FK → ingredientes | |
| cantidad_kg | numeric | Cantidad usada |
| merma_factor | numeric | Factor de merma (1.0 = sin merma) |

**Costo por ingrediente en receta** = `precio_kg × cantidad_kg × merma_factor`  
**Costo total receta** = `precio_prepizza + precio_salsa + SUM(costos_ingredientes)`

### `costos_fijos`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| nombre | text | "Alquiler", "Luz", "Gas" |
| monto | numeric | Monto en ARS |
| periodo | text | "mensual" / "semanal" |
| activo | boolean | Incluir en cálculo |

### `costos_variables`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| nombre | text | "Deliverys", "Insumos" |
| monto_referencia | numeric | Monto mensual estimado |
| categoria | text | "insumos" / "delivery" / "otros" |

### `config_negocio`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| pizzas_objetivo_mes | integer | Cantidad de pizzas objetivo/mes |

### `precios_venta`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| receta_id | uuid FK → recetas | |
| nombre | text | Nombre comercial del producto |
| markup | numeric | Factor multiplicador (ej: 1.6) |
| precio_efectivo | numeric | **Calculado** — ver fórmula |

---

## Fórmula de Precio de Venta

```
costo_operativo_por_pizza = SUM(costos_fijos_mensuales + costos_variables_mensuales) ÷ pizzas_objetivo_mes

costo_real_total = costo_receta + costo_operativo_por_pizza

precio_efectivo = costo_real_total × markup
```

**Cascada automática:** si cambia cualquier `precio_kg` en ingredientes, o cualquier `monto` en costos fijos/variables → todos los precios de venta se recalculan al vuelo en el frontend. No hay precios guardados estáticamente — se calculan siempre desde los datos base.

---

## Módulos Detallados

### 1. Dashboard (`/`)
- Cards resumen: costo promedio x pizza, total costos operativos mes, cantidad de recetas, última actualización
- Acceso rápido a cada módulo
- Alerta si algún precio de ingrediente tiene más de X días sin actualizar

### 2. Calculadora de Masa (`/masa`)
- Código actual sin modificaciones
- Solo se integra al nuevo layout con navegación

### 3. Recetas & Costos (`/recetas`)
- Lista de todas las recetas con costo total calculado
- Editor de receta: tabla de ingredientes con edición inline (precio/kg, cantidad, merma)
- Agregar/eliminar ingredientes
- Agregar/eliminar recetas
- Precio de cada ingrediente editado aquí → actualiza tabla `ingredientes` → afecta todas las recetas que lo usan

### 4. Costos Operativos (`/costos`)
- Tabla de costos fijos (editable inline: nombre, monto, activo)
- Tabla de costos variables (editable inline)
- Campo: pizzas objetivo del mes (editable)
- Totales calculados: total mensual, costo operativo por pizza
- Botones: agregar / eliminar filas

### 5. Lista de Precios (`/precios`)
- Tabla: nombre pizza | costo ingredientes | costo operativo/pizza | costo total real | markup (editable) | **precio efectivo** (calculado)
- Markup editable por pizza individualmente
- Todo se recalcula en tiempo real
- Botón exportar a PDF (impresión de lista de precios)

### 6. Marketing IA (`/marketing`)
- **Análisis de márgenes:** ranking de pizzas por margen de ganancia (barra visual)
- **Combos sugeridos:** detecta pizzas con ingredientes en común + alto margen → sugiere combo con precio
- **Promo de la semana:** la IA sugiere qué promover basándose en márgenes actuales
- **Generador de contenido:** genera texto para Instagram / WhatsApp / Facebook con datos reales (nombre pizzería, precios, promos)
- Botones: regenerar, copiar texto

**Endpoint `/api/marketing.ts`:**  
Recibe contexto (recetas + costos + márgenes actuales) → llama OpenAI `gpt-4o-mini` con prompt especializado en marketing gastronómico → devuelve sugerencias JSON.

---

## Variables de Entorno

```bash
# .env (nunca en git)
INSFORGE_URL=https://3agqcygs.us-east.insforge.app
INSFORGE_ANON_KEY=<tu-anon-key-de-insforge>
OPENAI_API_KEY=<nueva key — rotar la expuesta en chat>
```

---

## Consideraciones Técnicas

- **Tailwind v4:** el proyecto usa v4. Insforge recomienda v3.4 para proyectos nuevos, pero al ser una expansión del proyecto existente se mantiene v4.
- **Edición inline:** se implementa con `contenteditable` o inputs con `blur` → PATCH a Insforge. No hay "modo edición" separado.
- **Sin React:** toda la interactividad en vanilla JS dentro de `<script>` tags de Astro, consistente con el código actual.
- **Seguridad OpenAI key:** solo accesible server-side en `src/pages/api/marketing.ts` — nunca expuesta al cliente.
- **Offline:** el módulo de masa sigue funcionando offline. Los módulos de datos requieren conexión (Insforge).

---

## Fuera de Alcance

- Registro de ventas diarias
- Historial de cambios de precios
- Estadísticas de ventas
- App móvil nativa
- Multi-usuario (preparado en arquitectura, no implementado)
