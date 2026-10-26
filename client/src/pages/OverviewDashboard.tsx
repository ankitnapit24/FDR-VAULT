import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { StatusBadge } from '../components/common/Badge.js';
import {
  Building2,
  FileSpreadsheet,
  IndianRupee,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Landmark,
  Scale,
  Building,
  CreditCard,
  Users,
  Settings,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const OverviewDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/dashboard/summary');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTriggerScan = async () => {
    setIsScanning(true);
    setScanMessage('');
    try {
      const res = await api.post('/ai/trigger-scan');
      if (res.data.success) {
        setScanMessage(
          `Evaluated ${res.data.result.scanned} FDRs: ${res.data.result.expiringCount} expiring soon, ${res.data.result.maturedCount} matured, ${res.data.result.notificationsSent} alerts created.`
        );
        await fetchDashboardData();
      }
    } catch (e: any) {
      setScanMessage(e.response?.data?.message || 'Error executing automated scan.');
    } finally {
      setIsScanning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-text-secondary text-sm">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-aicte" />
        Loading AICTE regulatory metrics...
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const roleMeta = data?.roleMeta || {};
  const role = user?.role;

  // -------------------------------------------------------------
  // 1. ADMIN PANEL VIEW
  // -------------------------------------------------------------
  if (role === 'admin') {
    return (
      <div className="space-y-6">
        {/* Admin Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-surface rounded-lg border border-border shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                AICTE Approval Bureau • Central Administrator
              </span>
              <span className="text-xs text-text-secondary">• All India Jurisdiction</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary mt-1.5">
              Welcome, {user?.name}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Central regulatory oversight for statutory security deposits, policy compliance, and audit governance.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerScan}
              isLoading={isScanning}
              title="Run automated maturity horizon scan and update priority ranks"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Run AI Horizon Scan
            </Button>
            <Link to="/users">
              <Button variant="primary" size="sm">
                <Users className="w-3.5 h-3.5 mr-1.5" /> User Administration
              </Button>
            </Link>
          </div>
        </div>

        {scanMessage && (
          <div className="p-3 bg-aicte-subtle border border-[#D0DFEF] rounded-md text-xs text-aicte flex items-center justify-between">
            <span>{scanMessage}</span>
            <button onClick={() => setScanMessage('')} className="font-bold ml-2">×</button>
          </div>
        )}

        {/* Global KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="!p-4 border-l-4 border-l-aicte">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">
                  Technical Institutions
                </p>
                <h3 className="text-2xl font-bold text-text-primary mt-1">
                  {metrics.totalInstitutions || 0}
                </h3>
              </div>
              <div className="p-2.5 rounded bg-surface-subtle text-aicte">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">
              Approved colleges in national registry
            </div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-aicte">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">
                  Total FDR Instruments
                </p>
                <h3 className="text-2xl font-bold text-text-primary mt-1">
                  {metrics.totalFdrs || 0}
                </h3>
              </div>
              <div className="p-2.5 rounded bg-surface-subtle text-aicte">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">
              {metrics.activeFdrs || 0} active • {metrics.renewedFdrs || 0} renewed
            </div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-[#137333]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">
                  National Deposit Value
                </p>
                <h3 className="text-2xl font-bold text-text-primary mt-1">
                  ₹{((metrics.totalDepositAmount || 0) / 10000000).toFixed(2)} Cr
                </h3>
              </div>
              <div className="p-2.5 rounded bg-[#E6F4EA] text-[#137333]">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">
              ₹{(metrics.totalDepositAmount || 0).toLocaleString('en-IN')} total in joint lien
            </div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-status-warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">
                  Expiring / Matured
                </p>
                <h3 className="text-2xl font-bold text-status-warning mt-1">
                  {(metrics.expiringFdrs || 0) + (metrics.maturedFdrs || 0)}
                </h3>
              </div>
              <div className="p-2.5 rounded bg-[#FEF7E0] text-status-warning">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">
              {metrics.expiringFdrs || 0} approaching • {metrics.maturedFdrs || 0} overdue
            </div>
          </Card>
        </div>

        {/* Global Administrative Navigation Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Link
            to="/documents/verification-queue"
            className="p-3 bg-surface rounded-lg border border-border hover:border-aicte/40 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-aicte-subtle text-aicte rounded">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-text-primary block">Scrutiny Queue</span>
                <span className="text-[11px] text-text-secondary">Pending review</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-subtle border border-border">
              {metrics.pendingVerifications || 0}
            </span>
          </Link>

          <Link
            to="/bank-verification"
            className="p-3 bg-surface rounded-lg border border-border hover:border-aicte/40 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#E8F0FE] text-aicte rounded">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-text-primary block">Bank Verification</span>
                <span className="text-[11px] text-text-secondary">Active liaison tickets</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-subtle border border-border">
              {metrics.pendingBankTickets || 0}
            </span>
          </Link>

          <Link
            to="/renewals"
            className="p-3 bg-surface rounded-lg border border-border hover:border-aicte/40 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#FEF7E0] text-status-warning rounded">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-text-primary block">Renewal Cases</span>
                <span className="text-[11px] text-text-secondary">Pending approvals</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-subtle border border-border">
              {metrics.pendingRenewals || 0}
            </span>
          </Link>

          <Link
            to="/refunds"
            className="p-3 bg-surface rounded-lg border border-border hover:border-aicte/40 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#E6F4EA] text-[#137333] rounded">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-text-primary block">Release Applications</span>
                <span className="text-[11px] text-text-secondary">Clearance workflow</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-subtle border border-border">
              {metrics.pendingRefunds || 0}
            </span>
          </Link>
        </div>

        {/* 2-Column Core Section: Smart Priority Queue & Admin Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Smart Case Prioritization Queue"
            description="High-priority regulatory exceptions requiring Bureau review."
            action={
              <Link to="/fdrs" className="text-xs text-aicte font-medium hover:underline flex items-center">
                All FDRs <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            }
          >
            {data?.priorityCases?.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">No high-priority regulatory cases pending.</p>
            ) : (
              <div className="space-y-2.5">
                {data?.priorityCases?.map((item: any) => (
                  <Link
                    key={item._id}
                    to={`/fdrs/${item._id}`}
                    className="block p-3 rounded-md border border-border hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-text-primary">{item.fdrNumber}</span>
                          <span className="text-xs text-text-secondary">• {item.bankName}</span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {item.institutionId?.name || 'Institution'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-text-primary block">
                          ₹{(item.depositAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <StatusBadge status={item.currentStatus} />
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] bg-red-50 text-red-700 p-1.5 rounded border border-red-100 flex items-center">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1 shrink-0 text-red-600" />
                      <span className="truncate">{item.priorityReason}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Admin Management Tools */}
          <Card
            title="Bureau Administration Controls"
            description="Direct administrative modules for user governance, policy thresholds, and audit integrity."
          >
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/users"
                className="p-3 rounded-lg border border-border hover:border-aicte/40 hover:bg-surface-subtle transition-colors block"
              >
                <div className="p-2 rounded bg-purple-50 text-purple-700 w-fit mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-text-primary">User Governance</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Create, assign institution roles, and activate/deactivate accounts.
                </p>
              </Link>

              <Link
                to="/settings"
                className="p-3 rounded-lg border border-border hover:border-aicte/40 hover:bg-surface-subtle transition-colors block"
              >
                <div className="p-2 rounded bg-blue-50 text-blue-700 w-fit mb-2">
                  <Settings className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-text-primary">System Thresholds</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Configure reminder horizons (30/15/7d) and overdue criteria.
                </p>
              </Link>

              <Link
                to="/policies"
                className="p-3 rounded-lg border border-border hover:border-aicte/40 hover:bg-surface-subtle transition-colors block"
              >
                <div className="p-2 rounded bg-amber-50 text-amber-700 w-fit mb-2">
                  <Scale className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-text-primary">Policy Rules Engine</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Set discipline deposit requirements (UG/PG/Diploma) and tenure.
                </p>
              </Link>

              <Link
                to="/audit-logs"
                className="p-3 rounded-lg border border-border hover:border-aicte/40 hover:bg-surface-subtle transition-colors block"
              >
                <div className="p-2 rounded bg-emerald-50 text-emerald-700 w-fit mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-text-primary">Audit Hash-Chain</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Inspect cryptographic SHA-256 ledger integrity and trace actors.
                </p>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Audit Ledger */}
        <Card
          title="Recent Regulatory Audit Trail"
          description="Cryptographically linked log of system events, logins, and approvals."
          action={
            <Link to="/audit-logs" className="text-xs text-aicte font-medium hover:underline flex items-center">
              All audit logs <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          }
        >
          <div className="space-y-2">
            {data?.recentActivities?.slice(0, 5).map((log: any) => (
              <div key={log._id} className="p-2 rounded border border-border text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-surface-subtle text-[10px] font-mono font-semibold border border-border">
                    {log.action}
                  </span>
                  <span className="text-text-primary font-medium">
                    {log.actorName} ({log.actorRole})
                  </span>
                </div>
                <span className="text-[11px] text-text-secondary">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. AICTE SCRUTINY OFFICER VIEW
  // -------------------------------------------------------------
  if (role === 'officer') {
    return (
      <div className="space-y-6">
        {/* Officer Desk Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-surface rounded-lg border border-border shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                AICTE Regulation Bureau • Scrutiny Desk
              </span>
              <span className="text-xs text-text-secondary">• Regional Verification Authority</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary mt-1.5">
              Welcome, {user?.name}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Review submitted FDR certificates, scrutinize OCR discrepancy signals, and record compliance decisions.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/documents/verification-queue">
              <Button variant="primary" size="sm">
                <FileCheck className="w-3.5 h-3.5 mr-1.5" /> Scrutiny Queue ({metrics.pendingVerifications || 0})
              </Button>
            </Link>
          </div>
        </div>

        {/* Officer Workbench KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="!p-4 border-l-4 border-l-aicte">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Pending Scrutiny</p>
                <h3 className="text-2xl font-bold text-text-primary mt-1">{metrics.pendingVerifications || 0}</h3>
              </div>
              <div className="p-2.5 rounded bg-surface-subtle text-aicte">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">Certificates awaiting decision</div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-status-warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Impending Maturities</p>
                <h3 className="text-2xl font-bold text-status-warning mt-1">{metrics.expiringFdrs || 0}</h3>
              </div>
              <div className="p-2.5 rounded bg-[#FEF7E0] text-status-warning">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">Deposits maturing within 30 days</div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Bank Liaison</p>
                <h3 className="text-2xl font-bold text-blue-700 mt-1">{metrics.pendingBankTickets || 0}</h3>
              </div>
              <div className="p-2.5 rounded bg-blue-50 text-blue-600">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">Bank verification inquiries</div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Clearance Cases</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">{metrics.pendingRefunds || 0}</h3>
              </div>
              <div className="p-2.5 rounded bg-emerald-50 text-emerald-600">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">Multi-department releases</div>
          </Card>
        </div>

        {/* Scrutiny Desk Queues: 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Priority Scrutiny Cases"
            description="Cases ranked by regulatory urgency score, tenure gap, and discrepancy signals."
            action={
              <Link to="/documents/verification-queue" className="text-xs text-aicte font-medium hover:underline flex items-center">
                Scrutiny queue <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            }
          >
            {data?.priorityCases?.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">All scrutiny cases up to date.</p>
            ) : (
              <div className="space-y-2.5">
                {data?.priorityCases?.map((item: any) => (
                  <Link
                    key={item._id}
                    to={`/fdrs/${item._id}`}
                    className="block p-3 rounded-md border border-border hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-text-primary">{item.fdrNumber}</span>
                        <span className="text-xs text-text-secondary ml-1.5">• {item.bankName}</span>
                        <p className="text-[11px] text-text-secondary mt-0.5">{item.institutionId?.name}</p>
                      </div>
                      <StatusBadge status={item.currentStatus} />
                    </div>
                    <div className="mt-2 text-[11px] bg-red-50 text-red-700 p-1.5 rounded border border-red-100 flex items-center">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1 shrink-0 text-red-600" />
                      <span className="truncate">{item.priorityReason}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Maturity Horizon Monitor"
            description="Deposits approaching expiry requiring renewal notification or compliance action."
            action={
              <Link to="/maturity-schedule" className="text-xs text-aicte font-medium hover:underline flex items-center">
                Schedule <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            }
          >
            {data?.upcomingMaturities?.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">No deposits maturing in next 60 days.</p>
            ) : (
              <div className="space-y-2">
                {data?.upcomingMaturities?.map((item: any) => {
                  const diffDays = Math.ceil(
                    (new Date(item.maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={item._id}
                      className="p-2.5 rounded border border-border flex items-center justify-between text-xs hover:bg-surface-subtle"
                    >
                      <div>
                        <span className="font-mono font-semibold text-text-primary">{item.fdrNumber}</span>
                        <span className="text-text-secondary ml-1.5">({item.bankName})</span>
                        <p className="text-[10px] text-text-secondary">
                          Maturity: {new Date(item.maturityDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${diffDays <= 7 ? 'text-status-danger' : diffDays <= 15 ? 'text-status-warning' : 'text-aicte'}`}>
                          {diffDays <= 0 ? 'Matured' : `in ${diffDays} day(s)`}
                        </span>
                        <Link to={`/fdrs/${item._id}`} className="block text-[10px] text-aicte hover:underline mt-0.5">
                          Examine Record
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. INSTITUTION USER VIEW
  // -------------------------------------------------------------
  if (role === 'institution') {
    const inst = roleMeta.institution || user?.institution;
    const hasExpiring = (metrics.expiringFdrs || 0) > 0 || (metrics.maturedFdrs || 0) > 0;

    return (
      <div className="space-y-6">
        {/* Institution Dossier Header */}
        <div className="p-5 bg-surface rounded-lg border border-border shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  AICTE Technical Institution
                </span>
                <span className="text-xs font-mono font-bold text-aicte">
                  {inst?.institutionCode || 'AICTE-RECORD'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-text-primary mt-1.5">
                {inst?.name || user?.name}
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Authorized Signatory: {user?.name} {user?.designation ? `(${user.designation})` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/fdrs/register">
                <Button variant="primary" size="sm">
                  + Register New FDR
                </Button>
              </Link>
              <Link to="/documents/upload">
                <Button variant="outline" size="sm">
                  Upload Document
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Action Alert Banner if expiring or action needed */}
        {hasExpiring && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-900">
                Statutory Compliance Alert: Deposit Renewal Required
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                You have {metrics.expiringFdrs || 0} deposit(s) approaching maturity within 30 days and {metrics.maturedFdrs || 0} matured deposit(s). To maintain regulatory approval standing, submit renewal applications or replacement instruments promptly.
              </p>
              <div className="mt-2.5 flex items-center space-x-3">
                <Link to="/renewals">
                  <Button variant="primary" size="sm" className="!bg-amber-700 hover:!bg-amber-800">
                    Apply for Renewal
                  </Button>
                </Link>
                <Link to="/refunds" className="text-xs text-amber-900 hover:underline font-medium">
                  Request Release / Refund →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Institution Deposit Portfolio KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="!p-4 border-l-4 border-l-aicte">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">My FDRs on Record</p>
                <h3 className="text-2xl font-bold text-text-primary mt-1">{metrics.totalFdrs || 0}</h3>
              </div>
              <div className="p-2.5 rounded bg-surface-subtle text-aicte">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">{metrics.activeFdrs || 0} active in AICTE joint lien</div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-[#137333]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Total Security Deposit</p>
                <h3 className="text-2xl font-bold text-[#137333] mt-1">
                  ₹{((metrics.totalDepositAmount || 0) / 100000).toFixed(2)} L
                </h3>
              </div>
              <div className="p-2.5 rounded bg-[#E6F4EA] text-[#137333]">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">₹{(metrics.totalDepositAmount || 0).toLocaleString('en-IN')}</div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-status-warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Expiring / Matured</p>
                <h3 className="text-2xl font-bold text-status-warning mt-1">
                  {(metrics.expiringFdrs || 0) + (metrics.maturedFdrs || 0)}
                </h3>
              </div>
              <div className="p-2.5 rounded bg-[#FEF7E0] text-status-warning">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">Requires rollover or renewal</div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Pending Scrutiny</p>
                <h3 className="text-2xl font-bold text-blue-700 mt-1">{metrics.pendingVerifications || 0}</h3>
              </div>
              <div className="p-2.5 rounded bg-blue-50 text-blue-600">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">Certificates under review</div>
          </Card>
        </div>

        {/* 4 Institution Action Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            to="/fdrs/register"
            className="p-3.5 rounded-lg border border-border bg-surface hover:border-aicte/40 hover:bg-surface-subtle transition-colors block text-left"
          >
            <div className="p-2 rounded bg-aicte-subtle text-aicte w-fit mb-2">
              <Landmark className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-text-primary">Register New FDR</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">Submit new bank fixed deposit receipt with joint lien.</p>
          </Link>

          <Link
            to="/documents/upload"
            className="p-3.5 rounded-lg border border-border bg-surface hover:border-aicte/40 hover:bg-surface-subtle transition-colors block text-left"
          >
            <div className="p-2 rounded bg-blue-50 text-blue-700 w-fit mb-2">
              <FileCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-text-primary">Upload Document</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">Scan FDR receipt or bank confirmation with AI OCR.</p>
          </Link>

          <Link
            to="/renewals"
            className="p-3.5 rounded-lg border border-border bg-surface hover:border-aicte/40 hover:bg-surface-subtle transition-colors block text-left"
          >
            <div className="p-2 rounded bg-amber-50 text-amber-700 w-fit mb-2">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-text-primary">Renewal Requests</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">Submit renewal proofs for expiring security deposits.</p>
          </Link>

          <Link
            to="/refunds"
            className="p-3.5 rounded-lg border border-border bg-surface hover:border-aicte/40 hover:bg-surface-subtle transition-colors block text-left"
          >
            <div className="p-2 rounded bg-emerald-50 text-emerald-700 w-fit mb-2">
              <CreditCard className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-text-primary">Release / Refund</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">Apply for statutory release upon program completion.</p>
          </Link>
        </div>

        {/* Institution Records Table Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="My Security Deposit Instruments"
            description="Fixed deposits maintained under AICTE Approval Bureau lien."
            action={
              <Link to="/fdrs" className="text-xs text-aicte font-medium hover:underline flex items-center">
                All FDRs <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            }
          >
            {data?.upcomingMaturities?.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">No FDR records approaching maturity.</p>
            ) : (
              <div className="space-y-2">
                {data?.upcomingMaturities?.map((item: any) => (
                  <div
                    key={item._id}
                    className="p-2.5 rounded border border-border flex items-center justify-between text-xs hover:bg-surface-subtle"
                  >
                    <div>
                      <span className="font-mono font-semibold text-text-primary">{item.fdrNumber}</span>
                      <span className="text-text-secondary ml-1.5">• {item.bankName}</span>
                      <p className="text-[10px] text-text-secondary">
                        Maturity: {new Date(item.maturityDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-text-primary block">
                        ₹{(item.depositAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <Link to={`/fdrs/${item._id}`} className="text-[10px] text-aicte hover:underline">
                        Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Application Status & Next Steps"
            description="Track your renewal applications and release clearances."
          >
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-border bg-surface-subtle flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Active Renewal Applications</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {metrics.pendingRenewals || 0} request(s) currently under scrutiny by AICTE regional office.
                  </p>
                </div>
                <Link to="/renewals">
                  <Button variant="outline" size="sm">Track</Button>
                </Link>
              </div>

              <div className="p-3 rounded-lg border border-border bg-surface-subtle flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Statutory Refund Applications</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {metrics.pendingRefunds || 0} release case(s) undergoing multi-department clearances.
                  </p>
                </div>
                <Link to="/refunds">
                  <Button variant="outline" size="sm">View</Button>
                </Link>
              </div>

              <div className="p-3 rounded-lg border border-border bg-surface-subtle flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Deposit Adequacy Evaluation</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Verify statutory deposit requirements for approved intake level.
                  </p>
                </div>
                <Link to="/policies">
                  <Button variant="outline" size="sm">Evaluate</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. TRUSTEE USER VIEW
  // -------------------------------------------------------------
  if (role === 'trust') {
    const trust = roleMeta.trust;
    const campuses = roleMeta.campuses || [];

    return (
      <div className="space-y-6">
        {/* Trustee Header Banner */}
        <div className="p-5 bg-surface rounded-lg border border-border shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Educational Trust Oversight Panel
                </span>
                <span className="text-xs font-mono font-bold text-text-secondary">
                  Reg: {trust?.registrationNumber || 'TR-RECORD'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-text-primary mt-1.5">
                {trust?.trustName || 'Educational Trust'}
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Managing Trustee: {user?.name} • Consolidated multi-campus security deposit portfolio
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/trust-exposure">
                <Button variant="primary" size="sm">
                  <Building className="w-3.5 h-3.5 mr-1.5" /> Trust Financial Exposure
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Multi-Campus KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="!p-4 border-l-4 border-l-aicte">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Affiliated Campuses</p>
                <h3 className="text-2xl font-bold text-text-primary mt-1">{campuses.length || metrics.totalInstitutions || 0}</h3>
              </div>
              <div className="p-2.5 rounded bg-surface-subtle text-aicte">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">Institutions under this Trust</div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-[#137333]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Trust-Wide Deposit</p>
                <h3 className="text-2xl font-bold text-[#137333] mt-1">
                  ₹{((metrics.totalDepositAmount || 0) / 10000000).toFixed(2)} Cr
                </h3>
              </div>
              <div className="p-2.5 rounded bg-[#E6F4EA] text-[#137333]">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">₹{(metrics.totalDepositAmount || 0).toLocaleString('en-IN')} total held</div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-aicte">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Total Instruments</p>
                <h3 className="text-2xl font-bold text-text-primary mt-1">{metrics.totalFdrs || 0}</h3>
              </div>
              <div className="p-2.5 rounded bg-surface-subtle text-aicte">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">{metrics.activeFdrs || 0} active FDRs</div>
          </Card>

          <Card className="!p-4 border-l-4 border-l-status-warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase">Expiring / Matured</p>
                <h3 className="text-2xl font-bold text-status-warning mt-1">
                  {(metrics.expiringFdrs || 0) + (metrics.maturedFdrs || 0)}
                </h3>
              </div>
              <div className="p-2.5 rounded bg-[#FEF7E0] text-status-warning">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-text-secondary">Across all trust campuses</div>
          </Card>
        </div>

        {/* Campuses Breakdown & Impending Horizon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Campus-Wise Security Deposit Distribution"
            description="Overview of technical institutions managed under this Educational Trust."
            action={
              <Link to="/institutions" className="text-xs text-aicte font-medium hover:underline flex items-center">
                All campuses <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            }
          >
            {campuses.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">No colleges linked to this trust record.</p>
            ) : (
              <div className="space-y-2.5">
                {campuses.map((c: any) => (
                  <div
                    key={c._id}
                    className="p-3 rounded-md border border-border flex items-center justify-between hover:bg-surface-subtle"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-text-primary">{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-aicte-subtle text-aicte rounded font-mono">
                          {c.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Discipline: {c.type} • {c.fdrCount} FDR instruments
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-text-primary block">
                        ₹{(c.totalDeposit || 0).toLocaleString('en-IN')}
                      </span>
                      <Link to={`/institutions/${c._id}`} className="text-[10px] text-aicte hover:underline">
                        Campus Dossier →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Trust-Wide Impending Maturities"
            description="Fixed deposits approaching tenure completion across all colleges under your trust."
            action={
              <Link to="/maturity-schedule" className="text-xs text-aicte font-medium hover:underline flex items-center">
                Schedule <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            }
          >
            {data?.upcomingMaturities?.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">No deposits maturing in next 60 days across your campuses.</p>
            ) : (
              <div className="space-y-2">
                {data?.upcomingMaturities?.map((item: any) => {
                  const diffDays = Math.ceil(
                    (new Date(item.maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={item._id}
                      className="p-2.5 rounded border border-border flex items-center justify-between text-xs hover:bg-surface-subtle"
                    >
                      <div>
                        <span className="font-mono font-semibold text-text-primary">{item.fdrNumber}</span>
                        <span className="text-text-secondary ml-1.5">• {item.bankName}</span>
                        <p className="text-[10px] text-text-secondary">{item.institutionId?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${diffDays <= 7 ? 'text-status-danger' : diffDays <= 15 ? 'text-status-warning' : 'text-aicte'}`}>
                          {diffDays <= 0 ? 'Matured' : `in ${diffDays} day(s)`}
                        </span>
                        <Link to={`/fdrs/${item._id}`} className="block text-[10px] text-aicte hover:underline mt-0.5">
                          View Instrument
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="py-20 text-center text-text-secondary text-sm">
      Invalid user role. Please contact support.
    </div>
  );
};
