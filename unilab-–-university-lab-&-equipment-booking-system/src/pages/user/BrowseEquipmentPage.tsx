/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getEquipmentList, getCategories } from '../../services/db';
import { Equipment, EquipmentCategory } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Wrench, Boxes, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const BrowseEquipmentPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [eqList, catList] = await Promise.all([getEquipmentList(), getCategories()]);
        setEquipment(eqList);
        setCategories(catList);
      } catch (err) {
        console.error('Error fetching equipment:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.equipmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.labName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesAvailability = !onlyAvailable || item.availableQuantity > 0;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Equipment Inventory Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Check real-time stock levels of development kits, measurement instruments, and sensor toolkits.
          </p>
        </div>
        <button
          onClick={() => navigate('/bookings/new?resourceType=EQUIPMENT')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Wrench className="w-4 h-4" /> Reserve Equipment
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search equipment by title, ID (e.g. EQ-ARD-001), kit contents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={e => setOnlyAvailable(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-0"
            />
            In Stock Only (&gt;0)
          </label>
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 bg-slate-200/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No equipment matches your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono text-indigo-600 font-semibold">{item.equipmentId}</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{item.category}</p>
                  </div>
                  <StatusBadge status={item.condition} size="sm" />
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                <p className="text-xs text-slate-600 mt-2 font-medium">
                  Housed in: <span className="text-slate-900 font-semibold">{item.labName}</span>
                </p>

                {/* Real-time Inventory Grid */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl grid grid-cols-4 text-center text-xs border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                    <span className="font-bold text-slate-800 text-sm">{item.totalQuantity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Reserved</span>
                    <span className="font-bold text-amber-600 text-sm">{item.reservedQuantity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">In Use</span>
                    <span className="font-bold text-blue-600 text-sm">{item.inUseQuantity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Available</span>
                    <span className="font-bold text-emerald-600 text-sm">{item.availableQuantity}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 mt-3 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/equipment/${item.id}`)}
                  className="text-xs font-semibold text-slate-700 hover:text-indigo-600"
                >
                  View Details
                </button>
                <button
                  disabled={item.availableQuantity === 0 || item.maintenanceStatus === 'UNDER_MAINTENANCE'}
                  onClick={() => navigate(`/bookings/new?resourceType=EQUIPMENT&resourceId=${item.id}`)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {item.availableQuantity === 0 ? 'Out of Stock' : 'Reserve Equipment'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
