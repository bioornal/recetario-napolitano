# ImpastoRecetario — Mobile App Design Spec

**Fecha:** 2026-05-15  
**Proyecto destino:** `C:\Users\spezi\Desktop\ImpastoRecetario`  
**Origen:** Migración 1:1 de El Fogon (Astro web app en `C:\Users\spezi\Desktop\RECETARIO_NAPOLITANO`)

---

## 1. Contexto y Objetivo

Migrar el dashboard de pizzería "El Fogon" a una app nativa Android (React Native + Expo) distribuida internamente como APK. La app replica todas las features de la web: calculadora de masa, gestión de recetas, ingredientes, costos operativos, precios y marketing AI. No es una app pública — es una herramienta interna de la pizzería.

---

## 2. Decisiones de Proyecto

| Aspecto | Decisión |
|---|---|
| Carpeta | `C:\Users\spezi\Desktop\ImpastoRecetario` |
| Nombre de app | ImpastoRecetario |
| Framework | Expo SDK (managed workflow) |
| Target | Android (APK) |
| Backend | InsForge existente (`https://3agqcygs.us-east.insforge.app`) |
| Auth | Sin pantalla de login (uso interno) |
| Distribución | APK directo (sideload, sin Play Store) |

---

## 3. Navegación

**Bottom Tab Navigator** con 5 tabs:

| Tab | Ícono | Pantallas que cubre |
|---|---|---|
| Inicio | 🏠 | Dashboard con métricas clave |
| Masa | 🍞 | Calculadora de masa |
| Recetas | 📋 | Recetas + detalle |
| Precios | 💰 | Lista de precios de venta |
| Más | ⋯ | Ingredientes, Costos, Marketing |

"Más" abre un Stack Navigator secundario con las 3 pantallas restantes (Ingredientes, Costos, Marketing).

Librería: `@react-navigation/native` + `@react-navigation/bottom-tabs`.

---

## 4. Pantallas (scope 1:1 con la web)

### 4.1 Inicio (Dashboard)
- 4 métricas: costo promedio/pizza, costo operativo mensual, total recetas, pizzas objetivo/mes
- Cards de navegación rápida a cada sección
- Fuente: tablas `recetas`, `costos_fijos`, `costos_variables`, `config_negocio`

### 4.2 Masa (Calculadora)
- Selectores de cantidad de bollos, peso por bollo, temperatura ambiente
- Slider de hidratación
- Selector de horas de fermentación
- Toggle de 4 métodos: Napolitana · N. Poolish · Arg Piedra · Arg Molde
- Sub-opciones Poolish: Rápido (~3h) / Frío (12-16h)
- Resultados dinámicos: cantidades, temperatura del agua, diagnóstico de temperatura, procedimiento paso a paso
- Botón de compartir/guardar resultados (Share API nativa)
- **100% offline** — no usa red
- Parámetros persistidos con `AsyncStorage`

### 4.3 Recetas
- Lista de recetas con costo por unidad
- Crear / editar / eliminar receta
- Tabla de ingredientes por receta: nombre, $/kg, cantidad neta, MR, cantidad bruta, costo línea
- Dos modos de rendimiento: Directo (N unidades) y Peso (gramos ÷ gramos/unidad)
- Fuente: `recetas`, `receta_ingredientes`, `ingredientes`

### 4.4 Ingredientes
- Catálogo editable: nombre, $/kg, MR, unidad, tipo
- Agrupado por categoría: Quesos, Carnes, Fiambres, Verduras, Harinas, Salsas, Varios
- CRUD completo — cambios en precio/MR cascadean a costos de recetas
- Fuente: `ingredientes`

### 4.5 Costos Operativos
- Panel izquierdo/top: costos fijos mensuales (toggle activo/inactivo)
- Panel derecho/bottom: costos variables de referencia
- Resumen: fijo + variable = costo total, costo por pizza
- Input de pizzas objetivo/mes
- Fuente: `costos_fijos`, `costos_variables`, `config_negocio`

### 4.6 Precios
- Productos agrupados por subcategoría (Pizzas, Calzones, Empanadas, Hamburguesas, Lomos, Otros)
- Columnas: nombre, costo ingredientes, costo op/pizza, costo total, margen %, precio efectivo
- Markup editable por producto o por categoría
- Fórmula: `Precio = (CostoIng + CostoOp) × Markup`
- Empanadas: costo op = total_op ÷ 12 (por docena)
- Fuente: `precios_venta`, `recetas`, `receta_ingredientes`, `ingredientes`

### 4.7 Marketing AI
- Botón "Generar sugerencias"
- Llama al endpoint `POST /api/marketing` del deployment web existente en Netlify (no se duplica la lógica)
- Muestra: combo sugerido, promo semanal, post Instagram, mensaje WhatsApp, ranking de margen con tácticas
- Botones de compartir para contenido de redes (Share API nativa)
- Fuente: misma lógica que `marketing.ts` actual

---

## 5. Capa de Datos

### 5.1 Utilidades de Cálculo

`src/utils/math.ts` y `src/utils/pricing.ts` se copian verbatim desde la web. Son TypeScript puro sin dependencias de DOM — funcionan sin modificaciones en React Native.

### 5.2 Cliente InsForge

No se usa `@insforge/sdk` directamente (riesgo de incompatibilidad con el entorno Hermes de RN). Se implementa un cliente propio basado en `fetch` nativo:

```
src/lib/
  insforge.ts    ← createClient() con fetch, interfaz compatible con el SDK
  dbWrite.ts     ← helper retry para PATCH/POST
```

**`insforge.ts`** expone la misma interfaz encadenada del SDK:
```typescript
insforge.from('tabla').select('*')
insforge.from('tabla').insert({ ... })
insforge.from('tabla').update({ ... }).eq('id', id)
insforge.from('tabla').delete().eq('id', id)
```

