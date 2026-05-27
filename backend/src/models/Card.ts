import { Schema, model } from 'mongoose';

interface CardPriceVariant {
  low: number | null;
  mid: number | null;
  high: number | null;
  market: number | null;
}

interface CardPrices {
  normal?: CardPriceVariant;
  holofoil?: CardPriceVariant;
  reverseHolofoil?: CardPriceVariant;
}

export interface ICard {
  _id: string;
  name: string;
  number: string;
  supertype: string;
  subtypes: string[];
  rarity: string;
  artist: string;
  nationalPokedexNumbers: number[];
  types: string[];
  set: {
    id: string;
    name: string;
    series: string;
    images: { symbol: string; logo: string };
  };
  images: {
    small: string;
    large: string;
  };
  prices: CardPrices;
  lastPriceSyncAt: Date;
  syncedAt: Date;
}

const priceVariantSchema = {
  low:    { type: Number, default: null },
  mid:    { type: Number, default: null },
  high:   { type: Number, default: null },
  market: { type: Number, default: null },
};

const CardSchema = new Schema<ICard>(
  {
    _id:        { type: String },
    name:       { type: String, required: true },
    number:     { type: String, required: true },
    supertype:  { type: String },
    subtypes:   [String],
    rarity:     { type: String },
    artist:     { type: String },
    nationalPokedexNumbers: [Number],
    types:      [String],
    set: {
      id:     { type: String, index: true },
      name:   String,
      series: String,
      images: { symbol: String, logo: String },
    },
    images: {
      small: String,
      large: String,
    },
    prices: {
      normal:          priceVariantSchema,
      holofoil:        priceVariantSchema,
      reverseHolofoil: priceVariantSchema,
    },
    lastPriceSyncAt: { type: Date },
    syncedAt:        { type: Date, default: Date.now },
  },
  { _id: false }
);

CardSchema.index({ name: 'text' });
CardSchema.index({ rarity: 1 });

export const Card = model<ICard>('Card', CardSchema);
