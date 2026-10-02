/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getAllBookings, approveBooking, rejectBooking } from '../../services/db';
import { Booking } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  Wrench,
  Search,
  Filter,
  User
} from 'lucide-react';

export const StaffRequestsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Reject Modal
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const all = await getAllBookings();
      setBookings(all.filter(b => b.status === 'PENDING_APPROVAL'));
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (bkg: Booking) => {
    if (!currentUser) return;
    setProcessing(true);
    try {
      await approveBooking(bkg.id, currentUser);
      success('Booking Approved!', `${bkg.bookingId} for ${bkg.resourceName} was approved and reserved.`);
      loadRequests();
    } catch (err: any) {
      error('Approval failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget || !currentUser || !rejectReason.trim()) return;
    setProcessing(true);
    try {
      await rejectBooking(rejectTarget.id, rejectReason.trim(), currentUser);
      success('Booking Rejected', `${rejectTarget.bookingId} was declined and applicant notified.`);
      setRejectTarget(null);
      setRejectReason('');
      loadRequests();
    } catch (err: any) {
      error('Rejection failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filtered = bookings.filter(b =>
    b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pending Booking Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review applicant justifications, verify conflict-free schedule, and authorize laboratory access.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-xs self-start sm:self-auto">
          {bookings.length} Pending Approval
        </span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search pending requests by student name, resource, booking ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading pending requests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No pending booking requests in the queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Target Resource</th>
                  <th className="py-3.5 px-4">Requested Slot</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Purpose & Justification</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(bkg => (
                  <tr key={bkg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{bkg.userName}</span>
                      <span className="text-[11px] text-slate-400 block">{bkg.userEmail}</span>
                      <span className="text-[10px] font-semibold text-indigo-600">{bkg.userRole}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{bkg.resourceName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {bkg.bookingId} • {bkg.resourceType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{bkg.bookingDate}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{bkg.startTime} - {bkg.endTime}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {bkg.quantity ? `${bkg.quantity} units` : '1 Lab'}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 line-clamp-2 leading-relaxed" title={bkg.purpose}>
                        {bkg.purpose}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        disabled={processing}
                        onClick={() => handleApprove(bkg)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        disabled={processing}
                        onClick={() => {
                          setRejectTarget(bkg);
                          setRejectReason('');
                        }}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition-colors border border-rose-200 cursor-pointer"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Booking Request"
        subtitle={`Booking: ${rejectTarget?.bookingId} for ${rejectTarget?.userName}`}
      >
        <form onSubmit={handleRejectConfirm} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please record a formal rejection rationale for audit logging. The applicant will be notified immediately.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Reason</label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Schedule conflict with scheduled departmental examination..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-rose-500 outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing || !rejectReason.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {processing ? 'Processing...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
