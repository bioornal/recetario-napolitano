export function calcCostoOperativoPorPizza(totalCostosMes: number, pizzasMes: number): number {
  if (pizzasMes === 0) return 0;
  return Math.round(totalCostosMes / pizzasMes);
}

/** Unidades que rinde una receta por peso (empanadas). Usa cantidad neta; MR solo afecta el costo. */
export function calcUnidadesReceta(
  ingredientes: Array<{ cantidad_kg: number; multiplo_rendimiento?: number }>,
  gramosPorUnidad = 65
): number {
  const totalNeta = ingredientes.reduce((acc, i) => acc + i.cantidad_kg, 0);
  return Math.floor((totalNeta * 1000) / gramosPorUnidad);
}

/** markup → margen % sobre precio. Ej: 1.6 → 37.5 */
export function markupToMargen(markup: number): number {
  if (markup <= 0) return 0;
  return Math.round((1 - 1 / markup) * 1000) / 10;
}

/** margen % → markup multiplicador. Ej: 37.5 → 1.6 */
export function margenToMarkup(margenPct: number): number {
  if (margenPct <= 0) return 1;
  if (margenPct >= 100) return 999;
  return 1 / (1 - margenPct / 100);
}

export function calcCostoRealTotal(costoIngredientes: number, costoOperativoPorPizza: number): number {
  return costoIngredientes + costoOperativoPorPizza;
}

export function calcPrecioEfectivo(costoRealTotal: number, markup: number): number {
  return Math.ceil((costoRealTotal * markup) / 1000) * 1000;
}

export function calcCostoReceta(
  ingredientes: Array<{ precio_kg: number; cantidad_kg: number; multiplo_rendimiento: number }>,
  precioPrepizza: number,
  precioSalsa: number
): number {
  const costoIngredientes = ingredientes.reduce((acc, ing) => {
    return acc + ing.precio_kg * ing.cantidad_kg * ing.multiplo_rendimiento;
  }, 0);
  return Math.round(precioPrepizza + precioSalsa + costoIngredientes);
}
