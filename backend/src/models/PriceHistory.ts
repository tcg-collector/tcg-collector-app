import { Schema, model, Types } from 'mongoose';

export interface IPriceHistory {
  _id: Types.ObjectId;
  cardId: string;
  date: Date;
  market: number;
}

const PriceHistorySchema = new Schema<IPriceHistory>({
  cardId: { type: String, ref: 'Card', required: true },
  date:   { type: Date, required: true },
  market: { type: Number, required: true },
});

// Um snapshot por carta por dia (idempotente via upsert)
PriceHistorySchema.index({ cardId: 1, date: -1 }, { unique: true });

// TTL: MongoDB remove automaticamente snapshots com mais de 60 dias
PriceHistorySchema.index({ date: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

export const PriceHistory = model<IPriceHistory>('PriceHistory', PriceHistorySchema);
