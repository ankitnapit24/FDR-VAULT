# FDRFlow — AICTE Security Deposit & FDR Management Portal

**AICTE Problem Statement ID:** 26265  
**Title:** Streamline of Security Deposit / FDR Portal  
**Organization:** All India Council for Technical Education (AICTE), Ministry of Education, Government of India  
**Stack Architecture:** MERN-First Full-Stack (MongoDB, Express.js, React, Node.js) with TypeScript, Tailwind CSS, and AI Document Intelligence.

---

## 1. Executive Summary

**FDRFlow** is a regulatory compliance and administrative portal built to streamline the entire lifecycle of Security Deposits and Fixed Deposit Receipts (FDRs) maintained by technical institutions under the AICTE Approval Bureau.

FDRFlow replaces fragmented tracking and manual correspondence with an integrated digital workflow:
1. **Centralized FDR & Institution Repository:** Multi-tenant institution profiles with complete instrument-level history and dual-lien records.
2. **AI Document Intelligence:** Scans PDF and image FDR receipts to extract instrument numbers, issuing banks, deposit amounts, and dates using OCR.
3. **Automated Discrepancy Detection:** Flags differences between manually claimed values and bank certificate text for officer scrutiny.
4. **Automated Maturity & Escalation Tracking:** Proactive tracking with advance reminders at 30, 15, and 7-day thresholds.
5. **Renewal & Rollover Workflow:** Multi-stage renewal pipeline that links replacement FDRs with previous instruments without overwriting historical data.
6. **Statutory Refund & Release Process:** Structured review pipeline for program closure and excess deposit releases.
7. **Immutable Regulatory Audit Trail:** Tamper-evident logging of every login, upload, endorsement, and administrative status update.

---

## 2. Agreed Product Scope: 12 Core Features + 8 Unique Features

### 12 Core Features (C1 – C12)
- **C1. Centralized Institution Management:** Official AICTE codes, legal names, disciplines, approved intake, contact coordinates, and aggregate metrics.
- **C2. FDR Record Management:** Complete lifecycle states (Active, Expiring Soon, Matured, Renewed, Released, Under Dispute), duplicate detection, and renewal linking.
- **C3. Secure Document Upload & Management:** Authenticated downloads, randomized storage keys, MIME validation, and size capping.
- **C4. Document Verification Workflow:** Multi-state scrutiny pipeline (`Pending Verification`, `Verified`, `Rejected`, `Additional Information Required`) with officer remarks.
- **C5. Maturity Date Tracking & Reminders:** Automated horizon scanning (30, 15, 7-day alerts) and overdue notifications.
- **C6. Renewal / Replacement Tracking:** Bidirectional rollover linkage connecting replacement FDRs to parent instruments.
- **C7. Refund / Release Tracking:** Multi-stage release application tracking with beneficiary bank coordinates and audit trail.
- **C8. Automated Alerts & Notifications:** In-app notification center categorized by urgency (`urgent`, `high`, `medium`, `low`).
- **C9. AICTE Officer Dashboard:** Comprehensive KPI overview (active FDRs, total deposits, expiring horizon, pending verifications, renewal/release queues).
- **C10. Authentication & Role-Based Access Control:** Strict data isolation protecting institutions, officers, administrators, and trust users.
- **C11. Reports & CSV Export:** Exportable FDR registers, maturity schedules, and scrutiny backlogs in standard CSV format.
- **C12. Security Controls & Audit Trail:** Structured logging of actor, IP, timestamp, entity type, and delta values.

### 8 Unique Differentiating Features (U1 – U8)
- **U1. AI-Powered FDR Document Intelligence & Integrity Analysis:**
  - Automated OCR extraction of FDR reference number, issuing bank, deposit amount, issue date, and maturity date.
  - Calculation and database persistence of SHA-256 cryptographic file hashes on upload.
  - Safe PDF structural and metadata inspection to flag JavaScript execution, launch actions, or anomalous object structures.
- **U2. Parallel Multi-Department Clearance Orchestrator:**
  - Concurrent routing of release applications across 4 departments: Regional Office, Approval Bureau, Public Grievance Redressal Cell (PGRC), and Finance/Vigilance.
  - Server-side NOC generation lock: prevents issuance of AICTE Release NOC Certificates until all mandatory clearances are recorded as `Approved` or `Waived`.
