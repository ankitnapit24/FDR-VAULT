import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Select } from '../components/common/Input.js';
import { StatusBadge } from '../components/common/Badge.js';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/common/Table.js';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const ReportsAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fdrs' | 'maturities' | 'overdue'>('fdrs');
  const [fdrStatus, setFdrStatus] = useState('');
  const [timeframe, setTimeframe] = useState('60');

  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'fdrs') {
        endpoint = `/reports/fdrs?status=${fdrStatus}`;
      } else if (activeTab === 'maturities') {
        endpoint = `/reports/maturities?timeframe=${timeframe}`;
      } else {
        endpoint = `/reports/overdue`;
      }

      const res = await api.get(endpoint);
      if (res.data.success) {
        setData(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, fdrStatus, timeframe]);

  const handleExportCSV = () => {
    let url = '';
    if (activeTab === 'fdrs') {
      url = `/api/reports/fdrs?status=${fdrStatus}&format=csv`;
    } else if (activeTab === 'maturities') {
      url = `/api/reports/maturities?timeframe=${timeframe}&format=csv`;
    } else {
      url = `/api/reports/overdue?format=csv`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Regulatory Reports & Management Analytics
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Audit-grade reporting on institutional fixed deposit reserves and maturity compliance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Download Official CSV Report
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-border pb-2 text-xs">
        <button
          onClick={() => setActiveTab('fdrs')}
          className={`px-3.5 py-1.5 font-semibold rounded-md transition-colors ${
            activeTab === 'fdrs'
              ? 'bg-aicte text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
          }`}
        >
          Institution-wise FDR Report
        </button>
        <button
          onClick={() => setActiveTab('maturities')}
          className={`px-3.5 py-1.5 font-semibold rounded-md transition-colors ${
            activeTab === 'maturities'
              ? 'bg-aicte text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
          }`}
        >
          Upcoming Maturity Schedule
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-3.5 py-1.5 font-semibold rounded-md transition-colors ${
            activeTab === 'overdue'
              ? 'bg-aicte text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
          }`}
        >
          Overdue Scrutiny & Matured Cases
        </button>
      </div>

      {/* Filter Control based on Tab */}
      <Card className="!p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-semibold text-text-secondary">Filter Criteria:</span>
            {activeTab === 'fdrs' && (
              <div className="w-48">
                <Select
                  value={fdrStatus}
                  onChange={e => setFdrStatus(e.target.value)}
                >
                  <option value="">All FDR Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Matured">Matured</option>
                  <option value="Renewed">Renewed</option>
                  <option value="Released">Released</option>
                </Select>
              </div>
            )}
            {activeTab === 'maturities' && (
              <div className="w-48">
                <Select
                  value={timeframe}
                  onChange={e => setTimeframe(e.target.value)}
                >
                  <option value="15">Next 15 Days</option>
                  <option value="30">Next 30 Days</option>
                  <option value="60">Next 60 Days</option>
                  <option value="90">Next 90 Days</option>
                  <option value="180">Next 6 Months</option>
                </Select>
              </div>
            )}
            {activeTab === 'overdue' && (
              <span className="text-text-secondary text-xs">
                Showing unreviewed items &gt; 14 days or matured instruments without renewal action.
              </span>
            )}
          </div>
          <span className="text-xs text-text-secondary">
            Total records in report: <strong>{data.length}</strong>
          </span>
        </div>
      </Card>

      {/* Data Table */}
      {isLoading ? (
        <div className="py-12 text-center text-text-secondary text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
          Compiling regulatory report...
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Institution Code</TableHead>
                <TableHead>Institution Name</TableHead>
                <TableHead>FDR Reference #</TableHead>
                <TableHead>Issuing Bank</TableHead>
                <TableHead>Principal (₹)</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Maturity Date</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-text-secondary" colSpan={8}>
                    No records found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row: any) => {
                  const inst = typeof row.institutionId === 'object' ? row.institutionId : null;
                  return (
                    <TableRow key={row._id}>
                      <TableCell className="font-mono text-xs font-bold text-aicte">
                        {inst?.institutionCode || '—'}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-text-primary max-w-xs truncate">
                        {inst?.name || 'Institution'}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-text-primary">
                        {row.fdrNumber}
                      </TableCell>
                      <TableCell className="text-xs">{row.bankName}</TableCell>
                      <TableCell className="font-semibold text-xs text-text-primary">
                        ₹{row.depositAmount?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(row.issueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(row.maturityDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.currentStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
