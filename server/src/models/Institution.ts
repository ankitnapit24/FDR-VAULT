import mongoose, { Schema, Document } from 'mongoose';

export type InstitutionStatus = 'Active' | 'Under Review' | 'Suspended';
export type InstitutionType = 'Engineering' | 'Management' | 'Polytechnic' | 'Pharmacy' | 'Architecture' | 'Other';

export interface IInstitution extends Document {
  institutionCode: string;
  name: string;
  type: InstitutionType;
  trustId?: mongoose.Types.ObjectId;
  intakeLevel?: 'UG' | 'PG' | 'Diploma' | 'Integrated';
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  contactEmail: string;
  contactPhone: string;
  status: InstitutionStatus;
  approvedIntake: number;
  establishedYear: number;
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionSchema = new Schema<IInstitution>(
  {
    institutionCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Engineering', 'Management', 'Polytechnic', 'Pharmacy', 'Architecture', 'Other'],
      default: 'Engineering',
    },
    trustId: { type: Schema.Types.ObjectId, ref: 'Trust', default: null, index: true },
    intakeLevel: { type: String, enum: ['UG', 'PG', 'Diploma', 'Integrated'], default: 'UG' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Under Review', 'Suspended'], default: 'Active' },
    approvedIntake: { type: Number, default: 0 },
    establishedYear: { type: Number, default: 2000 },
  },
  { timestamps: true }
);

InstitutionSchema.index({ name: 'text', institutionCode: 'text', 'address.city': 'text' });

export const Institution = mongoose.model<IInstitution>('Institution', InstitutionSchema);
