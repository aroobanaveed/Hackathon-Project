/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getUserNotifications, markNotificationAsRead } from '../../services/db';
import { Notification } from '../../types';
import { Bell, CheckCheck, Clock, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const NotificationsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { success } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      setLoading(true);
      try {
        const list = await getUserNotifications(currentUser!.id);
        setNotifications(list);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter(x => !x.read)) {
      await markNotificationAsRead(n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    success('All notifications marked as read.');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-500 mt-1">Live alerts regarding approvals, issue deadlines, and maintenance updates.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-indigo-600" /> Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No notifications in your inbox.
          </div>
        ) : (
          notifications.map(n => {
            const isSuccess = n.type === 'SUCCESS';
            const isAlert = n.type === 'ALERT';
            const isWarning = n.type === 'WARNING';

            return (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                  n.read ? 'bg-white hover:bg-slate-50/80 opacity-75' : 'bg-indigo-50/30 hover:bg-indigo-50/60 font-medium'
                }`}
              >
                <div className="p-2.5 rounded-xl shrink-0 mt-0.5">
                  {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {isAlert && <AlertCircle className="w-5 h-5 text-rose-600" />}
                  {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                  {!isSuccess && !isAlert && !isWarning && <Info className="w-5 h-5 text-indigo-600" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{n.title}</h3>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  {n.relatedBookingId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/bookings/${n.relatedBookingId}`);
                      }}
                      className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View Related Booking →
                    </button>
                  )}
                </div>

                {!n.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 self-center" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
