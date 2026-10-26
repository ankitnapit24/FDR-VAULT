import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '../components/common/Button.js';

export const NotFound: React.FC = () => {
  return (
    <div className="py-20 text-center max-w-md mx-auto">
      <div className="w-12 h-12 bg-surface-subtle rounded-full flex items-center justify-center text-text-secondary mx-auto mb-3">
        <FileQuestion className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">404 — Page Not Found</h2>
      <p className="text-xs text-text-secondary mt-1 mb-6">
        The requested FDRFlow regulatory portal route or document resource does not exist.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Overview Dashboard</Button>
      </Link>
    </div>
  );
};
