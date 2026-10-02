/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getEquipmentById, getAllBookings } from '../../services/db';
import { Equipment, Booking } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Wrench,
  Building2,
  Boxes,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ShieldAlert
} from 'lucide-react';

export const EquipmentDetailsPage: React.FC<{
  equipmentId: string;
  navigate: (path: string) => void;
}> = ({ equipmentId, navigate }) => {
  const [item, setItem] = useState<Equipment | null>(null);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [eq, allB] = await Promise.all([getEquipmentById(equipmentId), getAllBookings()]);
        setItem(eq);
        if (eq) {
          const relevant = allB.filter(b => b.resourceId === eq.id && (b.status === 'APPROVED' || b.status === 'RESERVED' || b.status === 'IN_USE'));
          setActiveBookings(relevant);
        }
      } catch (err) {
        console.error('Error fetching equipment item:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [equipmentId]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center text-slate-400">Loading equipment specifications...</div>;
  }

  if (!item) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-sm font-bold text-slate-800">Equipment Item Not Found</p>
        <button
          onClick={() => navigate('/equipment')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Equipment Catalog
        </button>
      </div>
    );
  }

  const isOutOfStock = item.availableQuantity <= 0;
  const isMaintenance = item.maintenanceStatus === 'UNDER_MAINTENANCE';

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate('/equipment')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Equipment Catalog
      </button>

      {/* Header Profile */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                  {item.equipmentId}
                </span>
                <span className="text-xs text-slate-500 font-semibold">{item.category}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{item.name}</h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Housed in Laboratory: <strong className="text-slate-800">{item.labName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={item.condition} />
            <button
              disabled={isOutOfStock || isMaintenance}
              onClick={() => navigate(`/bookings/new?resourceType=EQUIPMENT&resourceId=${item.id}`)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isMaintenance ? 'Under Maintenance' : isOutOfStock ? 'Currently Unavailable' : 'Reserve Equipment'}
            </button>
          </div>
        </div>

        {/* Inventory Gauges */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
          <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
            <span className="text-xs text-slate-400 block font-semibold">Total Stock</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{item.totalQuantity}</span>
            <span className="text-[10px] text-slate-400">Total university units</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
            <span className="text-xs text-slate-400 block font-semibold">Currently Available</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{item.availableQuantity}</span>
            <span className="text-[10px] text-emerald-600 font-medium">Ready for immediate checkout</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
            <span className="text-xs text-slate-400 block font-semibold">Reserved by Staff</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{item.reservedQuantity}</span>
            <span className="text-[10px] text-amber-600 font-medium">Allocated for upcoming labs</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
            <span className="text-xs text-slate-400 block font-semibold">In Active Use</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">{item.inUseQuantity}</span>
            <span className="text-[10px] text-blue-600 font-medium">Currently issued to students</span>
          </div>
        </div>
      </div>

      {/* Description & Reservation Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-3">Item Specifications & Description</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.description}</p>

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Maintenance Status</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{item.maintenanceStatus.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Equipment Health Condition</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{item.condition}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Active Bookings Queue */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Active Reservations for this Kit</h3>
            {activeBookings.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No pending holds or active checkouts for this item.</p>
            ) : (
              <div className="space-y-2.5">
                {activeBookings.map(b => (
                  <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{b.bookingDate}</span>
                      <span className="font-mono text-indigo-600 font-semibold">{b.startTime} - {b.endTime}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Requested Qty: <strong className="text-slate-800">{b.quantity || 1} units</strong></p>
                    <p className="text-[10px] text-slate-400 mt-0.5">By: {b.userName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
