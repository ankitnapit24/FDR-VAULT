import { FDR, IFDR } from '../models/FDR.js';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedFdrs: Array<{
    _id: string;
    fdrNumber: string;
    bankName: string;
    institutionId: string;
    depositAmount: number;
    currentStatus: string;
  }>;
  message: string;
}

export async function checkForDuplicateFDR(
  fdrNumber: string,
  bankName: string,
  excludeFdrId?: string
): Promise<DuplicateCheckResult> {
  const query: any = {
    fdrNumber: { $regex: new RegExp(`^${fdrNumber.trim()}$`, 'i') },
  };

  if (excludeFdrId) {
    query._id = { $ne: excludeFdrId };
  }

  const matches = await FDR.find(query).populate('institutionId', 'name institutionCode');

  if (matches.length === 0) {
    return {
      isDuplicate: false,
      matchedFdrs: [],
      message: 'No duplicate FDR records detected.',
    };
  }

  const isExactBankMatch = matches.some(
    m => m.bankName.toLowerCase().trim() === bankName.toLowerCase().trim()
  );

  return {
    isDuplicate: true,
    matchedFdrs: matches.map(m => ({
      _id: m._id.toString(),
      fdrNumber: m.fdrNumber,
      bankName: m.bankName,
      institutionId: (m.institutionId as any)?.name || m.institutionId?.toString(),
      depositAmount: m.depositAmount,
      currentStatus: m.currentStatus,
    })),
    message: isExactBankMatch
      ? `Potential duplicate found: An FDR with number ${fdrNumber} from ${bankName} is already recorded in the system.`
      : `Similar FDR number ${fdrNumber} found in another bank record. Review for uniqueness.`,
  };
}
