/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getBookingById, cancelBooking } from '../../services/db';
import { Booking, BookingStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  CalendarCheck,
  Clock,
  FlaskConical,
  Wrench,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  QrCode,
  ShieldCheck,
  Building2,
  User,
  Printer
} from 'lucide-react';

export const BookingDetailsPage: React.FC<{
  bookingId: string;
  navigate: (path: string) => void;
}> = ({ bookingId, navigate }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const b = await getBookingById(bookingId);
        setBooking(b);
      } catch (err) {
        console.error('Error fetching booking:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  const handleCancel = async () => {
    if (!booking || !currentUser) return;
    setCancelling(true);
    try {
      await cancelBooking(booking.id, currentUser);
      success('Booking Cancelled');
      setBooking(prev => (prev ? { ...prev, status: 'CANCELLED' } : null));
      setCancelModalOpen(false);
    } catch (err: any) {
      error('Failed to cancel', err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center text-slate-400 text-xs">Loading booking record...</div>;
  }

  if (!booking) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-sm font-bold text-slate-800">Booking Record Not Found</p>
        <button
          onClick={() => navigate('/bookings')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to My Bookings
        </button>
      </div>
    );
  }

  const LIFECYCLE_STAGES: { key: BookingStatus; label: string }[] = [
    { key: 'PENDING_APPROVAL', label: '1. Pending Review' },
    { key: 'APPROVED', label: '2. Staff Approved' },
    { key: 'RESERVED', label: '3. Reserved' },
    { key: 'IN_USE', label: '4. Active Session' },
    { key: 'COMPLETED', label: '5. Completed' }
  ];

  const getStageIndex = (s: BookingStatus): number => {
    switch (s) {
      case 'DRAFT': return 0;
      case 'PENDING_APPROVAL': return 1;
      case 'APPROVED': return 2;
      case 'RESERVED': return 3;
      case 'IN_USE': return 4;
      case 'COMPLETED':
      case 'RETURNED_LATE':
      case 'DAMAGED': return 5;
      default: return -1;
    }
  };

  const currentStageIndex = getStageIndex(booking.status);
  const isTerminated = booking.status === 'REJECTED' || booking.status === 'CANCELLED';
  const canCancel = booking.status === 'PENDING_APPROVAL' || booking.status === 'APPROVED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/bookings')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Bookings
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {booking.bookingId}
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase">{booking.resourceType}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{booking.resourceName}</h1>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} />
            {canCancel && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>

        {/* Visual Lifecycle Progress Tracker */}
        <div className="mt-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">
            Booking Lifecycle Progress
          </p>

          {isTerminated ? (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-900">
                  Booking Terminated: {booking.status}
                </p>
                {booking.rejectionReason && (
                  <p className="text-xs text-rose-700 mt-1">
                    Reviewer Note: "{booking.rejectionReason}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              {LIFECYCLE_STAGES.map((stg, idx) => {
                const isPassed = currentStageIndex >= idx + 1;
                const isCurrent = currentStageIndex === idx + 1;

                return (
                  <div
                    key={stg.key}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md shadow-indigo-600/20'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-800 font-semibold border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] font-medium opacity-80">Stage {idx + 1}</span>
                    <span className="text-xs font-semibold">{stg.label.split('. ')[1]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Details & Digital Session Pass */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900">Booking Specifications</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Reservation Date</span>
              <span className="font-bold text-slate-900 mt-0.5 block flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
                {booking.bookingDate}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Time Window</span>
              <span className="font-bold font-mono text-indigo-700 mt-0.5 block flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                {booking.startTime} – {booking.endTime}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Allocated Quantity</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {booking.quantity ? `${booking.quantity} Units` : 'Entire Lab Workstation Pod'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Applicant</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{booking.userName}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">User Role</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{booking.userRole}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Approval Status</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{booking.approvalStatus}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400 block font-medium mb-1">Stated Purpose:</span>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              {booking.purpose}
            </p>
          </div>

          {booking.approvedByName && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Verified and approved by <strong>{booking.approvedByName}</strong> on {booking.approvedAt ? new Date(booking.approvedAt).toLocaleDateString() : 'Official Staff'}.
              </span>
            </div>
          )}
        </div>

        {/* Digital Verification Pass */}
        <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-300 uppercase">
                Digital Pass
              </span>
              <FlaskConical className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="mt-6 flex flex-col items-center text-center">
              <div className="p-3 bg-white rounded-2xl shadow-md mb-3 text-slate-900">
                <QrCode className="w-24 h-24" />
              </div>
              <span className="font-mono text-xs font-bold text-indigo-200">
                VERIFY-{booking.bookingId.replace('BKG-', '')}
              </span>
              <p className="text-[11px] text-slate-300 mt-2">
                Present this digital badge to the lab incharge to check in or receive issued equipment.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>UniLab Auth Token</span>
            <span className="text-emerald-400 font-bold">Valid & Active</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancel}
        title="Cancel This Booking?"
        message={`Are you sure you want to cancel booking ${booking.bookingId}? This will free up the slot for other students.`}
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Active"
        isDestructive={true}
        isLoading={cancelling}
      />
    </div>
  );
};
