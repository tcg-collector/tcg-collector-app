import { Schema, model, Document, Types } from 'mongoose';

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  cardId: string;
  priority: 1 | 2 | 3;        // 1 = Alta, 2 = Média, 3 = Baixa
  maxBudgetUSD?: number;
  targetCondition: string;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cardId:  { type: String, ref: 'Card', required: true },
    priority: { type: Number, enum: [1, 2, 3], default: 2 },
    maxBudgetUSD: { type: Number },
    targetCondition: {
      type: String,
      enum: ['NM', 'LP', 'MP', 'HP', 'DMG'],
      default: 'LP',
    },
  },
  { timestamps: true }
);

// Uma carta aparece uma só vez na wishlist do usuário
WishlistSchema.index({ userId: 1, cardId: 1 }, { unique: true });

export const Wishlist = model<IWishlist>('Wishlist', WishlistSchema);
