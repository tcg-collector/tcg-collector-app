import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  preferences: {
    currency: string;   // "USD" | "BRL" | "EUR"
    language: string;   // "pt-BR" | "en-US"
  };
  stats: {
    totalCards: number;       // total de cartas (somando quantidades)
    uniqueCards: number;      // cartas únicas
    estimatedValueUSD: number;
    lastCalculatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:         { type: String, required: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar:       { type: String },
    preferences: {
      currency: { type: String, default: 'BRL' },
      language: { type: String, default: 'pt-BR' },
    },
    stats: {
      totalCards:         { type: Number, default: 0 },
      uniqueCards:        { type: Number, default: 0 },
      estimatedValueUSD:  { type: Number, default: 0 },
      lastCalculatedAt:   { type: Date },
    },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
