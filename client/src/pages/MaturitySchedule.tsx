import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Select } from '../components/common/Input.js';
import { StatusBadge, Badge } from '../components/common/Badge.js';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/common/Table.js';
import {
  CalendarClock,
  Download,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Clock,
} from 'lucide-react';

export const MaturitySchedule: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('60');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/reports/maturities?timeframe=${timeframe}`);
      if (res.data.success) {
        setRecords(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching maturity report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [timeframe]);

  const handleExportCSV = () => {
    window.open(`/api/reports/maturities?timeframe=${timeframe}&format=csv`, '_blank');
  };

  const totalValueAtMaturity = records.reduce((acc, r) => acc + (r.depositAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Maturity Schedule & Statutory Expiry Tracking
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Active monitoring of deposit completion horizons to prevent lapse in AICTE security guarantees.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Schedule CSV
          </Button>
          <div className="w-44">
            <Select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
            >
              <option value="15">Next 15 Days</option>
              <option value="30">Next 30 Days</option>
              <option value="60">Next 60 Days</option>
              <option value="90">Next 90 Days</option>
              <option value="180">Next 6 Months</option>
              <option value="365">Next 1 Year</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-4 border-l-4 border-l-status-warning">
          <p className="text-[11px] font-semibold text-text-secondary uppercase">
            Instruments In Window ({timeframe} Days)
          </p>
          <h3 className="text-xl font-bold text-text-primary mt-1">{records.length}</h3>
          <p className="text-[11px] text-text-secondary mt-1">Pending regulatory rollover or release</p>
        </Card>

        <Card className="!p-4 border-l-4 border-l-aicte">
          <p className="text-[11px] font-semibold text-text-secondary uppercase">
            Total Valuation Maturing
          </p>
          <h3 className="text-xl font-bold text-aicte mt-1">
            ₹{(totalValueAtMaturity / 100000).toFixed(2)} Lakhs
          </h3>
          <p className="text-[11px] text-text-secondary mt-1">Cumulative principal expiring</p>
        </Card>

        <Card className="!p-4 border-l-4 border-l-status-danger">
          <p className="text-[11px] font-semibold text-text-secondary uppercase">
            Overdue / Matured
          </p>
          <h3 className="text-xl font-bold text-status-danger mt-1">
            {records.filter(r => r.daysRemaining <= 0).length}
          </h3>
          <p className="text-[11px] text-text-secondary mt-1">Past maturity date needing immediate renewal</p>
        </Card>
      </div>

      {/* Schedule Table */}
      {isLoading ? (
        <div className="py-12 text-center text-text-secondary text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
          Loading maturity schedule...
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>FDR Number</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Principal Amount</TableHead>
                <TableHead>Maturity Date</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-text-secondary" colSpan={8}>
                    No deposits maturing within the next {timeframe} days.
                  </TableCell>
                </TableRow>
              ) : (
                records.map(fdr => {
                  const inst = typeof fdr.institutionId === 'object' ? fdr.institutionId : null;
                  const isMatured = fdr.daysRemaining <= 0;
                  const isCritical = fdr.daysRemaining > 0 && fdr.daysRemaining <= 15;

                  return (
                    <TableRow key={fdr._id}>
                      <TableCell className="font-mono font-bold text-xs text-text-primary">
                        <Link to={`/fdrs/${fdr._id}`} className="hover:text-aicte hover:underline block">
                          {fdr.fdrNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-text-primary block truncate max-w-[200px] text-xs">
                          {inst?.name || 'Institution'}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">
                          {inst?.institutionCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-text-primary">
                        {fdr.bankName}
                      </TableCell>
                      <TableCell className="font-semibold text-text-primary">
                        ₹{fdr.depositAmount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {new Date(fdr.maturityDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {isMatured ? (
                          <Badge variant="danger">
                            Matured ({Math.abs(fdr.daysRemaining)}d ago)
                          </Badge>
                        ) : isCritical ? (
                          <Badge variant="warning">
                            {fdr.daysRemaining} days left
                          </Badge>
                        ) : (
                          <Badge variant="aicte">
                            {fdr.daysRemaining} days
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={fdr.currentStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link to={`/renewals?fdrId=${fdr._id}`}>
                            <Button variant="primary" size="sm">
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Renew
                            </Button>
                          </Link>
                          <Link to={`/fdrs/${fdr._id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
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
