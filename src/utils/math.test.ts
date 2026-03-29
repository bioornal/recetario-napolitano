import { describe, it, expect } from 'vitest';
import {
  calculateYeast,
  calculatePoolishYeast,
  waterTemp,
  temperingTime,
  yeastTempFactor,
  poolishRapidTime
} from './math';

describe('Motor Matemático Napolitano — Certeza Total', () => {

  // ═══════════════════════════════════════════════
  // LEY Q10 (base bioquímica)
  // ═══════════════════════════════════════════════
  describe('Q10: factor de temperatura', () => {
    it('se duplica la actividad cada +10°C', () => {
      expect(yeastTempFactor(30, 20)).toBe(2);
      expect(yeastTempFactor(10, 20)).toBe(0.5);
      expect(yeastTempFactor(20, 20)).toBe(1);
    });

    it('se cuadruplica cada +20°C', () => {
      expect(yeastTempFactor(40, 20)).toBeCloseTo(4, 5);
    });
  });

  // ═══════════════════════════════════════════════
  // LEVADURA DIRECTA: escenarios reales
  // ═══════════════════════════════════════════════
  describe('Levadura directa — 48h en frío', () => {
    const flour = 563; // 4 bollos × 230g, ~56% hidratación

    it('a 22°C (ref) da ~0.31% fresca ≈ 1.75g', () => {
      const y = calculateYeast(flour, 48, 22);
      expect(y).toBeGreaterThan(1.4);
      expect(y).toBeLessThan(2.2);
    });

    it('a 10°C da MÁS levadura que a 22°C (frío, necesita más)', () => {
      const yFrio = calculateYeast(flour, 48, 10);
      const yNormal = calculateYeast(flour, 48, 22);
      expect(yFrio).toBeGreaterThan(yNormal);
    });

    it('a 35°C da MENOS levadura que a 22°C (calor, necesita menos)', () => {
      const yCalor = calculateYeast(flour, 48, 35);
      const yNormal = calculateYeast(flour, 48, 22);
      expect(yCalor).toBeLessThan(yNormal);
    });
  });

  describe('Levadura directa — temperaturas extremas', () => {
    const flour = 563;

    it('a -3°C (congelamiento) da el máximo de levadura (clamped a 5°C)', () => {
      const yMenos3 = calculateYeast(flour, 48, -3);
      const y5 = calculateYeast(flour, 48, 5);
      // A -3°C se clampea al factor de 5°C, así que dan lo mismo
      expect(yMenos3).toBe(y5);
      // Y debe dar bastante más que a 22°C
      const yNormal = calculateYeast(flour, 48, 22);
      expect(yMenos3).toBeGreaterThan(yNormal * 1.5);
    });

    it('a 40°C (calor extremo) da el mínimo de levadura (clamped a 38°C)', () => {
      const y40 = calculateYeast(flour, 48, 40);
      const y38 = calculateYeast(flour, 48, 38);
      // A 40°C se clampea al factor de 38°C
      expect(y40).toBe(y38);
      // Debe dar mucho menos que a 22°C
      const yNormal = calculateYeast(flour, 48, 22);
      expect(y40).toBeLessThan(yNormal);
    });

    it('nunca da menos de 0.3g (mínimo práctico)', () => {
      // Incluso con poca harina y mucho calor
      const y = calculateYeast(50, 72, 38);
      expect(y).toBeGreaterThanOrEqual(0.3);
    });

    it('nunca supera el 2% de la harina (tope de seguridad)', () => {
      const y = calculateYeast(flour, 24, -3);
      expect(y).toBeLessThanOrEqual(flour * 0.02);
    });
  });

  describe('Levadura directa — todos los tiempos de fermentación', () => {
    const flour = 500;
    const temp = 22;

    it('24h necesita más levadura que 48h', () => {
      expect(calculateYeast(flour, 24, temp)).toBeGreaterThan(calculateYeast(flour, 48, temp));
    });

    it('48h necesita más levadura que 72h', () => {
      expect(calculateYeast(flour, 48, temp)).toBeGreaterThan(calculateYeast(flour, 72, temp));
    });

    it('60h es intermedio entre 48h y 72h', () => {
      const y60 = calculateYeast(flour, 60, temp);
      expect(y60).toBeLessThan(calculateYeast(flour, 48, temp));
      expect(y60).toBeGreaterThan(calculateYeast(flour, 72, temp));
    });
  });

  // ═══════════════════════════════════════════════
  // TEMPERATURA DEL AGUA (Regla del 70)
  // ═══════════════════════════════════════════════
  describe('Temperatura del agua', () => {
    it('a 22°C ambiente → agua a 22°C (capped al ambiente)', () => {
      // 70 - 22 - 22 = 26, pero capped a 22 (no puede ser más caliente que ambiente)
      expect(waterTemp(22)).toBe(22);
    });

    it('a 30°C → agua a 10°C (fría de heladera)', () => {
      expect(waterTemp(30)).toBe(10);
    });

    it('a 35°C → agua helada a 2°C (mínimo)', () => {
      // 70 - 35 - 35 = 0, capped a 2
      expect(waterTemp(35)).toBe(2);
    });

    it('a 40°C → agua helada a 2°C (mínimo absoluto)', () => {
      expect(waterTemp(40)).toBe(2);
    });

    it('a 10°C → agua a 10°C (se capea al ambiente)', () => {
      // 70 - 10 - 10 = 50, pero capped a 10°C (no más que ambiente)
      expect(waterTemp(10)).toBe(10);
    });
  });

  // ═══════════════════════════════════════════════
  // ATEMPERADO (Newton)
  // ═══════════════════════════════════════════════
  describe('Tiempo de atemperado', () => {
    it('a 35°C tarda MENOS que a 22°C', () => {
      expect(temperingTime(35)).toBeLessThan(temperingTime(22));
    });

    it('a 22°C tarda ~4 horas (dato empírico calibrado)', () => {
      const t = temperingTime(22);
      expect(t).toBeGreaterThanOrEqual(200);
      expect(t).toBeLessThanOrEqual(280);
    });

    it('a 15°C o menos → 7 horas (máximo, no puede atemperar sola)', () => {
      expect(temperingTime(15)).toBe(420);
      expect(temperingTime(10)).toBe(420);
      expect(temperingTime(-3)).toBe(420);
    });

    it('a 40°C tarda ~1h (mínimo práctico)', () => {
      const t = temperingTime(40);
      expect(t).toBeGreaterThanOrEqual(60);
      expect(t).toBeLessThanOrEqual(90);
    });

    it('monótonamente decrece al subir la temperatura (arriba de 18°C)', () => {
      const t20 = temperingTime(20);
      const t25 = temperingTime(25);
      const t30 = temperingTime(30);
      expect(t25).toBeLessThan(t20);
      expect(t30).toBeLessThan(t25);
    });
  });

  // ═══════════════════════════════════════════════
  // POOLISH
  // ═══════════════════════════════════════════════
  describe('Poolish', () => {
    const poolishFlour = 170; // 30% de 563g

    it('poolish frío da ~0.14% fresca → ~0.24g', () => {
      const y = calculatePoolishYeast(poolishFlour, 22, 'cold');
      expect(y).toBeCloseTo(0.3, 1); // clamped al mínimo 0.3
    });

    it('poolish rápido se ajusta por temperatura', () => {
      const yFrio = calculatePoolishYeast(poolishFlour, 10, 'rapid');
      const yCalor = calculatePoolishYeast(poolishFlour, 30, 'rapid');
      expect(yFrio).toBeGreaterThan(yCalor);
    });

    it('tiempo de poolish rápido: más rápido en calor', () => {
      expect(poolishRapidTime(30)).toBeLessThan(poolishRapidTime(20));
      expect(poolishRapidTime(10)).toBeGreaterThan(poolishRapidTime(20));
    });
  });
});
