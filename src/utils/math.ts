/**
 * =================================================================
 * MOTOR MATEMÁTICO - Calculadora de Masa Napolitana
 * =================================================================
 * 
 * FUENTES CIENTÍFICAS VERIFICADAS:
 * 
 * 1. LEVADURA EN FRÍO (IDY → Fresca):
 *    - dough.school / TXCraig1 (pizzamaking.com):
 *      24h@4°C: 0.15-0.25% IDY → medio 0.20% IDY → 0.54% fresca (×2.7)
 *      48h@4°C: 0.08-0.15% IDY → medio 0.115% IDY → 0.31% fresca
 *      72h@4°C: 0.05-0.10% IDY → medio 0.075% IDY → 0.20% fresca
 *    - Estos valores ASUMEN 30-60 min de reposo a ~22°C antes del frío.
 *    - Conversión IDY→fresca: ×2.7 (rango estándar 2.7-3.0)
 * 
 * 2. LEY Q10 (ajuste por temperatura ambiente):
 *    - Wikipedia, PhysiologyWeb, USC:
 *      La tasa metabólica de la levadura se duplica cada +10°C.
 *      Factor = 2^((T - Tref) / 10)
 *    - Esto ajusta la cantidad de levadura ANTES de entrar al frío.
 *    - Si hace más calor → la levadura trabaja más en el reposo inicial
 *      → necesitás MENOS levadura para no sobrefermentar.
 *    - Si hace más frío → la levadura casi no arranca
 *      → necesitás MÁS levadura.
 * 
 * 3. LÍMITES BIOLÓGICOS DE LA LEVADURA:
 *    - Por debajo de 0°C: la levadura entra en DORMANCIA total.
 *      No muere pero no fermenta. La masa se congela parcialmente.
 *    - Entre 0°C y 10°C: metabolismo extremadamente lento.
 *    - 20°C-38°C: rango óptimo de fermentación.
 *    - Por encima de 40°C: la levadura comienza a morir.
 *    - 55-60°C: muerte térmica total.
 *    - Fuentes: Lesaffre, Exploratorium, Oculyze, Breadopedia
 * 
 * 4. TEMPERATURA DEL AGUA:
 *    - Stadler Made: Tagua = 70 - Tharina - Tambiente
 *    - Asumimos Tharina ≈ Tambiente (almacenada en cocina)
 * 
 * 5. POOLISH:
 *    - Weekend Bakery (poolish IDY):
 *      hasta 8h: 0.23-0.33%, 12h: 0.1-0.2%, 16h: 0.03-0.08%
 *    - Stadler Made: 1g fresca / 700g harina poolish frío ≈ 0.14%
 *    - Poolish rápido 3h@20°C: ~0.8% IDY = ~2.16% fresca
 * 
 * 6. ATEMPERADO (Ley de enfriamiento de Newton):
 *    - t = -τ × ln((Tfinal - Tamb) / (Tinicial - Tamb))
 *    - τ calibrado: a 22°C la masa (5°C→18°C) tarda ~240min
 * =================================================================
 */

// ─── Factor Q10 ───
// La actividad de la levadura se duplica cada ~10°C.
export function yeastTempFactor(tempC: number, refTemp: number): number {
  return Math.pow(2, (tempC - refTemp) / 10);
}

