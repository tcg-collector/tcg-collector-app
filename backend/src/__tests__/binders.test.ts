/**
 * Testes de integração — rotas de Binder
 *
 * Esses testes usam um MongoDB in-memory (mongodb-memory-server) para
 * rodar sem depender do Atlas. Para instalar:
 *   npm install --save-dev mongodb-memory-server
 *
 * Por enquanto testam a lógica de validação sem banco (unit-style).
 * TODO: adicionar testes com banco real quando mongodb-memory-server estiver instalado.
 */

import { validateBinderCreate, validateSlotUpdate } from '../validation/schemas';

// ─── validateBinderCreate ────────────────────────────────────────────────

describe('validateBinderCreate', () => {
  it('aceita input válido', () => {
    const { data, errors } = validateBinderCreate({ name: 'Meu Binder', gridConfig: '3x3' });
    expect(errors).toBeUndefined();
    expect(data?.name).toBe('Meu Binder');
    expect(data?.gridConfig).toBe('3x3');
  });

  it('rejeita quando name está ausente', () => {
    const { errors } = validateBinderCreate({});
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.field === 'name')).toBe(true);
  });

  it('rejeita gridConfig inválido', () => {
    const { errors } = validateBinderCreate({ name: 'Binder', gridConfig: '5x5' });
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.field === 'gridConfig')).toBe(true);
  });
});

// ─── validateSlotUpdate ───────────────────────────────────────────────────

describe('validateSlotUpdate', () => {
  it('aceita update válido', () => {
    const { data, errors } = validateSlotUpdate({ cardId: 'sv3-1', condition: 'NM', quantity: 1, language: 'EN' });
    expect(errors).toBeUndefined();
    expect(data?.cardId).toBe('sv3-1');
    expect(data?.condition).toBe('NM');
  });

  it('aceita cardId null (limpar slot)', () => {
    const { data, errors } = validateSlotUpdate({ cardId: null });
    expect(errors).toBeUndefined();
    expect(data?.cardId).toBeNull();
  });

  it('rejeita condição inválida', () => {
    const { errors } = validateSlotUpdate({ condition: 'PERFEITA' });
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.field === 'condition')).toBe(true);
  });

  it('rejeita idioma inválido para binder', () => {
    const { errors } = validateSlotUpdate({ language: 'KO' }); // KO é válido em collection mas não em binder
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.field === 'language')).toBe(true);
  });

  it('rejeita quantity zero', () => {
    const { errors } = validateSlotUpdate({ quantity: 0 });
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.field === 'quantity')).toBe(true);
  });

  it('rejeita quantity negativo', () => {
    const { errors } = validateSlotUpdate({ quantity: -5 });
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.field === 'quantity')).toBe(true);
  });

  it('aceita update parcial (só condition)', () => {
    const { data, errors } = validateSlotUpdate({ condition: 'LP' });
    expect(errors).toBeUndefined();
    expect(data?.condition).toBe('LP');
    expect(data?.cardId).toBeUndefined();
  });
});
