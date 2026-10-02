/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getDepartments, saveDepartment, deleteDepartmentDoc } from '../../services/db';
import { Department } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Building2, PlusCircle, Search, Edit3, Trash2 } from 'lucide-react';

export const AdminDepartmentsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { success, error } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getDepartments();
      setDepartments(list);
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditDept({
      id: `dept-${Date.now()}`,
      name: '',
      code: '',
      headName: '',
      email: '',
      createdAt: new Date().toISOString()
    });
    setIsNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDept) return;
    setSaving(true);
    try {
      await saveDepartment(editDept);
      success('Department Saved', `${editDept.name} recorded in catalog.`);
      setEditDept(null);
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
      await deleteDepartmentDoc(deleteTarget.id);
      success('Department Deleted', `${deleteTarget.name} has been removed.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      error('Failed to delete', err.message);
    }
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">University Academic Departments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain organizational hierarchy and department head contacts for resource allocation.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by department name or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading departments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Department Name</th>
                  <th className="py-3.5 px-4">Department Head</th>
                  <th className="py-3.5 px-4">Official Contact</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{d.code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.name}</td>
                    <td className="py-3.5 px-4 text-slate-700">{d.headName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{d.email}</td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          setEditDept({ ...d });
                          setIsNew(false);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(d)}
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
        isOpen={!!editDept}
        onClose={() => setEditDept(null)}
        title={isNew ? 'Create Academic Department' : `Edit Department: ${editDept?.name}`}
      >
        {editDept && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS"
                  value={editDept.code}
                  onChange={e => setEditDept({ ...editDept, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  value={editDept.name}
                  onChange={e => setEditDept({ ...editDept, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department Head / Chair</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Robert Martinez"
                value={editDept.headName}
                onChange={e => setEditDept({ ...editDept, headName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Contact Email</label>
              <input
                type="email"
                required
                placeholder="cs.head@unilab.edu"
                value={editDept.email}
                onChange={e => setEditDept({ ...editDept, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditDept(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Department'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Department Record?"
        message={`Are you sure you want to delete ${deleteTarget?.name}? Existing lab rooms linked to this department will need re-association.`}
        confirmLabel="Delete Department"
        isDestructive={true}
      />
    </div>
  );
};
