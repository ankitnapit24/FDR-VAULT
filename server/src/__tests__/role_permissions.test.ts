import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/database.js';
import { seedDatabase } from '../utils/seedData.js';
import { FDR } from '../models/FDR.js';
import { Institution } from '../models/Institution.js';
import { Trust } from '../models/Trust.js';

let adminToken = '';
let officerToken = '';
let institutionToken = '';
let trusteeToken = '';

let delhiInstId = '';
let mumbaiInstId = '';
let delhiFdrId = '';
let mumbaiFdrId = '';
let delhiTrustId = '';
let southTrustId = '';

beforeAll(async () => {
  await connectDB();
  await seedDatabase();

  // Obtain tokens for all 4 roles
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

  const trusteeRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'trustee@delhitechnical.edu.in', password: 'Trust@123' });
  trusteeToken = trusteeRes.body.token;

  // Retrieve sample IDs for test isolation
  const instDelhi = await Institution.findOne({ institutionCode: 'AICTE-DL-1001' });
  delhiInstId = instDelhi!._id.toString();

  const instMumbai = await Institution.findOne({ institutionCode: 'AICTE-MH-2045' });
  mumbaiInstId = instMumbai!._id.toString();

  const fdrDelhi = await FDR.findOne({ institutionId: instDelhi!._id });
  delhiFdrId = fdrDelhi!._id.toString();

  const fdrMumbai = await FDR.findOne({ institutionId: instMumbai!._id });
  mumbaiFdrId = fdrMumbai!._id.toString();

  const trustDelhi = await Trust.findOne({ registrationNumber: 'TR-DEL-2002-9841' });
  delhiTrustId = trustDelhi!._id.toString();

  const trustSouth = await Trust.findOne({ registrationNumber: 'TR-KA-2006-5512' });
  southTrustId = trustSouth!._id.toString();
}, 60000);

afterAll(async () => {
  await disconnectDB();
}, 60000);

describe('Role 1: Admin Permissions & Authority', () => {
  it('Admin can access User Management (GET /api/users)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('Admin can access and modify System Settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const patchRes = await request(app)
      .patch('/api/settings/reminder_days')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ value: '45,30,15,7' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);
  });

  it('Admin can access Immutable Audit Trail & verify ledger integrity', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const integrityRes = await request(app)
      .get('/api/audit-logs/verify-integrity')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(integrityRes.status).toBe(200);
    expect(integrityRes.body.verification.isValid).toBe(true);
  });

  it('Admin can view all FDRs across any institution', async () => {
    const resDelhi = await request(app)
      .get(`/api/fdrs/${delhiFdrId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resDelhi.status).toBe(200);

    const resMumbai = await request(app)
      .get(`/api/fdrs/${mumbaiFdrId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resMumbai.status).toBe(200);
  });
});

describe('Role 2: AICTE Scrutiny Officer Permissions', () => {
  it('Officer can access Document Verification Queue & Bank Verification Hub', async () => {
    const queueRes = await request(app)
      .get('/api/documents/verification-queue')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(queueRes.status).toBe(200);
    expect(queueRes.body.success).toBe(true);

    const bankRes = await request(app)
      .get('/api/bank-verification')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(bankRes.status).toBe(200);
    expect(bankRes.body.success).toBe(true);
  });

  it('Officer can view System Settings (Read-Only)', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Officer CANNOT modify System Settings (403 Forbidden)', async () => {
    const res = await request(app)
      .patch('/api/settings/reminder_days')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ value: '60,30' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Officer CANNOT access User Management (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Officer CAN access Audit Ledger Integrity Check', async () => {
    const res = await request(app)
      .get('/api/audit-logs/verify-integrity')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.verification.isValid).toBe(true);
  });
});

describe('Role 3: Technical Institution User Permissions & Scoping', () => {
  it('Institution can view their own FDR record', async () => {
    const res = await request(app)
      .get(`/api/fdrs/${delhiFdrId}`)
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fdr.fdrNumber).toBeDefined();
  });

  it('Institution CANNOT access another institution FDR (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/fdrs/${mumbaiFdrId}`)
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Institution CANNOT access another institution profile directly (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/institutions/${mumbaiInstId}`)
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Institution CANNOT alter verification status of their own FDR (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/fdrs/${delhiFdrId}`)
      .set('Authorization', `Bearer ${institutionToken}`)
      .send({ verificationStatus: 'Verified' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Institution CANNOT access User Management, Settings, or Audit Logs (403 Forbidden)', async () => {
    const userRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(userRes.status).toBe(403);

    const settingRes = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(settingRes.status).toBe(403);

    const auditRes = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(auditRes.status).toBe(403);
  });

  it('Institution CANNOT access Scrutiny Queue or Bank Verification Hub (403 Forbidden)', async () => {
    const queueRes = await request(app)
      .get('/api/documents/verification-queue')
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(queueRes.status).toBe(403);

    const bankRes = await request(app)
      .get('/api/bank-verification')
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(bankRes.status).toBe(403);
  });

  it('Institution CANNOT access Trust Portfolios (403 Forbidden)', async () => {
    const trustRes = await request(app)
      .get('/api/trusts')
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(trustRes.status).toBe(403);
  });
});

describe('Role 4: Trustee User Permissions & Scoping', () => {
  it('Trustee can view their own trust exposure dossier', async () => {
    const res = await request(app)
      .get(`/api/trusts/${delhiTrustId}/exposure`)
      .set('Authorization', `Bearer ${trusteeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.exposure.trust.registrationNumber).toBe('TR-DEL-2002-9841');
  });

  it('Trustee CANNOT access another trust exposure dossier (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/trusts/${southTrustId}/exposure`)
      .set('Authorization', `Bearer ${trusteeToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Trustee can access FDR of institution belonging to their trust', async () => {
    const res = await request(app)
      .get(`/api/fdrs/${delhiFdrId}`)
      .set('Authorization', `Bearer ${trusteeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Trustee CANNOT access FDR of institution NOT belonging to their trust (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/fdrs/${mumbaiFdrId}`)
      .set('Authorization', `Bearer ${trusteeToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Trustee CANNOT access User Management, Settings, Audit Logs, or Scrutiny Queue (403 Forbidden)', async () => {
    const userRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${trusteeToken}`);
    expect(userRes.status).toBe(403);

    const settingRes = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${trusteeToken}`);
    expect(settingRes.status).toBe(403);

    const auditRes = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${trusteeToken}`);
    expect(auditRes.status).toBe(403);

    const queueRes = await request(app)
      .get('/api/documents/verification-queue')
      .set('Authorization', `Bearer ${trusteeToken}`);
    expect(queueRes.status).toBe(403);
  });

  it('Trustee CANNOT mutate FDR records directly (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/fdrs/${delhiFdrId}`)
      .set('Authorization', `Bearer ${trusteeToken}`)
      .send({ remarks: 'Unauthorized trustee overwrite attempt' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
