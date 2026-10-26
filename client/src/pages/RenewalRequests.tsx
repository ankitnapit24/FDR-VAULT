import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { RenewalRequest, FDR } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input, Select } from '../components/common/Input.js';
import { StatusBadge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
} from '../components/common/Table.js';
import {
  RotateCcw,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const RenewalRequests: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedFdrId = searchParams.get('fdrId');

  const [renewals, setRenewals] = useState<RenewalRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Renewal Request Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [availableFdrs, setAvailableFdrs] = useState<FDR[]>([]);
  const [selectedFdrId, setSelectedFdrId] = useState(preselectedFdrId || '');
  const [renewalReason, setRenewalReason] = useState('');
  const [proposedTenure, setProposedTenure] = useState(60);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newError, setNewError] = useState('');

  // Officer Decision Modal
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalRequest | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'Approved' | 'Rejected' | 'Additional Information Required'>('Approved');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [newFdrNumber, setNewFdrNumber] = useState('');
  const [newMaturityDate, setNewMaturityDate] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  const fetchRenewals = async (currPage = page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', currPage.toString());
      params.append('limit', '10');

      const res = await api.get(`/renewals?${params.toString()}`);
      if (res.data.success) {
        setRenewals(res.data.renewals);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching renewal requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewals(1);
    setPage(1);
  }, [statusFilter]);

  // Load available FDRs when opening new request modal
  useEffect(() => {
    async function loadFdrs() {
      try {
        const res = await api.get('/fdrs?limit=50');
        if (res.data.success) {
          setAvailableFdrs(res.data.fdrs);
          if (!selectedFdrId && res.data.fdrs.length > 0) {
            setSelectedFdrId(res.data.fdrs[0]._id);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    if (isNewModalOpen || preselectedFdrId) {
      loadFdrs();
      if (preselectedFdrId) {
        setIsNewModalOpen(true);
      }
    }
  }, [isNewModalOpen, preselectedFdrId]);

  const handleCreateRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFdrId || !renewalReason) return;
    setIsSubmittingNew(true);
    setNewError('');

    try {
      const res = await api.post('/renewals', {
        existingFdrId: selectedFdrId,
        reason: renewalReason,
        proposedTenureMonths: Number(proposedTenure),
      });
      if (res.data.success) {
        setIsNewModalOpen(false);
        setRenewalReason('');
        await fetchRenewals(1);
      }
    } catch (err: any) {
      setNewError(err.response?.data?.message || 'Error creating renewal request.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleOpenDecision = (renewal: RenewalRequest) => {
    setSelectedRenewal(renewal);
    setDecisionStatus('Approved');
    setDecisionRemarks('Renewal request approved. Rollover FDR issued.');
    setNewFdrNumber(`${renewal.existingFdrId?.fdrNumber}-R2`);
    // default 5 years in future
    const dateFuture = new Date();
    dateFuture.setFullYear(dateFuture.getFullYear() + 5);
    setNewMaturityDate(dateFuture.toISOString().slice(0, 10));
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRenewal) return;
    setIsSubmittingDecision(true);

    try {
      const payload: any = {
        status: decisionStatus,
        reviewRemarks: decisionRemarks,
      };

      if (decisionStatus === 'Approved') {
        payload.replacementFdrData = {
          fdrNumber: newFdrNumber,
          bankName: selectedRenewal.existingFdrId?.bankName,
          depositAmount: selectedRenewal.existingFdrId?.depositAmount,
          maturityDate: newMaturityDate,
        };
      }

      const res = await api.patch(`/renewals/${selectedRenewal._id}/status`, payload);
      if (res.data.success) {
        setSelectedRenewal(null);
        await fetchRenewals(page);
      }
    } catch (err) {
      console.error('Error submitting renewal decision:', err);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            FDR Renewal & Replacement Applications
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Formal institutional requests to extend, rollover, or substitute fixed deposit instruments.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-44">
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsNewModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Renewal Request
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-text-secondary text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
          Loading renewal requests...
        </div>
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Ref Number</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Existing FDR</TableHead>
                <TableHead>Tenure</TableHead>
                <TableHead>Reason / Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Replacement Link</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {renewals.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-text-secondary" colSpan={8}>
                    No renewal requests found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                renewals.map(r => {
                  const inst = typeof r.institutionId === 'object' ? r.institutionId : null;
                  return (
                    <TableRow key={r._id}>
                      <TableCell className="font-mono font-bold text-xs text-text-primary">
                        {r.requestReference}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-text-primary block truncate max-w-[180px] text-xs">
                          {inst?.name || 'Institution'}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">
                          {inst?.institutionCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/fdrs/${r.existingFdrId?._id}`}
                          className="font-mono text-xs font-semibold text-aicte hover:underline block"
                        >
                          {r.existingFdrId?.fdrNumber}
                        </Link>
                        <span className="text-[10px] text-text-secondary">
                          ₹{r.existingFdrId?.depositAmount?.toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{r.proposedTenureMonths}m</TableCell>
                      <TableCell className="text-xs text-text-primary max-w-xs truncate">
                        {r.reason}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell>
                        {r.replacementFdrId ? (
                          <Link
                            to={`/fdrs/${r.replacementFdrId._id}`}
                            className="font-mono text-xs font-semibold text-status-success hover:underline"
                          >
                            {r.replacementFdrId.fdrNumber}
                          </Link>
                        ) : (
                          <span className="text-text-secondary text-xs italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasRole('admin', 'officer') && r.status === 'Submitted' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenDecision(r)}
                          >
                            Review
                          </Button>
                        ) : (
                          <span className="text-xs text-text-secondary">Logged</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / 10)}
            onPageChange={newPage => {
              setPage(newPage);
              fetchRenewals(newPage);
            }}
            totalRecords={total}
          />
        </div>
      )}

      {/* New Renewal Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Submit FDR Renewal Request"
        description="Initiate formal AICTE approval for FDR rollover upon maturity."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRenewal} className="space-y-4">
          {newError && (
            <div className="p-3 bg-status-danger-bg text-status-danger rounded text-xs">
              {newError}
            </div>
          )}

          <div>
            <Select
              label="Select Existing FDR Instrument"
              required
              value={selectedFdrId}
              onChange={e => setSelectedFdrId(e.target.value)}
            >
              <option value="">Select FDR record...</option>
              {availableFdrs.map(f => (
                <option key={f._id} value={f._id}>
                  {f.fdrNumber} — {f.bankName} (₹{f.depositAmount.toLocaleString('en-IN')})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Proposed Rollover Tenure (Months)"
              type="number"
              required
              value={proposedTenure}
              onChange={e => setProposedTenure(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Reason & Regulatory Justification *
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-aicte"
              placeholder="e.g. Existing 5-year security deposit maturing next month. Requesting extension for another 60 months in joint custody of Regional Officer..."
              value={renewalReason}
              onChange={e => setRenewalReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingNew}>
              Submit Renewal Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Officer Decision Modal */}
      {selectedRenewal && (
        <Modal
          isOpen={!!selectedRenewal}
          onClose={() => setSelectedRenewal(null)}
          title="Approve / Review Renewal Application"
          description={`Process renewal application ${selectedRenewal.requestReference}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitDecision} className="space-y-4">
            <div>
              <Select
                label="Regulatory Decision"
                value={decisionStatus}
                onChange={e => setDecisionStatus(e.target.value as any)}
              >
                <option value="Approved">Approve Renewal & Generate Rollover FDR</option>
                <option value="Additional Information Required">Request Additional Information</option>
                <option value="Rejected">Reject Renewal</option>
              </Select>
            </div>

            {decisionStatus === 'Approved' && (
              <div className="p-3 bg-surface-subtle border border-border rounded-lg space-y-3">
                <p className="text-xs font-semibold text-text-primary">
                  Replacement Instrument Metadata (Preserves Historical FDR Chain)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Replacement FDR Number"
                    required
                    value={newFdrNumber}
                    onChange={e => setNewFdrNumber(e.target.value)}
                  />
                  <Input
                    label="New Maturity Date"
                    type="date"
                    required
                    value={newMaturityDate}
                    onChange={e => setNewMaturityDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Officer Remarks & Decision Notes
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-aicte"
                value={decisionRemarks}
                onChange={e => setDecisionRemarks(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <Button variant="outline" type="button" onClick={() => setSelectedRenewal(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmittingDecision}>
                Confirm Decision
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
