import { Schema, model, Types } from 'mongoose';

export interface IExchangeRate {
  _id: Types.ObjectId;
  pair: string;
  rate: number;
  timestamp: Date;
}

const ExchangeRateSchema = new Schema<IExchangeRate>(
  {
    pair:      { type: String, required: true, index: true },
    rate:      { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  }
);

export const ExchangeRate = model<IExchangeRate>('ExchangeRate', ExchangeRateSchema);
