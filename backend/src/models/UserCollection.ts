import { Schema, model, Document, Types } from 'mongoose';

// NM = Near Mint | LP = Lightly Played | MP = Moderately Played
// HP = Heavily Played | DMG = Damaged
export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

export type CardLanguage = 'PT' | 'EN' | 'JP' | 'DE' | 'FR' | 'IT' | 'ES' | 'KO';

export interface IUserCollection extends Document {
  userId: Types.ObjectId;
  cardId: string;
  quantity: number;
  condition: CardCondition;
  language: CardLanguage;
  isFoil: boolean;
  isFirstEdition: boolean;
  acquiredPrice?: number;   // valor pago em USD (opcional)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserCollectionSchema = new Schema<IUserCollection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cardId: { type: String, ref: 'Card', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    condition: {
      type: String,
      enum: ['NM', 'LP', 'MP', 'HP', 'DMG'],
      required: true,
      default: 'NM',
    },
    language: {
      type: String,
      enum: ['PT', 'EN', 'JP', 'DE', 'FR', 'IT', 'ES', 'KO'],
      default: 'EN',
    },
    isFoil:         { type: Boolean, default: false },
    isFirstEdition: { type: Boolean, default: false },
    acquiredPrice:  { type: Number },
    notes:          { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// Sem unique — usuário pode ter múltiplos registros da mesma carta
// (ex: duplicatas para troca, compras em momentos diferentes)
UserCollectionSchema.index({ userId: 1, cardId: 1, condition: 1, language: 1 });
UserCollectionSchema.index({ userId: 1 });

export const UserCollection = model<IUserCollection>('UserCollection', UserCollectionSchema);
