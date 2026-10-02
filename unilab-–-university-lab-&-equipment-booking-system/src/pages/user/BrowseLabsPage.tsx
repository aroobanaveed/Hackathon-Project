/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getLabs, getDepartments } from '../../services/db';
import { Lab, Department } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Filter, FlaskConical, Users, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

export const BrowseLabsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [l, d] = await Promise.all([getLabs(), getDepartments()]);
        setLabs(l);
        setDepartments(d);
      } catch (err) {
        console.error('Error fetching labs:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredLabs = labs.filter(lab => {
    const matchesSearch =
      lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.labId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.facilities.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = selectedDept === 'ALL' || lab.departmentId === selectedDept;
    const matchesStatus = selectedStatus === 'ALL' || lab.status === selectedStatus;
    const matchesCapacity = lab.capacity >= minCapacity;

    return matchesSearch && matchesDept && matchesStatus && matchesCapacity;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">University Laboratories</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, inspect facilities, and reserve high-tech departmental research and computer labs.
          </p>
        </div>
        <button
          onClick={() => navigate('/bookings/new?resourceType=LAB')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FlaskConical className="w-4 h-4" /> Book Lab Session
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by lab name, ID, facility (e.g., Oscilloscope, RTX 4090)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="IN_USE">In Use</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Capacity */}
          <select
            value={minCapacity}
            onChange={e => setMinCapacity(Number(e.target.value))}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none bg-white text-slate-700 font-medium"
          >
            <option value="0">Any Capacity</option>
            <option value="30">30+ Seats</option>
            <option value="40">40+ Seats</option>
            <option value="50">50+ Seats</option>
          </select>
        </div>
      </div>

      {/* Grid of Labs */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 bg-slate-200/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredLabs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No laboratories matched your search filters. Try clearing queries.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.map(lab => (
            <div
              key={lab.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              <div className="h-44 relative bg-slate-100 overflow-hidden">
                <img
                  src={lab.imageUrl}
                  alt={lab.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={lab.status} size="sm" />
                </div>
                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900/80 backdrop-blur-md text-white">
                  {lab.departmentName}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-indigo-600">{lab.labId}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{lab.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{lab.description}</p>

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Capacity: <strong className="text-slate-900">{lab.capacity} student workstations</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Location: <strong className="text-slate-900">{lab.location}</strong></span>
                    </div>
                  </div>

                  {/* Facilities Chips */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {lab.facilities.slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md"
                      >
                        {f}
                      </span>
                    ))}
                    {lab.facilities.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{lab.facilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/labs/${lab.id}`)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View Details
                  </button>
                  <button
                    disabled={lab.status === 'CLOSED' || lab.status === 'MAINTENANCE'}
                    onClick={() => navigate(`/bookings/new?resourceType=LAB&resourceId=${lab.id}`)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    {lab.status === 'MAINTENANCE' ? 'In Maintenance' : lab.status === 'CLOSED' ? 'Closed' : 'Book Lab'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
