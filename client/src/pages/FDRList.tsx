import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { FDR } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input, Select } from '../components/common/Input.js';
import { StatusBadge, Badge } from '../components/common/Badge.js';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
} from '../components/common/Table.js';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Download,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export const FDRList: React.FC = () => {
  const [fdrs, setFdrs] = useState<FDR[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [maturityDays, setMaturityDays] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchFDRs = async (currPage = page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (currentStatus) params.append('currentStatus', currentStatus);
      if (verificationStatus) params.append('verificationStatus', verificationStatus);
      if (maturityDays) params.append('maturityWithinDays', maturityDays);
      params.append('page', currPage.toString());
      params.append('limit', '10');

      const res = await api.get(`/fdrs?${params.toString()}`);
      if (res.data.success) {
        setFdrs(res.data.fdrs);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching FDR records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFDRs(1);
    setPage(1);
  }, [search, currentStatus, verificationStatus, maturityDays]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchFDRs(newPage);
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (currentStatus) params.append('status', currentStatus);
    params.append('format', 'csv');
    window.open(`/api/reports/fdrs?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Security Deposit / FDR Repository
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Complete database of fixed deposit receipts submitted for AICTE regulatory oversight.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
          <Link to="/fdrs/register">
            <Button variant="primary" size="sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Register FDR
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <Input
              placeholder="Search by FDR #, Bank, Branch..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Select value={currentStatus} onChange={e => setCurrentStatus(e.target.value)}>
              <option value="">All Lifecycle Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Matured">Matured</option>
              <option value="Renewed">Renewed</option>
              <option value="Released">Released</option>
            </Select>
          </div>
          <div>
            <Select
              value={verificationStatus}
              onChange={e => setVerificationStatus(e.target.value)}
            >
              <option value="">All Verification Statuses</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Under Scrutiny">Under Scrutiny</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
              <option value="Additional Information Required">Additional Info Required</option>
            </Select>
          </div>
          <div>
            <Select value={maturityDays} onChange={e => setMaturityDays(e.target.value)}>
              <option value="">All Maturity Horizons</option>
              <option value="15">Maturing within 15 Days</option>
              <option value="30">Maturing within 30 Days</option>
              <option value="60">Maturing within 60 Days</option>
              <option value="90">Maturing within 90 Days</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-text-secondary text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
          Loading FDR records...
        </div>
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>FDR Number</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Issuing Bank</TableHead>
                <TableHead>Deposit Amount</TableHead>
                <TableHead>Maturity Date</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {fdrs.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-text-secondary" colSpan={9}>
                    No FDR records match the specified filters.
                  </TableCell>
                </TableRow>
              ) : (
                fdrs.map(fdr => {
                  const inst = typeof fdr.institutionId === 'object' ? fdr.institutionId : null;
                  return (
                    <TableRow key={fdr._id}>
                      <TableCell className="font-mono font-bold text-xs text-text-primary">
                        <Link to={`/fdrs/${fdr._id}`} className="hover:text-aicte hover:underline block">
                          {fdr.fdrNumber}
                        </Link>
                        {fdr.previousFdrId && (
                          <span className="text-[10px] text-text-secondary">
                            (Rollover renewal)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-text-primary block truncate max-w-[200px]">
                          {inst?.name || 'Assigned Institution'}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">
                          {inst?.institutionCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-text-primary block">{fdr.bankName}</span>
                        <span className="text-[11px] text-text-secondary">
                          {fdr.branchName || 'Main Branch'}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-text-primary">
                        ₹{fdr.depositAmount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(fdr.maturityDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={fdr.verificationStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={fdr.currentStatus} />
                      </TableCell>
                      <TableCell>
                        {fdr.priorityScore >= 40 ? (
                          <Badge variant="danger" title={fdr.priorityReason}>
                            High ({fdr.priorityScore})
                          </Badge>
                        ) : fdr.priorityScore >= 20 ? (
                          <Badge variant="warning" title={fdr.priorityReason}>
                            Med ({fdr.priorityScore})
                          </Badge>
                        ) : (
                          <Badge variant="default" title={fdr.priorityReason}>
                            Low
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/fdrs/${fdr._id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / 10)}
            onPageChange={handlePageChange}
            totalRecords={total}
          />
        </div>
      )}
    </div>
  );
};
