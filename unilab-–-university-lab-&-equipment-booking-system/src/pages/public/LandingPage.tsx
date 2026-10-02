/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getLabs, getEquipmentList } from '../../services/db';
import { Lab, Equipment, UserRole } from '../../types';
import {
  FlaskConical,
  Wrench,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Zap,
  Building2,
  BarChart3
} from 'lucide-react';

export const LandingPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { isAuthenticated, currentUser, role, logout } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      const [l, e] = await Promise.all([getLabs(), getEquipmentList()]);
      setLabs(l);
      setEquipment(e);
    }
    load();
  }, []);

  const handleSelectRole = (selectedRole: UserRole) => {
    if (isAuthenticated && currentUser && currentUser.role === selectedRole) {
      if (selectedRole === 'ADMIN') navigate('/admin/dashboard');
      else if (selectedRole === 'COORDINATOR') navigate('/coordinator/dashboard');
      else if (selectedRole === 'LAB_STAFF') navigate('/staff/dashboard');
      else navigate('/dashboard');
    } else {
      // Direct user to secure portal login requiring credentials
      navigate(`/login?portal=${selectedRole}`);
    }
  };

  const filteredLabs = labs.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="bg-indigo-950/90 backdrop-blur-md border-b border-indigo-900/50 sticky top-0 z-40 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight text-lg">UniLab</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-widest text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded-md border border-indigo-700/50">
                Univ Booking System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-indigo-200">
                  Signed in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.role})
                </span>
                <button
                  onClick={() => {
                    const target =
                      currentUser.role === 'ADMIN'
                        ? '/admin/dashboard'
                        : currentUser.role === 'COORDINATOR'
                        ? '/coordinator/dashboard'
                        : currentUser.role === 'LAB_STAFF'
                        ? '/staff/dashboard'
                        : '/dashboard';
                    navigate(target);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  My Dashboard
                </button>
                <button
                  onClick={() => logout()}
                  className="px-3 py-1.5 bg-indigo-900/50 hover:bg-indigo-900 text-indigo-200 hover:text-white border border-indigo-800 rounded-xl transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-colors cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Top Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white border-b border-indigo-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.18),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-6 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              University Lab & Equipment Booking System
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Smarter, Conflict-Free <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">
                University Lab & Equipment
              </span>{' '}
              Reservations
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Eliminate paper logs, informal chat requests, and scheduling collisions.
              UniLab automates time-slot conflict detection, real-time inventory tracking, staff approvals, and role-governed access.
            </p>

            {/* Role Portals Navigation Bar */}
            <div className="mt-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 w-full max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3 text-center">
                Access Portals by University Role
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  onClick={() => handleSelectRole('STUDENT')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:scale-102 cursor-pointer"
                >
                  Student Portal
                </button>
                <button
                  onClick={() => handleSelectRole('FACULTY')}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:scale-102 cursor-pointer"
                >
                  Faculty Portal
                </button>
                <button
                  onClick={() => handleSelectRole('LAB_STAFF')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:scale-102 cursor-pointer"
                >
                  Lab Staff Desk
                </button>
                <button
                  onClick={() => handleSelectRole('COORDINATOR')}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:scale-102 cursor-pointer"
                >
                  Coordinator
                </button>
                <button
                  onClick={() => handleSelectRole('ADMIN')}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:scale-102 cursor-pointer"
                >
                  Administrator
                </button>
              </div>
            </div>

            {/* Quick Search Resource Bar */}
            <div className="mt-8 w-full max-w-2xl flex items-center bg-white rounded-2xl p-1.5 shadow-2xl border border-slate-200 text-slate-800">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search labs (e.g. AI & ML Lab, Embedded Systems) or equipment..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2.5 text-sm outline-none text-slate-800 placeholder-slate-400"
              />
              <button
                onClick={() => navigate('/labs')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                Browse All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            End-to-End University Lab Workflow
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Structured lifecycle from discovery to checkout, condition inspection, and automated analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">1. Search & Check</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Filter by department, seating capacity, and real-time inventory availability across all campus labs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">2. Conflict Detection</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Mathematical overlap prevention ensures no double-bookings, maintenance clashes, or inventory over-allocations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">3. Staff Approval</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Lab in-charges verify academic rationale, approve time windows, and issue physical equipment with barcoded tracking.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">4. Return & Analytics</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Inspect returned items, record damages or missing units, update inventory stock, and feed department utilization metrics.
            </p>
          </div>
        </div>

        {/* Available Facilities Preview */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Featured Laboratories</h3>
              <p className="text-xs text-slate-500">Live operational status across academic departments</p>
            </div>
            <button
              onClick={() => navigate('/labs')}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              View All Labs
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredLabs.slice(0, 3).map(lab => (
              <div
                key={lab.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col"
              >
                <div className="h-44 relative bg-slate-100 overflow-hidden">
                  <img
                    src={lab.imageUrl}
                    alt={lab.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-emerald-800 shadow-xs">
                    {lab.status}
                  </div>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-white">
                    {lab.departmentName}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-indigo-600 font-semibold">{lab.labId}</span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{lab.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{lab.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                      <span>Capacity: <strong className="text-slate-900">{lab.capacity} seats</strong></span>
                      <span>Location: <strong className="text-slate-900">{lab.location.split(',')[0]}</strong></span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/labs/${lab.id}`)}
                      className="text-xs font-semibold text-slate-700 hover:text-indigo-600"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/bookings/new?resourceType=LAB&resourceId=${lab.id}`)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
                    >
                      Book Lab
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Equipment Preview */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Featured Equipment</h3>
              <p className="text-xs text-slate-500">Real-time stock quantities and conditions</p>
            </div>
            <button
              onClick={() => navigate('/equipment')}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              View All Equipment
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.slice(0, 3).map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">{item.equipmentId}</span>
                      <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                      <p className="text-xs text-indigo-600 font-medium mt-0.5">{item.category}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.condition}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl grid grid-cols-3 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                      <span className="font-bold text-slate-800 text-sm">{item.totalQuantity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">In Use</span>
                      <span className="font-bold text-amber-600 text-sm">{item.inUseQuantity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Available</span>
                      <span className="font-bold text-emerald-600 text-sm">{item.availableQuantity}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/equipment/${item.id}`)}
                    className="text-xs font-semibold text-slate-700 hover:text-indigo-600"
                  >
                    View Specs
                  </button>
                  <button
                    onClick={() => navigate(`/bookings/new?resourceType=EQUIPMENT&resourceId=${item.id}`)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Reserve Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white text-sm">UniLab</span>
            <span className="text-slate-500">| Academic Laboratory & Equipment Infrastructure</span>
          </div>
          <p>© 2026 University Laboratory Governance. Production Grade System.</p>
        </div>
      </footer>
    </div>
  );
};
