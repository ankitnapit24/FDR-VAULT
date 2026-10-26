import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { Institution } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input, Select } from '../components/common/Input.js';
import { Modal } from '../components/common/Modal.js';
import { StatusBadge } from '../components/common/Badge.js';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
} from '../components/common/Table.js';
import { Building2, Search, Plus, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const InstitutionsList: React.FC = () => {
  const { hasRole } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Institution Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Engineering');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newIntake, setNewIntake] = useState(300);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInstitutions = async (currPage = page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      params.append('page', currPage.toString());
      params.append('limit', '10');

      const res = await api.get(`/institutions?${params.toString()}`);
      if (res.data.success) {
        setInstitutions(res.data.institutions);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching institutions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions(1);
    setPage(1);
  }, [search, type, status]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchInstitutions(newPage);
  };

  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/institutions', {
        institutionCode: newCode,
        name: newName,
        type: newType,
        contactEmail: newEmail,
        contactPhone: newPhone,
        address: {
          city: newCity,
          state: newState,
          pincode: newPincode,
        },
        approvedIntake: Number(newIntake),
      });

      if (res.data.success) {
        setIsModalOpen(false);
        // Reset form
        setNewCode('');
        setNewName('');
        setNewEmail('');
        setNewCity('');
        setNewState('');
        setNewPincode('');
        await fetchInstitutions(1);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error creating institution profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Technical Institutions Directory
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Centralized registry of AICTE approved colleges and security deposit affiliations.
          </p>
        </div>
        {hasRole('admin', 'officer') && (
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Institution
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search by college name, code, or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Select value={type} onChange={e => setType(e.target.value)}>
              <option value="">All Disciplines</option>
              <option value="Engineering">Engineering</option>
              <option value="Management">Management</option>
              <option value="Polytechnic">Polytechnic</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Architecture">Architecture</option>
            </Select>
          </div>
          <div>
            <Select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Review">Under Review</option>
              <option value="Suspended">Suspended</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Institutions Table */}
      {isLoading ? (
        <div className="py-12 text-center text-text-secondary text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
          Loading institutions...
        </div>
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Code</TableHead>
                <TableHead>Institution Name</TableHead>
                <TableHead>Discipline</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Intake</TableHead>
                <TableHead>FDR Records</TableHead>
                <TableHead>Total Deposit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {institutions.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-text-secondary" colSpan={9}>
                    No institutions found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                institutions.map(inst => (
                  <TableRow key={inst._id}>
                    <TableCell className="font-mono font-bold text-xs text-aicte">
                      {inst.institutionCode}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/institutions/${inst._id}`}
                        className="font-medium text-text-primary hover:text-aicte hover:underline block"
                      >
                        {inst.name}
                      </Link>
                      <span className="text-[11px] text-text-secondary">
                        {inst.contactEmail}
                      </span>
                    </TableCell>
                    <TableCell>{inst.type}</TableCell>
                    <TableCell>
                      {inst.address.city}, {inst.address.state}
                    </TableCell>
                    <TableCell>{inst.approvedIntake || '—'}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-text-primary">
                        {inst.stats?.totalFdrs || 0}
                      </span>{' '}
                      <span className="text-[11px] text-text-secondary">
                        ({inst.stats?.activeCount || 0} active)
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-text-primary">
                      ₹{((inst.stats?.totalAmount || 0) / 100000).toFixed(2)} L
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inst.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/institutions/${inst._id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
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

      {/* Add Institution Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Technical Institution"
        description="Add a new technical institute to the AICTE regulatory registry."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateInstitution} className="space-y-4">
          {formError && (
            <div className="p-3 bg-status-danger-bg text-status-danger rounded text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Institution Code"
              required
              placeholder="e.g. AICTE-DL-1002"
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
            />
            <Select
              label="Discipline / Type"
              value={newType}
              onChange={e => setNewType(e.target.value)}
            >
              <option value="Engineering">Engineering</option>
              <option value="Management">Management</option>
              <option value="Polytechnic">Polytechnic</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Architecture">Architecture</option>
            </Select>
          </div>

          <Input
            label="Institution Full Legal Name"
            required
            placeholder="e.g. Delhi College of Advanced Technology"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Official Contact Email"
              type="email"
              required
              placeholder="director@institute.ac.in"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
            <Input
              label="Contact Phone"
              placeholder="+91 11 2345 6789"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="City"
              required
              placeholder="New Delhi"
              value={newCity}
              onChange={e => setNewCity(e.target.value)}
            />
            <Input
              label="State"
              required
              placeholder="Delhi"
              value={newState}
              onChange={e => setNewState(e.target.value)}
            />
            <Input
              label="Pincode"
              required
              placeholder="110001"
              value={newPincode}
              onChange={e => setNewPincode(e.target.value)}
            />
          </div>

          <Input
            label="Approved Student Intake"
            type="number"
            value={newIntake}
            onChange={e => setNewIntake(Number(e.target.value))}
          />

          <div className="pt-3 flex justify-end space-x-2 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Institution Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
