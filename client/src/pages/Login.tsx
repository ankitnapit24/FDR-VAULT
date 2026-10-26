import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || 'Login failed.');
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-lg bg-aicte flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-xl font-bold tracking-tight text-text-primary">
          FDRFlow
        </h2>
        <p className="text-center text-xs text-text-secondary mt-1">
          All India Council for Technical Education (AICTE)
        </p>
        <p className="text-center text-xs font-medium text-aicte">
          Security Deposit & Fixed Deposit Receipt Management Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow-sm border border-border sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-status-danger-bg border border-red-200 rounded flex items-center space-x-2 text-xs text-status-danger">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@aicte.gov.in"
              />
            </div>

            <div>
              <Input
                label="Account Password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Sign In to FDRFlow Portal
            </Button>
          </form>

          {/* Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2 text-center">
              Quick Prototype Demo Accounts
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@aicte.gov.in', 'Admin@123')}
                className="w-full text-left p-2 rounded border border-border bg-surface-subtle hover:bg-[#EBF1F8] hover:border-aicte/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-text-primary">Admin (Approval Bureau)</span>
                  <p className="text-[10px] text-text-secondary">admin@aicte.gov.in</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-aicte" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('officer@aicte.gov.in', 'Officer@123')}
                className="w-full text-left p-2 rounded border border-border bg-surface-subtle hover:bg-[#EBF1F8] hover:border-aicte/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-text-primary">AICTE Scrutiny Officer</span>
                  <p className="text-[10px] text-text-secondary">officer@aicte.gov.in</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-aicte" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('director@delhitechnical.edu.in', 'Inst@123')}
                className="w-full text-left p-2 rounded border border-border bg-surface-subtle hover:bg-[#EBF1F8] hover:border-aicte/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-text-primary">Institution User (Delhi Engg)</span>
                  <p className="text-[10px] text-text-secondary">director@delhitechnical.edu.in</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-aicte" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('trustee@delhitechnical.edu.in', 'Trust@123')}
                className="w-full text-left p-2 rounded border border-border bg-surface-subtle hover:bg-[#EBF1F8] hover:border-aicte/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-text-primary">Trust Trustee User (Multi-Campus)</span>
                  <p className="text-[10px] text-text-secondary">trustee@delhitechnical.edu.in</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-aicte" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-text-secondary mt-4">
          Problem Statement ID: 26265 • Streamline of Security Deposit / FDR Portal
        </p>
      </div>
    </div>
  );
};
