import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input, Select } from '../components/common/Input.js';
import { ExtractionReviewModal } from '../components/ai/ExtractionReviewModal.js';
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

const SCHEDULED_BANKS = [
  'State Bank of India',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Indian Bank',
  'Bank of India',
  'Central Bank of India',
];

export const FDRRegister: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [institutions, setInstitutions] = useState<any[]>([]);
  const [institutionId, setInstitutionId] = useState(
    searchParams.get('institutionId') || (user?.role === 'institution' ? user.institution?._id || '' : '')
  );

  const [fdrNumber, setFdrNumber] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [branchName, setBranchName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [depositAmount, setDepositAmount] = useState<number | ''>('');
  const [issueDate, setIssueDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [tenureMonths, setTenureMonths] = useState(60);
  const [interestRate, setInterestRate] = useState(6.75);
  const [jointHolderName, setJointHolderName] = useState('Regional Officer, AICTE & Principal');
  const [remarks, setRemarks] = useState('');

  // Duplicate Check
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // OCR Upload & Autofill
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadInstitutions() {
      try {
        const res = await api.get('/institutions?limit=100');
        if (res.data.success) {
          setInstitutions(res.data.institutions);
          if (!institutionId && res.data.institutions.length > 0) {
            setInstitutionId(res.data.institutions[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching institutions:', err);
      }
    }
    if (user?.role !== 'institution') {
      loadInstitutions();
    }
  }, [user]);

  const handleDuplicateCheck = async () => {
    if (!fdrNumber || !bankName) return;
    setIsCheckingDuplicate(true);
    setDuplicateWarning(null);
    try {
      const res = await api.get(`/fdrs/check-duplicate?fdrNumber=${fdrNumber}&bankName=${bankName}`);
      if (res.data.isDuplicate) {
        setDuplicateWarning(res.data.message);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setOcrFile(file);
    setIsExtracting(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/ai/extract-fdr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success && res.data.extraction) {
        setExtractedData(res.data.extraction);
        setIsOcrModalOpen(true);
      }
    } catch (err: any) {
      setFormError('OCR processing failed. Please enter FDR fields manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyOcrData = (data: any) => {
    if (data.fdrNumber) setFdrNumber(data.fdrNumber);
    if (data.bankName) setBankName(data.bankName);
    if (data.depositAmount) setDepositAmount(data.depositAmount);
    if (data.issueDate) {
      // Try parsing date format
      const parsed = new Date(data.issueDate);
      if (!isNaN(parsed.getTime())) {
        setIssueDate(parsed.toISOString().slice(0, 10));
      }
    }
    if (data.maturityDate) {
      const parsed = new Date(data.maturityDate);
      if (!isNaN(parsed.getTime())) {
        setMaturityDate(parsed.toISOString().slice(0, 10));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/fdrs', {
        institutionId: user?.role === 'institution' ? user.institution?._id : institutionId,
        fdrNumber,
        bankName,
        branchName,
        ifscCode,
        depositAmount: Number(depositAmount),
        issueDate,
        maturityDate,
        tenureMonths: Number(tenureMonths),
        interestRate: Number(interestRate),
        jointHolderName,
        remarks,
      });

      if (res.data.success) {
        // If an initial document file was selected during registration, upload it attached to this new FDR
        if (ocrFile && res.data.fdr?._id) {
          const docForm = new FormData();
          docForm.append('file', ocrFile);
          docForm.append('institutionId', res.data.fdr.institutionId);
          docForm.append('fdrId', res.data.fdr._id);
          docForm.append('documentType', 'FDR Certificate');
          await api.post('/documents/upload', docForm);
        }

        navigate(`/fdrs/${res.data.fdr._id}`);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error submitting FDR record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link to="/fdrs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Register Security Deposit / Fixed Deposit Receipt
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Submit FDR instrument details and upload certificate for regulatory verification.
          </p>
        </div>
      </div>

      {/* AI OCR Autofill Callout */}
      <Card className="!p-4 bg-aicte-subtle border-[#D0DFEF]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-aicte shrink-0" />
            <div>
              <span className="text-xs font-bold text-text-primary block">
                AI Document Intelligence — Automated Receipt Extraction
              </span>
              <span className="text-[11px] text-text-secondary">
                Upload your scanned FDR certificate or bank lien letter to automatically extract FDR #, bank, amount, and dates.
              </span>
            </div>
          </div>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              id="ocr-upload-input"
              className="hidden"
              onChange={handleOcrUpload}
            />
            <label htmlFor="ocr-upload-input">
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-white text-aicte border border-aicte/40 hover:bg-[#F5F8FC] cursor-pointer shadow-xs">
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Analyzing Document...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Scan Certificate with OCR
                  </>
                )}
              </span>
            </label>
          </div>
        </div>
      </Card>

      {duplicateWarning && (
        <div className="p-3 bg-[#FEF7E0] border border-[#FEEFC3] text-[#B06000] rounded-md text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{duplicateWarning}</span>
        </div>
      )}

      {formError && (
        <div className="p-3 bg-status-danger-bg border border-red-200 text-status-danger rounded-md text-xs">
          {formError}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Institution Selection */}
          {user?.role !== 'institution' ? (
            <div>
              <Select
                label="Assign to Technical Institution"
                required
                value={institutionId}
                onChange={e => setInstitutionId(e.target.value)}
              >
                <option value="">Select Technical Institution...</option>
                {institutions.map(inst => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name} ({inst.institutionCode})
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="p-3 bg-surface-subtle rounded border border-border text-xs">
              <span className="font-semibold text-text-secondary">Submitting for:</span>{' '}
              <strong className="text-text-primary">{user?.institution?.name}</strong>{' '}
              <span className="font-mono text-text-secondary">({user?.institution?.institutionCode})</span>
            </div>
          )}

          {/* FDR Reference & Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="FDR Reference / Certificate Number"
                required
                placeholder="e.g. SBIN-2024-998811"
                value={fdrNumber}
                onChange={e => setFdrNumber(e.target.value)}
                onBlur={handleDuplicateCheck}
              />
              <span className="text-[10px] text-text-secondary mt-1 block">
                Unique instrument number as specified on bank receipt.
              </span>
            </div>

            <div>
              <Select
                label="Issuing Scheduled Bank"
                required
                value={bankName}
                onChange={e => {
                  setBankName(e.target.value);
                  handleDuplicateCheck();
                }}
              >
                {SCHEDULED_BANKS.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="Other Scheduled Commercial Bank">Other Scheduled Commercial Bank</option>
              </Select>
            </div>
          </div>

          {/* Branch & IFSC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bank Branch Name"
              placeholder="e.g. Rohini Sector 14 Branch, New Delhi"
              value={branchName}
              onChange={e => setBranchName(e.target.value)}
            />
            <Input
              label="Bank IFSC Code"
              placeholder="e.g. SBIN0001234"
              value={ifscCode}
              onChange={e => setIfscCode(e.target.value.toUpperCase())}
            />
          </div>

          {/* Deposit Amount & Interest */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="Deposit Principal Amount (₹)"
                type="number"
                required
                placeholder="e.g. 3500000"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value === '' ? '' : Number(e.target.value))}
              />
              {depositAmount !== '' && (
                <span className="text-[10px] font-semibold text-aicte mt-0.5 block">
                  ₹{Number(depositAmount).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <Input
              label="Tenure (Months)"
              type="number"
              value={tenureMonths}
              onChange={e => setTenureMonths(Number(e.target.value))}
            />

            <Input
              label="Interest Rate (% p.a.)"
              type="number"
              step="0.05"
              value={interestRate}
              onChange={e => setInterestRate(Number(e.target.value))}
            />
          </div>

          {/* Issue & Maturity Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Issue"
              type="date"
              required
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
            />
            <Input
              label="Date of Maturity"
              type="date"
              required
              value={maturityDate}
              onChange={e => setMaturityDate(e.target.value)}
            />
          </div>

          {/* Joint Holder */}
          <Input
            label="Joint Holder Title / Regulatory Lien"
            required
            value={jointHolderName}
            onChange={e => setJointHolderName(e.target.value)}
          />

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Regulatory Approval Remarks / Scope
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-aicte"
              rows={3}
              placeholder="e.g. Security deposit submitted for approval of New Undergraduate Engineering intake in Artificial Intelligence & Data Science..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-border">
            <Link to="/fdrs">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Submit FDR Record for Scrutiny
            </Button>
          </div>
        </form>
      </Card>

      {/* AI Extraction Modal */}
      <ExtractionReviewModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        extractedData={extractedData}
        enteredData={{
          fdrNumber,
          bankName,
          depositAmount: depositAmount === '' ? undefined : Number(depositAmount),
          issueDate,
          maturityDate,
        }}
        onConfirmValues={handleApplyOcrData}
      />
    </div>
  );
};
