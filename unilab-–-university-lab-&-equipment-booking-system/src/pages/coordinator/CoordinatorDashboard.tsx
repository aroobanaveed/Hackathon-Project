/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllBookings, getLabs, getEquipmentList, getSystemSettings } from '../../services/db';
import { Booking, Lab, Equipment, SystemSetting } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  Sliders,
  ClipboardList,
  BarChart3,
  FlaskConical,
  Wrench,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const CoordinatorDashboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [rules, setRules] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [b, l, eq, r] = await Promise.all([
          getAllBookings(),
          getLabs(),
          getEquipmentList(),
          getSystemSettings()
        ]);
        setBookings(b);
        setLabs(l);
        setEquipment(eq);
        setRules(r);
      } catch (err) {
        console.error('Error fetching coordinator data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pendingRequests = bookings.filter(b => b.status === 'PENDING_APPROVAL');
  const approvedBookings = bookings.filter(b => b.status === 'APPROVED' || b.status === 'IN_USE');

  // Chart Data: Lab Utilization (bookings count per lab)
  const labUtilizationData = labs.map(lab => {
    const count = bookings.filter(b => b.resourceId === lab.id).length;
    return {
      name: lab.name.replace('Laboratory', 'Lab').replace('Computer', 'Comp'),
      bookings: count
    };
  });

  // Chart Data: Equipment Reservations
  const equipmentData = equipment.slice(0, 5).map(eq => ({
    name: eq.name.split('(')[0].trim().slice(0, 16),
    reserved: eq.reservedQuantity,
    inUse: eq.inUseQuantity,
    available: eq.availableQuantity
  }));

  // Status Distribution
  const statusCounts = bookings.reduce((acc: any, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status.replace(/_/g, ' '),
    value: statusCounts[status]
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              DEPARTMENT COORDINATOR OVERSIGHT
            </span>
            <span className="text-xs text-slate-500">{currentUser?.departmentName || 'Computer Science'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Department Utilization & Booking Rules
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/coordinator/rules')}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4" /> Edit Booking Rules
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Approvals</span>
            <ClipboardList className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{pendingRequests.length}</span>
          <span className="text-[11px] text-amber-600 font-medium ml-2">Needs Review</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Sessions</span>
            <FlaskConical className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{bookings.length}</span>
          <span className="text-[11px] text-emerald-600 font-medium ml-2">Logged</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Max Duration Rule</span>
            <Sliders className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{rules?.maxBookingDurationHours || 4}h</span>
          <span className="text-[11px] text-slate-400 font-medium ml-2">Per Session</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Booking Cap</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{rules?.maxActiveBookingsPerUser || 3}</span>
          <span className="text-[11px] text-slate-400 font-medium ml-2">Per Student</span>
        </div>
      </div>

      {/* Utilization Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lab Utilization BarChart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Lab Occupancy & Booking Volume</h3>
              <p className="text-xs text-slate-500">Total sessions scheduled per room</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labUtilizationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none'
                  }}
                />
                <Bar dataKey="bookings" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Stock Allocation BarChart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Equipment Stock Allocations</h3>
              <p className="text-xs text-slate-500">Reserved vs. In-Use vs. Available quantities</p>
            </div>
            <Wrench className="w-4 h-4 text-purple-600" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none'
                  }}
                />
                <Bar dataKey="available" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="reserved" fill="#f59e0b" stackId="a" />
                <Bar dataKey="inUse" fill="#3b82f6" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Pending Approvals Queue */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Department Escalations & Approvals</h3>
            <p className="text-xs text-slate-500">High-priority requests requiring coordinator concurrence</p>
          </div>
          <button
            onClick={() => navigate('/coordinator/requests')}
            className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            Review All ({pendingRequests.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 rounded-2xl">
            No pending escalation requests for this department.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Resource Target</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.slice(0, 4).map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{b.userName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{b.resourceName}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono">{b.bookingDate} ({b.startTime} - {b.endTime})</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{b.purpose}</td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
