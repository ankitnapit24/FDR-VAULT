import mongoose, { Schema, Document } from 'mongoose';

export interface ITrust extends Document {
  trustName: string;
  registrationNumber: string;
  panNumber: string;
  chairmanName: string;
  contactEmail: string;
  contactPhone: string;
  registeredAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  institutionIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TrustSchema = new Schema<ITrust>(
  {
    trustName: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    panNumber: { type: String, uppercase: true, trim: true, default: '' },
    chairmanName: { type: String, default: '' },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, default: '' },
    registeredAddress: {
      street: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    institutionIds: [{ type: Schema.Types.ObjectId, ref: 'Institution' }],
  },
  { timestamps: true }
);

TrustSchema.index({ trustName: 'text', registrationNumber: 1 });

export const Trust = mongoose.model<ITrust>('Trust', TrustSchema);
