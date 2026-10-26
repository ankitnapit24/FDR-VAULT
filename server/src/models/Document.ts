import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type DocumentType =
  | 'FDR Certificate'
  | 'Bank Confirmation Letter'
  | 'Renewal Request Letter'
  | 'Refund Application'
  | 'Board Resolution'
  | 'Other';

export type DocumentVerificationStatus =
  | 'Uploaded'
  | 'Pending Verification'
  | 'Verified'
  | 'Rejected'
  | 'Additional Information Required';

export interface IDiscrepancyFlag {
  field: string;
  expected: any;
  found: any;
  description: string;
  severity: 'warning' | 'error';
}

export interface IOCRExtraction {
  fdrNumber?: string;
  bankName?: string;
  depositAmount?: number;
  issueDate?: string;
  maturityDate?: string;
  rawText?: string;
  confidence?: number;
}

export interface IIntegritySignal {
  isEncrypted?: boolean;
  isSafePdf?: boolean;
  pdfVersion?: string;
  pageCount?: number;
  producer?: string;
  creator?: string;
  structuralCheckPassed?: boolean;
  remarks?: string;
}

export interface IHashHistory {
  fileHash: string;
  hashAlgorithm: string;
  uploadedAt: Date;
  uploadedBy?: mongoose.Types.ObjectId;
}

export interface IDocument extends MongooseDocument {
  institutionId: mongoose.Types.ObjectId;
  fdrId?: mongoose.Types.ObjectId;
  documentType: DocumentType;
  storageKey: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  verificationStatus: DocumentVerificationStatus;
  verificationRemarks?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  fileHash: string;
  hashAlgorithm: string;
  hashTimestamp: Date;
  integritySignals?: IIntegritySignal;
  hashHistory: IHashHistory[];
  ocrExtracted: boolean;
  ocrData?: IOCRExtraction;
  discrepancyFlags: IDiscrepancyFlag[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    fdrId: { type: Schema.Types.ObjectId, ref: 'FDR', default: null, index: true },
    documentType: {
      type: String,
      enum: [
        'FDR Certificate',
        'Bank Confirmation Letter',
        'Renewal Request Letter',
        'Refund Application',
        'Board Resolution',
        'Other',
      ],
      default: 'FDR Certificate',
    },
    storageKey: { type: String, required: true, unique: true },
    originalFilename: { type: String, required: true },
    contentType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    verificationStatus: {
      type: String,
      enum: ['Uploaded', 'Pending Verification', 'Verified', 'Rejected', 'Additional Information Required'],
      default: 'Uploaded',
      index: true,
    },
    verificationRemarks: { type: String, default: '' },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
    fileHash: { type: String, default: '', index: true },
    hashAlgorithm: { type: String, default: 'SHA-256' },
    hashTimestamp: { type: Date, default: Date.now },
    integritySignals: {
      isEncrypted: { type: Boolean, default: false },
      isSafePdf: { type: Boolean, default: true },
      pdfVersion: { type: String, default: '' },
      pageCount: { type: Number, default: 1 },
      producer: { type: String, default: '' },
      creator: { type: String, default: '' },
      structuralCheckPassed: { type: Boolean, default: true },
      remarks: { type: String, default: '' },
    },
    hashHistory: [
      {
        fileHash: { type: String, required: true },
        hashAlgorithm: { type: String, default: 'SHA-256' },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    ocrExtracted: { type: Boolean, default: false },
    ocrData: {
      fdrNumber: { type: String },
      bankName: { type: String },
      depositAmount: { type: Number },
      issueDate: { type: String },
      maturityDate: { type: String },
      rawText: { type: String },
      confidence: { type: Number, default: 0 },
    },
    discrepancyFlags: [
      {
        field: { type: String, required: true },
        expected: { type: Schema.Types.Mixed },
        found: { type: Schema.Types.Mixed },
        description: { type: String, required: true },
        severity: { type: String, enum: ['warning', 'error'], default: 'warning' },
      },
    ],
  },
  { timestamps: true }
);

export const AppDocument = mongoose.model<IDocument>('Document', DocumentSchema);
