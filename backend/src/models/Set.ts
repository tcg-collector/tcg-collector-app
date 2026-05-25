import { Schema, model, Document } from 'mongoose';

export interface ISet extends Document {
  _id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  images: {
    symbol: string;
    logo: string;
  };
  syncedAt: Date;
}

const SetSchema = new Schema<ISet>(
  {
    _id:          { type: String },
    name:         { type: String, required: true },
    series:       { type: String, required: true },
    printedTotal: { type: Number },
    total:        { type: Number },
    releaseDate:  { type: String },
    images: {
      symbol: String,
      logo:   String,
    },
    syncedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const Set = model<ISet>('Set', SetSchema);
