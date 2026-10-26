import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface CompletenessBadgeProps {
  score: number;
  missingTypes?: string[];
  className?: string;
}

export const CompletenessBadge: React.FC<CompletenessBadgeProps> = ({
  score,
  missingTypes = [],
  className = '',
}) => {
  const isComplete = score === 100;

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-status-success" />
        ) : (
          <AlertCircle className="w-4 h-4 text-status-warning" />
        )}
        <span
          className={`text-xs font-semibold ${
            isComplete ? 'text-status-success' : 'text-status-warning'
          }`}
        >
          {score}% Complete
        </span>
      </div>
      {missingTypes.length > 0 && (
        <span className="text-[11px] text-text-secondary bg-surface-subtle px-2 py-0.5 rounded border border-border">
          Missing: {missingTypes.join(', ')}
        </span>
      )}
    </div>
  );
};
