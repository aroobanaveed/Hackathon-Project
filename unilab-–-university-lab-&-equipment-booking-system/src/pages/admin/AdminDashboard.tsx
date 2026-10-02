/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllBookings,
  getLabs,
  getEquipmentList,
  getAllUsers,
  getAllIssues,
  getAuditLogs
} from '../../services/db';
import { Booking, Lab, Equipment, UserProfile, Issue, AuditLog } from '../../types';
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
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import {
  Shield,
  Users,
  FlaskConical,
  Boxes,
  CalendarCheck,
  AlertTriangle,
  History,
  TrendingUp,
  Settings,
  ArrowRight
} from 'lucide-react';

export const AdminDashboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [u, l, eq, b, i, a] = await Promise.all([
          getAllUsers(),
          getLabs(),
          getEquipmentList(),
          getAllBookings(),
          getAllIssues(),
          getAuditLogs()
        ]);
        setUsers(u);
        setLabs(l);
        setEquipment(eq);
        setBookings(b);
        setIssues(i);
        setAuditLogs(a);
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeBookings = bookings.filter(b => b.status === 'APPROVED' || b.status === 'IN_USE');
  const pendingRequests = bookings.filter(b => b.status === 'PENDING_APPROVAL');
  const now = new Date().getTime();
  const overdueItems = issues.filter(i => i.status === 'ISSUED' && new Date(i.expectedReturnAt).getTime() < now);

  // Utilization by Lab Data
  const labData = labs.map(lab => ({
    name: lab.name.replace('Laboratory', 'Lab').slice(0, 16),
    bookings: bookings.filter(b => b.resourceId === lab.id).length
  }));

  // Equipment Allocations Data
  const equipmentData = equipment.slice(0, 5).map(eq => ({
    name: eq.name.split('(')[0].trim().slice(0, 15),
    total: eq.totalQuantity,
    available: eq.availableQuantity,
    inUse: eq.inUseQuantity
  }));

  return (
    <div className="space-y-8">
      {/* Admin Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              CENTRAL ADMINISTRATOR SUITE
            </span>
            <span className="text-xs text-indigo-300 font-mono">Full System Privileges</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">University System Control Panel</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Global governance over user roles, laboratories, equipment inventory catalogs, audit trails, and booking policies.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition-all border border-white/20 cursor-pointer"
          >
            Manage Users
          </button>
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <History className="w-4 h-4" /> System Audit Trail
          </button>
        </div>
      </div>

      {/* KPI Stats Row (6 Cards as requested in Section 16) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          onClick={() => navigate('/admin/users')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Users</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{users.length}</span>
        </div>

        <div
          onClick={() => navigate('/admin/labs')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Labs</span>
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{labs.length}</span>
        </div>

        <div
          onClick={() => navigate('/admin/equipment')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Equipment Master</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{equipment.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Bookings</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600">{activeBookings.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Requests</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600">{pendingRequests.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Overdue Returns</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className={`text-2xl font-black ${overdueItems.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {overdueItems.length}
          </span>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Laboratory Utilization Volume</h3>
              <p className="text-xs text-slate-500">Total sessions booked per facility</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labData}>
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

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Equipment Stock Availability</h3>
              <p className="text-xs text-slate-500">Available vs. In-Use stock across main items</p>
            </div>
            <Boxes className="w-4 h-4 text-purple-600" />
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
                <Bar dataKey="available" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inUse" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Audit Trail Preview */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Security & Administrative Audit Events</h3>
            <p className="text-xs text-slate-500">Immutable ledger tracking approvals, stock alterations, and logins</p>
          </div>
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            Full Audit Logs ({auditLogs.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 5).map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.userName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-slate-100 text-slate-700 font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-600">{log.entityType}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
