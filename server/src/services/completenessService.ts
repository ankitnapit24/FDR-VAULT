import { AppDocument } from '../models/Document.js';

export interface CompletenessResult {
  isComplete: boolean;
  score: number;
  presentDocumentTypes: string[];
  missingDocumentTypes: string[];
  unverifiedCount: number;
  discrepancyCount: number;
  checklistSummary: string;
}

const REQUIRED_DOC_TYPES = [
  'FDR Certificate',
  'Bank Confirmation Letter',
];

export async function checkFDRDocumentCompleteness(fdrId: string): Promise<CompletenessResult> {
  const documents = await AppDocument.find({ fdrId });

  const presentTypes = new Set<string>();
  let unverifiedCount = 0;
  let discrepancyCount = 0;

  for (const doc of documents) {
    presentTypes.add(doc.documentType);
    if (doc.verificationStatus === 'Uploaded' || doc.verificationStatus === 'Pending Verification') {
      unverifiedCount++;
    }
    if (doc.discrepancyFlags && doc.discrepancyFlags.length > 0) {
      discrepancyCount += doc.discrepancyFlags.length;
    }
  }

  const missingTypes: string[] = [];
  for (const reqType of REQUIRED_DOC_TYPES) {
    if (!presentTypes.has(reqType)) {
      missingTypes.push(reqType);
    }
  }

  const totalRequired = REQUIRED_DOC_TYPES.length;
  const fulfilledRequired = totalRequired - missingTypes.length;
  const score = Math.round((fulfilledRequired / totalRequired) * 100);
  const isComplete = missingTypes.length === 0;

  const checklistSummary = isComplete
    ? `All ${totalRequired} mandatory regulatory documents submitted.`
    : `Missing mandatory document(s): ${missingTypes.join(', ')}.`;

  return {
    isComplete,
    score,
    presentDocumentTypes: Array.from(presentTypes),
    missingDocumentTypes: missingTypes,
    unverifiedCount,
    discrepancyCount,
    checklistSummary,
  };
}
