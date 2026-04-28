import type { APIRoute } from 'astro';

// Rate limiting: max 10 requests per hour per IP (best-effort, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Límite de requests alcanzado. Intentá en 1 hora.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { recetas, costoOpPorPizza, pizzasMes } = await request.json();

  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY no configurada.' }), { status: 500 });
  }

  const prompt = `Sos un Director de Marketing y Ventas especializado en pizzerías y gastronomía argentina.
Tu objetivo principal es maximizar las ganancias. Tenés que analizar estrictamente mis costos y los productos que vendo, y diseñarme planes de marketing, promociones inteligentes y tratamiento de redes sociales.
Respondé siempre en español argentino, con tono comercial pero informal y directo.

Datos actuales de la pizzería:
- Costo operativo por pizza: $${costoOpPorPizza}
- Pizzas objetivo por mes: ${pizzasMes}
- Mis productos (con costo real, precio y margen):
${recetas.map((r: any) => `  • ${r.nombre}: costo $${r.costoReal}, precio $${r.precioEfectivo}, margen ${r.margen}%`).join('\n')}

En base a estos datos, armá una estrategia súper enfocada en ventas, ofreciendo promociones rentables (fomentando los productos de mayor margen para maximizar ganancia) y dándome copy para tener excelente presencia en redes sociales.

Respondé SOLO con un objeto JSON con esta estructura exacta:
{
  "combo": {
    "titulo": "nombre comercial del combo",
    "pizzas": ["pizza1", "pizza2"],
    "precio_sugerido": 12000,
    "razon": "justificación estratégica basada en márgenes"
  },
  "promo": {
    "titulo": "nombre de la promo",
    "descripcion": "descripción de la campaña",
    "razon": "justificación financiera y comercial"
  },
  "post_instagram": "texto para feed/reels con emojis, hashtags y CTA fuerte (máx 250 chars)",
  "post_whatsapp": "mensaje difusión muy persuasivo para cerrar venta (máx 150 chars)",
  "ranking_margenes": [
    {"nombre": "pizza", "margen": 60, "recomendacion": "táctica específica de venta para este producto"}
  ]
}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: `OpenAI error: ${err.error?.message ?? res.statusText}` }), { status: 502 });
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? '{}';

    return new Response(content, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: `Error: ${error.message}` }), { status: 502 });
  }
};
