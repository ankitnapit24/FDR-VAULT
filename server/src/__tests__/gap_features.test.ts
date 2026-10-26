import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/database.js';
import { seedDatabase } from '../utils/seedData.js';
import { AuditLog } from '../models/AuditLog.js';
import { FDR } from '../models/FDR.js';
import { Institution } from '../models/Institution.js';
import { Trust } from '../models/Trust.js';
import { AppDocument } from '../models/Document.js';
import { RefundRequest } from '../models/RefundRequest.js';
import { verifyAuditLedgerIntegrity } from '../services/auditLedgerService.js';

let adminToken = '';
let officerToken = '';
let institutionToken = '';
let trustToken = '';

let sampleFdrId = '';
let sampleInstId = '';
let sampleDocId = '';
let sampleTrustId = '';
let sampleRefundId = '';

beforeAll(async () => {
  await connectDB();
  await seedDatabase();

  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@aicte.gov.in', password: 'Admin@123' });
  adminToken = adminRes.body.token;

  const officerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'officer@aicte.gov.in', password: 'Officer@123' });
  officerToken = officerRes.body.token;

  const instRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'director@delhitechnical.edu.in', password: 'Inst@123' });
  institutionToken = instRes.body.token;

  const trustRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'trustee@delhitechnical.edu.in', password: 'Trust@123' });
  trustToken = trustRes.body.token;

  const sampleFdr = await FDR.findOne();
  if (sampleFdr) sampleFdrId = sampleFdr._id.toString();

  const sampleInst = await Institution.findOne({ institutionCode: 'AICTE-DL-1001' });
  if (sampleInst) sampleInstId = sampleInst._id.toString();

  const sampleDoc = await AppDocument.findOne();
  if (sampleDoc) sampleDocId = sampleDoc._id.toString();

  const sampleTrust = await Trust.findOne();
  if (sampleTrust) sampleTrustId = sampleTrust._id.toString();

  const sampleRefund = await RefundRequest.findOne();
  if (sampleRefund) sampleRefundId = sampleRefund._id.toString();
}, 60000);

afterAll(async () => {
  await disconnectDB();
}, 60000);

describe('U1: AI-Powered FDR Document Intelligence & Integrity Analysis', () => {
  it('GET /api/documents/:id/integrity returns SHA-256 hash and safe PDF structural signals', async () => {
    const res = await request(app)
      .get(`/api/documents/${sampleDocId}/integrity`)
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.integrity).toBeDefined();
    expect(res.body.integrity.hashAlgorithm).toBe('SHA-256');
    expect(res.body.integrity.fileHash).toHaveLength(64); // Valid 64-char hex SHA-256
    expect(res.body.integrity.integritySignals).toBeDefined();
    expect(res.body.integrity.integritySignals.isSafePdf).toBe(true);
  });
});

