import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { RefundRequest } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Select } from '../components/common/Input.js';
import { StatusBadge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { ClearanceTracker } from '../components/clearances/ClearanceTracker.js';
import { ReleasePreCheckModal } from '../components/clearances/ReleasePreCheckModal.js';
import {
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const RefundRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();

  const [refund, setRefund] = useState<RefundRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreCheckOpen, setIsPreCheckOpen] = useState(false);

  // Workflow Action Modal state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('Under Document Review');
  const [actionRemarks, setActionRemarks] = useState('');
  const [finalOutcome, setFinalOutcome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/refund-requests/${id}`);
      if (res.data.success) {
        setRefund(res.data.refund);
        setTargetStatus(res.data.refund.status);
      }
    } catch (err) {
      console.error('Error fetching refund details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refund) return;
    setIsSubmitting(true);

    try {
      const res = await api.patch(`/refund-requests/${refund._id}/status`, {
        status: targetStatus,
        remarks: actionRemarks,
        finalOutcome: targetStatus === 'Completed' ? finalOutcome || 'Security deposit lien released.' : undefined,
      });

      if (res.data.success) {
        setIsActionModalOpen(false);
        setActionRemarks('');
        await fetchDetails();
      }
    } catch (err) {
      console.error('Error updating refund status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-text-secondary text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
        Loading refund application dossier...
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="py-12 text-center text-text-secondary">
        Refund request not found or access denied.
      </div>
    );
  }

  const institution = typeof refund.institutionId === 'object' ? refund.institutionId : null;
  const fdr = refund.fdrId;

  const WORKFLOW_STEPS = [
    'Submitted',
    'Under Document Review',
    'Under Approval',
    'Approved',
    'Completed',
  ];

  const currentStepIdx = WORKFLOW_STEPS.indexOf(refund.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Link to="/refunds">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-text-primary font-mono">
                {refund.requestReference}
              </h2>
              <StatusBadge status={refund.status} />
            </div>
            <p className="text-xs text-text-secondary">
              Statutory Release Application • {institution?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {fdr && (
            <Button variant="outline" size="sm" onClick={() => setIsPreCheckOpen(true)}>
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-aicte" /> Eligibility Pre-Check
            </Button>
          )}

          {hasRole('admin', 'officer') && refund.status !== 'Completed' && (
            <Button variant="primary" size="sm" onClick={() => setIsActionModalOpen(true)}>
              Advance Workflow Stage
            </Button>
          )}
        </div>
      </div>

      {/* Visual Workflow Stepper */}
      <Card title="Regulatory Multi-Stage Approval Process">
        <div className="py-3 px-2">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border -z-0"></div>
            {WORKFLOW_STEPS.map((step, idx) => {
              const isPast = currentStepIdx >= idx;
              const isCurrent = refund.status === step;
              return (
                <div key={step} className="flex flex-col items-center relative z-10 bg-surface px-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-colors ${
                      isCurrent
                        ? 'border-aicte bg-aicte text-white shadow-xs'
                        : isPast
                        ? 'border-status-success bg-status-success text-white'
                        : 'border-border bg-surface text-text-secondary'
                    }`}
                  >
                    {isPast && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1.5 text-center max-w-[100px] leading-tight ${
                      isCurrent ? 'text-aicte font-bold' : isPast ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Application Particulars">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-text-secondary block">Claimed Refund Amount</span>
                <span className="text-base font-bold text-text-primary mt-0.5 block">
                  ₹{refund.refundAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Statutory Reason</span>
                <span className="text-sm font-semibold text-text-primary mt-0.5 block">
                  {refund.reason}
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Date Submitted</span>
                <span className="text-sm font-medium text-text-primary mt-0.5 block">
                  {new Date(refund.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-xs space-y-2">
              <span className="font-semibold text-text-primary block">
                Beneficiary Bank Account Details for Release
              </span>
              <div className="p-3 bg-surface-subtle rounded border border-border grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-secondary block">Account Holder:</span>
                  <span className="font-medium text-text-primary">{refund.bankDetails?.accountHolderName}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Account Number:</span>
                  <span className="font-mono font-medium text-text-primary">{refund.bankDetails?.accountNumber}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Bank:</span>
                  <span className="font-medium text-text-primary">{refund.bankDetails?.bankName}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">IFSC:</span>
                  <span className="font-mono font-medium text-text-primary">{refund.bankDetails?.ifscCode}</span>
                </div>
              </div>

              {refund.remarks && (
                <div className="pt-2">
                  <span className="text-text-secondary block">Submission Remarks:</span>
                  <p className="text-text-primary bg-surface-subtle p-2.5 rounded border border-border mt-1">
                    {refund.remarks}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Multi-Department Clearance Orchestrator (U2) */}
          <ClearanceTracker refundRequest={refund} onRefresh={fetchDetails} />

          {/* Timeline of Stage Observations */}
          <Card
            title="Approval History & Regulatory Stage Audit"
            description="Chronological log of scrutiny decisions and officer remarks."
          >
            {(!refund.approvalObservations || refund.approvalObservations.length === 0) ? (
              <p className="text-xs text-text-secondary py-4 text-center">
                No stage observations recorded.
              </p>
            ) : (
              <div className="space-y-3">
                {refund.approvalObservations.map((obs, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-subtle rounded-md border border-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-text-primary">
                          Stage: {obs.stage}
                        </span>
                        <span className="text-text-secondary">•</span>
                        <span className="text-text-secondary font-medium">{obs.officerName}</span>
                      </div>
                      <span className="text-[11px] text-text-secondary">
                        {new Date(obs.date).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-text-primary whitespace-pre-wrap">{obs.remarks}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Linked FDR */}
          {refund.fdrId && (
            <Card title="Subject Security Deposit FDR">
              <div className="space-y-2 text-xs">
                <Link
                  to={`/fdrs/${refund.fdrId._id}`}
                  className="font-mono font-bold text-sm text-aicte hover:underline block"
                >
                  {refund.fdrId.fdrNumber}
                </Link>
                <p className="text-text-secondary">
                  Bank: <span className="text-text-primary font-medium">{refund.fdrId.bankName}</span>
                </p>
                <p className="text-text-secondary">
                  Instrument Value: <span className="text-text-primary font-semibold">₹{refund.fdrId.depositAmount?.toLocaleString('en-IN')}</span>
                </p>
                <p className="text-text-secondary">
                  Current Status: <StatusBadge status={refund.fdrId.currentStatus} />
                </p>
                <Link to={`/fdrs/${refund.fdrId._id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Inspect FDR Dossier
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Institution Reference */}
          {institution && (
            <Card title="Applicant Institution">
              <div className="space-y-2 text-xs">
                <Link
                  to={`/institutions/${institution._id}`}
                  className="font-bold text-text-primary hover:text-aicte hover:underline block"
                >
                  {institution.name}
                </Link>
                <p className="text-text-secondary font-mono">{institution.institutionCode}</p>
                <p className="text-text-secondary">{institution.address.city}, {institution.address.state}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Advance Stage Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Advance Refund Workflow Stage"
        description="Transition statutory release application to next regulatory stage."
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <Select
              label="Select Next Regulatory Workflow Stage"
              value={targetStatus}
              onChange={e => setTargetStatus(e.target.value)}
            >
              <option value="Under Document Review">Under Document Review</option>
              <option value="Additional Information Required">Additional Information Required</option>
              <option value="Under Approval">Under Approval</option>
              <option value="Approved">Approved</option>
              <option value="Sent for Authorized External Processing">Sent for Authorized External Processing</option>
              <option value="Completed">Completed (Final Lien Revocation)</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Stage Observation Remarks *
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-aicte"
              placeholder="e.g. Scrutiny committee cleared program surrender. Recommended for Council release authorization..."
              value={actionRemarks}
              onChange={e => setActionRemarks(e.target.value)}
            />
          </div>

          {targetStatus === 'Completed' && (
            <div className="p-3 bg-aicte-subtle border border-[#D0DFEF] rounded-md text-xs text-aicte">
              <strong>Notice:</strong> Marking this application as "Completed" will formally update the linked FDR status to <strong>Released</strong> in the repository.
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsActionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Confirm Workflow Transition
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pre-Check Modal (U3) */}
      {fdr && (
        <ReleasePreCheckModal
          isOpen={isPreCheckOpen}
          onClose={() => setIsPreCheckOpen(false)}
          fdrId={typeof fdr === 'string' ? fdr : fdr._id}
        />
      )}
    </div>
  );
};
