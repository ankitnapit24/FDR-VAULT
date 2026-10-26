import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { connectDB, disconnectDB } from '../config/database.js';
import { User } from '../models/User.js';
import { Institution } from '../models/Institution.js';
import { Trust } from '../models/Trust.js';
import { PolicyRule } from '../models/PolicyRule.js';
import { BankVerificationRequest } from '../models/BankVerificationRequest.js';
import { FDR } from '../models/FDR.js';
import { AppDocument } from '../models/Document.js';
import { RenewalRequest } from '../models/RenewalRequest.js';
import { RefundRequest } from '../models/RefundRequest.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { calculateFDRPriority } from '../services/prioritizationService.js';
import { appendAuditBlock } from '../services/auditLedgerService.js';
import { getDefaultClearances } from '../services/clearanceService.js';

export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Starting FDR Vault database seeding...');
  await connectDB();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Institution.deleteMany({}),
    Trust.deleteMany({}),
    PolicyRule.deleteMany({}),
    BankVerificationRequest.deleteMany({}),
    FDR.deleteMany({}),
    AppDocument.deleteMany({}),
    RenewalRequest.deleteMany({}),
    RefundRequest.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    SystemSetting.deleteMany({}),
  ]);
  console.log('[Seed] Cleared existing records.');

  // 1. Create Sample Educational Trusts (U7: Trust Consolidation)
  const trustDelhi = await Trust.create({
    trustName: 'Delhi Technical & Higher Education Society',
    registrationNumber: 'TR-DEL-2002-9841',
    panNumber: 'AAATD1234F',
    chairmanName: 'Er. Ravinder Gupta',
    contactEmail: 'trust.delhi@aicte-demo.gov.in',
    contactPhone: '+91 11 2789 9900',
    registeredAddress: {
      street: '12 Institutional Area, Outer Ring Road',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110085',
    },
    institutionIds: [],
  });

  const trustSouth = await Trust.create({
    trustName: 'Deccan Educational & Research Consortium',
    registrationNumber: 'TR-KA-2006-5512',
    panNumber: 'AAATD5678K',
    chairmanName: 'Dr. K. S. Venkatesh',
    contactEmail: 'trust.deccan@aicte-demo.gov.in',
    contactPhone: '+91 80 2658 8800',
    registeredAddress: {
      street: '74 J.P. Nagar 4th Phase',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560078',
    },
    institutionIds: [],
  });

  // 2. Create Institutions
  const instDelhi = await Institution.create({
    institutionCode: 'AICTE-DL-1001',
    name: 'Delhi Institute of Advanced Engineering & Technology',
    type: 'Engineering',
    trustId: trustDelhi._id,
    address: {
      street: '12 Sector 14, Institutional Area, Rohini',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110085',
    },
    contactEmail: 'director@delhitechnical.edu.in',
    contactPhone: '+91 11 2789 4400',
    status: 'Active',
    approvedIntake: 720,
    establishedYear: 2004,
  });

  const instMumbai = await Institution.create({
    institutionCode: 'AICTE-MH-2045',
    name: 'Mumbai Central Polytechnic & Technical Institute',
    type: 'Polytechnic',
    address: {
      street: '45 Veer Savarkar Marg, Mahim West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400016',
    },
    contactEmail: 'principal@mumbaipoly.edu.in',
    contactPhone: '+91 22 2445 8890',
    status: 'Active',
    approvedIntake: 480,
    establishedYear: 2011,
  });

  const instBangalore = await Institution.create({
    institutionCode: 'AICTE-KA-3088',
    name: 'Bangalore National Academy of Management & Technology',
    type: 'Management',
    trustId: trustSouth._id,
    address: {
      street: '88 Bannerghatta Main Road, Hulimavu',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560076',
    },
    contactEmail: 'registrar@bengalurumgmt.ac.in',
    contactPhone: '+91 80 2658 9100',
    status: 'Active',
    approvedIntake: 300,
    establishedYear: 2008,
  });

  const instChennai = await Institution.create({
    institutionCode: 'AICTE-TN-4112',
    name: 'Chennai College of Pharmacy & Clinical Sciences',
    type: 'Pharmacy',
    trustId: trustSouth._id,
    address: {
      street: '22 Velachery High Road, Guindy',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600032',
    },
    contactEmail: 'admin@chennaipharmacy.edu.in',
    contactPhone: '+91 44 2235 6700',
    status: 'Active',
    approvedIntake: 180,
    establishedYear: 2015,
  });

  trustDelhi.institutionIds = [instDelhi._id];
  await trustDelhi.save();

  trustSouth.institutionIds = [instBangalore._id, instChennai._id];
  await trustSouth.save();

  console.log('[Seed] Created sample educational trusts and technical institutions.');

  // 2. Create Users
  const adminPass = await bcrypt.hash('Admin@123', 10);
  const officerPass = await bcrypt.hash('Officer@123', 10);
  const instPass = await bcrypt.hash('Inst@123', 10);

  const adminUser = await User.create({
    name: 'Dr. Ramesh Chandra (AICTE Admin)',
    email: 'admin@aicte.gov.in',
    passwordHash: adminPass,
    role: 'admin',
    designation: 'Director (Approval Bureau)',
    phone: '+91 11 2958 1000',
    isActive: true,
  });

  const officerUser = await User.create({
    name: 'Smt. Priya Sharma (Scrutiny Officer)',
    email: 'officer@aicte.gov.in',
    passwordHash: officerPass,
    role: 'officer',
    designation: 'Regional Scrutiny Officer, Northern Region',
    phone: '+91 11 2958 1024',
    isActive: true,
  });

  const instUser1 = await User.create({
    name: 'Prof. Arvind Saxena',
    email: 'director@delhitechnical.edu.in',
    passwordHash: instPass,
    role: 'institution',
    institutionId: instDelhi._id,
    designation: 'Director, Delhi Institute of Advanced Engineering',
    phone: '+91 98110 54321',
    isActive: true,
  });

  const instUser2 = await User.create({
    name: 'Dr. Sunita Kulkarni',
    email: 'principal@mumbaipoly.edu.in',
    passwordHash: instPass,
    role: 'institution',
    institutionId: instMumbai._id,
    designation: 'Principal, Mumbai Central Polytechnic',
    phone: '+91 98220 87654',
    isActive: true,
  });

  const trustPass = await bcrypt.hash('Trust@123', 10);
  const trustUser1 = await User.create({
    name: 'Er. Ravinder Gupta (Trust Chairman)',
    email: 'trustee@delhitechnical.edu.in',
    passwordHash: trustPass,
    role: 'trust',
    trustId: trustDelhi._id,
    designation: 'Managing Trustee, Delhi Technical & Higher Education Society',
    phone: '+91 98100 11223',
    isActive: true,
  });

  const trustUser2 = await User.create({
    name: 'Dr. K. Swaminathan (South Trust President)',
    email: 'trustee.south@southtrust.org',
    passwordHash: trustPass,
    role: 'trust',
    trustId: trustSouth._id,
    designation: 'Trust President, South India Educational & Research Foundation',
    phone: '+91 94440 33445',
    isActive: true,
  });

  console.log('[Seed] Created demo users with roles Admin, Officer, Institution, and Trust.');

  // 3. Create Sample FDRs
  const now = new Date();

  // FDR 1: Active, Healthy (Delhi)
  const fdr1 = new FDR({
    institutionId: instDelhi._id,
    fdrNumber: 'SBIN-2023-908124',
    bankName: 'State Bank of India',
    branchName: 'CGO Complex Branch, New Delhi',
    ifscCode: 'SBIN0007831',
    depositAmount: 3500000, // 35 Lakhs
    issueDate: new Date('2023-08-15'),
    maturityDate: new Date('2028-08-15'), // 2+ years ahead
    tenureMonths: 60,
    interestRate: 6.8,
    jointHolderName: 'Regional Officer, AICTE & Principal',
    verificationStatus: 'Verified',
    currentStatus: 'Active',
    renewalStatus: 'Not Applicable',
    remarks: 'Original security deposit for UG B.Tech Programs.',
  });
  fdr1.priorityScore = calculateFDRPriority(fdr1).score;
  fdr1.priorityReason = calculateFDRPriority(fdr1).reason;
  await fdr1.save();

  // FDR 2: Expiring Soon in 12 days (Delhi)
  const dateIn12Days = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
  const fdr2 = new FDR({
    institutionId: instDelhi._id,
    fdrNumber: 'PNB-2018-774129',
    bankName: 'Punjab National Bank',
    branchName: 'Rohini Sector 14, Delhi',
    ifscCode: 'PUNB0123400',
    depositAmount: 1500000, // 15 Lakhs
    issueDate: new Date(dateIn12Days.getTime() - 5 * 365 * 24 * 60 * 60 * 1000),
    maturityDate: dateIn12Days,
    tenureMonths: 60,
    interestRate: 7.1,
    jointHolderName: 'Regional Officer, AICTE & Principal',
    verificationStatus: 'Verified',
    currentStatus: 'Expiring Soon',
    renewalStatus: 'Renewal Requested',
    remarks: 'Security deposit for Master of Computer Applications (MCA).',
  });
  fdr2.priorityScore = calculateFDRPriority(fdr2).score;
  fdr2.priorityReason = calculateFDRPriority(fdr2).reason;
  await fdr2.save();

  // FDR 3: Matured 6 days ago, Pending Renewal (Mumbai)
  const date6DaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const fdr3 = new FDR({
    institutionId: instMumbai._id,
    fdrNumber: 'BOB-2019-332910',
    bankName: 'Bank of Baroda',
    branchName: 'Dadar West Branch, Mumbai',
    ifscCode: 'BARB0DADARX',
    depositAmount: 2000000, // 20 Lakhs
    issueDate: new Date(date6DaysAgo.getTime() - 5 * 365 * 24 * 60 * 60 * 1000),
    maturityDate: date6DaysAgo,
    tenureMonths: 60,
    interestRate: 6.9,
    jointHolderName: 'Regional Officer, AICTE & Principal',
    verificationStatus: 'Verified',
    currentStatus: 'Matured',
    renewalStatus: 'Renewal Pending',
    remarks: 'Security deposit for Mechanical and Civil Diploma wings.',
  });
  fdr3.priorityScore = calculateFDRPriority(fdr3).score;
  fdr3.priorityReason = calculateFDRPriority(fdr3).reason;
  await fdr3.save();

  // FDR 4: Pending Verification & Discrepancy Flag (Bangalore)
  const fdr4 = new FDR({
    institutionId: instBangalore._id,
    fdrNumber: 'CAN-2024-554210',
    bankName: 'Canara Bank',
    branchName: 'Jayanagar 4th Block, Bengaluru',
    ifscCode: 'CNRB0001045',
    depositAmount: 2500000,
    issueDate: new Date('2024-01-10'),
    maturityDate: new Date('2029-01-10'),
    tenureMonths: 60,
    interestRate: 6.75,
    jointHolderName: 'Regional Officer, AICTE & Principal',
    verificationStatus: 'Under Scrutiny',
    currentStatus: 'Active',
    renewalStatus: 'Not Applicable',
    remarks: 'Deposit for New PGDM Specialization batch.',
  });
  fdr4.priorityScore = calculateFDRPriority(fdr4, false, true).score;
  fdr4.priorityReason = 'High Priority — Document discrepancy detected; Verification is pending review.';
  await fdr4.save();

  // FDR 5: Previous Original FDR (Chennai) that was renewed
  const fdr5Old = await FDR.create({
    institutionId: instChennai._id,
    fdrNumber: 'HDFC-2019-118832',
    bankName: 'HDFC Bank',
    branchName: 'Guindy Industrial Estate, Chennai',
    ifscCode: 'HDFC0000124',
    depositAmount: 1800000,
    issueDate: new Date('2019-03-20'),
    maturityDate: new Date('2024-03-20'),
    tenureMonths: 60,
    interestRate: 7.0,
    jointHolderName: 'Regional Officer, AICTE & Principal',
    verificationStatus: 'Verified',
    currentStatus: 'Renewed',
    renewalStatus: 'Renewed',
    remarks: 'Original deposit replaced upon tenure completion.',
  });

  // FDR 6: Replacement Active FDR (Chennai)
  const fdr6New = new FDR({
    institutionId: instChennai._id,
    fdrNumber: 'HDFC-2024-990145',
    bankName: 'HDFC Bank',
    branchName: 'Guindy Industrial Estate, Chennai',
    ifscCode: 'HDFC0000124',
    depositAmount: 1800000,
    issueDate: new Date('2024-03-21'),
    maturityDate: new Date('2029-03-21'),
    tenureMonths: 60,
    interestRate: 7.25,
    jointHolderName: 'Regional Officer, AICTE & Principal',
    verificationStatus: 'Verified',
    currentStatus: 'Active',
    renewalStatus: 'Not Applicable',
    previousFdrId: fdr5Old._id,
    remarks: 'Rollover renewal of HDFC-2019-118832.',
  });
  fdr6New.priorityScore = calculateFDRPriority(fdr6New).score;
  fdr6New.priorityReason = calculateFDRPriority(fdr6New).reason;
  await fdr6New.save();

  // Link replacement ID to old FDR
  fdr5Old.replacementFdrId = fdr6New._id;
  await fdr5Old.save();

  // FDR 7: Released FDR (Mumbai)
  const fdr7Released = await FDR.create({
    institutionId: instMumbai._id,
    fdrNumber: 'ICIC-2018-442190',
    bankName: 'ICICI Bank',
    branchName: 'Bandra Kurla Complex, Mumbai',
    ifscCode: 'ICIC0000004',
    depositAmount: 1000000,
    issueDate: new Date('2018-05-10'),
    maturityDate: new Date('2023-05-10'),
    tenureMonths: 60,
    interestRate: 6.9,
    jointHolderName: 'Regional Officer, AICTE & Principal',
    verificationStatus: 'Verified',
    currentStatus: 'Released',
    renewalStatus: 'Not Applicable',
    remarks: 'Discharged following regulatory program closure approval.',
  });

  console.log('[Seed] Created diverse FDR lifecycle records.');

  // 4. Create Sample Documents with Hash Integrity (U1)
  const doc1 = await AppDocument.create({
    institutionId: instDelhi._id,
    fdrId: fdr1._id,
    documentType: 'FDR Certificate',
    storageKey: 'seed_sbi_fdr_cert.pdf',
    originalFilename: 'SBI_FDR_35Lakhs_Certificate.pdf',
    contentType: 'application/pdf',
    fileSize: 428000,
    fileHash: crypto.createHash('sha256').update('seed_sbi_fdr_cert.pdf_mock_content').digest('hex'),
    hashAlgorithm: 'SHA-256',
    integritySignals: {
      isSafePdf: true,
      hasJavascript: false,
      hasSuspiciousActions: false,
      producer: 'AICTE Secure Ingestion Gateway v1.0',
      pageCount: 2,
    },
    uploadedBy: instUser1._id,
    verificationStatus: 'Verified',
    verificationRemarks: 'Scrutinized against bank confirmation. Instrument valid and lien marked in AICTE favour.',
    verifiedBy: officerUser._id,
    verifiedAt: new Date(),
    ocrExtracted: true,
    ocrData: {
      fdrNumber: 'SBIN-2023-908124',
      bankName: 'State Bank of India',
      depositAmount: 3500000,
      issueDate: '15/08/2023',
      maturityDate: '15/08/2028',
      confidence: 0.96,
    },
    discrepancyFlags: [],
  });

  const doc2 = await AppDocument.create({
    institutionId: instBangalore._id,
    fdrId: fdr4._id,
    documentType: 'FDR Certificate',
    storageKey: 'seed_canara_fdr_cert.pdf',
    originalFilename: 'Canara_Fixed_Deposit_Receipt.pdf',
    contentType: 'application/pdf',
    fileSize: 512000,
    fileHash: crypto.createHash('sha256').update('seed_canara_fdr_cert.pdf_mock_content').digest('hex'),
    hashAlgorithm: 'SHA-256',
    integritySignals: {
      isSafePdf: true,
      hasJavascript: false,
      hasSuspiciousActions: false,
      producer: 'Canara Bank E-Receipt Engine',
      pageCount: 1,
    },
    uploadedBy: adminUser._id,
    verificationStatus: 'Pending Verification',
    verificationRemarks: '',
    ocrExtracted: true,
    ocrData: {
      fdrNumber: 'CAN-2024-554210',
      bankName: 'Canara Bank',
      depositAmount: 2400000, // Discrepancy: Entered 25 Lakhs, document says 24 Lakhs
      issueDate: '10/01/2024',
      maturityDate: '10/01/2029',
      confidence: 0.89,
    },
    discrepancyFlags: [
      {
        field: 'depositAmount',
        expected: 2500000,
        found: 2400000,
        description: 'Deposit Amount discrepancy: Entered ₹25,00,000, but document indicates ₹24,00,000.',
        severity: 'error',
      },
    ],
  });

  const doc3 = await AppDocument.create({
    institutionId: instDelhi._id,
    fdrId: fdr2._id,
    documentType: 'Bank Confirmation Letter',
    storageKey: 'seed_pnb_bank_letter.pdf',
    originalFilename: 'PNB_Bank_Lien_Confirmation.pdf',
    contentType: 'application/pdf',
    fileSize: 280000,
    fileHash: crypto.createHash('sha256').update('seed_pnb_bank_letter.pdf_mock_content').digest('hex'),
    hashAlgorithm: 'SHA-256',
    integritySignals: {
      isSafePdf: true,
      hasJavascript: false,
      hasSuspiciousActions: false,
      producer: 'PNB Branch Document System',
      pageCount: 1,
    },
    uploadedBy: instUser1._id,
    verificationStatus: 'Verified',
    verificationRemarks: 'Bank confirms lien marked in favour of AICTE Regional Officer.',
    verifiedBy: officerUser._id,
    verifiedAt: new Date(),
    ocrExtracted: true,
    ocrData: {
      fdrNumber: 'PNB-2018-774129',
      bankName: 'Punjab National Bank',
      depositAmount: 1500000,
      confidence: 0.94,
    },
  });

  console.log('[Seed] Created sample documents with OCR extraction and discrepancy detection.');

  // 5. Create Sample Renewal Request
  const renewal1 = await RenewalRequest.create({
    institutionId: instDelhi._id,
    existingFdrId: fdr2._id,
    requestReference: 'REN-2026-0042',
    reason: 'FDR PNB-2018-774129 reaching 5-year tenure. Requesting approval to renew for an additional 60 months at prevailing term rate.',
    proposedTenureMonths: 60,
    supportingDocuments: [doc3._id],
    status: 'Submitted',
    submittedBy: instUser1._id,
    reviewRemarks: 'Under scrutiny by Northern Region regulatory committee.',
  });

  // 6. Create Sample Refund/Release Request (U2 Parallel Clearance & U3 Pre-Check)
  const approvedClearances = getDefaultClearances().map(c => ({
    ...c,
    status: 'Approved' as const,
    decidedBy: adminUser._id,
    decidedByName: adminUser.name,
    decidedAt: new Date('2025-06-25'),
    comments: 'All regulatory verification and field clearance approved.',
  }));

  const refund1 = await RefundRequest.create({
    institutionId: instMumbai._id,
    fdrId: fdr7Released._id,
    requestReference: 'REF-2025-0019',
    reason: 'Closure of Program',
    refundAmount: 1000000,
    bankDetails: {
      accountHolderName: 'Mumbai Central Polytechnic Society',
      accountNumber: '918020038841920',
      bankName: 'ICICI Bank',
      ifscCode: 'ICIC0000004',
    },
    status: 'Completed',
    clearances: approvedClearances,
    nocGenerated: true,
    nocGeneratedAt: new Date('2025-07-02'),
    nocCertificateNumber: 'AICTE/NOC/2025/0019',
    preCheckResult: {
      eligible: true,
      score: 100,
      checkedAt: new Date('2025-06-10'),
      checks: [
        { key: 'maturity', label: 'Instrument Maturity Reached', passed: true, details: 'FDR has completed required regulatory tenure' },
        { key: 'verified_docs', label: 'All Submitted Documents Verified', passed: true, details: 'FDR and board resolution verified' },
        { key: 'zero_discrepancies', label: 'Zero Unresolved Discrepancies', passed: true, details: 'No discrepancy flags detected' },
        { key: 'parallel_clearances', label: 'Mandatory Multi-Department Clearances', passed: true, details: '4/4 mandatory clearances approved' },
      ],
    },
    submittedBy: instUser2._id,
    assignedOfficer: officerUser._id,
    remarks: 'All audit clearances submitted. Program surrendered smoothly with no pending student liabilities.',
    approvalObservations: [
      {
        stage: 'Submission',
        officerId: instUser2._id,
        officerName: instUser2.name,
        decision: 'Submitted',
        remarks: 'Release application submitted with executive board resolution.',
        date: new Date('2025-06-10'),
      },
      {
        stage: 'Document Review',
        officerId: officerUser._id,
        officerName: officerUser.name,
        decision: 'Approved Under Scrutiny',
        remarks: 'No dues certificate verified from state DTE.',
        date: new Date('2025-06-18'),
      },
      {
        stage: 'Completed',
        officerId: adminUser._id,
        officerName: adminUser.name,
        decision: 'Completed',
        remarks: 'Authorized release letter issued to ICICI Bank.',
        date: new Date('2025-07-02'),
      },
    ],
    finalOutcome: 'Security deposit released and lien revoked as per AICTE Council approval.',
  });

  // 7. Seed Policy Rules (U4 Regulatory Policy & Deposit Adequacy Engine)
  await PolicyRule.create([
    {
      ruleCode: 'APH-2024-NORM-ENG',
      version: 'AICTE-APH-2024-25',
      title: 'AICTE Security Deposit Norms for Degree Engineering & Technology (Illustrative Benchmark)',
      formulaDescription: 'Base Deposit ₹35,00,000 + ₹5,00,000 for each batch of 60 intake above 300 seats. Minimum 8-year (96 months) fixed term.',
      regulatorySource: 'AICTE Approval Process Handbook (Illustrative Benchmark for Automated Compliance)',
      effectiveFrom: new Date('2024-04-01'),
      minimumTenureMonths: 96,
      disciplineRates: [
        { discipline: 'Engineering', level: 'UG', baseDepositAmount: 3500000, perIntakeUnitAmount: 500000, intakeUnitSize: 60 },
        { discipline: 'Engineering', level: 'PG', baseDepositAmount: 1500000, perIntakeUnitAmount: 300000, intakeUnitSize: 30 },
      ],
      isActive: true,
      isIllustrativeDemoRule: true,
      createdBy: adminUser._id,
    },
    {
      ruleCode: 'APH-2024-NORM-MGMT',
      version: 'AICTE-APH-2024-25',
      title: 'AICTE Security Deposit Norms for Management & MBA Programs (Illustrative Benchmark)',
      formulaDescription: 'Base Deposit ₹15,00,000 + ₹2,50,000 for each additional 60 intake. Minimum 5-year (60 months) fixed term.',
      regulatorySource: 'AICTE Approval Process Handbook (Illustrative Benchmark for Automated Compliance)',
      effectiveFrom: new Date('2024-04-01'),
      minimumTenureMonths: 60,
      disciplineRates: [
        { discipline: 'Management', level: 'PG', baseDepositAmount: 1500000, perIntakeUnitAmount: 250000, intakeUnitSize: 60 },
      ],
      isActive: true,
      isIllustrativeDemoRule: true,
      createdBy: adminUser._id,
    },
    {
      ruleCode: 'APH-2024-NORM-POLY',
      version: 'AICTE-APH-2024-25',
      title: 'AICTE Security Deposit Norms for Polytechnic & Diploma Institutions (Illustrative Benchmark)',
      formulaDescription: 'Base Deposit ₹15,00,000 + ₹2,00,000 for each additional 60 intake. Minimum 5-year (60 months) fixed term.',
      regulatorySource: 'AICTE Approval Process Handbook (Illustrative Benchmark for Automated Compliance)',
      effectiveFrom: new Date('2024-04-01'),
      minimumTenureMonths: 60,
      disciplineRates: [
        { discipline: 'Polytechnic', level: 'Diploma', baseDepositAmount: 1500000, perIntakeUnitAmount: 200000, intakeUnitSize: 60 },
      ],
      isActive: true,
      isIllustrativeDemoRule: true,
      createdBy: adminUser._id,
    },
    {
      ruleCode: 'APH-2024-NORM-PHARM',
      version: 'AICTE-APH-2024-25',
      title: 'AICTE Security Deposit Norms for Pharmacy Institutions (Illustrative Benchmark)',
      formulaDescription: 'Base Deposit ₹15,00,000 + ₹3,00,000 for each additional 60 intake. Minimum 5-year (60 months) fixed term.',
      regulatorySource: 'AICTE Approval Process Handbook (Illustrative Benchmark for Automated Compliance)',
      effectiveFrom: new Date('2024-04-01'),
      minimumTenureMonths: 60,
      disciplineRates: [
        { discipline: 'Pharmacy', level: 'UG', baseDepositAmount: 1500000, perIntakeUnitAmount: 300000, intakeUnitSize: 60 },
      ],
      isActive: true,
      isIllustrativeDemoRule: true,
      createdBy: adminUser._id,
    },
  ]);

  // 8. Seed Bank Verification Requests (U6 Bank Verification & Duplicate FDR Detection Hub)
  await BankVerificationRequest.create([
    {
      requestReference: 'BVR-2026-001',
      fdrId: fdr1._id,
      institutionId: instDelhi._id,
      fdrNumber: fdr1.fdrNumber,
      bankName: fdr1.bankName,
      branchName: fdr1.branchName,
      ifscCode: fdr1.ifscCode,
      claimedDepositAmount: fdr1.depositAmount,
      verificationMethod: 'SFMS / Formal Letter',
      status: 'Verified',
      requestedBy: officerUser._id,
      submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      bankOfficerName: 'R. K. Malhotra',
      bankOfficerDesignation: 'Chief Manager, SBI Industrial Finance Branch',
      responseNotes: 'Verified against SBI core banking system. AICTE joint lien is duly registered under ledger folio #8821.',
      lienConfirmed: true,
      amountConfirmed: fdr1.depositAmount,
      isDemoMode: true,
    },
    {
      requestReference: 'BVR-2026-002',
      fdrId: fdr2._id,
      institutionId: instDelhi._id,
      fdrNumber: fdr2.fdrNumber,
      bankName: fdr2.bankName,
      branchName: fdr2.branchName,
      ifscCode: fdr2.ifscCode,
      claimedDepositAmount: fdr2.depositAmount,
      verificationMethod: 'Official Bank Portal',
      status: 'Pending Response',
      requestedBy: officerUser._id,
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isDemoMode: true,
    },
  ]);

  // 9. Create System Settings
  await SystemSetting.create([
    {
      key: 'reminder_days_before',
      value: [30, 15, 7],
      category: 'notifications',
      description: 'Advance reminder thresholds in days prior to FDR maturity.',
    },
    {
      key: 'overdue_days_threshold',
      value: 14,
      category: 'workflow',
      description: 'Days before pending verification or action is flagged as overdue.',
    },
    {
      key: 'ai_ocr_auto_parse',
      value: true,
      category: 'ai',
      description: 'Automatically run OCR extraction and discrepancy detection on file upload.',
    },
    {
      key: 'require_dual_lien_authorization',
      value: true,
      category: 'security',
      description: 'Enforce joint lien naming AICTE Regional Officer & Institution head.',
    },
  ]);

  // 8. Create Notifications
  await Notification.create([
    {
      targetRole: 'officer',
      institutionId: instDelhi._id,
      type: 'Maturity Alert',
      title: 'Advance Maturity Alert (12 days): PNB-2018-774129',
      message: `FDR PNB-2018-774129 (Punjab National Bank, ₹15,00,000) matures in 12 days on ${dateIn12Days.toLocaleDateString()}. Renewal request is pending review.`,
      relatedEntityType: 'FDR',
      relatedEntityId: fdr2._id,
      priority: 'high',
      dueAt: dateIn12Days,
    },
    {
      targetRole: 'officer',
      institutionId: instMumbai._id,
      type: 'Maturity Alert',
      title: 'FDR Matured: BOB-2019-332910',
      message: `FDR BOB-2019-332910 matured 6 days ago on ${date6DaysAgo.toLocaleDateString()}. Institution action required for renewal or release.`,
      relatedEntityType: 'FDR',
      relatedEntityId: fdr3._id,
      priority: 'urgent',
      dueAt: date6DaysAgo,
    },
    {
      targetRole: 'officer',
      institutionId: instBangalore._id,
      type: 'Discrepancy Detected',
      title: 'Document Discrepancy Flagged: Canara_Fixed_Deposit_Receipt.pdf',
      message: '1 discrepancy flag(s) detected during automated scan: Deposit Amount mismatch between submitted record and certificate.',
      relatedEntityType: 'Document',
      relatedEntityId: doc2._id,
      priority: 'high',
    },
  ]);

  // 10. Create Tamper-Evident SHA-256 Audit Ledger Chain (U8)
  await appendAuditBlock({
    actorId: adminUser._id,
    actorName: adminUser.name,
    actorRole: adminUser.role,
    action: 'SYSTEM_INITIALIZATION',
    entityType: 'SystemSetting',
    entityId: 'SYSTEM',
    newValues: { status: 'Portal Initialized with AICTE Security Deposit configurations' },
  });

  await appendAuditBlock({
    actorId: instUser1._id,
    actorName: instUser1.name,
    actorRole: instUser1.role,
    action: 'CREATE_FDR',
    entityType: 'FDR',
    entityId: fdr1._id.toString(),
    institutionId: instDelhi._id,
    newValues: { fdrNumber: fdr1.fdrNumber, depositAmount: fdr1.depositAmount },
  });

  await appendAuditBlock({
    actorId: officerUser._id,
    actorName: officerUser.name,
    actorRole: officerUser.role,
    action: 'VERIFY_DOCUMENT',
    entityType: 'Document',
    entityId: doc1._id.toString(),
    institutionId: instDelhi._id,
    previousValues: { status: 'Pending Verification' },
    newValues: { status: 'Verified', remarks: doc1.verificationRemarks },
  });

  console.log('[Seed] Seeding completed successfully!');
  console.log('====================================================');
  console.log(' DEMO ACCOUNTS READY:');
  console.log(' 1. Admin:       admin@aicte.gov.in           / Admin@123');
  console.log(' 2. Officer:     officer@aicte.gov.in         / Officer@123');
  console.log(' 3. Institution: director@delhitechnical.edu.in / Inst@123');
  console.log(' 4. Institution: principal@mumbaipoly.edu.in  / Inst@123');
  console.log(' 5. Trust:       trustee@delhitechnical.edu.in / Trust@123');
  console.log('====================================================');
}

// Allow direct execution: npx tsx src/utils/seedData.ts
if (process.argv[1]?.includes('seedData')) {
  seedDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(err => {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    });
}
