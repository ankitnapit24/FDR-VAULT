import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { Institution, FDR } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
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
  Building2,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  IndianRupee,
  Calendar,
  ArrowLeft,
  Plus,
  RefreshCw,
} from 'lucide-react';

export const InstitutionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [metrics, setMetrics] = useState<any>({});
  const [fdrs, setFdrs] = useState<FDR[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDetails() {
      setIsLoading(true);
      try {
        const res = await api.get(`/institutions/${id}`);
        if (res.data.success) {
          setInstitution(res.data.institution);
          setMetrics(res.data.metrics);
          setFdrs(res.data.fdrs);
        }
      } catch (err) {
        console.error('Error fetching institution details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-text-secondary text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
        Loading institution profile...
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="py-12 text-center text-text-secondary">
        Institution profile not found or access denied.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/institutions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-text-primary">{institution.name}</h2>
              <StatusBadge status={institution.status} />
            </div>
            <p className="text-xs text-text-secondary">
              AICTE Permanent ID: <strong className="font-mono text-text-primary">{institution.institutionCode}</strong> • {institution.type} Discipline
            </p>
          </div>
        </div>
        <Link to={`/fdrs/register?institutionId=${institution._id}`}>
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" /> Register FDR
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-[11px] font-semibold text-text-secondary uppercase">Associated FDRs</p>
          <h3 className="text-xl font-bold text-text-primary mt-1">{metrics.totalFdrs || 0}</h3>
          <p className="text-[11px] text-text-secondary mt-1">
            {metrics.activeCount || 0} active • {metrics.maturedCount || 0} matured
          </p>
        </Card>

        <Card className="!p-4">
          <p className="text-[11px] font-semibold text-text-secondary uppercase">Total Security Deposits</p>
          <h3 className="text-xl font-bold text-[#137333] mt-1">
            ₹{((metrics.totalDepositAmount || 0) / 100000).toFixed(2)} Lakhs
          </h3>
          <p className="text-[11px] text-text-secondary mt-1">
            Cumulative principal with AICTE lien
          </p>
        </Card>

        <Card className="!p-4">
          <p className="text-[11px] font-semibold text-text-secondary uppercase">Approved Intake</p>
          <h3 className="text-xl font-bold text-text-primary mt-1">
            {institution.approvedIntake || 'N/A'} seats
          </h3>
          <p className="text-[11px] text-text-secondary mt-1">Established in {institution.establishedYear}</p>
        </Card>

        <Card className="!p-4">
          <p className="text-[11px] font-semibold text-text-secondary uppercase">Compliance Status</p>
          <h3 className="text-xl font-bold text-aicte mt-1">Affiliated</h3>
          <p className="text-[11px] text-text-secondary mt-1">Regional Bureau Compliant</p>
        </Card>
      </div>

      {/* Institution Info Card */}
      <Card title="Institution Information & Location Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start space-x-2.5">
            <MapPin className="w-4 h-4 text-aicte shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-text-primary block">Campus Address</span>
              <p className="text-text-secondary mt-0.5">
                {institution.address.street && `${institution.address.street}, `}
                {institution.address.city}, {institution.address.state} - {institution.address.pincode}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <Mail className="w-4 h-4 text-aicte shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-text-primary block">Official Correspondence</span>
              <p className="text-text-secondary mt-0.5">{institution.contactEmail}</p>
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <Phone className="w-4 h-4 text-aicte shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-text-primary block">Contact Phone</span>
              <p className="text-text-secondary mt-0.5">{institution.contactPhone || '—'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Affiliated FDRs Table */}
      <Card
        title="Fixed Deposit Receipts & Security Deposits"
        description="All financial instruments maintained by this institution for AICTE regulatory approval."
      >
        {fdrs.length === 0 ? (
          <p className="text-xs text-text-secondary py-6 text-center">
            No FDR records registered for this institution yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>FDR Number</TableHead>
                <TableHead>Issuing Bank & Branch</TableHead>
                <TableHead>Principal Amount</TableHead>
                <TableHead>Maturity Date</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {fdrs.map(fdr => (
                <TableRow key={fdr._id}>
                  <TableCell className="font-mono font-bold text-xs text-text-primary">
                    <Link to={`/fdrs/${fdr._id}`} className="hover:text-aicte hover:underline">
                      {fdr.fdrNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-text-primary block">{fdr.bankName}</span>
                    <span className="text-[11px] text-text-secondary">{fdr.branchName || 'Main Branch'}</span>
                  </TableCell>
                  <TableCell className="font-semibold text-text-primary">
                    ₹{fdr.depositAmount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    {new Date(fdr.maturityDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={fdr.verificationStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={fdr.currentStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/fdrs/${fdr._id}`}>
                      <Button variant="outline" size="sm">
                        View Record
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
