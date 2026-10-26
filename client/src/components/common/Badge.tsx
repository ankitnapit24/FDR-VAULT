import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'aicte';
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  title,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-medium' : 'px-2.5 py-1 text-sm font-medium';

  const variantClasses = {
    default: 'bg-surface-subtle text-text-secondary border border-border',
    success: 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]',
    warning: 'bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]',
    danger: 'bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]',
    info: 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]',
    aicte: 'bg-[#EBF1F8] text-[#365F91] border border-[#D0DFEF]',
  }[variant];

  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-md ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'aicte' = 'default';

  switch (status) {
    case 'Active':
    case 'Verified':
    case 'Approved':
    case 'Completed':
      variant = 'success';
      break;
    case 'Expiring Soon':
    case 'Renewal Pending':
    case 'Renewal Requested':
    case 'Under Scrutiny':
    case 'Under Document Review':
    case 'Under Approval':
      variant = 'warning';
      break;
    case 'Matured':
    case 'Rejected':
    case 'Suspended':
    case 'Under Dispute':
      variant = 'danger';
      break;
    case 'Renewed':
    case 'Released':
      variant = 'info';
      break;
    case 'Pending Verification':
    case 'Additional Information Required':
    case 'Submitted':
    case 'Uploaded':
      variant = 'aicte';
      break;
    default:
      variant = 'default';
  }

  return <Badge variant={variant}>{status}</Badge>;
};
