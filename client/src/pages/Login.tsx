import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  FileCheck,
  Building2,
  Landmark,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface DemoAccount {
  role: string;
  badge: string;
  badgeColor: string;
  email: string;
  pass: string;
  desc: string;
  icon: React.ElementType;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'Admin',
    badge: 'Central Bureau',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    email: 'admin@aicte.gov.in',
    pass: 'Admin@123',
    desc: 'National oversight & user management',
    icon: ShieldCheck,
  },
  {
    role: 'AICTE Scrutiny Officer',
    badge: 'Scrutiny Desk',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    email: 'officer@aicte.gov.in',
    pass: 'Officer@123',
    desc: 'Deposit audit & document scrutiny',
    icon: FileCheck,
  },
  {
    role: 'Institution User',
    badge: 'College Portal',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    email: 'director@delhitechnical.edu.in',
    pass: 'Inst@123',
    desc: 'Delhi Technical Engg — register & renew',
    icon: Building2,
  },
  {
    role: 'Trustee User',
    badge: 'Trust Oversight',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    email: 'trustee@delhitechnical.edu.in',
    pass: 'Trust@123',
    desc: 'Multi-campus exposure & maturity monitoring',
    icon: Landmark,
  },
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      setIsLoading(false);

      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setIsLoading(false);
      setError('An unexpected error occurred while connecting to the authentication service.');
    }
  };

  const handleSelectDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.pass);
    setSelectedDemo(account.email);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-between selection:bg-[#EAF2FB] selection:text-[#183B63] relative overflow-x-hidden">
      {/* Ambient background glows for visual polish */}
      <div className="absolute top-0 left-1/4 w-[480px] h-[480px] bg-[#3567A5]/8 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[480px] h-[480px] bg-[#2A9D8F]/8 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Unified Container */}
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: Branding & Visual Storytelling (53% width)   */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Top Brand Identity */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#183B63] to-[#3567A5] flex items-center justify-center text-white shadow-md shadow-[#183B63]/20 ring-1 ring-white/60">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-extrabold text-[#183B63] tracking-tight block leading-tight">
                  FDR VAULT
                </span>
                <span className="text-xs text-[#667085] font-medium leading-tight">
                  All India Council for Technical Education (AICTE)
                </span>
              </div>
            </div>

            {/* Headline and Description */}
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl xl:text-[32px] font-extrabold text-[#182230] leading-tight tracking-tight">
                Smarter FDR Management.{' '}
                <span className="bg-gradient-to-r from-[#183B63] via-[#3567A5] to-[#2A9D8F] bg-clip-text text-transparent">
                  Complete Transparency.
                </span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#667085] leading-relaxed max-w-xl">
                A centralized platform for secure deposit tracking, document scrutiny, maturity monitoring, and release
                workflows across AICTE-approved institutions nationwide.
              </p>
            </div>

            {/* Isometric Visual Security Illustration */}
            <div className="w-full max-w-[460px] mx-auto lg:mx-0 my-1">
              <div className="rounded-xl p-3 bg-white/70 backdrop-blur-sm border border-[#E2E8F0]/80 shadow-sm">
                <svg
                  viewBox="0 0 520 290"
                  className="w-full h-auto drop-shadow-sm select-none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="FDR Vault Financial Security Illustration"
                >
                  <defs>
                    <linearGradient id="vaultDoorGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#183B63" />
                      <stop offset="60%" stopColor="#254F7F" />
                      <stop offset="100%" stopColor="#3567A5" />
                    </linearGradient>
                    <linearGradient id="goldSealGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F9D472" />
                      <stop offset="50%" stopColor="#E9A23B" />
                      <stop offset="100%" stopColor="#C47E19" />
                    </linearGradient>
                    <linearGradient id="tealNodeGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#48C7B8" />
                      <stop offset="100%" stopColor="#2A9D8F" />
                    </linearGradient>
                    <linearGradient id="certBg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#F4F8FC" />
                    </linearGradient>
                    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#183B63" floodOpacity="0.12" />
                    </filter>
                  </defs>

                  {/* Ground Isometric Grid Line Platform */}
                  <ellipse cx="260" cy="250" rx="210" ry="34" fill="#E2EDF9" opacity="0.6" />
                  <ellipse cx="260" cy="250" rx="150" ry="22" fill="#D3E4F5" opacity="0.7" />

                  {/* Connection Workflow Lines */}
                  <path
                    d="M 90 170 C 130 170, 150 145, 195 145"
                    stroke="#3567A5"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                    opacity="0.5"
                  />
                  <path
                    d="M 325 145 C 365 145, 385 175, 425 175"
                    stroke="#2A9D8F"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                    opacity="0.6"
                  />

                  {/* Background Floating Deposit Certificate */}
                  <g filter="url(#softGlow)" transform="translate(42, 35) rotate(-5)">
                    <rect
                      x="0"
                      y="0"
                      width="170"
                      height="195"
                      rx="9"
                      fill="url(#certBg)"
                      stroke="#E2E8F0"
                      strokeWidth="1.5"
                    />
                    <rect x="10" y="10" width="150" height="24" rx="4" fill="#EAF2FB" />
                    <rect x="16" y="17" width="75" height="4" rx="2" fill="#183B63" />
                    <rect x="16" y="24" width="45" height="3" rx="1.5" fill="#3567A5" opacity="0.7" />
                    <circle cx="144" cy="22" r="5.5" fill="url(#goldSealGrad)" />

                    <rect x="16" y="44" width="138" height="3" rx="1.5" fill="#D8E2EC" />
                    <rect x="16" y="53" width="115" height="3" rx="1.5" fill="#D8E2EC" />
                    <rect x="16" y="62" width="128" height="3" rx="1.5" fill="#D8E2EC" />

                    {/* Deposit Amount Pill */}
                    <rect x="16" y="76" width="138" height="38" rx="5" fill="#F0F6FD" stroke="#D3E4F5" />
                    <text x="24" y="91" fill="#667085" fontSize="7.5" fontFamily="Inter, sans-serif" fontWeight="600">
                      FIXED DEPOSIT VALUE
                    </text>
                    <text x="24" y="106" fill="#183B63" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="800">
                      ₹ 50,00,000.00
                    </text>

                    {/* Joint Lien Stamp */}
                    <rect x="16" y="124" width="76" height="13" rx="3" fill="#E6F4EA" stroke="#A7D7B9" />
                    <text x="20" y="133" fill="#1B806A" fontSize="6.5" fontFamily="Inter, sans-serif" fontWeight="700">
                      ✓ AICTE JOINT LIEN
                    </text>

                    <rect x="16" y="148" width="65" height="3" rx="1.5" fill="#D8E2EC" />
                    <rect x="16" y="156" width="40" height="3" rx="1.5" fill="#D8E2EC" />

                    {/* Gold Seal */}
                    <circle cx="134" cy="152" r="14" fill="url(#goldSealGrad)" opacity="0.9" />
                    <circle cx="134" cy="152" r="10.5" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
                    <text x="130" y="155" fill="#FFFFFF" fontSize="8" fontWeight="bold">
                      ★
                    </text>
                  </g>

                  {/* Central Enterprise Vault Safe */}
                  <g filter="url(#softGlow)" transform="translate(178, 38)">
                    <rect
                      x="0"
                      y="14"
                      width="155"
                      height="172"
                      rx="14"
                      fill="url(#vaultDoorGrad)"
                      stroke="#4F79A8"
                      strokeWidth="2"
                    />
                    <rect
                      x="9"
                      y="23"
                      width="137"
                      height="154"
                      rx="10"
                      fill="#1E4470"
                      stroke="#2C598C"
                      strokeWidth="1.5"
                    />

                    {/* Vault Chamber Door */}
                    <circle cx="77" cy="100" r="54" fill="#183B63" stroke="#5C89BD" strokeWidth="2.5" />
                    <circle
                      cx="77"
                      cy="100"
                      r="42"
                      fill="#254F7F"
                      stroke="#3567A5"
                      strokeWidth="1.8"
                      strokeDasharray="5 3.5"
                    />
                    <circle cx="77" cy="100" r="30" fill="#183B63" stroke="#8BB0DC" strokeWidth="1.8" />

                    {/* Combination Dial */}
                    <circle cx="77" cy="100" r="16" fill="url(#goldSealGrad)" />
                    <circle cx="77" cy="100" r="7" fill="#183B63" />

                    <line x1="77" y1="71" x2="77" y2="80" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <line x1="77" y1="120" x2="77" y2="129" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <line x1="48" y1="100" x2="57" y2="100" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <line x1="97" y1="100" x2="106" y2="100" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

                    {/* Biometric / Keypad Indicator Lights */}
                    <rect x="16" y="32" width="32" height="9" rx="2.5" fill="#10253F" />
                    <circle cx="22" cy="36.5" r="2" fill="#2A9D8F" />
                    <circle cx="29" cy="36.5" r="2" fill="#E9A23B" />
                    <circle cx="36" cy="36.5" r="2" fill="#667085" />

                    {/* Active Lock Badge */}
                    <g transform="translate(104, 29)">
                      <rect x="0" y="0" width="36" height="16" rx="3.5" fill="#2A9D8F" />
                      <text x="6" y="11.5" fill="#FFFFFF" fontSize="8" fontWeight="800" fontFamily="sans-serif">
                        ACTIVE
                      </text>
                    </g>
                  </g>

                  {/* Right Flow Node: Bank & Verification Ledger */}
                  <g filter="url(#softGlow)" transform="translate(340, 78)">
                    <rect
                      x="0"
                      y="0"
                      width="135"
                      height="115"
                      rx="9"
                      fill="#FFFFFF"
                      stroke="#E2E8F0"
                      strokeWidth="1.5"
                    />
                    <rect x="9" y="9" width="117" height="20" rx="3.5" fill="#EAF2FB" />
                    <circle cx="20" cy="19" r="4.5" fill="url(#tealNodeGrad)" />
                    <text x="30" y="22" fill="#183B63" fontSize="8" fontWeight="700">
                      BANK INTEGRATION
                    </text>

                    <g transform="translate(11, 35)">
                      <circle cx="7" cy="7" r="5" fill="#E6F4EA" />
                      <text x="5" y="9.5" fill="#1B806A" fontSize="6.5" fontWeight="bold">
                        ✓
                      </text>
                      <text x="18" y="10" fill="#182230" fontSize="7.5" fontWeight="600">
                        IFSC & Branch Validation
                      </text>

                      <circle cx="7" cy="23" r="5" fill="#E6F4EA" />
                      <text x="5" y="25.5" fill="#1B806A" fontSize="6.5" fontWeight="bold">
                        ✓
                      </text>
                      <text x="18" y="26" fill="#182230" fontSize="7.5" fontWeight="600">
                        Joint Lien Confirmation
                      </text>

                      <circle cx="7" cy="39" r="5" fill="#FEF3D6" />
                      <text x="5" y="41.5" fill="#B7791F" fontSize="6.5" fontWeight="bold">
                        ●
                      </text>
                      <text x="18" y="42" fill="#182230" fontSize="7.5" fontWeight="600">
                        Periodic Interest Accrual
                      </text>

                      <rect x="0" y="52" width="113" height="15" rx="3" fill="#F4F8FC" stroke="#D3E4F5" />
                      <text x="10" y="62.5" fill="#3567A5" fontSize="7" fontWeight="700">
                        SHA-256 LEDGER SECURED
                      </text>
                    </g>
                  </g>
                </svg>
              </div>
            </div>

            {/* Three Compact Feature Benefit Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-3">
              <div className="bg-white/80 rounded-xl p-2.5 sm:p-3 border border-[#E2E8F0] shadow-sm hover:border-[#3567A5]/30 transition-all">
                <div className="w-6 h-6 rounded-lg bg-[#EAF2FB] flex items-center justify-center text-[#183B63] mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#3567A5]" />
                </div>
                <h4 className="text-[11px] sm:text-xs font-bold text-[#182230]">Secure Management</h4>
                <p className="text-[10px] text-[#667085] mt-0.5 leading-tight">Encrypted records & lien logs</p>
              </div>

              <div className="bg-white/80 rounded-xl p-2.5 sm:p-3 border border-[#E2E8F0] shadow-sm hover:border-[#2A9D8F]/30 transition-all">
                <div className="w-6 h-6 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#2A9D8F] mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2A9D8F]" />
                </div>
                <h4 className="text-[11px] sm:text-xs font-bold text-[#182230]">Maturity Tracking</h4>
                <p className="text-[10px] text-[#667085] mt-0.5 leading-tight">Automated alerts at 90/60/30 days</p>
              </div>

              <div className="bg-white/80 rounded-xl p-2.5 sm:p-3 border border-[#E2E8F0] shadow-sm hover:border-[#E9A23B]/30 transition-all">
                <div className="w-6 h-6 rounded-lg bg-[#FEF3D6] flex items-center justify-center text-[#E9A23B] mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E9A23B]" />
                </div>
                <h4 className="text-[11px] sm:text-xs font-bold text-[#182230]">Transparent Workflows</h4>
                <p className="text-[10px] text-[#667085] mt-0.5 leading-tight">Role-scoped scrutiny & audit trail</p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Integrated Enterprise Login Panel (47%)    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-7 xl:p-8">
              {/* Header */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EAF2FB] text-[#183B63] border border-[#3567A5]/20">
                    SECURE PORTAL ACCESS
                  </span>
                  <span className="text-[11px] text-[#667085] font-medium">AICTE Workspace</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#182230] tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Sign in to access your FDR management workspace.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-[#FCE8E6] border border-[#F5B5B0] rounded-xl flex items-start space-x-2 text-xs text-[#C53030] shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
              )}

              {/* Form */}
              <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
                {/* Email Input */}
                <div>
                  <label htmlFor="email-input" className="block text-xs font-semibold text-[#182230] mb-1">
                    Registered Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#667085]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email-input"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@aicte.gov.in or college domain"
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#182230] placeholder-[#667085]/60 focus:outline-none focus:ring-2 focus:ring-[#3567A5]/30 focus:border-[#3567A5] transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Password Input with Visibility Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password-input" className="block text-xs font-semibold text-[#182230]">
                      Account Password <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#667085]">Encrypted session</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#667085]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#182230] placeholder-[#667085]/60 focus:outline-none focus:ring-2 focus:ring-[#3567A5]/30 focus:border-[#3567A5] transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#667085] hover:text-[#182230] focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || !password}
                  className="w-full mt-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-[#183B63] to-[#3567A5] hover:from-[#132E4D] hover:to-[#2B5489] text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3567A5]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to FDR Vault</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Access */}
              <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-[#183B63] uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3 h-3 text-[#E9A23B]" />
                    <span>Quick Demo Access</span>
                  </span>
                  <span className="text-[10px] text-[#667085]">One-click autofill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const Icon = acc.icon;
                    const isSelected = selectedDemo === acc.email;

                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleSelectDemo(acc)}
                        className={`text-left p-2 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#3567A5] bg-[#EAF2FB] shadow-xs ring-1 ring-[#3567A5]'
                            : 'border-[#E2E8F0] bg-[#FAFBFD] hover:bg-[#F2F7FC] hover:border-[#3567A5]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-0.5">
                          <div className="flex items-center space-x-1.5 truncate mr-1">
                            <Icon className="w-3.5 h-3.5 text-[#183B63] shrink-0" />
                            <span className="text-[11px] font-bold text-[#182230] truncate">{acc.role}</span>
                          </div>
                          <span className={`text-[8.5px] font-semibold px-1 py-0.5 rounded border shrink-0 ${acc.badgeColor}`}>
                            {acc.badge}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-[#667085] truncate w-full font-mono">
                          {acc.email}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Institutional Footer */}
      <footer className="w-full py-3 px-4 text-center text-[11px] text-[#667085] border-t border-[#E2E8F0]/70 bg-white/50 backdrop-blur-xs">
        <p className="font-medium text-[#182230]">
          FDR Vault • Security Deposit & Fixed Deposit Receipt Management
        </p>
        <p className="text-[10px] text-[#667085] mt-0.5">All India Council for Technical Education (AICTE)</p>
      </footer>
    </div>
  );
};