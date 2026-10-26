import React, { useState, useEffect } from 'react';
import { Scale, ShieldCheck, CheckCircle2, AlertCircle, Info, Calculator, ExternalLink } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Select } from '../components/common/Select.js';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/common/Table.js';
import { PolicyRule, Institution, AdequacyEvaluation } from '../types/index.js';
import api from '../services/api.js';

export const PolicyAdequacyPage: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [adequacy, setAdequacy] = useState<AdequacyEvaluation | null>(null);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoadingPolicies(true);
      try {
        const [polRes, instRes] = await Promise.all([
          api.get('/policies'),
          api.get('/institutions'),
        ]);

        if (polRes.data.success) {
          setPolicies(polRes.data.policies);
        }
        if (instRes.data.success && instRes.data.institutions.length > 0) {
          setInstitutions(instRes.data.institutions);
          setSelectedInstId(instRes.data.institutions[0]._id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load policy rules or institutions.');
      } finally {
        setLoadingPolicies(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedInstId) return;

    const runCalculation = async () => {
      setCalculating(true);
      try {
        const res = await api.get(`/policies/calculate-adequacy/${selectedInstId}`);
        if (res.data.success && (res.data.adequacy || res.data.evaluation)) {
          const data = res.data.adequacy || res.data.evaluation;
          setAdequacy({
            institution: {
              id: data.institution?.id || '',
              name: data.institution?.name || '',
              code: data.institution?.code || '',
              discipline: data.institution?.discipline || '',
              approvedIntake: data.institution?.approvedIntake || 0,
            },
            policyUsed: {
              ruleCode: data.policy?.ruleCode || '',
              version: data.policy?.version || '',
              title: data.policy?.title || '',
              isIllustrativeDemoRule: data.policy?.isIllustrativeDemoRule ?? true,
            },
            requiredDepositAmount: data.calculation?.totalRequiredDeposit || 0,
            currentActiveDepositAmount: data.calculation?.eligibleActiveFDRTotal || 0,
            activeFdrCount: data.calculation?.eligibleFdrCount || 0,
            shortfallAmount: (data.calculation?.shortfallOrSurplus < 0) ? Math.abs(data.calculation.shortfallOrSurplus) : 0,
            surplusAmount: (data.calculation?.shortfallOrSurplus > 0) ? data.calculation.shortfallOrSurplus : 0,
            isCompliant: data.calculation?.isAdequate ?? true,
            explanation: data.calculation?.breakdownExplanation || '',
          });
        }
      } catch (err: any) {
        console.error('Calculation error:', err);
      } finally {
        setCalculating(false);
      }
    };

    runCalculation();
  }, [selectedInstId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <Scale className="w-6 h-6 text-aicte" />
          <h1 className="text-xl font-bold text-text-primary">
            Regulatory Policy & Deposit Adequacy Engine
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-aicte-subtle text-aicte rounded border border-[#D0DFEF]">
            Feature U4
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Automated evaluation of institutional security deposit adequacy against Approval Process Handbook benchmark formulas.
        </p>
      </div>

      {/* Illustrative Notice */}
      <div className="p-3.5 bg-[#F0F5FA] border border-[#CBD5E1] rounded text-xs text-slate-800 leading-relaxed flex items-start space-x-2">
        <Info className="w-4 h-4 text-aicte shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-aicte">Statutory Norm Transparency: </span>
          The policy formulas below are versioned benchmarks modeled on the AICTE Approval Process Handbook (APH) regulations for Technical Institutions. AICTE Council Gazetted regulations govern statutory enforcement.
        </div>
      </div>

      {/* Interactive Adequacy Calculator Card */}
      <div className="bg-surface rounded border border-border p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary flex items-center space-x-1.5">
              <Calculator className="w-4 h-4 text-aicte" />
              <span>Live Campus Security Deposit Adequacy Audit</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Select any registered institution to evaluate total active FDR balance against formula intake multipliers.
            </p>
          </div>

          <div className="w-80">
            <Select
              label="Select Technical Institution"
              value={selectedInstId}
              onChange={e => setSelectedInstId(e.target.value)}
              options={institutions.map(inst => ({
                value: inst._id,
                label: `${inst.name} (${inst.institutionCode})`,
              }))}
            />
          </div>
        </div>

        {calculating && (
          <div className="py-8 text-center text-xs text-text-secondary">
            Computing deposit adequacy against active policy rules...
          </div>
        )}

        {adequacy && !calculating && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded border border-border bg-slate-50">
                <span className="text-[11px] text-text-secondary block">Program & Intake</span>
                <span className="font-bold text-xs text-text-primary block mt-0.5">
                  {adequacy.institution.discipline}
                </span>
                <span className="text-[11px] text-text-muted">
                  {adequacy.institution.approvedIntake} Approved Seats
                </span>
              </div>

              <div className="p-3.5 rounded border border-border bg-slate-50">
                <span className="text-[11px] text-text-secondary block">Required Deposit Norm</span>
                <span className="font-bold text-sm text-text-primary block mt-0.5">
                  ₹{adequacy.requiredDepositAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-aicte font-medium">
                  {adequacy.policyUsed.ruleCode} ({adequacy.policyUsed.version})
                </span>
              </div>

              <div className="p-3.5 rounded border border-border bg-slate-50">
                <span className="text-[11px] text-text-secondary block">Active FDR Portfolio</span>
                <span className="font-bold text-sm text-aicte block mt-0.5">
                  ₹{adequacy.currentActiveDepositAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-text-muted">
                  {adequacy.activeFdrCount} active FDR instrument{adequacy.activeFdrCount !== 1 ? 's' : ''}
                </span>
              </div>

              <div className={`p-3.5 rounded border ${
                adequacy.isCompliant ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
              }`}>
                <span className="text-[11px] text-text-secondary block">Compliance Position</span>
                <span className={`font-bold text-sm block mt-0.5 ${
                  adequacy.isCompliant ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {adequacy.isCompliant 
                    ? `Surplus: +₹${adequacy.surplusAmount.toLocaleString('en-IN')}` 
                    : `Shortfall: -₹${adequacy.shortfallAmount.toLocaleString('en-IN')}`}
                </span>
                <span className={`inline-flex items-center text-[10px] font-bold ${
                  adequacy.isCompliant ? 'text-emerald-800' : 'text-red-800'
                }`}>
                  {adequacy.isCompliant ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Fully Compliant</>
                  ) : (
                    <><AlertCircle className="w-3 h-3 mr-1" /> Deposit Top-up Required</>
                  )}
                </span>
              </div>
            </div>

            {/* Formula Explanation Narrative */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
              <span className="font-bold text-text-primary block mb-1">Adequacy Formula Breakdown:</span>
              <p className="text-text-secondary leading-relaxed font-mono text-[11px]">
                {adequacy.explanation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Versioned Policy Rules Table */}
      <div className="bg-surface rounded border border-border overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-[#F8FAFC]">
          <h2 className="font-bold text-sm text-text-primary">
            Active Approval Process Handbook Deposit Norms ({policies.length})
          </h2>
          <p className="text-xs text-text-secondary">
            Configured formula matrices categorized by technical discipline and intake units.
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Code</TableHead>
                <TableHead>Policy Version</TableHead>
                <TableHead>Title & Regulatory Description</TableHead>
                <TableHead>Minimum Tenure</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map(p => (
                <TableRow key={p._id}>
                  <TableCell className="font-mono font-bold text-xs text-aicte">
                    {p.ruleCode}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-text-primary">
                    {p.version}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <span className="font-semibold text-xs text-text-primary block">{p.title}</span>
                    <span className="text-xs text-text-secondary block mt-0.5">{p.formulaDescription}</span>
                    <span className="text-[10px] text-text-muted block mt-0.5 italic">Source: {p.regulatorySource}</span>
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {p.minimumTenureMonths} Months ({p.minimumTenureMonths / 12} Yrs)
                  </TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        Archived
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
