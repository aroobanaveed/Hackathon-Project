/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getEquipmentList, saveEquipment, deleteEquipmentDoc, getLabs, getCategories } from '../../services/db';
import { Equipment, Lab, EquipmentCategory, EquipmentCondition, MaintenanceStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Boxes, PlusCircle, Search, Edit3, Trash2 } from 'lucide-react';

export const AdminEquipmentPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { success, error } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal
  const [editItem, setEditItem] = useState<Equipment | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eq, l, cat] = await Promise.all([getEquipmentList(), getLabs(), getCategories()]);
      setEquipment(eq);
      setLabs(l);
      setCategories(cat);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    const newItem: Equipment = {
      id: `eq-${Date.now()}`,
      equipmentId: `EQ-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: categories[0]?.name || 'Microcontrollers',
      labId: labs[0]?.id || 'lab-embedded',
      labName: labs[0]?.name || 'Embedded Systems Lab',
      departmentId: labs[0]?.departmentId || 'dept-cs',
      totalQuantity: 15,
      availableQuantity: 15,
      reservedQuantity: 0,
      inUseQuantity: 0,
      condition: 'EXCELLENT',
      maintenanceStatus: 'OPERATIONAL',
      description: '',
      createdAt: new Date().toISOString()
    };
    setEditItem(newItem);
    setIsNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      const parentLab = labs.find(l => l.id === editItem.labId);
      const toSave: Equipment = {
        ...editItem,
        labName: parentLab?.name || editItem.labName,
        departmentId: parentLab?.departmentId || editItem.departmentId,
        updatedAt: new Date().toISOString()
      };
      await saveEquipment(toSave);
      success('Equipment Saved', `${toSave.name} updated in master inventory.`);
      setEditItem(null);
      loadData();
    } catch (err: any) {
      error('Failed to save', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEquipmentDoc(deleteTarget.id);
      success('Equipment Deleted', `${deleteTarget.name} has been archived.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      error('Failed to delete', err.message);
    }
  };

  const filtered = equipment.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.equipmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Equipment CRUD</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global catalog administration across all departmental stores, labs, and hardware lockers.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Add Equipment Item
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by equipment title, ID, category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading equipment inventory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Housed In</th>
                  <th className="py-3.5 px-4 text-center">Total</th>
                  <th className="py-3.5 px-4 text-center">Available</th>
                  <th className="py-3.5 px-4">Condition</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(eq => (
                  <tr key={eq.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{eq.equipmentId}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{eq.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{eq.category}</td>
                    <td className="py-3.5 px-4 text-slate-700">{eq.labName}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{eq.totalQuantity}</td>
                    <td className="py-3.5 px-4 text-center font-black text-emerald-600">{eq.availableQuantity}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={eq.condition} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          setEditItem({ ...eq });
                          setIsNew(false);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(eq)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg text-xs border border-rose-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={isNew ? 'Register Equipment Item' : `Edit: ${editItem?.name}`}
      >
        {editItem && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Equipment ID</label>
                <input
                  type="text"
                  required
                  value={editItem.equipmentId}
                  onChange={e => setEditItem({ ...editItem, equipmentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editItem.name}
                  onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editItem.category}
                  onChange={e => setEditItem({ ...editItem, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Housed in Lab</label>
                <select
                  value={editItem.labId}
                  onChange={e => setEditItem({ ...editItem, labId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                >
                  {labs.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editItem.totalQuantity}
                  onChange={e => {
                    const t = Number(e.target.value);
                    const avail = Math.max(0, t - editItem.reservedQuantity - editItem.inUseQuantity);
                    setEditItem({ ...editItem, totalQuantity: t, availableQuantity: avail });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Available Quantity</label>
                <input
                  type="number"
                  min="0"
                  max={editItem.totalQuantity}
                  required
                  value={editItem.availableQuantity}
                  onChange={e => setEditItem({ ...editItem, availableQuantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-bold text-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Condition</label>
                <select
                  value={editItem.condition}
                  onChange={e => setEditItem({ ...editItem, condition: e.target.value as EquipmentCondition })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="NEEDS_REPAIR">Needs Repair</option>
                  <option value="DECOMMISSIONED">Decommissioned</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maintenance Status</label>
                <select
                  value={editItem.maintenanceStatus}
                  onChange={e => setEditItem({ ...editItem, maintenanceStatus: e.target.value as MaintenanceStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                >
                  <option value="OPERATIONAL">Operational</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="CALIBRATION_DUE">Calibration Due</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={editItem.description}
                onChange={e => setEditItem({ ...editItem, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Equipment'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Equipment Item?"
        message={`Are you sure you want to delete ${deleteTarget?.name}? Item will be removed from checkout catalog.`}
        confirmLabel="Confirm Delete"
        isDestructive={true}
      />
    </div>
  );
};
