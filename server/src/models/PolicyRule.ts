import mongoose, { Schema, Document } from 'mongoose';

export interface IDisciplineRate {
  discipline: string;
  level: string; // 'UG' | 'PG' | 'Diploma'
  baseDepositAmount: number;
  perIntakeUnitAmount: number; // e.g. amount per 60 approved seats
  intakeUnitSize: number; // e.g. 60
}

export interface IPolicyRule extends Document {
  ruleCode: string;
  version: string;
  title: string;
  formulaDescription: string;
  regulatorySource: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  minimumTenureMonths: number;
  disciplineRates: IDisciplineRate[];
  isActive: boolean;
  isIllustrativeDemoRule: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PolicyRuleSchema = new Schema<IPolicyRule>(
  {
    ruleCode: { type: String, required: true, uppercase: true, trim: true },
    version: { type: String, required: true, trim: true },
    title: { type: String, required: true },
    formulaDescription: { type: String, required: true },
    regulatorySource: { type: String, default: 'AICTE Approval Process Handbook (Illustrative Benchmark)' },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date, default: null },
    minimumTenureMonths: { type: Number, default: 60 },
    disciplineRates: [
      {
        discipline: { type: String, required: true },
        level: { type: String, default: 'UG' },
        baseDepositAmount: { type: Number, required: true },
        perIntakeUnitAmount: { type: Number, default: 500000 },
        intakeUnitSize: { type: Number, default: 60 },
      },
    ],
    isActive: { type: Boolean, default: true },
    isIllustrativeDemoRule: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

PolicyRuleSchema.index({ ruleCode: 1, version: 1 }, { unique: true });
PolicyRuleSchema.index({ isActive: 1, effectiveFrom: -1 });

export const PolicyRule = mongoose.model<IPolicyRule>('PolicyRule', PolicyRuleSchema);
