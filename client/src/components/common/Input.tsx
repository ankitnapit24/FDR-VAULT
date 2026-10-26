import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-text-primary mb-1">
          {label} {props.required && <span className="text-status-danger">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 text-sm bg-surface border rounded focus:outline-none focus:ring-1 focus:ring-aicte transition-colors ${
          error ? 'border-status-danger focus:border-status-danger' : 'border-border focus:border-aicte'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-status-danger font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-text-secondary">{helperText}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ label: string; value: string | number }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  id,
  options,
  children,
  className = '',
  ...props
}) => {
  const selectId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-text-primary mb-1">
          {label} {props.required && <span className="text-status-danger">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-2 text-sm bg-surface border rounded focus:outline-none focus:ring-1 focus:ring-aicte transition-colors ${
          error ? 'border-status-danger focus:border-status-danger' : 'border-border focus:border-aicte'
        } ${className}`}
        {...props}
      >
        {options
          ? options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="mt-1 text-xs text-status-danger font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-text-secondary">{helperText}</p>}
    </div>
  );
};
