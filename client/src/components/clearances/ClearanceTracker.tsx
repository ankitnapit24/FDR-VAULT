import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Clock, XCircle, FileText, Lock } from 'lucide-react';
import { Button } from '../common/Button.js';
import { Modal } from '../common/Modal.js';
import { Select } from '../common/Select.js';
import { Textarea } from '../common/Textarea.js';
import { ClearanceItem, RefundRequest } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../services/api.js';

interface ClearanceTrackerProps {
  refundRequest: RefundRequest;
  onRefresh: () => void;
}

export const ClearanceTracker: React.FC<ClearanceTrackerProps> = ({ refundRequest, onRefresh }) => {
  const { hasRole, user } = useAuth();
  const [selectedClearance, setSelectedClearance] = useState<ClearanceItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<'Approved' | 'Objected' | 'Waived'>('Approved');
  const [comments, setComments] = useState('');
  const [objectionReason, setObjectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingNoc, setIsGeneratingNoc] = useState(false);
  const [actionError, setActionError] = useState('');

  const clearances = refundRequest.clearances || [];
  const mandatoryList = clearances.filter(c => c.isMandatory);
  const approvedMandatory = mandatoryList.filter(c => c.status === 'Approved' || c.status === 'Waived');
  const allMandatoryApproved = mandatoryList.length > 0 && mandatoryList.length === approvedMandatory.length;
  const blockingClearances = mandatoryList.filter(c => c.status !== 'Approved' && c.status !== 'Waived');

  const handleOpenAction = (clearance: ClearanceItem) => {
    setSelectedClearance(clearance);
    setStatus(clearance.status === 'Objected' ? 'Objected' : 'Approved');
    setComments(clearance.comments || '');
    setObjectionReason(clearance.objectionReason || '');
    setActionError('');
    setModalOpen(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedClearance) return;
    setIsSubmitting(true);
    setActionError('');

    try {
      const res = await api.patch(
        `/refund-requests/${refundRequest._id}/clearances/${selectedClearance.departmentKey}`,
        {
          status,
          comments,
          objectionReason: status === 'Objected' ? objectionReason : undefined,
        }
      );

      if (res.data.success) {
        setModalOpen(false);
        onRefresh();
      } else {
        setActionError(res.data.message || 'Failed to record clearance decision.');
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Error updating clearance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateNoc = async () => {
    if (!allMandatoryApproved) return;
    setIsGeneratingNoc(true);
    setActionError('');

    try {
      const res = await api.post(`/refund-requests/${refundRequest._id}/generate-noc`);
      if (res.data.success) {
        onRefresh();
      } else {
        setActionError(res.data.message || 'Server rejected NOC generation.');
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Error generating NOC certificate');
    } finally {
      setIsGeneratingNoc(false);
    }
  };

  const getStatusBadge = (cStatus: string) => {
    switch (cStatus) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </span>
        );
      case 'Objected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3 mr-1" /> Objected
          </span>
        );
      case 'Waived':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            Waived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 mr-1" /> Awaiting Clearance
          </span>
        );
    }
  };

  return (
    <div className="bg-surface rounded border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-aicte" />
            <h3 className="font-bold text-sm text-text-primary">
              Parallel Multi-Department Clearance Orchestrator
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#E2E8F0] text-slate-700 rounded">
              Feature U2
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Concurrent routing to Regional Office, Approval Bureau, PGRC, and Finance/Vigilance. All mandatory approvals required prior to NOC generation.
          </p>
        </div>

        {/* Clearance progress counter */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-text-secondary font-medium">Status:</span>
          <span className={`font-bold px-2 py-0.5 rounded ${allMandatoryApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {approvedMandatory.length} of {mandatoryList.length} Mandatory Approved
          </span>
        </div>
      </div>

      {actionError && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Clearances Table / List */}
      <div className="divide-y divide-border">
        {clearances.map((c) => (
          <div key={c.departmentKey} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-xs text-text-primary">{c.departmentName}</span>
                {c.isMandatory && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-red-50 text-red-700 border border-red-200 rounded">
                    Mandatory
                  </span>
                )}
                {getStatusBadge(c.status)}
              </div>

              {c.comments && (
                <p className="text-xs text-text-secondary mt-1">
                  <span className="font-medium text-slate-700">Remarks:</span> {c.comments}
                </p>
              )}

              {c.status === 'Objected' && c.objectionReason && (
                <div className="mt-1.5 p-2 bg-red-50/80 border border-red-200 rounded text-xs text-red-800">
                  <span className="font-bold">Objection Raised:</span> {c.objectionReason}
                </div>
              )}

              {c.decidedByName && c.decidedAt && (
                <p className="text-[11px] text-text-muted mt-1">
                  Decided by {c.decidedByName} on {new Date(c.decidedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {hasRole('admin', 'officer') && refundRequest.status !== 'Completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAction(c)}
                className="shrink-0 text-xs"
              >
                Record Bureau Decision
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* NOC Certificate Status Banner & Gating Action */}
      <div className="p-4 bg-slate-50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          {refundRequest.nocGenerated ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800">
                  AICTE Release NOC Generated ({refundRequest.nocCertificateNumber})
                </p>
                <p className="text-[11px] text-emerald-600">
                  Issued on {new Date(refundRequest.nocGeneratedAt || '').toLocaleDateString('en-IN')}. Statutory lien revocation authorized.
                </p>
              </div>
            </div>
          ) : allMandatoryApproved ? (
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs font-semibold text-emerald-800">
                All multi-department clearances satisfied. Case is eligible for AICTE NOC Certificate generation.
              </p>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  NOC Certificate Generation is Locked
                </p>
                <p className="text-[11px] text-slate-500">
                  Pending clearances: {blockingClearances.map(b => b.departmentName).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {hasRole('admin', 'officer') && !refundRequest.nocGenerated && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateNoc}
            disabled={!allMandatoryApproved || isGeneratingNoc}
            isLoading={isGeneratingNoc}
            className="shrink-0"
          >
            Generate Official AICTE NOC
          </Button>
        )}
      </div>

      {/* Decision Recording Modal */}
      {modalOpen && selectedClearance && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Record Clearance Decision: ${selectedClearance.departmentName}`}
        >
          <div className="space-y-4 text-xs">
            {actionError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700">
                {actionError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-text-primary mb-1">Clearance Determination</label>
              <Select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                options={[
                  { value: 'Approved', label: 'Approved (Clearance Granted)' },
                  { value: 'Objected', label: 'Objected (Requires Resolution / Blocks NOC)' },
                  { value: 'Waived', label: 'Waived (Not Applicable by Bureau Policy)' },
                ]}
              />
            </div>

            {status === 'Objected' && (
              <div>
                <label className="block font-semibold text-red-700 mb-1">Objection Reason / Deficiency *</label>
                <Textarea
                  value={objectionReason}
                  onChange={e => setObjectionReason(e.target.value)}
                  placeholder="Detail the audit objection, missing surrender documentation, or active grievance..."
                  rows={3}
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-text-primary mb-1">Official Scrutiny Remarks</label>
              <Textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Enter remarks, reference memos, or compliance notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitDecision}
                isLoading={isSubmitting}
              >
                Confirm Decision
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
