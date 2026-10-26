import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { FDR, AppDocument } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { StatusBadge, Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Input, Select } from '../components/common/Input.js';
import { DiscrepancyBanner } from '../components/ai/DiscrepancyBanner.js';
import { CompletenessBadge } from '../components/ai/CompletenessBadge.js';
import { ReleasePreCheckModal } from '../components/clearances/ReleasePreCheckModal.js';
import {
  FileSpreadsheet,
  Building2,
  Calendar,
  IndianRupee,
  ShieldCheck,
  FileText,
  Download,
  Plus,
  ArrowLeft,
  RotateCcw,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const FDRDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();

  const [fdr, setFdr] = useState<FDR | null>(null);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [completeness, setCompleteness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scrutiny Modal state
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [observationText, setObservationText] = useState('');
  const [newVerificationStatus, setNewVerificationStatus] = useState('Verified');
  const [isSubmittingObs, setIsSubmittingObs] = useState(false);

  // Document Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreCheckOpen, setIsPreCheckOpen] = useState(false);
  const [docType, setDocType] = useState('Bank Confirmation Letter');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchFDRDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/fdrs/${id}`);
      if (res.data.success) {
        setFdr(res.data.fdr);
        setDocuments(res.data.documents || []);
        setCompleteness(res.data.completeness || null);
      }
    } catch (err) {
      console.error('Error fetching FDR details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFDRDetails();
  }, [id]);

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationText) return;
    setIsSubmittingObs(true);
    try {
      const res = await api.post(`/fdrs/${id}/observations`, {
        observation: observationText,
        verificationStatus: newVerificationStatus,
      });
      if (res.data.success) {
        setIsObservationModalOpen(false);
        setObservationText('');
        await fetchFDRDetails();
      }
    } catch (err) {
      console.error('Error adding observation:', err);
    } finally {
      setIsSubmittingObs(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !fdr) return;
    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('institutionId', typeof fdr.institutionId === 'object' ? fdr.institutionId._id : fdr.institutionId);
    formData.append('fdrId', fdr._id);
    formData.append('documentType', docType);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setIsUploadModalOpen(false);
        setFileToUpload(null);
        await fetchFDRDetails();
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Error uploading document.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-text-secondary text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
        Loading FDR dossier...
      </div>
    );
  }

  if (!fdr) {
    return (
      <div className="py-12 text-center text-text-secondary">
        FDR record not found or access denied.
      </div>
    );
  }

  const institution = typeof fdr.institutionId === 'object' ? fdr.institutionId : null;
  const allDiscrepancyFlags = documents.flatMap(d => d.discrepancyFlags || []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Link to="/fdrs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-text-primary font-mono">{fdr.fdrNumber}</h2>
              <StatusBadge status={fdr.currentStatus} />
              <StatusBadge status={fdr.verificationStatus} />
            </div>
            <p className="text-xs text-text-secondary">
              Issuing Bank: <strong className="text-text-primary">{fdr.bankName}</strong> • {institution?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasRole('admin', 'officer') && (
            <Button variant="outline" size="sm" onClick={() => setIsObservationModalOpen(true)}>
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Record Scrutiny
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Upload Document
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsPreCheckOpen(true)}>
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-aicte" /> Release Pre-Check
          </Button>
          <Link to={`/renewals?fdrId=${fdr._id}`}>
            <Button variant="primary" size="sm">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Request Renewal
            </Button>
          </Link>
        </div>
      </div>

      {/* Discrepancy Alert Banner */}
      {allDiscrepancyFlags.length > 0 && (
        <DiscrepancyBanner flags={allDiscrepancyFlags} />
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instrument Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Financial Instrument Details">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-text-secondary block">Deposit Principal</span>
                <span className="text-base font-bold text-text-primary mt-0.5 block">
                  ₹{fdr.depositAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Interest Rate</span>
                <span className="text-sm font-semibold text-text-primary mt-0.5 block">
                  {fdr.interestRate}% p.a.
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Tenure</span>
                <span className="text-sm font-semibold text-text-primary mt-0.5 block">
                  {fdr.tenureMonths} Months
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Date of Issue</span>
                <span className="text-sm font-medium text-text-primary mt-0.5 block">
                  {new Date(fdr.issueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Date of Maturity</span>
                <span className="text-sm font-medium text-text-primary mt-0.5 block">
                  {new Date(fdr.maturityDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Bank IFSC</span>
                <span className="text-sm font-mono font-medium text-text-primary mt-0.5 block">
                  {fdr.ifscCode || '—'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-xs space-y-2">
              <div>
                <span className="text-text-secondary block">Joint Lien Holder Authority:</span>
                <span className="font-semibold text-text-primary">{fdr.jointHolderName}</span>
              </div>
              <div>
                <span className="text-text-secondary block">Bank Branch Location:</span>
                <span className="text-text-primary">{fdr.branchName || 'Not specified'}</span>
              </div>
              {fdr.remarks && (
                <div>
                  <span className="text-text-secondary block">Regulatory Purpose / Remarks:</span>
                  <p className="text-text-primary bg-surface-subtle p-2 rounded border border-border mt-1">
                    {fdr.remarks}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Associated Documents */}
          <Card
            title={`Regulatory Supporting Documents (${documents.length})`}
            description="Verified certificates, bank lien endorsements, and board resolutions."
            action={
              <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add File
              </Button>
            }
          >
            {documents.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">
                No documents uploaded for this FDR yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {documents.map(doc => (
                  <div
                    key={doc._id}
                    className="p-3 rounded-lg border border-border flex items-center justify-between text-xs hover:bg-surface-subtle/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded bg-aicte-subtle text-aicte">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-text-primary block">
                          {doc.originalFilename}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-text-secondary mt-0.5">
                          <span>{doc.documentType}</span>
                          <span>•</span>
                          <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                          {doc.fileHash && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1 py-0.2 rounded border border-slate-200" title={`SHA-256: ${doc.fileHash}`}>
                                SHA-256: {doc.fileHash.substring(0, 8)}...
                              </span>
                            </>
                          )}
                          {doc.integritySignals?.isSafePdf && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">Safe PDF</span>
                            </>
                          )}
                          {doc.ocrExtracted && (
                            <>
                              <span>•</span>
                              <span className="text-aicte font-medium">OCR Parsed</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={doc.verificationStatus} />
                      <a
                        href={`/api/documents/${doc._id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-text-secondary hover:text-aicte rounded hover:bg-surface-subtle"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Regulatory Scrutiny Timeline */}
          <Card
            title="AICTE Scrutiny & Regulatory Observations"
            description="Official observations recorded by AICTE inspection officers."
          >
            {!fdr.scrutinyObservations || fdr.scrutinyObservations.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">
                No regulatory observations recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {fdr.scrutinyObservations.map((obs, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-subtle rounded-md border border-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">
                        {obs.officerName || 'Scrutiny Officer'}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {new Date(obs.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-text-primary whitespace-pre-wrap">{obs.observation}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar Metadata */}
        <div className="space-y-6">
          {/* Priority Card */}
          <Card title="Case Urgency & Prioritization">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Priority Score</span>
                <span className="text-sm font-bold font-mono text-text-primary">
                  {fdr.priorityScore} / 100
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-subtle border border-border text-[11px] text-text-primary">
                <strong>Evaluation:</strong> {fdr.priorityReason}
              </div>
            </div>
          </Card>

          {/* Document Completeness Checklist */}
          {completeness && (
            <Card title="Document Completeness">
              <div className="space-y-3 text-xs">
                <CompletenessBadge
                  score={completeness.score}
                  missingTypes={completeness.missingDocumentTypes}
                />
                <p className="text-text-secondary text-[11px]">
                  {completeness.checklistSummary}
                </p>
              </div>
            </Card>
          )}

          {/* Institution Reference */}
          {institution && (
            <Card title="Technical Institution">
              <div className="space-y-2 text-xs">
                <Link
                  to={`/institutions/${institution._id}`}
                  className="font-bold text-text-primary hover:text-aicte hover:underline block text-sm"
                >
                  {institution.name}
                </Link>
                <p className="text-text-secondary">
                  Code: <span className="font-mono font-medium">{institution.institutionCode}</span>
                </p>
                <p className="text-text-secondary">
                  City: {institution.address.city}, {institution.address.state}
                </p>
                <Link to={`/institutions/${institution._id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Institution Dossier
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Historical Chains (Rollovers) */}
          {(fdr.previousFdrId || fdr.replacementFdrId) && (
            <Card title="Lifecycle Rollover Links">
              <div className="space-y-2 text-xs">
                {fdr.previousFdrId && (
                  <div className="p-2 rounded bg-surface-subtle border border-border">
                    <span className="text-[11px] text-text-secondary block">Replaced Previous FDR:</span>
                    <Link
                      to={`/fdrs/${typeof fdr.previousFdrId === 'object' ? (fdr.previousFdrId as any)._id : fdr.previousFdrId}`}
                      className="font-mono font-semibold text-aicte hover:underline"
                    >
                      {typeof fdr.previousFdrId === 'object' ? (fdr.previousFdrId as any).fdrNumber : fdr.previousFdrId}
                    </Link>
                  </div>
                )}
                {fdr.replacementFdrId && (
                  <div className="p-2 rounded bg-surface-subtle border border-border">
                    <span className="text-[11px] text-text-secondary block">Subsequent Replacement FDR:</span>
                    <Link
                      to={`/fdrs/${typeof fdr.replacementFdrId === 'object' ? (fdr.replacementFdrId as any)._id : fdr.replacementFdrId}`}
                      className="font-mono font-semibold text-aicte hover:underline"
                    >
                      {typeof fdr.replacementFdrId === 'object' ? (fdr.replacementFdrId as any).fdrNumber : fdr.replacementFdrId}
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Record Scrutiny Observation Modal */}
      <Modal
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        title="Record AICTE Scrutiny Observation"
        description="Add official regulatory review notes and update instrument verification status."
      >
        <form onSubmit={handleAddObservation} className="space-y-4">
          <div>
            <Select
              label="Update Verification Status"
              value={newVerificationStatus}
              onChange={e => setNewVerificationStatus(e.target.value)}
            >
              <option value="Verified">Verified (Compliant)</option>
              <option value="Under Scrutiny">Under Scrutiny</option>
              <option value="Additional Information Required">Additional Information Required</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Officer Scrutiny Observation Remarks *
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-aicte"
              placeholder="e.g. Scrutinized against branch confirmation. Lien marked in favor of Regional Officer, AICTE. Instrument genuine and verified."
              value={observationText}
              onChange={e => setObservationText(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsObservationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingObs}>
              Save Observation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Supporting Document"
        description="Upload FDR certificate, bank endorsement letter, or board resolution."
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          {uploadError && (
            <div className="p-3 bg-status-danger-bg text-status-danger rounded text-xs">
              {uploadError}
            </div>
          )}

          <div>
            <Select
              label="Document Classification Type"
              value={docType}
              onChange={e => setDocType(e.target.value)}
            >
              <option value="FDR Certificate">FDR Certificate</option>
              <option value="Bank Confirmation Letter">Bank Confirmation Letter / Lien Endorsement</option>
              <option value="Renewal Request Letter">Renewal Request Letter</option>
              <option value="Board Resolution">Board Resolution / Trust Deed</option>
              <option value="Other">Other Regulatory Supporting Document</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Select Document File (.pdf, .png, .jpg) *
            </label>
            <input
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg"
              className="w-full text-xs text-text-primary file:mr-3 file:py-2 file:px-3 file:rounded file:border file:border-border file:text-xs file:font-semibold file:bg-surface-subtle file:text-text-primary hover:file:bg-[#E3E7ED]"
              onChange={e => setFileToUpload(e.target.files ? e.target.files[0] : null)}
            />
            <span className="text-[10px] text-text-secondary mt-1 block">
              Max file size: 10MB. Document will be scanned automatically for OCR discrepancy checks.
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isUploading}>
              Upload & Scan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Release Pre-Check Modal (U3) */}
      <ReleasePreCheckModal
        isOpen={isPreCheckOpen}
        onClose={() => setIsPreCheckOpen(false)}
        fdrId={fdr._id}
      />
    </div>
  );
};
