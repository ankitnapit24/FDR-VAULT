import React, { useState, useEffect } from 'react';
import { Building, ShieldCheck, AlertCircle, CheckCircle2, TrendingUp, IndianRupee, Layers, ExternalLink } from 'lucide-react';
import { Card } from '../components/common/Card.js';
import { Select } from '../components/common/Select.js';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/common/Table.js';
import { TrustExposureSummary, Trust } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export const TrustExposureDashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [trusts, setTrusts] = useState<Trust[]>([]);
  const [selectedTrustId, setSelectedTrustId] = useState<string>('');
  const [summary, setSummary] = useState<TrustExposureSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available trusts
  useEffect(() => {
    const fetchTrusts = async () => {
      try {
        const res = await api.get('/trusts');
        if (res.data.success && res.data.trusts.length > 0) {
          setTrusts(res.data.trusts);
          // If user is trust role, lock to their trustId; else default to first trust
          if (user?.trustId) {
            setSelectedTrustId(user.trustId);
          } else {
            setSelectedTrustId(res.data.trusts[0]._id);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load trusts.');
      }
    };

    fetchTrusts();
  }, [user]);

  // Fetch exposure summary when selectedTrustId changes
  useEffect(() => {
    if (!selectedTrustId) return;

    const fetchExposure = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/trusts/${selectedTrustId}/exposure`);
        if (res.data.success && res.data.exposure) {
          const exp = res.data.exposure;
          setSummary({
            trust: exp.trust,
            institutionsCount: exp.metrics?.totalInstitutions || 0,
            totalFdrsCount: exp.metrics?.totalActiveFdrs || 0,
            totalActiveFdrAmount: exp.metrics?.cumulativeEligibleActiveDeposit || 0,
            totalRequiredDeposit: exp.metrics?.cumulativeRequiredDeposit || 0,
            totalShortfall: (exp.metrics?.netShortfallOrSurplus < 0) ? Math.abs(exp.metrics.netShortfallOrSurplus) : 0,
            totalSurplus: (exp.metrics?.netShortfallOrSurplus > 0) ? exp.metrics.netShortfallOrSurplus : 0,
            institutionsBreakdown: (exp.institutionsBreakdown || []).map((ib: any) => ({
              institutionId: ib.id,
              institutionName: ib.name,
              institutionCode: ib.code,
              discipline: ib.discipline,
              approvedIntake: ib.approvedIntake,
              activeFdrsCount: ib.activeFdrCount,
              activeFdrsAmount: ib.activeDeposit,
              requiredDeposit: ib.requiredDeposit,
              shortfall: ib.shortfallOrSurplus < 0 ? Math.abs(ib.shortfallOrSurplus) : 0,
              surplus: ib.shortfallOrSurplus > 0 ? ib.shortfallOrSurplus : 0,
              isCompliant: ib.isAdequate,
            })),
          });
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch trust exposure summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchExposure();
  }, [selectedTrustId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Building className="w-6 h-6 text-aicte" />
            <h1 className="text-xl font-bold text-text-primary">
              Trust-Level Consolidated Financial Exposure
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Aggregated multi-institution compliance, campus deposit portfolios, and regulatory surplus/shortfall overview.
          </p>
        </div>

        {/* Trust Switcher for Admins/Officers */}
        {hasRole('admin', 'officer') && trusts.length > 1 && (
          <div className="w-72">
            <Select
              label="Selected Educational Trust / Society"
              value={selectedTrustId}
              onChange={e => setSelectedTrustId(e.target.value)}
              options={trusts.map(t => ({
                value: t._id,
                label: `${t.trustName} (${t.registrationNumber})`,
              }))}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !summary && (
        <div className="py-12 text-center text-text-secondary text-xs">
          Loading consolidated trust data...
        </div>
      )}

      {summary && (
        <>
          {/* Trust Profile Card */}
          <div className="bg-surface rounded border border-border p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-aicte px-2 py-0.5 bg-aicte-subtle rounded border border-[#D0DFEF]">
                  Educational Trust Dossier
                </span>
                <h2 className="text-base font-bold text-text-primary mt-1">
                  {summary.trust.trustName}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary mt-1">
                  <span>Reg No: <strong className="text-text-primary font-mono">{summary.trust.registrationNumber}</strong></span>
                  <span>PAN: <strong className="text-text-primary font-mono">{summary.trust.panNumber || 'N/A'}</strong></span>
                  <span>Chairman: <strong className="text-text-primary">{summary.trust.chairmanName || 'N/A'}</strong></span>
                  <span>Contact: <strong className="text-text-primary">{summary.trust.contactEmail}</strong></span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-text-muted block">Campus Network</span>
                <span className="text-lg font-bold text-text-primary">
                  {summary.institutionsCount} Technical Institution{summary.institutionsCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface rounded border border-border p-4 shadow-xs">
              <span className="text-xs text-text-secondary font-medium">Active Security Deposit FDRs</span>
              <p className="text-2xl font-bold text-text-primary mt-1">{summary.totalFdrsCount}</p>
              <span className="text-[11px] text-text-muted">Instruments across all campuses</span>
            </div>

            <div className="bg-surface rounded border border-border p-4 shadow-xs">
              <span className="text-xs text-text-secondary font-medium">Total Active FDR Holdings</span>
              <p className="text-2xl font-bold text-aicte mt-1">
                ₹{(summary.totalActiveFdrAmount / 100000).toFixed(2)} L
              </p>
              <span className="text-[11px] text-text-muted font-mono">
                ₹{summary.totalActiveFdrAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-surface rounded border border-border p-4 shadow-xs">
              <span className="text-xs text-text-secondary font-medium">Regulatory Benchmark Required</span>
              <p className="text-2xl font-bold text-text-primary mt-1">
                ₹{(summary.totalRequiredDeposit / 100000).toFixed(2)} L
              </p>
              <span className="text-[11px] text-text-muted font-mono">
                ₹{summary.totalRequiredDeposit.toLocaleString('en-IN')}
              </span>
            </div>

            <div className={`bg-surface rounded border p-4 shadow-xs ${
              summary.totalShortfall > 0 ? 'border-red-300 bg-red-50/20' : 'border-emerald-300 bg-emerald-50/20'
            }`}>
              <span className="text-xs text-text-secondary font-medium">Net Trust Compliance Position</span>
              <p className={`text-2xl font-bold mt-1 ${
                summary.totalShortfall > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}>
                {summary.totalShortfall > 0 
                  ? `- ₹${(summary.totalShortfall / 100000).toFixed(2)} L` 
                  : `+ ₹${(summary.totalSurplus / 100000).toFixed(2)} L`}
              </p>
              <span className={`text-[11px] font-semibold ${
                summary.totalShortfall > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {summary.totalShortfall > 0 ? 'Shortfall: Action Required' : 'Fully Compliant Surplus'}
              </span>
            </div>
          </div>

          {/* Campus Breakdown Table */}
          <div className="bg-surface rounded border border-border overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border bg-[#F8FAFC]">
              <h3 className="font-bold text-sm text-text-primary">
                Campus-by-Campus Financial Compliance Breakdown
              </h3>
              <p className="text-xs text-text-secondary">
                Detailed deposit status calculated against AICTE approval intake norms.
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institution Code</TableHead>
                    <TableHead>Campus Name</TableHead>
                    <TableHead>Discipline / Intake</TableHead>
                    <TableHead>Active FDRs</TableHead>
                    <TableHead>Current Deposit</TableHead>
                    <TableHead>Required Deposit</TableHead>
                    <TableHead>Compliance Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.institutionsBreakdown.map((inst) => (
                    <TableRow key={inst.institutionId}>
                      <TableCell className="font-mono font-semibold text-xs text-aicte">
                        {inst.institutionCode}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-text-primary max-w-xs">
                        {inst.institutionName}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        <span className="block font-medium text-text-primary">{inst.discipline}</span>
                        <span className="text-[10px] text-text-muted">{inst.approvedIntake} Approved Seats</span>
                      </TableCell>
                      <TableCell className="text-xs text-center font-medium">
                        {inst.activeFdrsCount}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-text-primary">
                        ₹{inst.activeFdrsAmount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        ₹{inst.requiredDeposit.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        {inst.shortfall > 0 ? (
                          <span className="font-semibold text-xs text-red-700">
                            - ₹{inst.shortfall.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="font-semibold text-xs text-emerald-700">
                            + ₹{inst.surplus.toLocaleString('en-IN')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {inst.isCompliant ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Compliant
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 border border-red-300">
                            <AlertCircle className="w-3 h-3 mr-1" /> Shortfall
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/institutions/${inst.institutionId}`}
                          className="inline-flex items-center text-xs text-aicte hover:underline font-semibold"
                        >
                          Dossier <ExternalLink className="w-3 h-3 ml-0.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
