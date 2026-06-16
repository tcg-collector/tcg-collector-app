/**
 * Testes de integração — rotas de UserCollection
 *
 * Cobre os casos críticos que detectariam mass assignment e
 * falta de validação de campos obrigatórios.
 */

import { validateCollectionCreate } from '../validation/schemas';

// ─── validateCollectionCreate ────────────────────────────────────────────

describe('validateCollectionCreate', () => {
  it('aceita input mínimo válido (só cardId)', () => {
    const { data, errors } = validateCollectionCreate({ cardId: 'sv3-1' });
    expect(errors).toBeUndefined();
    expect(data?.cardId).toBe('sv3-1');
  });

  it('aceita input completo válido', () => {
    const { data, errors } = validateCollectionCreate({
      cardId: 'sv3-1',
      quantity: 2,
      condition: 'LP',
      language: 'PT',
      isFoil: true,
      isFirstEdition: false,
      acquiredPrice: 45.90,
      notes: 'Comprada na TCGPlayer',
    });
    expect(errors).toBeUndefined();
    expect(data?.condition).toBe('LP');
    expect(data?.language).toBe('PT');
  });

  it('rejeita quando cardId está ausente', () => {
    const { errors } = validateCollectionCreate({});
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.field === 'cardId')).toBe(true);
  });

  it('rejeita condição inválida', () => {
    const { errors } = validateCollectionCreate({ cardId: 'sv3-1', condition: 'MINT' });
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.field === 'condition')).toBe(true);
  });

  it('rejeita idioma inválido', () => {
    const { errors } = validateCollectionCreate({ cardId: 'sv3-1', language: 'ZZ' });
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.field === 'language')).toBe(true);
  });

  it('rejeita quantity zero (mass assignment attempt)', () => {
    const { errors } = validateCollectionCreate({ cardId: 'sv3-1', quantity: 0 });
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.field === 'quantity')).toBe(true);
  });

  it('não propaga campos não permitidos (proteção contra mass assignment)', () => {
    const { data } = validateCollectionCreate({
      cardId: 'sv3-1',
      userId: 'user_outrousuario', // tentativa de injetar userId
      __proto__: { admin: true }, // tentativa de prototype pollution
    });
    // data deve conter apenas campos do whitelist
    expect(data).not.toHaveProperty('userId');
    expect(data).not.toHaveProperty('admin');
  });
});
