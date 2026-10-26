import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/common/Button.js';

export const Unauthorized: React.FC = () => {
  return (
    <div className="py-20 text-center max-w-md mx-auto">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-status-danger mx-auto mb-3">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">403 — Access Denied</h2>
      <p className="text-xs text-text-secondary mt-1 mb-6">
        You do not have the required role privileges or institutional permissions to access this regulatory section.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Overview Dashboard</Button>
      </Link>
    </div>
  );
};
