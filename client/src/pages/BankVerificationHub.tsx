import React, { useState, useEffect } from 'react';
import { Landmark, Search, CheckCircle2, XCircle, AlertTriangle, Clock, Plus, ExternalLink, ShieldAlert } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Modal } from '../components/common/Modal.js';
import { Select } from '../components/common/Select.js';
import { Textarea } from '../components/common/Textarea.js';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/common/Table.js';
import { BankVerificationRequest } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';

export const BankVerificationHub: React.FC = () => {
  const { hasRole } = useAuth();
  const [requests, setRequests] = useState<BankVerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // IFSC Validator State
  const [ifscInput, setIfscInput] = useState('SBIN0007831');
  const [ifscResult, setIfscResult] = useState<any>(null);
  const [ifscLoading, setIfscLoading] = useState(false);

  // Modal State
  const [selectedTicket, setSelectedTicket] = useState<BankVerificationRequest | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('Verified');
  const [officerName, setOfficerName] = useState('');
  const [officerDesignation, setOfficerDesignation] = useState('');
  const [responseNotes, setResponseNotes] = useState('');
  const [lienConfirmed, setLienConfirmed] = useState(true);
  const [amountConfirmed, setAmountConfirmed] = useState<number>(0);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bank-verification');
      if (res.data.success) {
        setRequests(res.data.tickets || res.data.requests || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bank verification tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleValidateIfsc = async () => {
    if (!ifscInput) return;
    setIfscLoading(true);
    setIfscResult(null);

    try {
      const res = await api.get(`/bank-verification/validate-ifsc/${ifscInput.trim().toUpperCase()}`);
      const payload = res.data.lookup || res.data;
      setIfscResult(payload);
    } catch (err: any) {
      setIfscResult({
        success: false,
        isValidSyntax: false,
        validSyntax: false,
        message: err.response?.data?.message || 'IFSC validation failed',
      });
    } finally {
      setIfscLoading(false);
    }
  };

  const handleOpenUpdateModal = (ticket: BankVerificationRequest) => {
    setSelectedTicket(ticket);
    setUpdateStatus(ticket.status === 'Verified' ? 'Verified' : 'Responded');
    setOfficerName(ticket.bankOfficerName || '');
    setOfficerDesignation(ticket.bankOfficerDesignation || '');
    setResponseNotes(ticket.responseNotes || '');
    setLienConfirmed(ticket.lienConfirmed ?? true);
    setAmountConfirmed(ticket.amountConfirmed || ticket.claimedDepositAmount);
    setUpdateModalOpen(true);
  };

  const handleSaveResponse = async () => {
    if (!selectedTicket) return;
    setSubmittingUpdate(true);

    try {
      const res = await api.patch(`/bank-verification/${selectedTicket._id}/status`, {
        status: updateStatus,
        bankOfficerName: officerName,
        bankOfficerDesignation: officerDesignation,
        responseNotes,
        lienConfirmed,
        amountConfirmed,
      });

      if (res.data.success) {
        setUpdateModalOpen(false);
        fetchTickets();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to record bank response.');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
          </span>
        );
      case 'Responded':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            Responded
          </span>
        );
      case 'Pending Response':
      case 'Submitted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 mr-1" /> Pending Bank
          </span>
        );
      case 'Unable to Verify':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3 mr-1" /> Unable to Verify
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Official Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Landmark className="w-6 h-6 text-aicte" />
            <h1 className="text-xl font-bold text-text-primary">
              Bank Verification & Duplicate FDR Detection Hub
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Standardized tracking of bank verification requests, SFMS inquiries, and formal bank lien confirmation.
          </p>
        </div>

        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <ShieldAlert className="w-3.5 h-3.5 mr-1" /> DEMO / MOCK INTEGRATION MODE
        </span>
      </div>

      {/* Mock Notice Box */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed">
        <span className="font-bold">Regulatory & Architecture Notice: </span>
        Direct programmatic core-banking FDR lien verification requires an official bilateral SFMS / Structured Financial Messaging System gateway agreement or authorized open-banking API access with individual schedule commercial banks. This module demonstrates the end-to-end inquiry dispatch, regex IFSC validation, and human-in-the-loop liaison lifecycle.
      </div>

      {/* IFSC Code Syntax & Routing Validator Card */}
      <div className="bg-surface rounded border border-border p-5 shadow-xs">
        <h2 className="font-bold text-sm text-text-primary mb-1 flex items-center space-x-1.5">
          <span>IFSC Syntax Validator & Branch Directory Lookup</span>
        </h2>
        <p className="text-xs text-text-secondary mb-3">
          Verifies standard RBI IFSC regex syntax (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">^[A-Z]&#123;4&#125;0[A-Z0-9]&#123;6&#125;$</code>) and returns branch routing coordinates.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <Input
            value={ifscInput}
            onChange={e => setIfscInput(e.target.value.toUpperCase())}
            placeholder="e.g. SBIN0007831, HDFC0001004"
            className="font-mono uppercase text-xs"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleValidateIfsc}
            isLoading={ifscLoading}
            className="shrink-0"
          >
            <Search className="w-3.5 h-3.5 mr-1" /> Validate IFSC
          </Button>
        </div>

        {ifscResult && (
          <div className="mt-4 p-3.5 rounded border text-xs space-y-1.5 bg-[#F8FAFC] border-[#CBD5E1]">
            <div className="flex items-center space-x-2">
              {ifscResult.isValidFormat || ifscResult.validSyntax ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="font-bold text-text-primary">
                {ifscResult.isValidFormat || ifscResult.validSyntax ? 'Valid RBI IFSC Structure' : 'Invalid IFSC Format'}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded">
                {ifscInput}
              </span>
            </div>

            {ifscResult.bankName && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-text-muted text-[10px] block">Identified Issuing Bank</span>
                <span className="font-semibold text-text-primary text-xs">{ifscResult.bankName}</span>
                <p className="text-[11px] text-text-secondary mt-1">{ifscResult.sourceNote}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bank Verification Tickets List */}
      <div className="bg-surface rounded border border-border overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-[#F8FAFC] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-text-primary">
              Active Bank Verification Tickets ({requests.length})
            </h2>
            <p className="text-xs text-text-secondary">
              Liaison inquiries dispatched to issuing scheduled commercial bank branches.
            </p>
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket Ref</TableHead>
                <TableHead>FDR Details</TableHead>
                <TableHead>Bank / Branch</TableHead>
                <TableHead>IFSC Code</TableHead>
                <TableHead>Deposit Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bank Response Summary</TableHead>
                {hasRole('admin', 'officer') && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-text-muted text-xs">
                    No bank verification tickets on record.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map(ticket => (
                  <TableRow key={ticket._id}>
                    <TableCell className="font-mono font-semibold text-xs text-aicte">
                      {ticket.requestReference}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-xs text-text-primary block font-mono">
                        {ticket.fdrNumber}
                      </span>
                      <span className="text-[10px] text-text-muted block">
                        Method: {ticket.verificationMethod}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-text-primary block">{ticket.bankName}</span>
                      <span className="text-[11px] text-text-secondary block">{ticket.branchName}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{ticket.ifscCode}</TableCell>
                    <TableCell className="font-semibold text-xs text-text-primary">
                      ₹{ticket.claimedDepositAmount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="max-w-xs text-xs text-text-secondary">
                      {ticket.responseNotes ? (
                        <div>
                          <p className="truncate">{ticket.responseNotes}</p>
                          {ticket.bankOfficerName && (
                            <p className="text-[10px] text-text-muted">
                              Resp: {ticket.bankOfficerName} ({ticket.bankOfficerDesignation})
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-muted italic">Awaiting branch response...</span>
                      )}
                    </TableCell>
                    {hasRole('admin', 'officer') && (
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenUpdateModal(ticket)}
                          className="text-xs"
                        >
                          Record Response
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Response Modal */}
      {updateModalOpen && selectedTicket && (
        <Modal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          title={`Record Bank Branch Response: ${selectedTicket.requestReference}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-text-primary mb-1">Verification Status</label>
              <Select
                value={updateStatus}
                onChange={e => setUpdateStatus(e.target.value)}
                options={[
                  { value: 'Verified', label: 'Verified (Lien & Amount Confirmed)' },
                  { value: 'Responded', label: 'Responded (Under Scrutiny)' },
                  { value: 'Unable to Verify', label: 'Unable to Verify (Record Missing / Discrepancy)' },
                  { value: 'Pending Response', label: 'Pending Response' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-text-primary mb-1">Bank Officer Name</label>
                <Input
                  value={officerName}
                  onChange={e => setOfficerName(e.target.value)}
                  placeholder="e.g. R. K. Malhotra"
                />
              </div>
              <div>
                <label className="block font-semibold text-text-primary mb-1">Officer Designation</label>
                <Input
                  value={officerDesignation}
                  onChange={e => setOfficerDesignation(e.target.value)}
                  placeholder="e.g. Chief Manager"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-text-primary mb-1">Confirmed Deposit Amount (₹)</label>
                <Input
                  type="number"
                  value={amountConfirmed}
                  onChange={e => setAmountConfirmed(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center space-x-2 pt-5">
                <input
                  type="checkbox"
                  id="lienConfirmed"
                  checked={lienConfirmed}
                  onChange={e => setLienConfirmed(e.target.checked)}
                  className="w-4 h-4 text-aicte rounded"
                />
                <label htmlFor="lienConfirmed" className="font-semibold text-text-primary">
                  AICTE Joint Lien Confirmed
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-text-primary mb-1">Bank Branch Response Notes</label>
              <Textarea
                value={responseNotes}
                onChange={e => setResponseNotes(e.target.value)}
                placeholder="Enter folio number, bank communication ref, or findings..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setUpdateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveResponse}
                isLoading={submittingUpdate}
              >
                Save Bank Response
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
