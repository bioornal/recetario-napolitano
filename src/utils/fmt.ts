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
