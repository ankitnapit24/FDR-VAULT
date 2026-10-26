import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { AuditLogItem, AuditIntegrityVerificationResult } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
} from '../components/common/Table.js';
import { History, Shield, ShieldCheck, AlertCircle, CheckCircle2, Lock, RefreshCw } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Cryptographic Ledger Verification State (U8)
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [verificationResult, setVerificationResult] = useState<AuditIntegrityVerificationResult | null>(null);

  const fetchLogs = async (currPage = page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType) params.append('entityType', entityType);
      if (actorRole) params.append('actorRole', actorRole);
      params.append('page', currPage.toString());
      params.append('limit', '15');

      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLedgerIntegrity = async () => {
    setVerifyingChain(true);
    try {
      const res = await api.get('/audit-logs/verify-integrity');
      setVerificationResult(res.data);
    } catch (err: any) {
      setVerificationResult({
        valid: false,
        totalBlocks: 0,
        genesisHash: '',
        error: err.response?.data?.message || err.message || 'Verification failed',
      });
    } finally {
      setVerifyingChain(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    setPage(1);
  }, [entityType, actorRole]);

  return (
    <div className="space-y-5">
      {/* Page Title & Cryptographic Chain Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-aicte" />
            <h1 className="text-xl font-bold text-text-primary">
              Tamper-Evident SHA-256 Audit Ledger Chain
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-aicte-subtle text-aicte rounded border border-[#D0DFEF]">
              Feature U8
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Sequentially linked SHA-256 cryptographic chain. Every administrative action, document endorsement, and status transition is immutably anchored.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={verifyLedgerIntegrity}
          isLoading={verifyingChain}
          className="shrink-0"
        >
          <Lock className="w-3.5 h-3.5 mr-1" /> Verify Cryptographic Integrity
        </Button>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div className={`p-4 rounded border text-xs flex items-start space-x-3 ${
          verificationResult.valid 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-red-50 border-red-300 text-red-900'
        }`}>
          {verificationResult.valid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <p className="font-bold text-sm">
              {verificationResult.valid 
                ? `Cryptographic Ledger Verified: All ${verificationResult.totalBlocks} Blocks Tamper-Free` 
                : 'Cryptographic Chain Verification Failed'}
            </p>
            <p className="text-[11px] opacity-90">
              {verificationResult.valid 
                ? 'Every block sequence, canonical event payload, and SHA-256 previous-hash reference matches with zero mathematical discrepancy from Genesis Block.' 
                : verificationResult.error}
            </p>
            {verificationResult.latestHash && (
              <p className="text-[10px] font-mono opacity-80 pt-1">
                Latest Ledger Root Hash: <span className="font-bold">{verificationResult.latestHash}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filter toolbar */}
      <Card className="!p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <select
              value={entityType}
              onChange={e => setEntityType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-aicte"
            >
              <option value="">All Entity Types</option>
              <option value="FDR">FDR Instruments</option>
              <option value="Document">Supporting Documents</option>
              <option value="Institution">Technical Institutions</option>
              <option value="RenewalRequest">Renewal Requests</option>
              <option value="RefundRequest">Refund Applications</option>
              <option value="User">User Accounts</option>
              <option value="SystemSetting">System Settings</option>
              <option value="Trust">Educational Trusts</option>
              <option value="PolicyRule">Policy Rules</option>
            </select>
          </div>
          <div>
            <select
              value={actorRole}
              onChange={e => setActorRole(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-aicte"
            >
              <option value="">All Actor Roles</option>
              <option value="admin">Administrators</option>
              <option value="officer">Scrutiny Officers</option>
              <option value="institution">Institution Representatives</option>
              <option value="trust">Trust Trustees</option>
              <option value="System">Automated System Jobs</option>
            </select>
          </div>
          <div className="flex items-center text-xs text-text-secondary justify-end">
            <span>Total chained blocks: <strong>{total}</strong></span>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      {isLoading ? (
        <div className="py-12 text-center text-text-secondary text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
          Loading audit entries...
        </div>
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Block #</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor (Role)</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Block Hash (SHA-256)</TableHead>
                <TableHead>Previous Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-text-secondary" colSpan={7}>
                    No audit records found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log._id}>
                    <TableCell className="text-xs font-mono font-bold text-aicte">
                      #{log.sequenceNumber || 1}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-text-secondary whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-surface-subtle text-text-primary border border-border">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-text-primary">
                      <span className="font-semibold block">{log.actorName}</span>
                      <span className="text-[10px] text-text-muted capitalize">({log.actorRole})</span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-aicte">
                      <span className="block">{log.entityType}</span>
                      <span className="text-[10px] font-mono text-text-muted">{log.entityId}</span>
                    </TableCell>
                    <TableCell className="text-[11px] font-mono text-slate-700">
                      {log.currentHash ? (
                        <span title={log.currentHash} className="cursor-help bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {log.currentHash.substring(0, 10)}...{log.currentHash.substring(58)}
                        </span>
                      ) : (
                        <span className="text-text-muted italic">Legacy</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[11px] font-mono text-slate-500">
                      {log.previousHash ? (
                        <span title={log.previousHash} className="cursor-help">
                          {log.previousHash.substring(0, 8)}...
                        </span>
                      ) : (
                        'Genesis'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / 15) || 1}
            onPageChange={newPage => {
              setPage(newPage);
              fetchLogs(newPage);
            }}
            totalRecords={total}
          />
        </div>
      )}
    </div>
  );
};
