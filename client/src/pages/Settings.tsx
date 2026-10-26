import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Settings as SettingsIcon, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const Settings: React.FC = () => {
  const { hasRole } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [reminderDays, setReminderDays] = useState('30, 15, 7');
  const [overdueThreshold, setOverdueThreshold] = useState('14');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
        const rem = res.data.settings.find((s: any) => s.key === 'reminder_days_before');
        if (rem) {
          setReminderDays(Array.isArray(rem.value) ? rem.value.join(', ') : String(rem.value));
        }
        const ovr = res.data.settings.find((s: any) => s.key === 'overdue_days_threshold');
        if (ovr) {
          setOverdueThreshold(String(ovr.value));
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(false);

    try {
      const parsedDays = reminderDays
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n));

      await api.patch('/settings/reminder_days_before', {
        value: parsedDays,
        description: 'Advance reminder thresholds in days prior to FDR maturity.',
      });

      await api.patch('/settings/overdue_days_threshold', {
        value: parseInt(overdueThreshold, 10) || 14,
        description: 'Days before pending verification or action is flagged as overdue.',
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      await fetchSettings();
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">
          Portal Configurations & Regulatory Thresholds
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure automated maturity reminder windows, scrutiny escalation rules, and AI parameters.
        </p>
      </div>

      {isSaved && (
        <div className="p-3 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] rounded-md text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>System settings updated successfully and logged to audit trail.</span>
        </div>
      )}

      <Card title="Workflow & Compliance Rules">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <Input
              label="Advance Maturity Reminder Intervals (Days)"
              disabled={!hasRole('admin')}
              helperText="Comma-separated day thresholds before FDR maturity to trigger regulatory reminders."
              value={reminderDays}
              onChange={e => setReminderDays(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Overdue Scrutiny Action Threshold (Days)"
              type="number"
              disabled={!hasRole('admin')}
              helperText="Maximum allowed days for pending document verification before case is marked overdue."
              value={overdueThreshold}
              onChange={e => setOverdueThreshold(e.target.value)}
            />
          </div>

          <div className="pt-2 border-t border-border space-y-3">
            <h4 className="text-xs font-semibold text-text-primary">
              AI & Regulatory Security Safeguards
            </h4>

            <div className="p-3 bg-surface-subtle rounded border border-border flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-text-primary block">
                  Mandatory Dual Lien Endorsement
                </span>
                <span className="text-[11px] text-text-secondary">
                  Enforces joint FDR naming between Regional Officer, AICTE and College Principal.
                </span>
              </div>
              <span className="text-xs font-semibold text-status-success">Enforced</span>
            </div>

            <div className="p-3 bg-surface-subtle rounded border border-border flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-text-primary block">
                  Automated OCR Document Intelligence & Discrepancy Parsing
                </span>
                <span className="text-[11px] text-text-secondary">
                  Automatically extracts FDR number, issuing bank, amount, and dates on certificate upload.
                </span>
              </div>
              <span className="text-xs font-semibold text-status-success">Active</span>
            </div>
          </div>

          {hasRole('admin') && (
            <div className="flex justify-end pt-3 border-t border-border">
              <Button variant="primary" type="submit">
                Save System Thresholds
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};
