import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const AlertsNotifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } =
    useNotifications();

  const [filterType, setFilterType] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const filtered = notifications.filter(n => {
    if (filterUnreadOnly && n.readAt) return false;
    if (filterType && n.type !== filterType) return false;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Maturity Alert':
        return <Clock className="w-4 h-4 text-status-warning" />;
      case 'Discrepancy Detected':
        return <AlertTriangle className="w-4 h-4 text-status-danger" />;
      case 'Verification Needed':
        return <FileCheck className="w-4 h-4 text-aicte" />;
      case 'Renewal Pending':
        return <RefreshCw className="w-4 h-4 text-aicte" />;
      default:
        return <Bell className="w-4 h-4 text-text-secondary" />;
    }
  };

  const getEntityLink = (n: any) => {
    if (!n.relatedEntityType || !n.relatedEntityId) return null;
    switch (n.relatedEntityType) {
      case 'FDR':
        return `/fdrs/${n.relatedEntityId}`;
      case 'Document':
        return `/documents/verification-queue`;
      case 'RenewalRequest':
        return `/renewals`;
      case 'RefundRequest':
        return `/refunds/${n.relatedEntityId}`;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Alerts, Regulatory Tasks & Reminders
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time notifications for maturity thresholds, document discrepancy flags, and overdue cases.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark All as Read
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={refreshNotifications}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => {
            setFilterType('');
            setFilterUnreadOnly(false);
          }}
          className={`px-3 py-1.5 rounded-md font-medium border transition-colors ${
            !filterType && !filterUnreadOnly
              ? 'bg-aicte text-white border-aicte'
              : 'bg-surface text-text-primary border-border hover:bg-surface-subtle'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnreadOnly(prev => !prev)}
          className={`px-3 py-1.5 rounded-md font-medium border transition-colors ${
            filterUnreadOnly
              ? 'bg-aicte text-white border-aicte'
              : 'bg-surface text-text-primary border-border hover:bg-surface-subtle'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
        <button
          onClick={() => setFilterType('Maturity Alert')}
          className={`px-3 py-1.5 rounded-md font-medium border transition-colors ${
            filterType === 'Maturity Alert'
              ? 'bg-aicte text-white border-aicte'
              : 'bg-surface text-text-primary border-border hover:bg-surface-subtle'
          }`}
        >
          Maturity Alerts
        </button>
        <button
          onClick={() => setFilterType('Discrepancy Detected')}
          className={`px-3 py-1.5 rounded-md font-medium border transition-colors ${
            filterType === 'Discrepancy Detected'
              ? 'bg-aicte text-white border-aicte'
              : 'bg-surface text-text-primary border-border hover:bg-surface-subtle'
          }`}
        >
          Discrepancy Flags
        </button>
      </div>

      {/* Notification List */}
      <Card>
        {filtered.length === 0 ? (
          <p className="text-xs text-text-secondary py-12 text-center">
            No notifications matching your filter.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(n => {
              const link = getEntityLink(n);
              const isUnread = !n.readAt;

              return (
                <div
                  key={n._id}
                  className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                    isUnread ? 'bg-aicte-subtle/30' : 'hover:bg-surface-subtle/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded bg-surface border border-border shrink-0 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-text-primary">
                          {n.title}
                        </span>
                        {n.priority === 'urgent' && (
                          <Badge variant="danger">Urgent</Badge>
                        )}
                        {n.priority === 'high' && (
                          <Badge variant="warning">High</Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-primary mt-0.5">{n.message}</p>
                      <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-text-secondary">
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                        {link && (
                          <Link
                            to={link}
                            onClick={() => {
                              if (isUnread) markAsRead(n._id);
                            }}
                            className="text-aicte font-medium hover:underline inline-flex items-center"
                          >
                            Open linked record <ExternalLink className="w-3 h-3 ml-0.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isUnread && (
                      <button
                        onClick={() => markAsRead(n._id)}
                        className="text-[11px] text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-subtle whitespace-nowrap"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
