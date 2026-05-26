import { Schema, model, Types } from 'mongoose';

export interface IWishlist {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  cardId: string;
  targetPriceBRL?: number;
  notifyOnDrop: boolean;
  addedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cardId:         { type: String, ref: 'Card', required: true },
    targetPriceBRL: { type: Number },
    notifyOnDrop:   { type: Boolean, default: false },
    addedAt:        { type: Date, default: Date.now },
  }
);

WishlistSchema.index({ userId: 1, cardId: 1 }, { unique: true });

export const Wishlist = model<IWishlist>('Wishlist', WishlistSchema);