- **U3. Intelligent Release Eligibility Pre-Check Engine:**
  - Automated pre-submission and scrutiny evaluation verifying: (1) regulatory maturity reached, (2) all submitted documents verified, (3) zero active discrepancy flags, (4) minimum regulatory tenure satisfied, and (5) multi-department clearance readiness.
  - Explanatory compliance readiness score (0–100) and actionable remediation items.
- **U4. Regulatory Policy & Deposit Adequacy Engine:**
  - Versioned policy rules modeled on the AICTE Approval Process Handbook (APH) deposit benchmarks.
  - Automated adequacy calculation comparing active FDR portfolio against approved intake seat multipliers.
  - Clear narrative explanation of deposit surplus or shortfall requirements.
- **U5. Smart Risk Prioritization & Compliance Deadline Planner:**
  - Explainable case priority scoring (0–100) weighted by maturity proximity, document verification backlogs, discrepancy severity, and renewal review delays.
- **U6. Bank Verification & Duplicate FDR Detection Hub:**
  - Real-time Reserve Bank of India IFSC syntax validation matching regex `^[A-Z]{4}0[A-Z0-9]{6}$` with branch directory routing lookup.
  - Standardized bank inquiry tickets tracking formal bank liaison and joint lien registration.
  - Explicit architectural label: clearly marked as `DEMO / MOCK INTEGRATION MODE` with transparency regarding required core banking / SFMS bilateral agreements.
- **U7. Trust-Level Consolidated Financial Exposure Dashboard:**
  - Multi-campus parent view aggregating security deposit compliance across all institutions operating under a single Educational Trust or Society.
  - Institutional breakdown table showing campus-by-campus deposit holding, required benchmark, and net shortfall or surplus.
  - Strict tenant isolation: Trust accounts cannot access data belonging to other educational trusts.
- **U8. Tamper-Evident SHA-256 Audit Ledger Chain:**
  - Every administrative action and event is sequentially linked in a cryptographic block chain where `currentHash = SHA256(previousHash | sequenceNumber | canonicalPayload)`.
  - Chained directly from Genesis Block `0000000000000000000000000000000000000000000000000000000000000000`.
  - Cryptographic verification endpoint (`GET /api/audit-logs/verify-integrity`) that validates ledger integrity and instantly flags altered historical events.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Government design palette: `#F5F6F8` background, `#FFFFFF` surfaces, `#365F91` AICTE blue, `#D9534F` alert red)
- **Routing:** React Router v7
- **Icons:** Lucide React
- **HTTP Client:** Axios with JWT request/response interceptors

### Backend & API
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js (Modular MVC architecture)
- **Language:** TypeScript
- **Database ODM:** Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) with server-side Role-Based Access Control (RBAC)
- **Password Security:** Bcrypt password hashing
- **File Storage:** Multer with mime-type validation, size limits, and randomized storage keys
- **Security Middleware:** Helmet, CORS, and Express Rate Limiting

### Database
- **Primary:** MongoDB (Supports MongoDB Atlas or local MongoDB instance)
- **Embedded Fallback:** Automatic zero-configuration `MongoMemoryServer` fallback for instant prototype evaluation without requiring local MongoDB pre-installation.

---

## 4. Demo Credentials

Seed data comes pre-populated with ready-to-test accounts across all system roles:

| Role | Email | Password | Scope / Permissions |
|---|---|---|---|
| **System Administrator** | `admin@aicte.gov.in` | `Admin@123` | Full administrative oversight, user management, system settings |
| **AICTE Scrutiny Officer** | `officer@aicte.gov.in` | `Officer@123` | Verification queue, scrutiny observations, renewals, refund approvals |
| **Institution User 1** | `director@delhitechnical.edu.in` | `Inst@123` | Delhi Institute of Advanced Engineering (Strict data isolation) |
| **Institution User 2** | `principal@mumbaipoly.edu.in` | `Inst@123` | Mumbai Central Polytechnic (Strict data isolation) |
| **Educational Trust User** | `trustee@delhitechnical.edu.in` | `Trust@123` | Delhi Technical & Higher Education Society (Multi-Campus Exposure) |

