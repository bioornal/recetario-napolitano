export function calcCostoOperativoPorPizza(totalCostosMes: number, pizzasMes: number): number {
  if (pizzasMes === 0) return 0;
  return Math.round(totalCostosMes / pizzasMes);
}

export function calcCostoRealTotal(costoIngredientes: number, costoOperativoPorPizza: number): number {
  return costoIngredientes + costoOperativoPorPizza;
}

export function calcPrecioEfectivo(costoRealTotal: number, markup: number): number {
  return Math.round(costoRealTotal * markup);
}

export function calcCostoReceta(
  ingredientes: Array<{ precio_kg: number; cantidad_kg: number; merma_factor: number }>,
  precioPrepizza: number,
  precioSalsa: number
): number {
  const costoIngredientes = ingredientes.reduce((acc, ing) => {
    return acc + Math.round(ing.precio_kg * ing.cantidad_kg * ing.merma_factor);
  }, 0);
  return precioPrepizza + precioSalsa + costoIngredientes;
}
