/**
 * Schemas de validação centralizados.
 *
 * SETUP: instale Zod no backend e descomente a versão Zod abaixo.
 *   cd backend && npm install zod
 *
 * Por enquanto usa validação manual equivalente.
 * Migração para Zod: substituir as funções por z.parse() e usar
 * o middleware validate() em cada rota.
 */

// ─── Tipos compartilhados ──────────────────────────────────────────────────

export const VALID_CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'] as const;
export const VALID_LANGUAGES  = ['PT', 'EN', 'JP', 'DE', 'FR', 'IT', 'ES', 'KO'] as const;
export const VALID_BINDER_LANGUAGES = ['PT', 'EN', 'JP'] as const;
export const VALID_GRID_CONFIGS = ['2x2', '3x3', '3x4', '4x4'] as const;

export type CardCondition = typeof VALID_CONDITIONS[number];
export type CardLanguage  = typeof VALID_LANGUAGES[number];
export type GridConfig    = typeof VALID_GRID_CONFIGS[number];

// ─── Helper de validação ──────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export function validateRequired(value: unknown, field: string): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return { field, message: `${field} é obrigatório` };
  }
  return null;
}

export function validateEnum<T extends string>(
  value: unknown,
  field: string,
  options: readonly T[],
): ValidationError | null {
  if (value !== undefined && !options.includes(value as T)) {
    return { field, message: `${field} inválido. Use: ${options.join(', ')}` };
  }
  return null;
}

export function validatePositiveInt(value: unknown, field: string): ValidationError | null {
  if (value !== undefined && (typeof value !== 'number' || !Number.isInteger(value) || value < 1)) {
    return { field, message: `${field} deve ser um inteiro >= 1` };
  }
  return null;
}

// ─── Schema: POST /api/collections ────────────────────────────────────────

export interface CollectionCreateInput {
  cardId: string;
  quantity?: number;
  condition?: CardCondition;
  language?: CardLanguage;
  isFoil?: boolean;
  isFirstEdition?: boolean;
  acquiredPrice?: number;
  notes?: string;
}

export function validateCollectionCreate(body: unknown): {
  data?: CollectionCreateInput;
  errors?: ValidationError[];
} {
  const b = body as Record<string, unknown>;
  const errors: ValidationError[] = [];

  const req = validateRequired(b.cardId, 'cardId');
  if (req) errors.push(req);

  const condErr = validateEnum(b.condition, 'condition', VALID_CONDITIONS);
  if (condErr) errors.push(condErr);

  const langErr = validateEnum(b.language, 'language', VALID_LANGUAGES);
  if (langErr) errors.push(langErr);

  const qtyErr = validatePositiveInt(b.quantity, 'quantity');
  if (qtyErr) errors.push(qtyErr);

  if (errors.length > 0) return { errors };

  return {
    data: {
      cardId:         b.cardId as string,
      quantity:       b.quantity as number | undefined,
      condition:      b.condition as CardCondition | undefined,
      language:       b.language as CardLanguage | undefined,
      isFoil:         b.isFoil as boolean | undefined,
      isFirstEdition: b.isFirstEdition as boolean | undefined,
      acquiredPrice:  b.acquiredPrice as number | undefined,
      notes:          b.notes as string | undefined,
    },
  };
}

// ─── Schema: POST /api/binders ─────────────────────────────────────────────

export interface BinderCreateInput {
  name: string;
  gridConfig?: GridConfig;
  coverPhotoUrl?: string;
}

export function validateBinderCreate(body: unknown): {
  data?: BinderCreateInput;
  errors?: ValidationError[];
} {
  const b = body as Record<string, unknown>;
  const errors: ValidationError[] = [];

  const req = validateRequired(b.name, 'name');
  if (req) errors.push(req);

  const gridErr = validateEnum(b.gridConfig, 'gridConfig', VALID_GRID_CONFIGS);
  if (gridErr) errors.push(gridErr);

  if (errors.length > 0) return { errors };

  return {
    data: {
      name:          b.name as string,
      gridConfig:    b.gridConfig as GridConfig | undefined,
      coverPhotoUrl: b.coverPhotoUrl as string | undefined,
    },
  };
}

// ─── Schema: PATCH /api/binders/:id/slots/:position ──────────────────────

export interface SlotUpdateInput {
  cardId?: string | null;
  condition?: CardCondition;
  quantity?: number;
  language?: typeof VALID_BINDER_LANGUAGES[number];
}

export function validateSlotUpdate(body: unknown): {
  data?: SlotUpdateInput;
  errors?: ValidationError[];
} {
  const b = body as Record<string, unknown>;
  const errors: ValidationError[] = [];

  const condErr = validateEnum(b.condition, 'condition', VALID_CONDITIONS);
  if (condErr) errors.push(condErr);

  const langErr = validateEnum(b.language, 'language', VALID_BINDER_LANGUAGES);
  if (langErr) errors.push(langErr);

  const qtyErr = validatePositiveInt(b.quantity, 'quantity');
  if (qtyErr) errors.push(qtyErr);

  if (errors.length > 0) return { errors };

  return {
    data: {
      cardId:    'cardId' in b ? (b.cardId as string | null) : undefined,
      condition: b.condition as CardCondition | undefined,
      quantity:  b.quantity as number | undefined,
      language:  b.language as typeof VALID_BINDER_LANGUAGES[number] | undefined,
    },
  };
}