*(Quick-login buttons are also provided directly on the Login page for convenience.)*

---

## 5. Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation
```bash
# 1. Install server dependencies
cd server
npm install

# 2. Install client dependencies
cd ../client
npm install
cd ..
```

### Running the Application

Open two terminal sessions:

**Terminal 1 — Backend API Server (Port 5000):**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend Application (Port 5173):**
```bash
cd client
npm run dev
```

Visit **http://localhost:5173** in your web browser.

---

## 6. Running Automated Verification Tests

### Backend Unit & Integration Tests (Vitest)
```bash
cd server
npm test
```

### Production Build Verification
```bash
# Frontend production build
cd client
npm run build

# Backend compilation check
cd ../server
npx tsc --noEmit
```

---

## 7. Key REST API Endpoints

### Authentication & Authorization
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/me` — Get current user profile and role
- `POST /api/auth/logout` — Secure sign-out with audit log

### Institutions & Trusts
- `GET /api/institutions` — List institutions (with search, filter, and pagination)
- `GET /api/institutions/:id` — Institution details with affiliated FDRs
- `GET /api/trusts` — List educational trusts
- `GET /api/trusts/:id/exposure` — Consolidated multi-campus financial exposure (U7)

### FDR Records & Scrutiny
- `GET /api/fdrs` — List FDRs (search, maturity filters, priority sorting)
- `POST /api/fdrs` — Register new FDR (includes duplicate detection check)
- `GET /api/fdrs/:id` — View detailed FDR dossier, documents, and scrutiny timeline
- `POST /api/fdrs/:id/observations` — Record officer scrutiny observation

### AI Document Intelligence & Integrity
- `POST /api/documents/upload` — Upload certificate, run OCR, compute SHA-256 hash (U1)
- `GET /api/documents/:id/download` — Secure, authenticated document stream
- `GET /api/documents/:id/integrity` — View cryptographic hash and safe PDF structural signals (U1)
- `POST /api/documents/:id/verify` — Endorse or reject submitted document

### Lifecycles & Clearances
- `GET /api/renewals` & `POST /api/renewals` — Renewal & replacement applications
- `PATCH /api/renewals/:id/status` — Approve renewal and generate rollover FDR
- `GET /api/refund-requests` & `POST /api/refund-requests` — Release applications
- `GET /api/refund-requests/pre-check/:fdrId` — Run eligibility pre-check (U3)
- `PATCH /api/refund-requests/:id/clearances/:deptKey` — Record department clearance (U2)
- `POST /api/refund-requests/:id/generate-noc` — Generate official AICTE NOC Certificate (U2)

### Bank Verification & Adequacy Policies
- `GET /api/bank-verification/validate-ifsc/:ifsc` — Validate IFSC regex & lookup directory (U6)
- `GET /api/bank-verification` — List bank verification tickets (U6)
- `PATCH /api/bank-verification/:id/status` — Record bank response (U6)
- `GET /api/policies` — List versioned policy rules (U4)
- `GET /api/policies/calculate-adequacy/:institutionId` — Calculate deposit adequacy (U4)

### Cryptographic Audit Ledger
- `GET /api/audit-logs` — List sequentially chained audit blocks (U8)
- `GET /api/audit-logs/verify-integrity` — Cryptographically verify entire SHA-256 chain (U8)

---

## 8. Architectural Guarantees & Real-World Compliance

1. **No Autonomous Financial Release:** The platform enforces strict regulatory control. AI detects discrepancies and scores risk, but all financial releases require explicit multi-department human clearance and signed Council NOC certificates.
2. **Multi-Tenant Data Isolation:** Institutional representatives are restricted exclusively to their college's records. Trust trustees have access across their network but are isolated from outside trusts. AICTE officers maintain macro-oversight across jurisdictions.
3. **Rollover History Immutability:** Historical FDRs are never overwritten or deleted upon renewal; they transition to `Renewed` status and maintain permanent bidirectional hyperlinks to successor certificates.
4. **Integration Truthfulness:** Live automated bank verification requires bilateral SFMS or API gateway integration with scheduled commercial banks. The portal provides a standardized operational inquiry lifecycle and clearly labels prototype simulation as `DEMO / MOCK INTEGRATION MODE`.
