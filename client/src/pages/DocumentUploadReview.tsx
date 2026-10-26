import React, { useState } from 'react';
import api from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input, Select } from '../components/common/Input.js';
import { DiscrepancyBanner } from '../components/ai/DiscrepancyBanner.js';
import {
  Upload,
  Sparkles,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileCheck,
} from 'lucide-react';

export const DocumentUploadReview: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extraction, setExtraction] = useState<any>(null);
  const [error, setError] = useState('');

  // Entered values to test discrepancy detection
  const [enteredFdrNumber, setEnteredFdrNumber] = useState('');
  const [enteredBank, setEnteredBank] = useState('State Bank of India');
  const [enteredAmount, setEnteredAmount] = useState<number | ''>('');
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setExtraction(null);
      setDiscrepancies([]);
      setError('');
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/ai/extract-fdr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setExtraction(res.data.extraction);

        // Check discrepancies against test inputs if provided
        if (enteredFdrNumber || enteredAmount !== '') {
          const discRes = await api.post('/ai/check-discrepancies', {
            fdrData: {
              fdrNumber: enteredFdrNumber,
              bankName: enteredBank,
              depositAmount: enteredAmount === '' ? undefined : Number(enteredAmount),
            },
            extractedData: res.data.extraction,
          });
          if (discRes.data.success) {
            setDiscrepancies(discRes.data.discrepancies || []);
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error processing OCR document extraction.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">
          AI Document Intelligence & OCR Scrutiny Studio
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Upload FDR instruments or scanned certificates to evaluate OCR text extraction and automated discrepancy detection.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-status-danger-bg text-status-danger rounded text-xs">
          {error}
        </div>
      )}

      {/* Discrepancy Alert */}
      {discrepancies.length > 0 && (
        <DiscrepancyBanner flags={discrepancies} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Card */}
        <Card title="Upload Instrument for OCR Scrutiny">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-aicte/40 transition-colors">
              <Upload className="w-8 h-8 text-aicte mx-auto mb-2" />
              <label htmlFor="file-input" className="cursor-pointer">
                <span className="text-xs font-semibold text-aicte hover:underline block">
                  Select FDR Certificate or Letter (.pdf, .png, .jpg)
                </span>
                <span className="text-[11px] text-text-secondary">
                  {file ? file.name : 'Drag & drop or browse from disk'}
                </span>
              </label>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <p className="text-xs font-semibold text-text-primary">
                Optional: Enter Expected Values to Test Discrepancy Detection
              </p>
              <Input
                label="Entered FDR Reference #"
                placeholder="e.g. SBIN-2024-908124"
                value={enteredFdrNumber}
                onChange={e => setEnteredFdrNumber(e.target.value)}
              />
              <Input
                label="Entered Deposit Amount (₹)"
                type="number"
                placeholder="e.g. 3500000"
                value={enteredAmount}
                onChange={e => setEnteredAmount(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <Button
              variant="primary"
              className="w-full"
              disabled={!file}
              isLoading={isProcessing}
              onClick={handleRunAIAnalysis}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Execute OCR & Scrutiny Check
            </Button>
          </div>
        </Card>

        {/* Extraction Results */}
        <Card title="Structured Extraction Outcome">
          {!extraction ? (
            <div className="py-16 text-center text-xs text-text-secondary">
              Upload a document and click "Execute OCR" to view structured fields and confidence scores.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-aicte-subtle rounded border border-[#D0DFEF] flex items-center justify-between">
                <span className="font-semibold text-aicte">OCR Confidence Score:</span>
                <span className="font-bold text-aicte">
                  {Math.round((extraction.confidence || 0) * 100)}%
                </span>
              </div>

              <div className="space-y-2 border border-border rounded-lg p-3 bg-surface-subtle">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-text-secondary">FDR Number:</span>
                  <span className="font-mono font-bold text-text-primary">
                    {extraction.fdrNumber || <span className="text-status-warning italic">Not detected</span>}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-text-secondary">Issuing Bank:</span>
                  <span className="font-medium text-text-primary">
                    {extraction.bankName || <span className="text-status-warning italic">Not detected</span>}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-text-secondary">Deposit Amount:</span>
                  <span className="font-semibold text-text-primary">
                    {extraction.depositAmount
                      ? `₹${Number(extraction.depositAmount).toLocaleString('en-IN')}`
                      : <span className="text-status-warning italic">Not detected</span>}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-text-secondary">Date of Issue:</span>
                  <span className="text-text-primary">
                    {extraction.issueDate || <span className="text-text-secondary">None</span>}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-secondary">Date of Maturity:</span>
                  <span className="text-text-primary">
                    {extraction.maturityDate || <span className="text-text-secondary">None</span>}
                  </span>
                </div>
              </div>

              {extraction.rawText && (
                <div>
                  <span className="font-semibold text-text-secondary block mb-1">
                    Raw Parsed Excerpt:
                  </span>
                  <pre className="p-2 bg-surface rounded border border-border text-[11px] font-mono text-text-secondary whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {extraction.rawText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
