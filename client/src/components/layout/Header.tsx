import React from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useNotifications } from '../../context/NotificationContext.js';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  // Determine current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview Dashboard';
    if (path.startsWith('/institutions')) return 'Technical Institutions';
    if (path.startsWith('/fdrs/register')) return 'Register New Security Deposit / FDR';
    if (path.startsWith('/fdrs')) return 'FDR Repository & Records';
    if (path.startsWith('/documents/verification-queue')) return 'Document Verification Queue';
    if (path.startsWith('/documents/upload')) return 'Document Upload & AI Review';
    if (path.startsWith('/maturity-schedule')) return 'Maturity Schedule & Monitoring';
    if (path.startsWith('/renewals')) return 'Renewal & Replacement Workflows';
    if (path.startsWith('/refunds')) return 'Release & Refund Applications';
    if (path.startsWith('/notifications')) return 'Alerts & System Tasks';
    if (path.startsWith('/reports')) return 'Reports & Regulatory Analytics';
    if (path.startsWith('/audit-logs')) return 'Immutable Audit Trail';
    if (path.startsWith('/users')) return 'User Administration';
    if (path.startsWith('/settings')) return 'System Settings & Thresholds';
    return 'FDR Vault Portal';
  };

  return (
    <header className="h-16 bg-surface border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-subtle lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-text-primary leading-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-text-secondary hidden sm:block">
            All India Council for Technical Education • Regulation Bureau
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* System Active Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-[#137333] animate-pulse"></span>
          <span>Regulatory Portal Live</span>
        </div>

        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-status-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Role Badge */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-semibold text-text-primary truncate max-w-[160px]">
            {user?.name}
          </span>
          <span className="text-[10px] text-text-secondary capitalize">
            {user?.role === 'institution' ? 'Institution Rep' : user?.role}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 rounded text-text-secondary hover:text-status-danger hover:bg-surface-subtle transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
