import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { RefundRequest, FDR } from '../types/index.js';
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
  CreditCard,
  Plus,
  RefreshCw,
  Building2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const RefundRequestsList: React.FC = () => {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Request Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableFdrs, setAvailableFdrs] = useState<FDR[]>([]);
  const [selectedFdrId, setSelectedFdrId] = useState('');
  const [reason, setReason] = useState<any>('Closure of Program');
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [ifscCode, setIfscCode] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRefunds = async (currPage = page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', currPage.toString());
      params.append('limit', '10');

      const res = await api.get(`/refund-requests?${params.toString()}`);
      if (res.data.success) {
        setRefunds(res.data.refunds);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching refunds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds(1);
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    async function loadFdrs() {
      try {
        const res = await api.get('/fdrs?limit=50');
        if (res.data.success) {
          setAvailableFdrs(res.data.fdrs);
          if (!selectedFdrId && res.data.fdrs.length > 0) {
            setSelectedFdrId(res.data.fdrs[0]._id);
            setRefundAmount(res.data.fdrs[0].depositAmount);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    if (isModalOpen) {
      loadFdrs();
    }
  }, [isModalOpen]);

  const handleSelectFdr = (fdrId: string) => {
    setSelectedFdrId(fdrId);
    const matched = availableFdrs.find(f => f._id === fdrId);
    if (matched) {
      setRefundAmount(matched.depositAmount);
    }
  };

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFdrId || !refundAmount || !accountNumber || !ifscCode) return;
    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await api.post('/refund-requests', {
        fdrId: selectedFdrId,
        reason,
        refundAmount: Number(refundAmount),
        bankDetails: {
          accountHolderName: holderName || 'Institution Trust Account',
          accountNumber,
          bankName,
          ifscCode,
        },
        remarks,
      });

      if (res.data.success) {
        setIsModalOpen(false);
        await fetchRefunds(1);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error creating refund application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Security Deposit Refund & Release Applications
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Formal requests for statutory deposit surrender following program closure or excess contribution.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-52">
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Workflow Stages</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Document Review">Under Document Review</option>
              <option value="Under Approval">Under Approval</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Release Application
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-text-secondary text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
          Loading refund dossiers...
        </div>
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Application Ref</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>FDR Instrument</TableHead>
                <TableHead>Requested Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Workflow Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {refunds.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-text-secondary" colSpan={7}>
                    No refund or release applications found.
                  </TableCell>
                </TableRow>
              ) : (
                refunds.map(ref => {
                  const inst = typeof ref.institutionId === 'object' ? ref.institutionId : null;
                  return (
                    <TableRow key={ref._id}>
                      <TableCell className="font-mono font-bold text-xs text-text-primary">
                        <Link to={`/refunds/${ref._id}`} className="hover:text-aicte hover:underline block">
                          {ref.requestReference}
                        </Link>
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
                        <span className="font-mono text-xs font-semibold text-text-primary block">
                          {ref.fdrId?.fdrNumber || 'FDR Instrument'}
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          {ref.fdrId?.bankName}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-text-primary">
                        ₹{ref.refundAmount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-xs">{ref.reason}</TableCell>
                      <TableCell>
                        <StatusBadge status={ref.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/refunds/${ref._id}`}>
                          <Button variant="outline" size="sm">
                            View Dossier
                          </Button>
                        </Link>
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
              fetchRefunds(newPage);
            }}
            totalRecords={total}
          />
        </div>
      )}

      {/* New Refund Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Security Deposit Release / Refund Application"
        description="Formal statutory application to discharge AICTE deposit lien."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRefund} className="space-y-4">
          {formError && (
            <div className="p-3 bg-status-danger-bg text-status-danger rounded text-xs">
              {formError}
            </div>
          )}

          <div>
            <Select
              label="Select FDR for Statutory Release"
              required
              value={selectedFdrId}
              onChange={e => handleSelectFdr(e.target.value)}
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
            <Select
              label="Regulatory Grounds for Release"
              value={reason}
              onChange={e => setReason(e.target.value as any)}
            >
              <option value="Closure of Program">Closure of Program</option>
              <option value="Reduction in Intake">Reduction in Intake</option>
              <option value="Excess Deposit">Excess Deposit</option>
              <option value="Statutory Release">Statutory Release</option>
              <option value="Other">Other Ground</option>
            </Select>

            <Input
              label="Requested Refund Amount (₹)"
              type="number"
              required
              value={refundAmount}
              onChange={e => setRefundAmount(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div className="p-3 bg-surface-subtle border border-border rounded-lg space-y-3">
            <span className="text-xs font-semibold text-text-primary block">
              Disbursement Bank Account Particulars
            </span>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Account Holder Legal Name"
                required
                placeholder="e.g. Society / Trust Legal Account"
                value={holderName}
                onChange={e => setHolderName(e.target.value)}
              />
              <Input
                label="Bank Account Number"
                required
                placeholder="Account number"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Beneficiary Bank Name"
                required
                value={bankName}
                onChange={e => setBankName(e.target.value)}
              />
              <Input
                label="Branch IFSC Code"
                required
                placeholder="IFSC Code"
                value={ifscCode}
                onChange={e => setIfscCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Remarks & Regulatory Submission Notes
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-aicte"
              placeholder="e.g. Council NOC attached. Intake reduction from 120 to 60 seats approved in academic council resolution..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
