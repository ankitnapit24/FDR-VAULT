import crypto from 'crypto';
import { AuditLog, IAuditLog } from '../models/AuditLog.js';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function canonicalize(data: any): string {
  if (data === null || data === undefined) return '';
  if (typeof data !== 'object') return String(data);
  if (data instanceof Date) return data.toISOString();
  if (Array.isArray(data)) return `[${data.map(canonicalize).join(',')}]`;
  
  const sortedKeys = Object.keys(data).sort();
  const pairs = sortedKeys.map(k => `"${k}":${canonicalize(data[k])}`);
  return `{${pairs.join(',')}}`;
}

export function computeBlockHash(previousHash: string, sequenceNumber: number, canonicalData: string): string {
  return crypto
    .createHash('sha256')
    .update(`${previousHash}|${sequenceNumber}|${canonicalData}`)
    .digest('hex');
}

export interface CreateAuditBlockParams {
  actorId?: any;
  actorName?: string;
  actorRole?: string;
  action: string;
  entityType: 'FDR' | 'Document' | 'Institution' | 'RenewalRequest' | 'RefundRequest' | 'User' | 'SystemSetting' | 'Trust' | 'PolicyRule' | 'BankVerification';
  entityId: string;
  institutionId?: any;
  previousValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function appendAuditBlock(params: CreateAuditBlockParams): Promise<IAuditLog> {
  // Find highest current sequence number to ensure hash continuity
  const lastBlock = await AuditLog.findOne().sort({ sequenceNumber: -1 });

  const sequenceNumber = lastBlock ? lastBlock.sequenceNumber + 1 : 1;
  const previousHash = lastBlock ? lastBlock.currentHash : GENESIS_HASH;

  const eventPayload = {
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    actorName: params.actorName || 'System',
    actorRole: params.actorRole || 'System',
    institutionId: params.institutionId ? params.institutionId.toString() : null,
    previousValues: params.previousValues || null,
    newValues: params.newValues || null,
    timestamp: new Date().toISOString(),
  };

  const canonicalData = canonicalize(eventPayload);
  const currentHash = computeBlockHash(previousHash, sequenceNumber, canonicalData);

  const newLog = await AuditLog.create({
    sequenceNumber,
    actorId: params.actorId || null,
    actorName: params.actorName || 'System',
    actorRole: params.actorRole || 'System',
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    institutionId: params.institutionId || null,
    previousValues: params.previousValues || null,
    newValues: params.newValues || null,
    ipAddress: params.ipAddress || '',
    userAgent: params.userAgent || '',
    canonicalData,
    previousHash,
    currentHash,
    timestamp: new Date(),
  });

  return newLog;
}

export interface AuditVerificationResult {
  isValid: boolean;
  totalBlocks: number;
  genesisHash: string;
  verifiedAt: Date;
  brokenBlock?: {
    sequenceNumber: number;
    action: string;
    expectedPreviousHash: string;
    recordedPreviousHash: string;
    expectedCurrentHash: string;
    recordedCurrentHash: string;
  };
  summary: string;
}

export async function verifyAuditLedgerIntegrity(): Promise<AuditVerificationResult> {
  const allBlocks = await AuditLog.find().sort({ sequenceNumber: 1 });

  if (allBlocks.length === 0) {
    return {
      isValid: true,
      totalBlocks: 0,
      genesisHash: GENESIS_HASH,
      verifiedAt: new Date(),
      summary: 'Audit ledger is empty. Chain is intact.',
    };
  }

  let expectedPreviousHash = GENESIS_HASH;

  for (const block of allBlocks) {
    // 1. Verify previous hash pointer
    if (block.previousHash !== expectedPreviousHash) {
      return {
        isValid: false,
        totalBlocks: allBlocks.length,
        genesisHash: GENESIS_HASH,
        verifiedAt: new Date(),
        brokenBlock: {
          sequenceNumber: block.sequenceNumber,
          action: block.action,
          expectedPreviousHash,
          recordedPreviousHash: block.previousHash,
          expectedCurrentHash: '',
          recordedCurrentHash: block.currentHash,
        },
        summary: `Tampering Detected: Block #${block.sequenceNumber} has broken pointer to previous hash.`,
      };
    }

    // 2. Recompute current hash
    const recomputedHash = computeBlockHash(block.previousHash, block.sequenceNumber, block.canonicalData);
    if (recomputedHash !== block.currentHash) {
      return {
        isValid: false,
        totalBlocks: allBlocks.length,
        genesisHash: GENESIS_HASH,
        verifiedAt: new Date(),
        brokenBlock: {
          sequenceNumber: block.sequenceNumber,
          action: block.action,
          expectedPreviousHash: block.previousHash,
          recordedPreviousHash: block.previousHash,
          expectedCurrentHash: recomputedHash,
          recordedCurrentHash: block.currentHash,
        },
        summary: `Tampering Detected: Payload signature mismatch at block #${block.sequenceNumber}. Stored hash does not match recomputed SHA-256 digest.`,
      };
    }

    expectedPreviousHash = block.currentHash;
  }

  return {
    isValid: true,
    totalBlocks: allBlocks.length,
    genesisHash: GENESIS_HASH,
    verifiedAt: new Date(),
    summary: `Cryptographic audit ledger verified successfully: ${allBlocks.length} sequential blocks validated from Genesis.`,
  };
}
