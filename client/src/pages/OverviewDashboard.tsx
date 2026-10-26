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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-surface rounded-lg border border-border shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Welcome back, {user?.name}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {user?.role === 'institution'
              ? 'Institution Portal — Monitor and manage your fixed deposit receipts and statutory compliances.'
              : 'Regulatory Dashboard — Overview of institutional deposits, impending maturities, and verification queues.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerScan}
            isLoading={isScanning}
            title="Scan impending maturities and recalculate case prioritization"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Run AI Maturity Scan
          </Button>
          <Link to="/fdrs/register">
            <Button variant="primary" size="sm">
              + Register New FDR
            </Button>
          </Link>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-aicte-subtle border border-[#D0DFEF] rounded-md text-xs text-aicte flex items-center justify-between">
          <span>{scanMessage}</span>
          <button onClick={() => setScanMessage('')} className="font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-4 border-l-4 border-l-aicte">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase">
                Institutions
              </p>
              <h3 className="text-xl font-bold text-text-primary mt-1">
                {metrics.totalInstitutions || 0}
              </h3>
            </div>
            <div className="p-2.5 rounded bg-surface-subtle text-aicte">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-text-secondary">
            Technical colleges on record
          </div>
        </Card>

        <Card className="!p-4 border-l-4 border-l-aicte">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase">
                Total FDRs
              </p>
              <h3 className="text-xl font-bold text-text-primary mt-1">
                {metrics.totalFdrs || 0}
              </h3>
            </div>
            <div className="p-2.5 rounded bg-surface-subtle text-aicte">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-text-secondary">
            {metrics.activeFdrs || 0} currently active
          </div>
        </Card>

        <Card className="!p-4 border-l-4 border-l-[#137333]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase">
                Total Deposit Value
              </p>
              <h3 className="text-xl font-bold text-text-primary mt-1">
                ₹{((metrics.totalDepositAmount || 0) / 10000000).toFixed(2)} Cr
              </h3>
            </div>
            <div className="p-2.5 rounded bg-[#E6F4EA] text-[#137333]">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-text-secondary">
            ₹{(metrics.totalDepositAmount || 0).toLocaleString('en-IN')} total
          </div>
        </Card>

        <Card className="!p-4 border-l-4 border-l-status-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase">
                Expiring Soon / Matured
              </p>
              <h3 className="text-xl font-bold text-status-warning mt-1">
                {(metrics.expiringFdrs || 0) + (metrics.maturedFdrs || 0)}
              </h3>
            </div>
            <div className="p-2.5 rounded bg-[#FEF7E0] text-status-warning">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-text-secondary">
            {metrics.expiringFdrs || 0} upcoming & {metrics.maturedFdrs || 0} matured
          </div>
        </Card>
      </div>

      {/* Workflow Queue Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/documents/verification-queue"
          className="p-3 bg-surface rounded-lg border border-border hover:border-aicte/40 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-aicte-subtle text-aicte rounded">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-text-primary block">
                Pending Document Scrutiny
              </span>
              <span className="text-[11px] text-text-secondary">
                Certificates requiring review
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-subtle text-text-primary border border-border">
            {metrics.pendingVerifications || 0}
          </span>
        </Link>

        <Link
          to="/renewals"
          className="p-3 bg-surface rounded-lg border border-border hover:border-aicte/40 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FEF7E0] text-status-warning rounded">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-text-primary block">
                Pending Renewal Requests
              </span>
              <span className="text-[11px] text-text-secondary">
                Extension applications
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-subtle text-text-primary border border-border">
            {metrics.pendingRenewals || 0}
          </span>
        </Link>

        <Link
          to="/refunds"
          className="p-3 bg-surface rounded-lg border border-border hover:border-aicte/40 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#E8F0FE] text-status-info rounded">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-text-primary block">
                Refund & Release Requests
              </span>
              <span className="text-[11px] text-text-secondary">
                Statutory surrender reviews
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-subtle text-text-primary border border-border">
            {metrics.pendingRefunds || 0}
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Case Prioritization Queue */}
        <Card
          title="Smart Case Prioritization Queue"
          description="Algorithmic urgency scoring based on days to maturity, verification state, and discrepancies."
          action={
            <Link to="/fdrs" className="text-xs text-aicte font-medium hover:underline flex items-center">
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          }
        >
          {data?.priorityCases?.length === 0 ? (
            <p className="text-xs text-text-secondary py-6 text-center">
              No high-priority action items pending.
            </p>
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
                        <span className="font-mono text-xs font-bold text-text-primary">
                          {item.fdrNumber}
                        </span>
                        <span className="text-xs text-text-secondary">
                          • {item.bankName}
                        </span>
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

        {/* Impending Maturity Schedule */}
        <Card
          title="Impending Maturity Schedule (Next 60 Days)"
          description="Fixed deposits approaching tenure completion requiring renewal or surrender."
          action={
            <Link to="/maturity-schedule" className="text-xs text-aicte font-medium hover:underline flex items-center">
              Schedule view <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          }
        >
          {data?.upcomingMaturities?.length === 0 ? (
            <p className="text-xs text-text-secondary py-6 text-center">
              No deposits maturing in the next 60 days.
            </p>
          ) : (
            <div className="space-y-2">
              {data?.upcomingMaturities?.map((item: any) => {
                const diffDays = Math.ceil(
                  (new Date(item.maturityDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={item._id}
                    className="p-2.5 rounded border border-border flex items-center justify-between text-xs hover:bg-surface-subtle"
                  >
                    <div>
                      <span className="font-mono font-semibold text-text-primary">
                        {item.fdrNumber}
                      </span>
                      <span className="text-text-secondary ml-1.5">
                        ({item.bankName})
                      </span>
                      <p className="text-[10px] text-text-secondary">
                        Maturity: {new Date(item.maturityDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-semibold ${
                          diffDays <= 7
                            ? 'text-status-danger'
                            : diffDays <= 15
                            ? 'text-status-warning'
                            : 'text-aicte'
                        }`}
                      >
                        {diffDays <= 0 ? 'Matured' : `in ${diffDays} day(s)`}
                      </span>
                      <Link
                        to={`/fdrs/${item._id}`}
                        className="block text-[10px] text-aicte hover:underline mt-0.5"
                      >
                        View Record
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity Timeline */}
      <Card
        title="Recent Regulatory Audit Trail"
        description="Immutable logs of system transactions, document uploads, and administrative decisions."
        action={
          <Link to="/audit-logs" className="text-xs text-aicte font-medium hover:underline flex items-center">
            All audit logs <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        }
      >
        <div className="space-y-2">
          {data?.recentActivities?.slice(0, 6).map((log: any) => (
            <div
              key={log._id}
              className="p-2 rounded border border-border text-xs flex items-center justify-between"
            >
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
};
