import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { User, Institution } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input, Select } from '../components/common/Input.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/common/Table.js';
import { Users, Plus, ShieldCheck, RefreshCw } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New User Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'officer' | 'institution'>('officer');
  const [institutionId, setInstitutionId] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [uRes, iRes] = await Promise.all([
        api.get('/users'),
        api.get('/institutions?limit=100'),
      ]);
      if (uRes.data.success) {
        setUsers(uRes.data.users);
      }
      if (iRes.data.success) {
        setInstitutions(iRes.data.institutions);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/users', {
        name,
        email,
        password,
        role,
        institutionId: role === 'institution' ? institutionId : undefined,
        designation,
        phone,
      });

      if (res.data.success) {
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPassword('');
        setDesignation('');
        setPhone('');
        await fetchUsers();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error creating user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await api.patch(`/users/${id}/toggle-status`);
      if (res.data.success) {
        setUsers(prev =>
          prev.map(u => (u._id === id ? { ...u, isActive: res.data.user.isActive } : u))
        );
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            AICTE User Accounts & Role Permissions
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Admin console for provisioning officers, administrators, and authorized college representatives.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Provision New User
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-text-secondary text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-aicte" />
          Loading user database...
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>User Full Name</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Affiliated Institution / Bureau</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u._id}>
                  <TableCell>
                    <span className="font-semibold text-text-primary block text-xs">
                      {u.name}
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {u.designation || 'Staff'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{u.email}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-surface-subtle text-text-primary border border-border">
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-text-primary">
                    {u.institutionId?.name || (u.role === 'institution' ? 'Assigned College' : 'AICTE Headquarters')}
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="danger">Deactivated</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(u._id)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Provision User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Portal User Account"
        description="Assign credentials and server-side RBAC permissions."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-status-danger-bg text-status-danger rounded text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Dr. A. K. Verma"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Select
              label="Role Assignment"
              value={role}
              onChange={e => setRole(e.target.value as any)}
            >
              <option value="officer">AICTE Scrutiny Officer</option>
              <option value="admin">System Administrator</option>
              <option value="institution">Institution Representative</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Official Email"
              type="email"
              required
              placeholder="user@aicte.gov.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Input
              label="Temporary Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {role === 'institution' && (
            <div>
              <Select
                label="Assign Technical Institution *"
                required
                value={institutionId}
                onChange={e => setInstitutionId(e.target.value)}
              >
                <option value="">Select College...</option>
                {institutions.map(inst => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name} ({inst.institutionCode})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Designation / Office Title"
              placeholder="e.g. Regional Scrutiny Officer"
              value={designation}
              onChange={e => setDesignation(e.target.value)}
            />
            <Input
              label="Contact Phone"
              placeholder="+91 11 2958 1000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
