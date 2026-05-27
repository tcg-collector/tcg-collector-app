/**
 * Testa utilitários de formatação de preço.
 * Esses helpers são críticos — qualquer erro afeta o valor mostrado ao usuário.
 */

function formatBRL(value: number): string {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
  const fixed = value.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${intFormatted},${decPart}`;
}

function applyConditionMultiplier(priceUSD: number, condition: string): number {
  const multipliers: Record<string, number> = {
    NM: 1.0, LP: 0.8, MP: 0.6, HP: 0.4, DMG: 0.2,
  };
  return priceUSD * (multipliers[condition] ?? 1.0);
}

describe('formatBRL', () => {
  it('formata valor simples corretamente', () => {
    expect(formatBRL(10)).toBe('R$ 10,00');
  });

  it('formata milhar com ponto', () => {
    expect(formatBRL(1500.5)).toBe('R$ 1.500,50');
  });

  it('formata zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
  });

  it('lida com NaN', () => {
    expect(formatBRL(NaN)).toBe('R$ 0,00');
  });
});

describe('applyConditionMultiplier', () => {
  it('NM = 100% do preço', () => {
    expect(applyConditionMultiplier(100, 'NM')).toBe(100);
  });

  it('LP = 80% do preço', () => {
    expect(applyConditionMultiplier(100, 'LP')).toBe(80);
  });

  it('DMG = 20% do preço', () => {
    expect(applyConditionMultiplier(100, 'DMG')).toBe(20);
  });

  it('condição desconhecida = 100%', () => {
    expect(applyConditionMultiplier(100, 'UNKNOWN')).toBe(100);
  });
});
