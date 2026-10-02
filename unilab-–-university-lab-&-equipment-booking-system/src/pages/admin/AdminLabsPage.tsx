/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getLabs, saveLab, deleteLabDoc, getDepartments } from '../../services/db';
import { Lab, Department, LabStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FlaskConical, PlusCircle, Search, Edit3, Trash2 } from 'lucide-react';

export const AdminLabsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { success, error } = useToast();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal
  const [editLab, setEditLab] = useState<Lab | null>(null);
  const [facilitiesStr, setFacilitiesStr] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Lab | null>(null);

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    const newLab: Lab = {
      id: `lab-${Date.now()}`,
      labId: `LAB-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      departmentId: departments[0]?.id || 'dept-cs',
      departmentName: departments[0]?.name || 'Computer Science',
      capacity: 30,
      location: 'Engineering Building',
      facilities: ['Workstations', 'High-Speed LAN'],
      status: 'AVAILABLE',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString()
    };
    setEditLab(newLab);
    setFacilitiesStr(newLab.facilities.join(', '));
    setIsNew(true);
  };

  const handleOpenEdit = (lab: Lab) => {
    setEditLab({ ...lab });
    setFacilitiesStr(lab.facilities.join(', '));
    setIsNew(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLab) return;
    setSaving(true);
    try {
      const dept = departments.find(d => d.id === editLab.departmentId);
      const parsedFacilities = facilitiesStr.split(',').map(s => s.trim()).filter(Boolean);
      const toSave: Lab = {
        ...editLab,
        departmentName: dept?.name || editLab.departmentName,
        facilities: parsedFacilities,
        updatedAt: new Date().toISOString()
      };
      await saveLab(toSave);
      success('Lab Saved', `${toSave.name} updated in registry.`);
      setEditLab(null);
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
      await deleteLabDoc(deleteTarget.id);
      success('Lab Archived', `${deleteTarget.name} has been deleted.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      error('Failed to delete', err.message);
    }
  };

  const filtered = labs.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.labId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Laboratories CRUD Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, update capacity, configure equipment allocations, and toggle maintenance or closure states.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Add Laboratory
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search labs by title, ID, room location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading laboratories...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3.5 px-4">Lab ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Capacity</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(lab => (
                  <tr key={lab.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{lab.labId}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{lab.name}</td>
                    <td className="py-3.5 px-4 text-slate-700">{lab.departmentName}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{lab.capacity} seats</td>
                    <td className="py-3.5 px-4 text-slate-600">{lab.location}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={lab.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleOpenEdit(lab)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(lab)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg text-xs border border-rose-200 cursor-pointer"
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
        isOpen={!!editLab}
        onClose={() => setEditLab(null)}
        title={isNew ? 'Create Laboratory Facility' : `Edit Lab: ${editLab?.name}`}
      >
        {editLab && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lab Code / Identifier</label>
                <input
                  type="text"
                  required
                  value={editLab.labId}
                  onChange={e => setEditLab({ ...editLab, labId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={editLab.name}
                  onChange={e => setEditLab({ ...editLab, name: e.target.value })}
                  placeholder="e.g. AI & Machine Learning Lab"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={editLab.departmentId}
                  onChange={e => setEditLab({ ...editLab, departmentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min="5"
                  required
                  value={editLab.capacity}
                  onChange={e => setEditLab({ ...editLab, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ada Lovelace Center, Room 301"
                  value={editLab.location}
                  onChange={e => setEditLab({ ...editLab, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Status</label>
                <select
                  value={editLab.status}
                  onChange={e => setEditLab({ ...editLab, status: e.target.value as LabStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold outline-none"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="IN_USE">In Use</option>
                  <option value="MAINTENANCE">Maintenance (Blocks Bookings)</option>
                  <option value="CLOSED">Closed (Blocks Bookings)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Facilities & Installed Instruments (Comma separated)
              </label>
              <input
                type="text"
                placeholder="RTX 4090 Workstations, Soldering Stations, Oscilloscopes..."
                value={facilitiesStr}
                onChange={e => setFacilitiesStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={editLab.description}
                onChange={e => setEditLab({ ...editLab, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditLab(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Laboratory'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Laboratory Record?"
        message={`Are you sure you want to remove ${deleteTarget?.name}? Historical completed bookings will be preserved in audit logs.`}
        confirmLabel="Confirm Delete"
        isDestructive={true}
      />
    </div>
  );
};
