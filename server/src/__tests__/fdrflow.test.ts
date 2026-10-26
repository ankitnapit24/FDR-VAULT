import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/database.js';
import { seedDatabase } from '../utils/seedData.js';

let adminToken = '';
let officerToken = '';
let institutionToken = '';

beforeAll(async () => {
  await connectDB();
  await seedDatabase();

  // Obtain tokens for tests
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
}, 60000);

afterAll(async () => {
  await disconnectDB();
}, 60000);

describe('1. Health Check & Public Endpoints', () => {
  it('GET /api/health returns 200 with AICTE details', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.problemStatementId).toBe(26265);
  });
});

describe('2. Authentication & Authorization', () => {
  it('Fails login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aicte.gov.in', password: 'WrongPassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me returns current authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('officer');
  });

  it('Rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/fdrs');
    expect(res.status).toBe(401);
  });
});

describe('3. Institution Isolation & Role-Based Access Control', () => {
  it('Officer can see all institutions', async () => {
    const res = await request(app)
      .get('/api/institutions')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.institutions.length).toBeGreaterThanOrEqual(4);
  });

  it('Institution user can only see their assigned institution profile', async () => {
    const res = await request(app)
      .get('/api/institutions')
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(res.status).toBe(200);
    expect(res.body.institutions.length).toBe(1);
    expect(res.body.institutions[0].institutionCode).toBe('AICTE-DL-1001');
  });

  it('Prevents regular institution user from accessing admin user management', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${institutionToken}`);
    expect(res.status).toBe(403);
  });
});

describe('4. FDR Record Management & Scrutiny', () => {
  it('GET /api/fdrs returns FDR records with priority scores', async () => {
    const res = await request(app)
      .get('/api/fdrs')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.fdrs.length).toBeGreaterThan(0);
    expect(res.body.fdrs[0]).toHaveProperty('priorityScore');
    expect(res.body.fdrs[0]).toHaveProperty('priorityReason');
  });

  it('Officer records scrutiny observation on an FDR', async () => {
    const listRes = await request(app)
      .get('/api/fdrs')
      .set('Authorization', `Bearer ${officerToken}`);
    const fdrId = listRes.body.fdrs[0]._id;

    const res = await request(app)
      .post(`/api/fdrs/${fdrId}/observations`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        observation: 'Regulatory inspection complete. Joint lien verified with SBI branch manager.',
        verificationStatus: 'Verified',
      });

    expect(res.status).toBe(200);
    expect(res.body.fdr.verificationStatus).toBe('Verified');
    expect(res.body.fdr.scrutinyObservations.length).toBeGreaterThan(0);
  });

  it('Rejects duplicate FDR registration attempt', async () => {
    const res = await request(app)
      .post('/api/fdrs')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        institutionId: '65f000000000000000000001',
        fdrNumber: 'SBIN-2023-908124',
        bankName: 'State Bank of India',
        depositAmount: 3500000,
        issueDate: '2023-08-15',
        maturityDate: '2028-08-15',
      });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('5. AI OCR Extraction & Discrepancy Detection', () => {
  it('POST /api/ai/check-discrepancies flags amount mismatch', async () => {
    const res = await request(app)
      .post('/api/ai/check-discrepancies')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        fdrData: {
          fdrNumber: 'PNB-998811',
          bankName: 'Punjab National Bank',
          depositAmount: 5000000,
        },
        extractedData: {
          fdrNumber: 'PNB-998811',
          bankName: 'Punjab National Bank',
          depositAmount: 4500000, // mismatch
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.hasDiscrepancies).toBe(true);
    expect(res.body.discrepancies[0].field).toBe('depositAmount');
  });

  it('POST /api/ai/extract-fdr parses text-based FDR receipt', async () => {
    const sampleText = `
      STATE BANK OF INDIA
      TERM DEPOSIT RECEIPT
      FDR No: SBIN-2025-998877
      Deposit Amount: Rs. 25,00,000.00
      Date of Issue: 10/02/2025
      Date of Maturity: 10/02/2030
      Jointly held with Regional Officer, AICTE
    `;

    const res = await request(app)
      .post('/api/ai/extract-fdr')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ text: sampleText });

    expect(res.status).toBe(200);
    expect(res.body.extraction.fdrNumber).toBe('SBIN-2025-998877');
    expect(res.body.extraction.bankName).toBe('State Bank of India');
    expect(res.body.extraction.depositAmount).toBe(2500000);
  });
});

describe('6. Dashboard & Audit Logs', () => {
  it('GET /api/dashboard/summary returns database metrics', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics).toHaveProperty('totalFdrs');
    expect(res.body.metrics).toHaveProperty('totalDepositAmount');
    expect(res.body.metrics.totalDepositAmount).toBeGreaterThan(0);
    expect(res.body.upcomingMaturities).toBeInstanceOf(Array);
  });

  it('GET /api/audit-logs returns immutable activity history', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeGreaterThan(0);
    expect(res.body.logs[0]).toHaveProperty('action');
    expect(res.body.logs[0]).toHaveProperty('timestamp');
  });
});
