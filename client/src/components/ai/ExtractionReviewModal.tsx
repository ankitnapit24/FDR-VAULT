import React from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { CheckCircle, AlertTriangle, FileText } from 'lucide-react';

interface ExtractionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData?: {
    fdrNumber?: string;
    bankName?: string;
    depositAmount?: number;
    issueDate?: string;
    maturityDate?: string;
    rawText?: string;
    confidence?: number;
  };
  enteredData?: {
    fdrNumber?: string;
    bankName?: string;
    depositAmount?: number;
    issueDate?: string;
    maturityDate?: string;
  };
  onConfirmValues?: (confirmedData: any) => void;
}

export const ExtractionReviewModal: React.FC<ExtractionReviewModalProps> = ({
  isOpen,
  onClose,
  extractedData,
  enteredData,
  onConfirmValues,
}) => {
  if (!extractedData) return null;

  const fields = [
    { label: 'FDR Reference Number', key: 'fdrNumber', format: (v: any) => v || 'Not detected' },
    { label: 'Issuing Bank Name', key: 'bankName', format: (v: any) => v || 'Not detected' },
    {
      label: 'Deposit Amount',
      key: 'depositAmount',
      format: (v: any) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : 'Not detected'),
    },
    { label: 'Issue Date', key: 'issueDate', format: (v: any) => v || 'Not detected' },
    { label: 'Maturity Date', key: 'maturityDate', format: (v: any) => v || 'Not detected' },
  ];

  const confidencePct = Math.round((extractedData.confidence || 0) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Document Intelligence — FDR Data Scrutiny"
      description="Compare values extracted via OCR against manual record entries."
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Quality indicator banner */}
        <div className="flex items-center justify-between p-3 bg-aicte-subtle/70 rounded-md border border-[#D0DFEF]">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-aicte" />
            <span className="text-xs font-medium text-text-primary">
              Automated OCR & Document Parser
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-aicte border border-border">
            Extraction Confidence: {confidencePct}%
          </span>
        </div>

        {/* Side-by-side Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-text-secondary border-b border-border font-semibold">
              <tr>
                <th className="p-3">Field</th>
                <th className="p-3">OCR Extracted Value</th>
                <th className="p-3">User Entered Value</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fields.map(field => {
                const extVal = (extractedData as any)[field.key];
                const entVal = enteredData ? (enteredData as any)[field.key] : undefined;

                let isMatch = true;
                if (extVal && entVal) {
                  if (field.key === 'depositAmount') {
                    isMatch = Math.abs(Number(extVal) - Number(entVal)) < 1;
                  } else {
                    isMatch = String(extVal).toLowerCase().trim() === String(entVal).toLowerCase().trim();
                  }
                }

                return (
                  <tr key={field.key} className="hover:bg-surface-subtle/40">
                    <td className="p-3 font-medium text-text-primary">{field.label}</td>
                    <td className="p-3 font-mono text-text-primary bg-surface-subtle/30">
                      {field.format(extVal)}
                    </td>
                    <td className="p-3 font-mono text-text-primary">
                      {entVal ? field.format(entVal) : <span className="text-text-secondary italic">None</span>}
                    </td>
                    <td className="p-3 text-center">
                      {entVal && extVal ? (
                        isMatch ? (
                          <span className="inline-flex items-center text-status-success font-medium">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-status-danger font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Mismatch
                          </span>
                        )
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Raw Text Preview Accordion / Box */}
        {extractedData.rawText && (
          <details className="text-xs bg-surface-subtle p-3 rounded border border-border">
            <summary className="font-semibold text-text-secondary cursor-pointer hover:text-text-primary">
              View OCR Raw Text Excerpt ({extractedData.rawText.length} characters)
            </summary>
            <pre className="mt-2 p-2 bg-white rounded border border-border overflow-x-auto text-[11px] font-mono text-text-secondary whitespace-pre-wrap max-h-36">
              {extractedData.rawText}
            </pre>
          </details>
        )}

        <div className="pt-2 flex items-center justify-end space-x-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {onConfirmValues && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onConfirmValues(extractedData);
                onClose();
              }}
            >
              Autofill Form with Extracted Data
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
