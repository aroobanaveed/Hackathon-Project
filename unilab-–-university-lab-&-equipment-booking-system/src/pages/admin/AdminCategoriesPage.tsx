/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { getCategories, saveCategory, deleteCategoryDoc } from '../../services/db';
import { EquipmentCategory } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Layers, PlusCircle, Search, Edit3, Trash2 } from 'lucide-react';

export const AdminCategoriesPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [editCat, setEditCat] = useState<EquipmentCategory | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EquipmentCategory | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getCategories();
      setCategories(list);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditCat({
      id: `cat-${Date.now()}`,
      name: '',
      description: '',
      icon: 'Boxes'
    });
    setIsNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCat) return;
    setSaving(true);
    try {
      await saveCategory(editCat);
      success('Category Saved', `${editCat.name} updated in taxonomy.`);
      setEditCat(null);
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
      await deleteCategoryDoc(deleteTarget.id);
      success('Category Deleted', `${deleteTarget.name} has been removed.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      error('Failed to delete', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Equipment Taxonomy Categories</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure inventory classifications for filtering and checkout policies.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading categories...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.description || 'General category'}</td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          setEditCat({ ...c });
                          setIsNew(false);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
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
        isOpen={!!editCat}
        onClose={() => setEditCat(null)}
        title={isNew ? 'Create Equipment Category' : `Edit: ${editCat?.name}`}
      >
        {editCat && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category Title</label>
              <input
                type="text"
                required
                value={editCat.name}
                onChange={e => setEditCat({ ...editCat, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={editCat.description || ''}
                onChange={e => setEditCat({ ...editCat, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditCat(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Equipment Category?"
        message={`Are you sure you want to delete ${deleteTarget?.name}?`}
        confirmLabel="Confirm Delete"
        isDestructive={true}
      />
    </div>
  );
};
