import { Schema, model, Types } from 'mongoose';

export interface IPriceHistory {
  _id: Types.ObjectId;
  cardId: string;
  timestamp: Date;
  priceUSD: number;
  priceBRL: number;
  exchangeRate: number;
  condition: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
  source: string;
}

const PriceHistorySchema = new Schema<IPriceHistory>(
  {
    cardId:       { type: String, ref: 'Card', required: true, index: true },
    timestamp:    { type: Date, default: Date.now },
    priceUSD:     { type: Number, required: true },
    priceBRL:     { type: Number, required: true },
    exchangeRate: { type: Number, required: true },
    condition:    { type: String, enum: ['NM', 'LP', 'MP', 'HP', 'DMG'], default: 'NM' },
    source:       { type: String, default: 'pokemontcg.io' },
  },
  { timeseries: { timeField: 'timestamp', metaField: 'cardId', granularity: 'hours' } }
);

export const PriceHistory = model<IPriceHistory>('PriceHistory', PriceHistorySchema);
