/**
 * Testa helpers de formatação de preço do frontend.
 * Duplicado intencionalmente do backend — os dois lados precisam ser consistentes.
 */

function formatBRL(value: number): string {
  const fixed = value.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${intFormatted},${decPart}`;
}

function priceUSD(card: { prices?: { holofoil?: { market?: number }; normal?: { market?: number } } }): number | null {
  return card.prices?.holofoil?.market ?? card.prices?.normal?.market ?? null;
}

describe('formatBRL (frontend)', () => {
  it('formata corretamente', () => {
    expect(formatBRL(10)).toBe('R$ 10,00');
    expect(formatBRL(1500.5)).toBe('R$ 1.500,50');
    expect(formatBRL(0)).toBe('R$ 0,00');
  });
});

describe('priceUSD', () => {
  it('prefere holofoil quando disponível', () => {
    expect(priceUSD({ prices: { holofoil: { market: 50 }, normal: { market: 10 } } })).toBe(50);
  });

  it('fallback para normal quando sem holofoil', () => {
    expect(priceUSD({ prices: { normal: { market: 10 } } })).toBe(10);
  });

  it('retorna null quando sem preços', () => {
    expect(priceUSD({})).toBeNull();
  });
});
