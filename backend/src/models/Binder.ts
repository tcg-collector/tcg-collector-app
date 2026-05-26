import { Schema, model, Types } from 'mongoose';

export type GridConfig = '2x2' | '3x3' | '3x4' | '4x4';
export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

export interface IBinderSlot {
  position: number;
  cardId: string | null;
  condition: CardCondition;
  quantity: number;
  language: 'PT' | 'EN' | 'JP';
}

export interface IBinder {
  _id: Types.ObjectId;
  userId: string;          // Clerk user ID (ex: "user_2abc123")
  name: string;
  coverPhotoUrl?: string;
  gridConfig: GridConfig;
  slots: IBinderSlot[];
  createdAt: Date;
  updatedAt: Date;
}

function totalSlots(grid: GridConfig): number {
  const map: Record<GridConfig, number> = { '2x2': 4, '3x3': 9, '3x4': 12, '4x4': 16 };
  return map[grid];
}

const SlotSchema = new Schema<IBinderSlot>(
  {
    position:  { type: Number, required: true },
    cardId:    { type: String, ref: 'Card', default: null },
    condition: { type: String, enum: ['NM', 'LP', 'MP', 'HP', 'DMG'], default: 'NM' },
    quantity:  { type: Number, default: 1, min: 1 },
    language:  { type: String, enum: ['PT', 'EN', 'JP'], default: 'EN' },
  },
  { _id: false }
);

const BinderSchema = new Schema<IBinder>(
  {
    userId:        { type: String, required: true, index: true },  // String para Clerk ID
    name:          { type: String, required: true, trim: true },
    coverPhotoUrl: { type: String },
    gridConfig:    { type: String, enum: ['2x2', '3x3', '3x4', '4x4'], default: '3x3' },
    slots:         { type: [SlotSchema], default: [] },
  },
  { timestamps: true }
);

BinderSchema.pre('save', function (next) {
  const needed = totalSlots(this.gridConfig);
  const existing = new Set(this.slots.map(s => s.position));
  for (let i = 0; i < needed; i++) {
    if (!existing.has(i)) {
      this.slots.push({ position: i, cardId: null, condition: 'NM', quantity: 1, language: 'EN' });
    }
  }
  this.slots.sort((a, b) => a.position - b.position);
  next();
});

export const Binder = model<IBinder>('Binder', BinderSchema);
