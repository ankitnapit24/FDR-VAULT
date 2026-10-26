import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { ReleasePreCheckResult } from '../../types/index.js';
import api from '../../services/api.js';

interface ReleasePreCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  fdrId: string;
}

export const ReleasePreCheckModal: React.FC<ReleasePreCheckModalProps> = ({ isOpen, onClose, fdrId }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReleasePreCheckResult | null>(null);
  const [error, setError] = useState('');

  const fetchPreCheck = async () => {
    if (!fdrId) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.get(`/refund-requests/pre-check/${fdrId}`);
      if (res.data.success) {
        const raw = res.data.evaluation || res.data.preCheck;
        setResult({
          eligible: raw.isEligible ?? raw.eligible ?? false,
          score: raw.score ?? 0,
          checks: (raw.items || raw.checks || []).map((it: any) => ({
            key: it.key,
            label: it.title || it.label,
            passed: it.passed,
            details: it.guidance || it.reason || it.details,
            blockingReasons: it.passed ? [] : [it.reason].filter(Boolean),
          })),
          checkedAt: raw.evaluatedAt || raw.checkedAt || new Date().toISOString(),
        });
      } else {
        setError(res.data.message || 'Failed to execute pre-check analysis.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error running pre-check analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPreCheck();
    }
  }, [isOpen, fdrId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Release & Refund Eligibility Pre-Check Engine"
    >
      <div className="space-y-4 text-xs">
        {/* Banner */}
        <div className="p-3 bg-[#F0F5FA] border border-[#D0DFEF] rounded flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-aicte" />
            <div>
              <p className="font-bold text-xs text-aicte">Automated Regulatory Readiness Evaluation</p>
              <p className="text-[11px] text-text-secondary">
                Verifies FDR lifecycle state, document verification, zero OCR discrepancies, and department clearances.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPreCheck}
            isLoading={loading}
            className="shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-check
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {loading && !result && (
          <div className="py-8 text-center text-text-secondary">
            Evaluating regulatory checks against AICTE compliance norms...
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {/* Overall Score & Readiness Pill */}
            <div className={`p-4 rounded border flex items-center justify-between ${
              result.eligible 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div>
                <p className="text-sm font-bold">
                  {result.eligible ? 'Instrument Eligible for Release' : 'Action Required Before Release'}
                </p>
                <p className="text-xs opacity-90 mt-0.5">
                  Compliance Score: <span className="font-mono font-bold text-sm">{result.score}/100</span>
                </p>
              </div>

              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  result.eligible 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-amber-600 text-white'
                }`}>
                  {result.eligible ? 'CLEAR' : 'REMEDIATION NEEDED'}
                </span>
              </div>
            </div>

            {/* Checklist of rules */}
            <div className="border border-border rounded divide-y divide-border">
              {result.checks.map((check) => (
                <div key={check.key} className="p-3 flex items-start space-x-3">
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold text-xs ${check.passed ? 'text-text-primary' : 'text-red-700'}`}>
                      {check.label}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">{check.details}</p>
                    {check.blockingReasons && check.blockingReasons.length > 0 && (
                      <ul className="mt-1 list-disc list-inside text-[11px] text-red-600 space-y-0.5">
                        {check.blockingReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-text-muted text-center pt-2">
              Evaluated on {new Date(result.checkedAt).toLocaleString('en-IN')}. AICTE regulatory decisions are strictly reserved for competent authorities.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
