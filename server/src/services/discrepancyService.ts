import { IDiscrepancyFlag, IOCRExtraction } from '../models/Document.js';
import { IFDR } from '../models/FDR.js';

export function detectDiscrepancies(
  fdr: Partial<IFDR>,
  extracted: IOCRExtraction
): IDiscrepancyFlag[] {
  const flags: IDiscrepancyFlag[] = [];

  // 1. FDR Number check
  if (extracted.fdrNumber && fdr.fdrNumber) {
    const cleanExtracted = extracted.fdrNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const cleanEntered = fdr.fdrNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (cleanExtracted !== cleanEntered) {
      flags.push({
        field: 'fdrNumber',
        expected: fdr.fdrNumber,
        found: extracted.fdrNumber,
        description: `FDR Number mismatch: Entered '${fdr.fdrNumber}', but document contains '${extracted.fdrNumber}'.`,
        severity: 'error',
      });
    }
  }

  // 2. Deposit Amount check
  if (extracted.depositAmount && fdr.depositAmount !== undefined) {
    const diff = Math.abs(extracted.depositAmount - fdr.depositAmount);
    if (diff > 1.0) {
      flags.push({
        field: 'depositAmount',
        expected: fdr.depositAmount,
        found: extracted.depositAmount,
        description: `Deposit Amount discrepancy: Entered ₹${fdr.depositAmount.toLocaleString('en-IN')}, but document indicates ₹${extracted.depositAmount.toLocaleString('en-IN')}.`,
        severity: 'error',
      });
    }
  }

  // 3. Bank Name check
  if (extracted.bankName && fdr.bankName) {
    const cleanExtractedBank = extracted.bankName.toLowerCase().replace(/bank/g, '').trim();
    const cleanEnteredBank = fdr.bankName.toLowerCase().replace(/bank/g, '').trim();

    if (!cleanExtractedBank.includes(cleanEnteredBank) && !cleanEnteredBank.includes(cleanExtractedBank)) {
      flags.push({
        field: 'bankName',
        expected: fdr.bankName,
        found: extracted.bankName,
        description: `Bank Name difference: Entered '${fdr.bankName}', but document lists '${extracted.bankName}'.`,
        severity: 'warning',
      });
    }
  }

  return flags;
}
