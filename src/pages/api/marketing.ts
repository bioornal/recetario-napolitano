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
