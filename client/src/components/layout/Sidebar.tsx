import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  FileCheck,
  CalendarClock,
  RotateCcw,
  CreditCard,
  Bell,
  BarChart3,
  History,
  Users,
  Settings,
  ShieldCheck,
  Landmark,
  Scale,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/institutions', label: 'Institutions', icon: Building2 },
    { to: '/fdrs', label: 'FDR Records', icon: FileSpreadsheet },
    ...(hasRole('admin', 'officer')
      ? [{ to: '/documents/verification-queue', label: 'Document Verification', icon: FileCheck }]
      : []),
    { to: '/maturity-schedule', label: 'Maturity & Renewals', icon: CalendarClock },
    { to: '/renewals', label: 'Renewal Requests', icon: RotateCcw },
    { to: '/refunds', label: 'Refund Requests', icon: CreditCard },
    { to: '/bank-verification', label: 'Bank Verification Hub', icon: Landmark },
    { to: '/trust-exposure', label: 'Trust Exposure', icon: Building },
    { to: '/policies', label: 'Policy & Adequacy', icon: Scale },
    { to: '/notifications', label: 'Alerts & Tasks', icon: Bell },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Logs', icon: History },
    ...(hasRole('admin') ? [{ to: '/users', label: 'User Management', icon: Users }] : []),
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 px-5 border-b border-border flex items-center space-x-3 bg-surface">
          <div className="w-9 h-9 rounded bg-aicte flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-base text-text-primary tracking-tight">FDRFlow</span>
              <span className="text-[10px] font-semibold px-1 py-0.2 bg-aicte-subtle text-aicte rounded border border-[#D0DFEF]">
                AICTE
              </span>
            </div>
            <p className="text-[10px] text-text-secondary leading-none mt-0.5">
              Govt of India • PS #26265
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
            Portal Navigation
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-aicte text-white shadow-xs'
                      : 'text-text-primary hover:bg-surface-subtle hover:text-text-primary'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Info Footer */}
        <div className="p-3 border-t border-border bg-surface-subtle">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-aicte/10 text-aicte font-bold text-xs flex items-center justify-center border border-border">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{user?.name}</p>
              <p className="text-[10px] text-text-secondary capitalize truncate">
                Role: <strong>{user?.role}</strong>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
