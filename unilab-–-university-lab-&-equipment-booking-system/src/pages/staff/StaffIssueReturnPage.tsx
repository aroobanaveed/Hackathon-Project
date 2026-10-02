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
  issueEquipment,
  processEquipmentReturn,
  getEquipmentList
} from '../../services/db';
import { Booking, Issue, ReturnCondition, Equipment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  ArrowRightLeft,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  Search,
  PackageCheck
} from 'lucide-react';

export const StaffIssueReturnPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { success, error, warning } = useToast();

  const [activeIssues, setActiveIssues] = useState<Issue[]>([]);
  const [approvedBookings, setApprovedBookings] = useState<Booking[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Issue modal
  const [issueTarget, setIssueTarget] = useState<Booking | null>(null);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Return modal
  const [returnTarget, setReturnTarget] = useState<Issue | null>(null);
  const [returnCondition, setReturnCondition] = useState<ReturnCondition>('EXCELLENT');
  const [damageReport, setDamageReport] = useState('');
  const [missingQty, setMissingQty] = useState<number>(0);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returning, setReturning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allB, allI, allEq] = await Promise.all([
        getAllBookings(),
        getAllIssues(),
        getEquipmentList()
      ]);
      setApprovedBookings(allB.filter(b => b.resourceType === 'EQUIPMENT' && b.status === 'APPROVED'));
      setActiveIssues(allI);
      setEquipmentList(allEq);
    } catch (err) {
      console.error('Error fetching issue/return data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTarget || !currentUser) return;
    setIssuing(true);
    try {
      const expectedTime = expectedReturnDate || `${issueTarget.bookingDate}T${issueTarget.endTime}:00Z`;
      await issueEquipment(issueTarget.id, currentUser, expectedTime);
      success('Equipment Handed Out', `Issued ${issueTarget.quantity || 1}x ${issueTarget.resourceName} to ${issueTarget.userName}.`);
      setIssueTarget(null);
      loadData();
    } catch (err: any) {
      error('Failed to issue equipment', err.message);
    } finally {
      setIssuing(false);
    }
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTarget || !currentUser) return;
    setReturning(true);
    try {
      await processEquipmentReturn(returnTarget.id, {
        returnCondition,
        damageReport: returnCondition === 'DAMAGED' ? damageReport : '',
        missingQuantity: missingQty,
        remarks: returnRemarks,
        staffUser: currentUser
      });

      if (returnCondition === 'DAMAGED') {
        warning('Item Marked Damaged', 'Equipment condition changed to NEEDS_REPAIR and logged to maintenance.');
      } else if (missingQty > 0) {
        warning('Missing Units Recorded', `${missingQty} units deducted from university total inventory.`);
      } else {
        success('Return Completed', 'All units checked back into inventory.');
      }

      setReturnTarget(null);
      setDamageReport('');
      setMissingQty(0);
      setReturnRemarks('');
      loadData();
    } catch (err: any) {
      error('Return processing failed', err.message);
    } finally {
      setReturning(false);
    }
  };

  const checkedOutIssues = activeIssues.filter(i => i.status === 'ISSUED');
  const pastIssues = activeIssues.filter(i => i.status !== 'ISSUED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Equipment Issue & Return Desk</h1>
        <p className="text-xs text-slate-500 mt-1">
          Dispense approved hardware kits to students and process item return check-ins with automated damage & late return detection.
        </p>
      </div>

      {/* SECTION 1: READY TO ISSUE (Approved Equipment Bookings) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Approved Bookings Ready for Handout</h2>
              <p className="text-xs text-slate-500">Student is present to collect hardware with their digital pass</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full">
            {approvedBookings.length} Ready
          </span>
        </div>

        {approvedBookings.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-2xl">
            No equipment bookings currently awaiting handout.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Equipment Item</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Scheduled Slot</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedBookings.map(bkg => (
                  <tr key={bkg.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{bkg.bookingId}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{bkg.userName}</span>
                      <span className="text-[11px] text-slate-400">{bkg.userEmail}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{bkg.resourceName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{bkg.quantity || 1} units</td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {bkg.bookingDate} ({bkg.startTime} - {bkg.endTime})
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setIssueTarget(bkg);
                          setExpectedReturnDate(`${bkg.bookingDate}T${bkg.endTime}:00Z`);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer"
                      >
                        Hand Out Equipment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: CURRENTLY CHECKED OUT (Awaiting Return) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Equipment In Circulation (Checked Out)</h2>
              <p className="text-xs text-slate-500">Inspect condition and process return when student brings item back</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-900 font-bold text-xs rounded-full">
            {checkedOutIssues.length} In Possession
          </span>
        </div>

        {checkedOutIssues.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-2xl">
            No equipment currently out with students. All items safely stored.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Issue ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Issued At</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {checkedOutIssues.map(iss => {
                  const isLate = new Date().getTime() > new Date(iss.expectedReturnAt).getTime();

                  return (
                    <tr key={iss.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{iss.issueId}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{iss.userName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{iss.equipmentName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{iss.quantity}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(iss.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-mono font-semibold ${isLate ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                          {new Date(iss.expectedReturnAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isLate && (
                          <span className="block text-[10px] text-rose-600 font-bold">OVERDUE</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={isLate ? 'OVERDUE' : 'ISSUED'} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setReturnTarget(iss);
                            setReturnCondition('EXCELLENT');
                            setMissingQty(0);
                            setDamageReport('');
                            setReturnRemarks('');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer"
                        >
                          Process Return
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue Modal */}
      <Modal
        isOpen={!!issueTarget}
        onClose={() => setIssueTarget(null)}
        title="Confirm Equipment Handout"
        subtitle={`Booking: ${issueTarget?.bookingId} • ${issueTarget?.userName}`}
      >
        <form onSubmit={handleConfirmIssue} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900">{issueTarget?.resourceName}</p>
            <p className="text-slate-600 mt-0.5">Quantity to hand over: <strong>{issueTarget?.quantity || 1} unit(s)</strong></p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expected Return Due Date & Time</label>
            <input
              type="text"
              required
              value={expectedReturnDate}
              onChange={e => setExpectedReturnDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIssueTarget(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={issuing}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
            >
              {issuing ? 'Recording Handout...' : 'Authorize & Dispense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        title="Inspect & Process Equipment Return"
        subtitle={`Issue ID: ${returnTarget?.issueId} • Item: ${returnTarget?.equipmentName}`}
      >
        <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Inspected Return Condition</label>
            <select
              value={returnCondition}
              onChange={e => setReturnCondition(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium outline-none"
            >
              <option value="EXCELLENT">Excellent – All components and cables pristine</option>
              <option value="GOOD">Good – Operational with minor cosmetic wear</option>
              <option value="FAIR">Fair – Functional, requires gentle handling</option>
              <option value="DAMAGED">Damaged – Broken pins, burned PCB, or cracked casing</option>
              <option value="MISSING">Missing – Parts not returned by student</option>
            </select>
          </div>

          {returnCondition === 'DAMAGED' && (
            <div>
              <label className="block font-semibold text-rose-700 mb-1">Damage Description (Required)</label>
              <textarea
                required
                rows={3}
                value={damageReport}
                onChange={e => setDamageReport(e.target.value)}
                placeholder="Describe fault or physical breakage (e.g. shorted GPIO pin, cracked screen)..."
                className="w-full p-2.5 rounded-xl border border-rose-200 focus:border-rose-500 outline-none leading-relaxed"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Missing Units Count (if any)</label>
            <input
              type="number"
              min="0"
              max={returnTarget?.quantity || 1}
              value={missingQty}
              onChange={e => setMissingQty(Number(e.target.value))}
              className="w-32 px-3 py-2 rounded-xl border border-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Staff Remarks</label>
            <input
              type="text"
              value={returnRemarks}
              onChange={e => setReturnRemarks(e.target.value)}
              placeholder="e.g. Probes returned cleanly in storage pouch"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReturnTarget(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={returning}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs"
            >
              {returning ? 'Updating Stock...' : 'Confirm Return & Update Inventory'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
