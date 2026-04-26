import { describe, test, expect } from 'vitest';
import {
  calcCostoOperativoPorPizza,
  calcCostoRealTotal,
  calcPrecioEfectivo,
  calcCostoReceta,
} from './pricing';

describe('calcCostoOperativoPorPizza', () => {
  test('divide total mensual entre pizzas objetivo', () => {
    expect(calcCostoOperativoPorPizza(1_000_000, 800)).toBe(1250);
  });
  test('retorna 0 si pizzas = 0 (división por cero)', () => {
    expect(calcCostoOperativoPorPizza(1_000_000, 0)).toBe(0);
  });
});

describe('calcCostoRealTotal', () => {
  test('suma costo ingredientes + costo operativo', () => {
    expect(calcCostoRealTotal(4020, 1250)).toBe(5270);
  });
});

describe('calcPrecioEfectivo', () => {
  test('aplica markup al costo real total', () => {
    expect(calcPrecioEfectivo(5270, 1.6)).toBe(8432);
  });
  test('redondea al entero más cercano', () => {
    expect(calcPrecioEfectivo(1000, 1.333)).toBe(1333);
  });
});

describe('calcCostoReceta', () => {
  test('suma prepizza + salsa + ingredientes con merma', () => {
    const ingredientes = [
      { precio_kg: 16000, cantidad_kg: 0.2, merma_factor: 1.0 }, // 3200
      { precio_kg: 20000, cantidad_kg: 0.005, merma_factor: 1.0 }, // 100
    ];
    // prepizza 485 + salsa 236 + 3200 + 100 = 4021
    expect(calcCostoReceta(ingredientes, 485, 236)).toBe(4021);
  });
  test('aplica factor de merma a la cantidad', () => {
    const ingredientes = [
      { precio_kg: 10000, cantidad_kg: 0.1, merma_factor: 1.2 }, // 1200
    ];
    expect(calcCostoReceta(ingredientes, 0, 0)).toBe(1200);
  });
});
