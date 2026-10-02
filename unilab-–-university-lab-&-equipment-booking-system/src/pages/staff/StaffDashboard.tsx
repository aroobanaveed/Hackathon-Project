/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getAllBookings,
  getAllIssues,
  getLabs,
  getEquipmentList,
  getMaintenanceRecords,
  approveBooking,
  rejectBooking
} from '../../services/db';
import { Booking, Issue, Lab, Equipment, MaintenanceRecord } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  LayoutDashboard,
  ClipboardList,
  FlaskConical,
  Wrench,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowRightLeft
} from 'lucide-react';

export const StaffDashboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Reject Modal State
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, i, l, eq, m] = await Promise.all([
        getAllBookings(),
        getAllIssues(),
        getLabs(),
        getEquipmentList(),
        getMaintenanceRecords()
      ]);
      setBookings(b);
      setIssues(i);
      setLabs(l);
      setEquipment(eq);
      setMaintenance(m);
    } catch (err) {
      console.error('Error fetching staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (bkg: Booking) => {
    if (!currentUser) return;
    setProcessing(true);
    try {
      await approveBooking(bkg.id, currentUser);
      success('Booking Approved!', `${bkg.bookingId} for ${bkg.resourceName} has been confirmed.`);
      loadData();
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
      loadData();
    } catch (err: any) {
      error('Rejection failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  // KPIs
  const pendingRequests = bookings.filter(b => b.status === 'PENDING_APPROVAL');
  const labsInUse = labs.filter(l => l.status === 'IN_USE' || bookings.some(b => b.resourceId === l.id && b.status === 'IN_USE'));
  const issuedItems = issues.filter(i => i.status === 'ISSUED');
  const now = new Date().getTime();
  const overdueReturns = issues.filter(i => i.status === 'ISSUED' && new Date(i.expectedReturnAt).getTime() < now);
  const activeMaintenance = maintenance.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              STAFF COMMAND CENTER
            </span>
            <span className="text-xs text-slate-500">Incharge: {currentUser?.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Laboratory Operations & Approvals
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigate('/staff/issue-return')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" /> Issue / Return Desk
          </button>
          <button
            onClick={() => navigate('/staff/equipment')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Wrench className="w-4 h-4" /> Manage Inventory
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div
          onClick={() => navigate('/staff/requests')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Requests</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{pendingRequests.length}</span>
            <span className="text-[11px] text-amber-600 font-medium ml-2">Needs Action</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Labs In Use</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{labsInUse.length}</span>
            <span className="text-[11px] text-purple-600 font-medium ml-2">Active Rooms</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/staff/issue-return')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Equipment Checked Out</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{issuedItems.length}</span>
            <span className="text-[11px] text-blue-600 font-medium ml-2">With Students</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Overdue Returns</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className={`text-2xl font-black ${overdueReturns.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {overdueReturns.length}
            </span>
            <span className={`text-[11px] ml-2 font-medium ${overdueReturns.length > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
              {overdueReturns.length > 0 ? 'Urgent Alert' : 'Clean'}
            </span>
          </div>
        </div>

        <div
          onClick={() => navigate('/staff/maintenance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Maintenance Tasks</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{activeMaintenance.length}</span>
            <span className="text-[11px] text-slate-500 font-medium ml-2">Scheduled</span>
          </div>
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pending Booking Requests Queue</h2>
            <p className="text-xs text-slate-500">Verify availability and approve or reject submissions</p>
          </div>
          <button
            onClick={() => navigate('/staff/requests')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Full Requests Queue ({pendingRequests.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            No pending requests! All reservations are up to date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Resource Target</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.slice(0, 5).map(bkg => (
                  <tr key={bkg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{bkg.userName}</span>
                      <span className="text-[11px] text-slate-400">{bkg.userRole} • {bkg.userEmail}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{bkg.resourceName}</span>
                      <span className="text-[10px] font-mono text-indigo-600">
                        {bkg.resourceType} {bkg.quantity ? `(Qty: ${bkg.quantity})` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{bkg.bookingDate}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{bkg.startTime} - {bkg.endTime}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-600 truncate" title={bkg.purpose}>{bkg.purpose}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        disabled={processing}
                        onClick={() => handleApprove(bkg)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        disabled={processing}
                        onClick={() => {
                          setRejectTarget(bkg);
                          setRejectReason('');
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition-colors border border-rose-200 cursor-pointer"
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

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Booking Request"
        subtitle={`Booking ID: ${rejectTarget?.bookingId} • ${rejectTarget?.resourceName}`}
      >
        <form onSubmit={handleRejectConfirm} className="space-y-4">
          <p className="text-xs text-slate-600">
            A formal rejection reason is mandatory and will be notified to <strong>{rejectTarget?.userName}</strong>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Reason</label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Schedule conflict with scheduled departmental practical exams or kit under calibration..."
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