Credenciales desde `app.config.ts` (variables de entorno Expo):
- `EXPO_PUBLIC_INSFORGE_URL`
- `EXPO_PUBLIC_INSFORGE_ANON_KEY`

### 5.3 Retry Helper (dbWrite)

Puerto directo de la lógica actual de la web. Para operaciones de escritura (INSERT, UPDATE, DELETE), si la respuesta es 404 o 5xx:
- Reintento automático hasta 3 veces
- Backoff de 300ms entre reintentos
- Mitiga el nodo roto del ALB de InsForge que devuelve 404 espurio en PATCH/POST

```typescript
// src/lib/dbWrite.ts
export async function dbWrite<T>(fn: () => Promise<T>, retries = 3): Promise<T>
```

### 5.4 Server State — TanStack Query

`@tanstack/react-query` para todo el estado del servidor:
- Cache automático de datos de DB
- `stale-while-revalidate`: muestra datos cacheados mientras refresca en background
- Estados de loading/error centralizados
- Deduplicación de requests
- Invalidación de cache tras mutaciones (ej: editar un ingrediente invalida recetas y precios)

### 5.5 Persistencia Local

`AsyncStorage` exclusivamente para las preferencias de la calculadora de masa:
- Cantidad de bollos
- Peso por bollo
- Temperatura ambiente
- Hidratación
- Horas de fermentación
- Método activo (Napolitana / Poolish / Piedra / Molde)

Los datos de DB no se persisten offline — requieren red (uso en cocina con WiFi disponible).

---

## 6. Diseño Visual

Tema dark inspirado en la paleta de la web:

| Token | Color | Uso |
|---|---|---|
| `dark-bg` | `#1a1410` | Fondo de pantalla |
| `dark-card` | `#2a2118` | Cards y paneles |
| `dark-surface` | `#332820` | Superficies elevadas |
| `dark-border` | `#3d3228` | Bordes |
| `accent-gold` | `#e8a665` | Acento primario |
| `accent-amber` | `#d4843e` | Acento secundario |
| `text-main` | `#f0e6da` | Texto principal |
| `text-muted` | `#a89880` | Texto secundario |
| `status-danger` | `#d45050` | Errores |
| `status-success` | `#6bb86a` | Éxito |

Implementado con `StyleSheet` de React Native. No se usa Tailwind (no compatible con RN en managed workflow sin NativeWind, que agrega complejidad innecesaria para este proyecto).

Cards con efecto panel: `backgroundColor: dark-card`, `borderRadius: 12`, `borderWidth: 1`, `borderColor: dark-border`.

---

## 7. Stack Técnico

```
expo                         SDK managed workflow
react-native                 via Expo
@react-navigation/native     navegación base
@react-navigation/bottom-tabs Bottom Tab Navigator
@react-navigation/stack      Stack secundario para tab "Más"
@tanstack/react-query        server state + cache
@react-native-async-storage/async-storage  persistencia local
```

Sin librerías de UI prefabricadas (Expo managed, componentes propios con StyleSheet).

---

## 8. Generación del APK

### 8.1 Herramienta

**EAS Build** — cloud build de Expo. Sin necesidad de instalar Android SDK localmente.

### 8.2 Configuración `eas.json`

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

Perfil `preview` → `.apk` instalable directamente (sideload).  
Perfil `production` → `.aab` para Play Store (uso futuro).

### 8.3 Firma

Keystore gestionada por EAS (`credentialsSource: "remote"`). EAS la genera y custodia automáticamente. No requiere configuración manual de firma.

### 8.4 Flujo de Build

```bash
# Setup inicial (una vez)
npm install -g eas-cli
eas login
eas build:configure

# Generar APK
eas build --platform android --profile preview

# EAS devuelve URL de descarga directa del .apk
```

### 8.5 Instalación en el dispositivo

1. Habilitar "Instalar apps de fuentes desconocidas" en Android
2. Descargar el `.apk` desde la URL que devuelve EAS
3. Instalar directamente

---

## 9. Estructura de Carpetas del Proyecto Nuevo

```
ImpastoRecetario/
  app.json / app.config.ts   ← config Expo (nombre, ícono, splash)
  eas.json                   ← perfiles de build
  package.json
  tsconfig.json
  src/
    screens/
      DashboardScreen.tsx
      MasaScreen.tsx
      RecetasScreen.tsx
      RecetaDetalleScreen.tsx
      IngredientesScreen.tsx
      CostosScreen.tsx
      PreciosScreen.tsx
      MarketingScreen.tsx
    navigation/
      RootNavigator.tsx      ← Bottom Tab + Stack "Más"
    lib/
      insforge.ts            ← fetch client
      dbWrite.ts             ← retry helper
    utils/
      math.ts                ← copiado de la web
      pricing.ts             ← copiado de la web
    components/
      GlassCard.tsx          ← card panel reutilizable
      LoadingState.tsx
      ErrorState.tsx
    hooks/
      useInsForge.ts         ← hooks de TanStack Query por entidad
    constants/
      theme.ts               ← paleta de colores
```

---

## 10. Fuera de Scope

- iOS (solo Android)
- Autenticación / login
- Notificaciones push
- Modo offline para datos de DB (solo la calculadora es offline)
- Subir a Play Store
- Tests automatizados en esta primera versión

---

## 11. Criterios de Éxito

1. App instalable como APK en un Android
2. Calculadora de masa funciona sin red, con parámetros persistidos entre sesiones
3. CRUD completo de ingredientes, recetas, costos y precios contra InsForge
4. Generación de sugerencias de marketing AI
5. Operaciones de escritura toleran el nodo roto del ALB (retry automático)
6. Diseño dark amber/gold consistente con la web
