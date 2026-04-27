import type { APIRoute } from 'astro';
import { insforge } from '../../lib/insforge';

export const POST: APIRoute = async ({ request }) => {
  const { recetas, costoOpPorPizza, pizzasMes } = await request.json();

  const prompt = `Sos un Director de Marketing y Ventas especializado en pizzerías y gastronomía argentina.
Tu objetivo principal es maximizar las ganancias. Tenés que analizar estrictamente mis costos y los productos que vendo, y diseñarme planes de marketing, promociones inteligentes y tratamiento de redes sociales.
Respondé siempre en español argentino, con tono comercial pero informal y directo.

Datos actuales de la pizzería:
- Costo operativo por pizza: $${costoOpPorPizza}
- Pizzas objetivo por mes: ${pizzasMes}
- Mis productos (con costo real, precio y margen):
${recetas.map((r: any) => `  • ${r.nombre}: costo $${r.costoReal}, precio $${r.precioEfectivo}, margen ${r.margen}%`).join('\n')}

En base a estos datos, armá una estrategia súper enfocada en ventas, ofreciendo promociones rentables (fomentando los productos de mayor margen para maximizar ganancia) y dándome copy para tener excelente presencia en redes sociales. 

Generá sugerencias concretas. Respondé SOLO con JSON válido (sin formato markdown) con esta estructura exacta:
{
  "combo": {
    "titulo": "nombre comercial del combo",
    "pizzas": ["pizza1", "pizza2"],
    "precio_sugerido": 12000,
    "razon": "por qué este combo (justificación estratégica basada en márgenes)"
  },
  "promo": {
    "titulo": "nombre de la promo / plan de marketing",
    "descripcion": "descripción de la campaña promocional",
    "razon": "justificación financiera y comercial"
  },
  "post_instagram": "texto para feed/reels de instagram con emojis, hashtags y un fuerte llamado a la acción (CTA) para vender (máx 250 chars)",
  "post_whatsapp": "mensaje difusion de whatsapp a clientes, muy persuasivo y enfocado en cerrar venta (máx 150 chars)",
  "ranking_margenes": [
    {"nombre": "pizza", "margen": 60, "recomendacion": "táctica específica de venta/marketing para este producto"}
  ]
}`;

  try {
    const completion = await insforge.ai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = completion.choices[0].message.content;
    const cleanContent = content.replace(/^```json\n?/i, '').replace(/```$/i, '').trim();

    return new Response(cleanContent, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: `InsForge AI error: ${error.message}` }), { status: 502 });
  }
};
