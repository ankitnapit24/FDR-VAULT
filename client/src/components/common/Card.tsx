import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  description,
  action,
}) => {
  return (
    <div className={`bg-surface rounded-lg border border-border shadow-xs ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-text-primary">{title}</h3>}
            {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
