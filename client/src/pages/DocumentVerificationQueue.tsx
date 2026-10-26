import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { AppDocument } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Select } from '../components/common/Input.js';
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
  FileCheck,
  AlertTriangle,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const DocumentVerificationQueue: React.FC = () => {
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Review & Decision Modal
  const [selectedDoc, setSelectedDoc] = useState<AppDocument | null>(null);
  const [decision, setDecision] = useState<'Verified' | 'Rejected' | 'Additional Information Required'>('Verified');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async (currPage = page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', currPage.toString());
      params.append('limit', '10');

      const res = await api.get(`/documents/verification-queue?${params.toString()}`);
      if (res.data.success) {
        setDocuments(res.data.documents);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching verification queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(1);
    setPage(1);
  }, [statusFilter]);

  const handleOpenDecision = (doc: AppDocument) => {
    setSelectedDoc(doc);
    setDecision('Verified');
    setRemarks('');
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setIsSubmitting(true);

    try {
      const res = await api.post(`/documents/${selectedDoc._id}/verify`, {
        verificationStatus: decision,
        verificationRemarks: remarks,
      });
      if (res.data.success) {
        setSelectedDoc(null);
        await fetchQueue(page);
      }
    } catch (err) {
      console.error('Error submitting verification decision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Regulatory Document Verification Queue
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Examine uploaded FDR certificates, inspect OCR extractions, and endorse regulatory validity.
          </p>
        </div>
        <div className="w-56">
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Pending / Under Review</option>
            <option value="Verified">Show Verified</option>
            <option value="Rejected">Show Rejected</option>
            <option value="Additional Information Required">Additional Info Required</option>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-text-secondary text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
          Loading verification dossier...
        </div>
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Document File</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Linked FDR</TableHead>
                <TableHead>OCR / Scrutiny Flags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-text-secondary" colSpan={7}>
                    No documents currently pending verification.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map(doc => {
                  const inst = typeof doc.institutionId === 'object' ? doc.institutionId : null;
                  const fdr = typeof doc.fdrId === 'object' ? doc.fdrId : null;
                  const hasDiscrepancy = doc.discrepancyFlags && doc.discrepancyFlags.length > 0;

                  return (
                    <TableRow key={doc._id}>
                      <TableCell>
                        <span className="font-semibold text-text-primary block text-xs">
                          {doc.originalFilename}
                        </span>
                        <span className="text-[11px] text-text-secondary">
                          {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {doc.documentType}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-text-primary block truncate max-w-[180px] text-xs">
                          {inst?.name || 'Assigned Institution'}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">
                          {inst?.institutionCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        {fdr ? (
                          <Link
                            to={`/fdrs/${fdr._id}`}
                            className="font-mono text-xs font-semibold text-aicte hover:underline block"
                          >
                            {fdr.fdrNumber}
                          </Link>
                        ) : (
                          <span className="text-text-secondary text-xs italic">Unlinked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasDiscrepancy ? (
                          <span className="inline-flex items-center text-xs font-bold text-status-danger bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            {doc.discrepancyFlags.length} Discrepancy
                          </span>
                        ) : doc.ocrExtracted ? (
                          <span className="inline-flex items-center text-xs text-status-success font-medium">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            OCR Matched
                          </span>
                        ) : (
                          <span className="text-text-secondary text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.verificationStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <a
                            href={`/api/documents/${doc._id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-text-secondary hover:text-aicte"
                            title="Download Document"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenDecision(doc)}
                          >
                            Scrutinize
                          </Button>
                        </div>
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
              fetchQueue(newPage);
            }}
            totalRecords={total}
          />
        </div>
      )}

      {/* Decision Modal */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title="Document Scrutiny Decision"
          description={`Review and endorse ${selectedDoc.originalFilename}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitDecision} className="space-y-4">
            {selectedDoc.discrepancyFlags && selectedDoc.discrepancyFlags.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-status-danger">
                <strong>Attention Scrutiny Officer:</strong> Automated discrepancy check detected {selectedDoc.discrepancyFlags.length} mismatch(es) with database records.
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  {selectedDoc.discrepancyFlags.map((flag, idx) => (
                    <li key={idx}>{flag.description}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <Select
                label="Scrutiny Regulatory Outcome"
                value={decision}
                onChange={e => setDecision(e.target.value as any)}
              >
                <option value="Verified">Endorse as Verified (Compliant)</option>
                <option value="Additional Information Required">Request Additional Information</option>
                <option value="Rejected">Reject Document</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Official Scrutiny Remarks
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-aicte"
                placeholder="e.g. Scrutinized by Regional Officer. Bank lien endorsed in favor of AICTE. Document accepted."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <Button variant="outline" type="button" onClick={() => setSelectedDoc(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting}>
                Submit Decision
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
