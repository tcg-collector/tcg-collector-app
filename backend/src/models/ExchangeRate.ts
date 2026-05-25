import { Schema, model, Document } from 'mongoose';

export interface IExchangeRate extends Document {
  base: string;       // sempre "USD"
  rates: {
    BRL: number;
    EUR: number;
    GBP: number;
    JPY: number;
  };
  fetchedAt: Date;
}

const ExchangeRateSchema = new Schema<IExchangeRate>({
  base: { type: String, default: 'USD' },
  rates: {
    BRL: { type: Number, required: true },
    EUR: { type: Number, required: true },
    GBP: { type: Number, required: true },
    JPY: { type: Number, required: true },
  },
  fetchedAt: { type: Date, default: Date.now },
});

// Job diário (06:00) busca câmbio na ExchangeRate-API e sobrescreve este documento.
// No código: ExchangeRate.findOneAndReplace({}, novosDados, { upsert: true })

export const ExchangeRate = model<IExchangeRate>('ExchangeRate', ExchangeRateSchema);
