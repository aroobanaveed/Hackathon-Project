/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getAllBookings, getLabs, getEquipmentList, getAllIssues } from '../../services/db';
import { Booking, Lab, Equipment, Issue } from '../../types';
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
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, Filter, Users, FlaskConical, Wrench } from 'lucide-react';

export const CoordinatorAnalyticsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [b, l, eq, i] = await Promise.all([
          getAllBookings(),
          getLabs(),
          getEquipmentList(),
          getAllIssues()
        ]);
        setBookings(b);
        setLabs(l);
        setEquipment(eq);
        setIssues(i);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter bookings by date
  const now = new Date();
  const filteredBookings = bookings.filter(b => {
    if (dateFilter === 'ALL') return true;
    const bDate = new Date(b.bookingDate);
    if (dateFilter === 'TODAY') {
      return b.bookingDate === now.toISOString().split('T')[0];
    }
    if (dateFilter === 'WEEK') {
      const diff = now.getTime() - bDate.getTime();
      return diff <= 7 * 24 * 3600 * 1000;
    }
    if (dateFilter === 'MONTH') {
      const diff = now.getTime() - bDate.getTime();
      return diff <= 30 * 24 * 3600 * 1000;
    }
    return true;
  });

  const totalBookings = filteredBookings.length;
  const completedBookings = filteredBookings.filter(b => b.status === 'COMPLETED').length;
  const rejectedBookings = filteredBookings.filter(b => b.status === 'REJECTED').length;
  const cancelledBookings = filteredBookings.filter(b => b.status === 'CANCELLED').length;
  const overdueIssues = issues.filter(i => i.status === 'OVERDUE' || (i.status === 'ISSUED' && new Date(i.expectedReturnAt).getTime() < now.getTime())).length;

  // Chart: Bookings by Department
  const deptCounts: Record<string, number> = {};
  filteredBookings.forEach(b => {
    const dept = b.departmentId === 'dept-cs' ? 'Computer Science' : b.departmentId === 'dept-ec' ? 'Electronics' : 'Electrical';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const deptChartData = Object.keys(deptCounts).map(d => ({
    name: d,
    count: deptCounts[d]
  }));

  // Chart: Status Breakdown
  const statusCounts = filteredBookings.reduce((acc: any, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});
  const statusPieData = Object.keys(statusCounts).map(s => ({
    name: s.replace(/_/g, ' '),
    value: statusCounts[s]
  }));

  // Top Most Used Labs
  const labFrequency: Record<string, number> = {};
  filteredBookings.filter(b => b.resourceType === 'LAB').forEach(b => {
    labFrequency[b.resourceName] = (labFrequency[b.resourceName] || 0) + 1;
  });
  const topLabs = Object.keys(labFrequency)
    .map(name => ({ name: name.replace('Laboratory', 'Lab'), count: labFrequency[name] }))
    .sort((a, b) => b.count - a.count);

  // Top Most Reserved Equipment
  const eqFrequency: Record<string, number> = {};
  filteredBookings.filter(b => b.resourceType === 'EQUIPMENT').forEach(b => {
    eqFrequency[b.resourceName] = (eqFrequency[b.resourceName] || 0) + (b.quantity || 1);
  });
  const topEquipment = Object.keys(eqFrequency)
    .map(name => ({ name: name.slice(0, 20), units: eqFrequency[name] }))
    .sort((a, b) => b.units - a.units);

  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">University Resource Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated laboratory occupancy, equipment circulation metrics, and approval rates.
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs text-xs self-start sm:self-auto">
          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'MONTH', label: 'Last 30 Days' },
            { id: 'WEEK', label: 'This Week' },
            { id: 'TODAY', label: 'Today' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                dateFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Bookings</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalBookings}</span>
          <span className="text-[10px] text-slate-400">Total sessions recorded</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Completed</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{completedBookings}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Successfully utilized</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Declined / Rejected</span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">{rejectedBookings}</span>
          <span className="text-[10px] text-rose-600 font-medium">Policy/Conflict decline</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Cancelled</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{cancelledBookings}</span>
          <span className="text-[10px] text-amber-600 font-medium">Applicant released</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Overdue Items</span>
          <span className={`text-2xl font-black ${overdueIssues > 0 ? 'text-rose-600' : 'text-slate-900'} mt-1 block`}>
            {overdueIssues}
          </span>
          <span className="text-[10px] text-slate-400">Past return deadline</span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Used Labs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Most Frequently Booked Laboratories</h3>
              <p className="text-xs text-slate-500">Utilization sessions per facility</p>
            </div>
            <FlaskConical className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLabs}>
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
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Reserved Equipment */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Highest Demand Equipment Units</h3>
              <p className="text-xs text-slate-500">Total units checked out / reserved</p>
            </div>
            <Wrench className="w-4 h-4 text-purple-600" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topEquipment}>
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
                <Bar dataKey="units" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Booking Status Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of approvals, active sessions, and completions</p>
            </div>
            <BarChart3 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${(((percent ?? 0) * 100)).toFixed(0)}%`}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Usage Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Usage by Academic Department</h3>
              <p className="text-xs text-slate-500">Cross-departmental reservation volume</p>
            </div>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData}>
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
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
