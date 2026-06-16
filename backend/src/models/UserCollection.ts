import { Schema, model, Types } from "mongoose";

export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DMG";

export interface IUserCollection {
  _id: Types.ObjectId;
  userId: string;
  cardId: string;
  quantity: number;
  condition: CardCondition;
  language: "PT" | "EN" | "JP";
  binder?: string;
  notes?: string;
  addedAt: Date;
}

const UserCollectionSchema = new Schema<IUserCollection>({
  userId: { type: String, required: true, index: true },
  cardId: { type: String, ref: "Card", required: true },
  quantity: { type: Number, default: 1, min: 1 },
  condition: {
    type: String,
    enum: ["NM", "LP", "MP", "HP", "DMG"],
    default: "NM",
  },
  language: { type: String, enum: ["PT", "EN", "JP"], default: "EN" },
  binder: { type: String },
  notes: { type: String },
  addedAt: { type: Date, default: Date.now },
});

UserCollectionSchema.index({ userId: 1, cardId: 1 });

export const UserCollection = model<IUserCollection>(
  "UserCollection",
  UserCollectionSchema,
);
