import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { DiscrepancyFlag } from '../../types/index.js';

interface DiscrepancyBannerProps {
  flags: DiscrepancyFlag[];
  className?: string;
}

export const DiscrepancyBanner: React.FC<DiscrepancyBannerProps> = ({ flags, className = '' }) => {
  if (!flags || flags.length === 0) return null;

  return (
    <div className={`p-4 bg-status-danger-bg border border-red-200 rounded-lg text-text-primary ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-status-danger">
            Automated Discrepancy Alert ({flags.length} flag{flags.length > 1 ? 's' : ''})
          </h4>
          <p className="text-xs text-text-secondary mt-0.5">
            The system detected potential inconsistencies between the uploaded financial document and the submitted database values. Officer scrutiny required.
          </p>
          <ul className="mt-2 space-y-1.5">
            {flags.map((flag, idx) => (
              <li key={idx} className="text-xs bg-white/80 p-2 rounded border border-red-100 flex items-start justify-between">
                <div>
                  <strong className="capitalize text-status-danger font-semibold">{flag.field}: </strong>
                  <span>{flag.description}</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-800 shrink-0 ml-2">
                  {flag.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
