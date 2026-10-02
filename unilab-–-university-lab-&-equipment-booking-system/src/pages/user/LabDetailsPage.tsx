/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getLabById, getAllBookings, getEquipmentList, checkBookingAvailability } from '../../services/db';
import { Lab, Booking, Equipment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  FlaskConical,
  Users,
  MapPin,
  Calendar,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const LabDetailsPage: React.FC<{ labId: string; navigate: (path: string) => void }> = ({
  labId,
  navigate
}) => {
  const [lab, setLab] = useState<Lab | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [labEquipment, setLabEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Availability Checker Modal State
  const [checkModalOpen, setCheckModalOpen] = useState(false);
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkStart, setCheckStart] = useState('14:00');
  const [checkEnd, setCheckEnd] = useState('16:00');
  const [checkResult, setCheckResult] = useState<{ hasConflict: boolean; reason?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [labDoc, allB, allEq] = await Promise.all([
          getLabById(labId),
          getAllBookings(),
          getEquipmentList()
        ]);
        setLab(labDoc);
        if (labDoc) {
          const relevantB = allB.filter(b => b.resourceId === labDoc.id || b.resourceName === labDoc.name);
          setBookings(relevantB);
          const eqInLab = allEq.filter(e => e.labId === labDoc.id);
          setLabEquipment(eqInLab);
        }
      } catch (err) {
        console.error('Error fetching lab details:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [labId]);

  const handleRunAvailabilityCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lab) return;
    setChecking(true);
    try {
      const res = await checkBookingAvailability('LAB', lab.id, checkDate, checkStart, checkEnd, 1);
      setCheckResult(res);
    } catch (err: any) {
      setCheckResult({ hasConflict: true, reason: err.message });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center text-slate-400">Loading lab facilities...</div>;
  }

  if (!lab) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-sm font-bold text-slate-800">Laboratory Record Not Found</p>
        <button
          onClick={() => navigate('/labs')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Labs Catalog
        </button>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b =>
    (b.status === 'APPROVED' || b.status === 'RESERVED' || b.status === 'IN_USE') &&
    new Date(b.bookingDate).getTime() >= new Date().setHours(0, 0, 0, 0)
  );

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/labs')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Laboratories
      </button>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="h-64 sm:h-80 relative bg-slate-100">
          <img src={lab.imageUrl} alt={lab.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
          <div className="absolute top-4 right-4">
            <StatusBadge status={lab.status} />
          </div>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/20">
                {lab.labId}
              </span>
              <span className="text-xs bg-indigo-500/80 backdrop-blur-md px-2.5 py-0.5 rounded-md font-semibold">
                {lab.departmentName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{lab.name}</h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Seating Capacity</span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                <Users className="w-4 h-4 text-indigo-600" /> {lab.capacity} Seats
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Physical Location</span>
              <span className="text-sm font-semibold text-slate-800 mt-0.5 block flex items-center gap-1">
                <MapPin className="w-4 h-4 text-indigo-600" /> {lab.location}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Operating Schedule</span>
              <span className="text-sm font-semibold text-slate-800 mt-0.5 block flex items-center gap-1">
                <Clock className="w-4 h-4 text-indigo-600" /> 08:30 AM – 08:00 PM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setCheckResult(null);
                setCheckModalOpen(true);
              }}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Check Availability
            </button>
            <button
              disabled={lab.status === 'CLOSED' || lab.status === 'MAINTENANCE'}
              onClick={() => navigate(`/bookings/new?resourceType=LAB&resourceId=${lab.id}`)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Book This Lab
            </button>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Description, Facilities, Dedicated Equipment */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-3">Facility Overview</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{lab.description}</p>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-6 mb-3">
              Standard Lab Capabilities & Instruments
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {lab.facilities.map((fac, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{fac}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Equipment in Lab */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Equipment Housed in this Lab</h3>
              <span className="text-xs text-slate-400">{labEquipment.length} Registered Items</span>
            </div>

            {labEquipment.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No specific equipment records linked to this room.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {labEquipment.map(eq => (
                  <div key={eq.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{eq.name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">{eq.equipmentId} • {eq.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-medium">Available</span>
                        <span className="font-bold text-emerald-600">{eq.availableQuantity} of {eq.totalQuantity}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/equipment/${eq.id}`)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Today's Schedule & Occupancy */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Reservations</h3>
              <span className="text-xs text-indigo-600 font-semibold">{upcomingBookings.length} sessions</span>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No active bookings scheduled for this lab. Full availability.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.slice(0, 5).map(bkg => (
                  <div key={bkg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{bkg.bookingDate}</span>
                      <span className="font-mono text-indigo-600 font-bold">{bkg.startTime} - {bkg.endTime}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">Purpose: {bkg.purpose}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>By: {bkg.userName} ({bkg.userRole})</span>
                      <StatusBadge status={bkg.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate(`/bookings/new?resourceType=LAB&resourceId=${lab.id}`)}
              className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Request a Slot
            </button>
          </div>
        </div>
      </div>

      {/* Check Availability Modal */}
      <Modal
        isOpen={checkModalOpen}
        onClose={() => setCheckModalOpen(false)}
        title={`Check Availability: ${lab.name}`}
        subtitle="Verify if your preferred date and time range is free without booking"
      >
        <form onSubmit={handleRunAvailabilityCheck} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
            <input
              type="date"
              required
              value={checkDate}
              onChange={e => setCheckDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={checkStart}
                onChange={e => setCheckStart(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={checkEnd}
                onChange={e => setCheckEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={checking}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {checking ? 'Checking Database...' : 'Run Conflict Check'}
          </button>
        </form>

        {checkResult && (
          <div className="mt-4 p-4 rounded-xl border text-xs">
            {checkResult.hasConflict ? (
              <div className="text-rose-800 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Slot Unavailable / Conflict</p>
                  <p className="text-[11px] mt-0.5">{checkResult.reason}</p>
                </div>
              </div>
            ) : (
              <div className="text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Slot is Completely Open!</p>
                    <p className="text-[11px] mt-0.5">No conflicting reservations exist for this time period.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCheckModalOpen(false);
                    navigate(`/bookings/new?resourceType=LAB&resourceId=${lab.id}&date=${checkDate}&start=${checkStart}&end=${checkEnd}`);
                  }}
                  className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  Book Slot
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
