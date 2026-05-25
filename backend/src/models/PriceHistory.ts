import { Schema, model, Document } from 'mongoose';

export type PriceVariant = 'normal' | 'holofoil' | 'reverseHolofoil';

export interface IPriceHistory extends Document {
  cardId: string;           // metaField para Time Series
  variant: PriceVariant;
  market: number | null;    // preço em USD
  low: number | null;
  high: number | null;
  mid: number | null;
  recordedAt: Date;         // timeField — snapshot semanal (todo domingo)
}

const PriceHistorySchema = new Schema<IPriceHistory>({
  cardId:  { type: String, ref: 'Card', required: true },
  variant: { type: String, enum: ['normal', 'holofoil', 'reverseHolofoil'], required: true },
  market:  { type: Number, default: null },
  low:     { type: Number, default: null },
  high:    { type: Number, default: null },
  mid:     { type: Number, default: null },
  recordedAt: { type: Date, default: Date.now },
});

// IMPORTANTE: criar como Time Series Collection no Atlas (rodar uma vez):
//
// db.createCollection("pricehistories", {
//   timeseries: {
//     timeField: "recordedAt",
//     metaField: "cardId",
//     granularity: "hours"
//   }
// })
//
// Job semanal (todo domingo 00:00) insere um snapshot por carta ativa.

PriceHistorySchema.index({ cardId: 1, recordedAt: -1 });

export const PriceHistory = model<IPriceHistory>('PriceHistory', PriceHistorySchema);
