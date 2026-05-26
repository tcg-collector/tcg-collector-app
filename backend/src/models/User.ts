import { Schema, model, Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email:     { type: String, required: true, unique: true, lowercase: true },
    name:      { type: String, required: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
