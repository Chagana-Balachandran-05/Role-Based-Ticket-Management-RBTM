import mongoose, { Schema, Document } from 'mongoose';

export interface IIdempotencyRecord extends Document {
  key: string;
  responseBody: any;
  createdAt: Date;
}

const IdempotencySchema = new Schema<IIdempotencyRecord>(
  {
    key: { type: String, required: true, unique: true },
    responseBody: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Expire idempotency records automatically after 24 hours
IdempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model<IIdempotencyRecord>('Idempotency', IdempotencySchema);
