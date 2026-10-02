/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getUserBookings, cancelBooking } from '../../services/db';
import { Booking, BookingStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  XCircle,
  PlusCircle,
  ArrowRight,
  Clock,
  FlaskConical,
  Wrench
} from 'lucide-react';

export const UserBookingsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BookingStatus>('ALL');
  const [loading, setLoading] = useState(true);

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      setLoading(true);
      try {
        const list = await getUserBookings(currentUser!.id);
        setBookings(list);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !currentUser) return;
    setCancelling(true);
    try {
      await cancelBooking(cancelTarget.id, currentUser);
      success('Booking Cancelled', `Booking ${cancelTarget.bookingId} has been successfully cancelled.`);
      setBookings(prev => prev.map(b => (b.id === cancelTarget.id ? { ...b, status: 'CANCELLED' } : b)));
      setCancelTarget(null);
    } catch (err: any) {
      error('Cancellation Failed', err.message);
    } finally {
      setCancelling(false);
    }
  };

  const filtered = bookings.filter(b => {
    const matchesSearch =
      b.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My University Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status transitions, access digital session passes, or cancel pending requests.
          </p>
        </div>
        <button
          onClick={() => navigate('/bookings/new')}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> New Booking
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Bookings' },
            { id: 'PENDING_APPROVAL', label: 'Pending Approval' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'IN_USE', label: 'In Use / Ongoing' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
            { id: 'REJECTED', label: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter bookings by lab or equipment name, booking ID (e.g. BKG-2026-1001)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading your reservations...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CalendarCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No bookings found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Resource Target</th>
                  <th className="py-3.5 px-4">Scheduled Slot</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Approval State</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(bkg => {
                  const canCancel = bkg.status === 'PENDING_APPROVAL' || bkg.status === 'APPROVED';

                  return (
                    <tr key={bkg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {bkg.bookingId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {bkg.resourceType === 'LAB' ? (
                            <FlaskConical className="w-4 h-4 text-purple-600 shrink-0" />
                          ) : (
                            <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{bkg.resourceName}</span>
                            <span className="text-[11px] text-slate-400 line-clamp-1">{bkg.purpose}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block">{bkg.bookingDate}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {bkg.startTime} - {bkg.endTime}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {bkg.quantity ? (
                          <span className="font-semibold text-slate-700">{bkg.quantity} units</span>
                        ) : (
                          <span className="text-slate-400">1 Room</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={bkg.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => navigate(`/bookings/${bkg.id}`)}
                          className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                        {canCancel && (
                          <button
                            onClick={() => setCancelTarget(bkg)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg transition-colors border border-rose-200 cursor-pointer"
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

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Booking Request?"
        message={`Are you sure you want to cancel booking ${cancelTarget?.bookingId} for ${cancelTarget?.resourceName}?`}
        confirmLabel="Cancel Booking"
        isDestructive={true}
        isLoading={cancelling}
      />
    </div>
  );
};
