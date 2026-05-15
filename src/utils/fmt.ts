export const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

export function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const TIPOS = ['Quesos', 'Carnes', 'Fiambres', 'Verduras y Frutas', 'Harinas y Masas', 'Salsas y Condimentos', 'Varios'] as const;
export type Tipo = typeof TIPOS[number];

export function showDbError(err?: unknown) {
  const el = document.createElement('div');
  el.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-200 text-sm px-5 py-3 rounded-xl z-50 shadow-lg';
  el.textContent = 'Error al conectar con la base de datos. Verificá tu conexión.';
  document.body.appendChild(el);
  console.error(err);
}

// InsForge tiene nodos del load balancer que devuelven 404 espurio en PATCH/POST.
// Este helper reintenta hasta 4 veces con backoff corto — suele caer en un nodo sano.
export async function dbWrite<T extends { error?: any; status?: number }>(
  fn: () => Promise<T>,
  maxAttempts = 4,
): Promise<T> {
  let last: T | undefined;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fn();
    last = res;
    const status = res?.status;
    const has404 = status === 404;
    if (!has404 && !res?.error) return res;
    if (i < maxAttempts - 1) await new Promise(r => setTimeout(r, 150 + i * 250));
  }
  return last!;
}
