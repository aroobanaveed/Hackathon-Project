/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getUserBookings, cancelBooking, getUserNotifications, getAllIssues } from '../../services/db';
import { Booking, Notification, Issue } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  CalendarCheck,
  Clock,
  Wrench,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  FlaskConical,
  Bell,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';

export const UserDashboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    async function loadData() {
      setLoading(true);
      try {
        const [userB, allI, notifs] = await Promise.all([
          getUserBookings(currentUser!.id),
          getAllIssues(),
          getUserNotifications(currentUser!.id)
        ]);
        setBookings(userB);
        setIssues(allI.filter(i => i.userId === currentUser!.id));
        setNotifications(notifs);
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  // Derived KPI metrics
  const activeBookings = bookings.filter(b => b.status === 'APPROVED' || b.status === 'RESERVED');
  const pendingRequests = bookings.filter(b => b.status === 'PENDING_APPROVAL');
  const inUseItems = bookings.filter(b => b.status === 'IN_USE');
  const issuedEquipment = issues.filter(i => i.status === 'ISSUED');
  const now = new Date().getTime();
  const overdueItems = issues.filter(i => i.status === 'ISSUED' && new Date(i.expectedReturnAt).getTime() < now);

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !currentUser) return;
    setCancelling(true);
    try {
      await cancelBooking(cancelTarget.id, currentUser);
      success('Booking Cancelled', `Booking ${cancelTarget.bookingId} has been successfully cancelled.`);
      setBookings(prev => prev.map(b => (b.id === cancelTarget.id ? { ...b, status: 'CANCELLED' } : b)));
      setCancelTarget(null);
    } catch (err: any) {
      error('Could not cancel booking', err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {currentUser?.role} PORTAL
              </span>
              <span className="text-xs text-indigo-300 font-mono">
                {currentUser?.studentId || currentUser?.employeeId || 'ID Verified'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {currentUser?.name}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
              {currentUser?.departmentName || 'Computer Science'} Department • Manage your lab sessions, track equipment reservations, and check real-time availability.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/labs')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition-all border border-white/20"
            >
              Browse Labs
            </button>
            <button
              onClick={() => navigate('/bookings/new')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-102"
            >
              <PlusCircle className="w-4 h-4" />
              New Booking Request
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Bookings</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{activeBookings.length}</span>
            <span className="text-[11px] text-emerald-600 font-medium ml-2">Approved</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Requests</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{pendingRequests.length}</span>
            <span className="text-[11px] text-amber-600 font-medium ml-2">Awaiting Staff</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">In Use / Sessions</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{inUseItems.length}</span>
            <span className="text-[11px] text-blue-600 font-medium ml-2">Ongoing</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Equipment Checked Out</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{issuedEquipment.length}</span>
            <span className="text-[11px] text-purple-600 font-medium ml-2">In Possession</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Overdue Items</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className={`text-2xl font-black ${overdueItems.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {overdueItems.length}
            </span>
            <span className={`text-[11px] font-medium ml-2 ${overdueItems.length > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
              {overdueItems.length > 0 ? 'Action Required' : 'All On Time'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Bookings Table & Sidebar Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Bookings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Recent Bookings</h2>
              <p className="text-xs text-slate-500">Track real-time status and staff approval updates</p>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              View Full History
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {bookings.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <CalendarCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                You haven't made any booking requests yet.
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/bookings/new')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Create Your First Booking
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Resource</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.slice(0, 6).map(bkg => {
                      const canCancel = bkg.status === 'PENDING_APPROVAL' || bkg.status === 'APPROVED';

                      return (
                        <tr key={bkg.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{bkg.resourceName}</span>
                            <span className="text-[11px] font-mono text-slate-400">{bkg.bookingId}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 block">{bkg.bookingDate}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {bkg.startTime} - {bkg.endTime}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                bkg.resourceType === 'LAB'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {bkg.resourceType} {bkg.quantity ? `(Qty: ${bkg.quantity})` : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={bkg.status} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                            <button
                              onClick={() => navigate(`/bookings/${bkg.id}`)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canCancel && (
                              <button
                                onClick={() => setCancelTarget(bkg)}
                                className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Notifications & Quick Actions */}
        <div className="space-y-6">
          {/* Notifications Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Activity & Alerts</h3>
              </div>
              <button
                onClick={() => navigate('/notifications')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                All
              </button>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent notifications</p>
              ) : (
                notifications.slice(0, 4).map(n => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      n.read ? 'bg-slate-50 border-slate-100 opacity-80' : 'bg-indigo-50/40 border-indigo-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-bold text-slate-800">{n.title}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Issue Card */}
          {issuedEquipment.length > 0 && (
            <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                Checked Out Equipment
              </div>
              <p className="text-xs text-amber-800 mb-3">
                You have active equipment checked out from the department store.
              </p>
              <div className="space-y-2">
                {issuedEquipment.map(iss => (
                  <div key={iss.id} className="bg-white p-3 rounded-xl border border-amber-200 text-xs">
                    <p className="font-bold text-slate-900">{iss.equipmentName}</p>
                    <p className="text-[11px] text-slate-500">Qty: {iss.quantity} • Return Due: {new Date(iss.expectedReturnAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Booking Request?"
        message={`Are you sure you want to cancel your reservation for ${cancelTarget?.resourceName} on ${cancelTarget?.bookingDate}? This will immediately release the time slot and reserved inventory.`}
        confirmLabel="Yes, Cancel Booking"
        cancelLabel="Keep Booking"
        isDestructive={true}
        isLoading={cancelling}
      />
    </div>
  );
};