// ─── LEVADURA FRESCA: método directo con fermentación en frío ───
// Datos base calibrados a 22°C de ambiente (reposo estándar ~45min antes del frío):
//   24h → 0.54% fresca (de IDY 0.20% × 2.7)
//   48h → 0.31% fresca (de IDY 0.115% × 2.7)
//   72h → 0.20% fresca (de IDY 0.075% × 2.7)
export function calculateYeast(flourWeight: number, hours: number, tempC: number): number {
  const refPoints = [
    { h: 24, pct: 0.0054 },   // 0.54% fresca
    { h: 48, pct: 0.0031 },   // 0.31% fresca
    { h: 72, pct: 0.0020 }    // 0.20% fresca
  ];

  // Interpolación log-lineal entre puntos de referencia
  let pctAtRef: number;
  if (hours <= 24) {
    pctAtRef = refPoints[0].pct;
  } else if (hours <= 48) {
    const t = (Math.log(hours) - Math.log(24)) / (Math.log(48) - Math.log(24));
    pctAtRef = refPoints[0].pct + t * (refPoints[1].pct - refPoints[0].pct);
  } else if (hours <= 72) {
    const t = (Math.log(hours) - Math.log(48)) / (Math.log(72) - Math.log(48));
    pctAtRef = refPoints[1].pct + t * (refPoints[2].pct - refPoints[1].pct);
  } else {
    pctAtRef = refPoints[2].pct;
  }

  // Ajuste por temperatura ambiente (Q10, referencia 22°C).
  // Más calor → factor > 1 → dividimos → MENOS levadura
  // Más frío → factor < 1 → dividimos → MÁS levadura
  const factor = yeastTempFactor(tempC, 22);

  // LÍMITES BIOLÓGICOS para temperaturas extremas:
  // Bajo 0°C: la levadura está DORMANTE, no fermenta en absoluto.
  //   → Necesitamos mucha más levadura para cuando logre arrancar.
  //   → Pero el factor Q10 puro daría valores absurdos.
  //   → Capamos el factor mínimo a lo que sería ~5°C (límite práctico).
  // Sobre 40°C: la levadura empieza a MORIR.
  //   → No tiene sentido seguir reduciendo linealmente.
  //   → Capamos el factor máximo a lo que sería ~38°C.
  const clampedFactor = Math.max(
    yeastTempFactor(5, 22),   // piso: como si fuera 5°C (frío extremo)
    Math.min(
      yeastTempFactor(38, 22),  // techo: como si fuera 38°C (calor extremo)
      factor
    )
  );

  const adjustedPct = pctAtRef / clampedFactor;

  let yeast = flourWeight * adjustedPct;
  yeast = Math.max(yeast, 0.3);                  // mínimo práctico: imposible pesar menos
  yeast = Math.min(yeast, flourWeight * 0.02);    // tope seguridad: 2% (nunca más que esto)
  return yeast;
}

// ─── LEVADURA FRESCA: para poolish ───
export function calculatePoolishYeast(poolishFlour: number, tempC: number, poolishType: 'rapid' | 'cold'): number {
  if (poolishType === 'cold') {
    // Poolish frío: 0.14% fresca, va directo a heladera tras 1h.
    // Mínimo ajuste por temp (solo afecta esa 1h inicial).
    let yeast = poolishFlour * 0.0014;
    return Math.max(yeast, 0.3);
  }

  // Poolish rápido: ~3h a 20°C necesita ~2.16% fresca
  const basePct = 0.0216;
  const factor = yeastTempFactor(tempC, 20);
  const clampedFactor = Math.max(
    yeastTempFactor(5, 20),
    Math.min(yeastTempFactor(38, 20), factor)
  );
  let yeast = poolishFlour * basePct / clampedFactor;
  return Math.max(yeast, 0.3);
}

// ─── Tiempo estimado del poolish rápido ───
export function poolishRapidTime(tempC: number): number {
  const factor = yeastTempFactor(Math.max(5, Math.min(38, tempC)), 20);
  let minutes = Math.round(180 / factor);
  minutes = Math.max(minutes, 60);
  minutes = Math.min(minutes, 420);
  return minutes;
}

// ─── Atemperado (Ley de enfriamiento de Newton) ───
// La masa sale a ~5°C y debe llegar a ~18°C para trabajarla.
// τ calibrado: a 22°C tarda 240min (dato empírico estándar).
// τ = 240 / -ln((18-22)/(5-22)) = 240 / 1.447 ≈ 165.8
export function temperingTime(tempC: number): number {
  const Tinicial = 5;
  const Tfinal = 18;
  const Tamb = tempC;
  const tau = 165.8;

  // Si el ambiente está por debajo o igual a la temperatura objetivo,
  // la masa NUNCA llegará a 18°C por sí sola → máximo práctico
  if (Tamb <= Tfinal) {
    return 420; // 7 horas
  }

  const ratio = (Tfinal - Tamb) / (Tinicial - Tamb);
  if (ratio <= 0) return 60;
  let minutes = Math.round(-tau * Math.log(ratio));
  minutes = Math.max(minutes, 60);   // mínimo 1h (calor extremo, 40°C+)
  minutes = Math.min(minutes, 420);  // máximo 7h
  return minutes;
}

// ─── Temperatura ideal del agua (Regla del 70) ───
// Stadler Made: Tagua = 70 - Tharina - Tambiente
// Asumimos Tharina ≈ Tambiente
export function waterTemp(tempC: number): number {
  let tw = 70 - (tempC + tempC);
  tw = Math.max(tw, 2);       // nunca bajo 2°C (hielo práctico)
  tw = Math.min(tw, tempC);   // no más caliente que el ambiente
  return Math.round(tw);
}

// ─── Utilidades de formato ───
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function fmt(g: number): string {
  if (g < 10) return g.toFixed(1);
  return Math.round(g).toString();
}
