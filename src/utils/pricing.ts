export function calcCostoOperativoPorPizza(totalCostosMes: number, pizzasMes: number): number {
  if (pizzasMes === 0) return 0;
  return Math.round(totalCostosMes / pizzasMes);
}

/** Unidades que rinde una receta según MR y gramos por unidad */
export function calcUnidadesReceta(
  ingredientes: Array<{ cantidad_kg: number; multiplo_rendimiento: number }>,
  gramosPorUnidad = 65
): number {
  const totalMR = ingredientes.reduce((acc, i) => acc + i.cantidad_kg / (i.multiplo_rendimiento || 1), 0);
  return Math.floor((totalMR * 1000) / gramosPorUnidad);
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
  return Math.round(costoRealTotal * markup);
}

export function calcCostoReceta(
  ingredientes: Array<{ precio_kg: number; cantidad_kg: number; multiplo_rendimiento: number }>,
  precioPrepizza: number,
  precioSalsa: number
): number {
  const costoIngredientes = ingredientes.reduce((acc, ing) => {
    return acc + Math.round(ing.precio_kg * ing.cantidad_kg * ing.multiplo_rendimiento);
  }, 0);
  return precioPrepizza + precioSalsa + costoIngredientes;
}
