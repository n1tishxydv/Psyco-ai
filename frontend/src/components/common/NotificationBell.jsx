import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { isBackendConfigured } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Calendar,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated || !isBackendConfigured()) return;
    try {
      const res = await notificationService.getNotifications();
      if (res?.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Silently handle polling note
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isBackendConfigured()) return;
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 25000); // 25s refresh
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark notifications read:', err);
    }
  };

  const handleItemClick = async (notif) => {
    try {
      if (!notif.read) {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      // Ignore
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-psyco-coolGrey hover:text-psyco-softGrey hover:bg-psyco-slate transition-colors relative"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-psyco-softGrey text-[9px] font-bold text-psyco-deepNavy ring-2 ring-psyco-darkNavy">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-psyco-darkNavy border border-psyco-steel/80 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
          <div className="px-4 py-2.5 border-b border-psyco-steel/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-psyco-softGrey">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-psyco-slate text-psyco-softGrey text-[10px] font-semibold border border-psyco-steel">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-psyco-softGrey hover:text-white flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {!isBackendConfigured() ? (
              <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                <Bell className="w-6 h-6 mx-auto opacity-30 mb-2" />
                <p className="font-medium text-slate-400">Notifications Offline</p>
                <p className="text-[11px]">Backend service is not connected in this deployment.</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                <Bell className="w-6 h-6 mx-auto opacity-30 mb-2" />
                <p className="font-medium text-slate-400">No notifications</p>
                <p className="text-[11px]">Appointment and schedule updates will appear here.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const titleLower = (notif.title || '').toLowerCase();
                let iconClass = 'bg-softTeal/10 text-softTeal';
                let Icon = Calendar;

                if (titleLower.includes('confirmed') || titleLower.includes('accepted')) {
                  iconClass = 'bg-calmGreen/15 text-calmGreen';
                  Icon = CheckCheck;
                } else if (titleLower.includes('cancelled') || titleLower.includes('rejected')) {
                  iconClass = 'bg-mutedCoral/15 text-mutedCoral';
                  Icon = AlertCircle;
                } else if (titleLower.includes('rescheduled') || titleLower.includes('proposal')) {
                  iconClass = 'bg-mutedAmber/15 text-mutedAmber';
                  Icon = Clock;
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 hover:bg-psyco-slate/50 cursor-pointer transition-colors flex items-start gap-3 ${
                      !notif.read ? 'bg-psyco-slate/20' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${iconClass} mt-0.5 flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-psyco-softGrey truncate">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-psyco-softGrey flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-psyco-coolGrey line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="text-[10px] text-psyco-coolGrey/70 flex items-center gap-1 pt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