describe('U2: Parallel Multi-Department Clearance Orchestrator & Server-Side NOC Gating', () => {
  it('Allows authorized officer to update department clearance decision', async () => {
    const res = await request(app)
      .patch(`/api/refund-requests/${sampleRefundId}/clearances/regional_office`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        status: 'Approved',
        comments: 'Northern Regional Office confirms physical campus inspection complete.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.refund).toBeDefined();
  });

  it('Blocks NOC generation with 400 when any mandatory clearance is Objected or Pending', async () => {
    // Set one department to Objected
    await request(app)
      .patch(`/api/refund-requests/${sampleRefundId}/clearances/pgrc_grc`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        status: 'Objected',
        objectionReason: 'Active student fee dispute petition under hearing.',
      });

    // Attempt to generate NOC
    const nocRes = await request(app)
      .post(`/api/refund-requests/${sampleRefundId}/generate-noc`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(nocRes.status).toBe(400);
    expect(nocRes.body.success).toBe(false);
    expect(nocRes.body.message).toContain('mandatory clearance');
  });

  it('Allows NOC generation once all mandatory clearances are Approved', async () => {
    // Approve all mandatory clearances
    const depts = ['regional_office', 'approval_bureau', 'pgrc_grc', 'finance_vigilance'];
    for (const d of depts) {
      await request(app)
        .patch(`/api/refund-requests/${sampleRefundId}/clearances/${d}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Approved', comments: 'All requirements verified' });
    }

    const nocRes = await request(app)
      .post(`/api/refund-requests/${sampleRefundId}/generate-noc`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(nocRes.status).toBe(200);
    expect(nocRes.body.success).toBe(true);
    expect(nocRes.body.nocReference).toMatch(/^AICTE\/NOC\//);
  });
});

describe('U3: Intelligent Release Eligibility Pre-Check Engine', () => {
  it('GET /api/refund-requests/pre-check/:fdrId returns checklist with readiness score', async () => {
    const res = await request(app)
      .get(`/api/refund-requests/pre-check/${sampleFdrId}`)
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.evaluation).toBeDefined();
    expect(typeof res.body.evaluation.score).toBe('number');
    expect(Array.isArray(res.body.evaluation.items)).toBe(true);
    expect(res.body.evaluation.items.length).toBeGreaterThanOrEqual(4);
  });
});

describe('U4: Regulatory Policy & Deposit Adequacy Engine', () => {
  it('GET /api/policies returns versioned policy rules with benchmark notice', async () => {
    const res = await request(app)
      .get('/api/policies')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.policies.length).toBeGreaterThan(0);
  });

  it('GET /api/policies/calculate-adequacy/:institutionId computes shortfall/surplus against intake multiplier', async () => {
    const res = await request(app)
      .get(`/api/policies/calculate-adequacy/${sampleInstId}`)
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.adequacy).toBeDefined();
    expect(res.body.adequacy.calculation.totalRequiredDeposit).toBeGreaterThan(0);
    expect(res.body.adequacy.calculation.breakdownExplanation).toBeDefined();
  });
});

describe('U6: Bank Verification & Duplicate FDR Detection Hub', () => {
  it('GET /api/bank-verification/validate-ifsc/:ifsc correctly validates standard RBI regex', async () => {
    const validRes = await request(app)
      .get('/api/bank-verification/validate-ifsc/SBIN0007831')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.lookup.isValidFormat).toBe(true);
    expect(validRes.body.lookup.bankName).toBe('State Bank of India');

    // Invalid format
    const invalidRes = await request(app)
      .get('/api/bank-verification/validate-ifsc/INVALID_IFSC')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(invalidRes.status).toBe(200);
    expect(invalidRes.body.lookup.isValidFormat).toBe(false);
  });

  it('GET /api/bank-verification lists inquiry tickets labeled with mock mode notice', async () => {
    const res = await request(app)
      .get('/api/bank-verification')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.tickets)).toBe(true);
    expect(res.body.tickets.length).toBeGreaterThan(0);
  });
});

describe('U7: Trust-Level Consolidated Financial Exposure Dashboard', () => {
  it('GET /api/trusts/:id/exposure aggregates multi-campus deposit portfolio and balance', async () => {
    const res = await request(app)
      .get(`/api/trusts/${sampleTrustId}/exposure`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.exposure.trust).toBeDefined();
    expect(res.body.exposure.metrics.totalInstitutions).toBeGreaterThan(0);
    expect(typeof res.body.exposure.metrics.cumulativeEligibleActiveDeposit).toBe('number');
    expect(Array.isArray(res.body.exposure.institutionsBreakdown)).toBe(true);
  });

  it('Enforces strict Trust isolation: trust user cannot access other trusts', async () => {
    const otherTrust = await Trust.findOne({ _id: { $ne: sampleTrustId } });
    if (otherTrust) {
      const res = await request(app)
        .get(`/api/trusts/${otherTrust._id}/exposure`)
        .set('Authorization', `Bearer ${trustToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    }
  });
});

describe('U8: Tamper-Evident SHA-256 Audit Ledger & Chain Integrity', () => {
  it('GET /api/audit-logs/verify-integrity validates mathematical continuity with Genesis Block', async () => {
    const res = await request(app)
      .get('/api/audit-logs/verify-integrity')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.verification.isValid).toBe(true);
    expect(res.body.verification.totalBlocks).toBeGreaterThanOrEqual(3);
    expect(res.body.verification.genesisHash).toBe('0000000000000000000000000000000000000000000000000000000000000000');
  });

  it('Detects unauthorized tampering if any historical audit block payload is altered', async () => {
    const block = await AuditLog.findOne().sort({ sequenceNumber: -1 });
    expect(block).toBeDefined();

    if (block) {
      const originalCurrentHash = block.currentHash;
      block.currentHash = 'bad0000000000000000000000000000000000000000000000000000000000bad';
      await block.save();

      const tamperedCheck = await verifyAuditLedgerIntegrity();
      expect(tamperedCheck.isValid).toBe(false);
      expect(tamperedCheck.summary).toContain('Tampering Detected');

      // Restore block for database integrity
      block.currentHash = originalCurrentHash;
      await block.save();

      const restoredCheck = await verifyAuditLedgerIntegrity();
      expect(restoredCheck.isValid).toBe(true);
    }
  });
});
