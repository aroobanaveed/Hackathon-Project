/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getAllUsers, upsertUserProfile, getDepartments } from '../../services/db';
import { UserProfile, UserRole, Department } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Users, PlusCircle, Search, Edit3, Shield, UserX, CheckCircle2 } from 'lucide-react';

export const AdminUsersPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Deactivate dialog
  const [deactivateTarget, setDeactivateTarget] = useState<UserProfile | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, d] = await Promise.all([getAllUsers(), getDepartments()]);
      setUsers(u);
      setDepartments(d);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: '',
      email: '',
      role: 'STUDENT',
      departmentId: departments[0]?.id || 'dept-cs',
      departmentName: departments[0]?.name || 'Computer Science',
      studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: '+1 (555) 000-0000',
      active: true,
      createdAt: new Date().toISOString()
    };
    setEditUser(newUser);
    setIsNew(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const dept = departments.find(d => d.id === editUser.departmentId);
      const toSave: UserProfile = {
        ...editUser,
        departmentName: dept?.name || editUser.departmentName,
        updatedAt: new Date().toISOString()
      };
      await upsertUserProfile(toSave);
      success('User Account Saved', `${toSave.name} updated successfully.`);
      setEditUser(null);
      loadData();
    } catch (err: any) {
      error('Failed to save user', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!deactivateTarget) return;
    try {
      const updated: UserProfile = {
        ...deactivateTarget,
        active: !deactivateTarget.active,
        updatedAt: new Date().toISOString()
      };
      await upsertUserProfile(updated);
      success(
        updated.active ? 'Account Activated' : 'Account Suspended',
        `User ${updated.name} status updated.`
      );
      setDeactivateTarget(null);
      loadData();
    } catch (err: any) {
      error('Status change failed', err.message);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">University User Accounts & RBAC</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage students, faculty members, lab staff in-charges, department coordinators, and system administrators.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Provision New User
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, roll number, or employee ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
            <option value="LAB_STAFF">Lab Staff</option>
            <option value="COORDINATOR">Coordinator</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading user registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role Permission</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">ID Number</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{u.name}</span>
                      <span className="text-[11px] text-slate-400">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'COORDINATOR'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'LAB_STAFF'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{u.departmentName || 'Computer Science'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{u.studentId || u.employeeId || '–'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {u.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          setEditUser({ ...u });
                          setIsNew(false);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => setDeactivateTarget(u)}
                        className={`px-2.5 py-1 font-semibold rounded-lg text-xs transition-colors cursor-pointer border ${
                          u.active
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {u.active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Provision Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={isNew ? 'Provision New User' : `Edit User: ${editUser?.name}`}
        subtitle="Configure role authorization and department allocation"
      >
        {editUser && (
          <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={editUser.name}
                onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">University Email</label>
              <input
                type="email"
                required
                value={editUser.email}
                onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={editUser.role}
                  onChange={e => setEditUser({ ...editUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold outline-none"
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="LAB_STAFF">Lab Staff / Incharge</option>
                  <option value="COORDINATOR">Department Coordinator</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={editUser.departmentId}
                  onChange={e => setEditUser({ ...editUser, departmentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ID Number (Roll or Employee)</label>
                <input
                  type="text"
                  value={editUser.studentId || editUser.employeeId || ''}
                  onChange={e => setEditUser({ ...editUser, studentId: e.target.value, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editUser.phone || ''}
                  onChange={e => setEditUser({ ...editUser, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
              >
                {saving ? 'Saving...' : 'Save User Account'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleToggleActive}
        title={deactivateTarget?.active ? 'Suspend User Access?' : 'Activate User Account?'}
        message={`Are you sure you want to ${deactivateTarget?.active ? 'suspend' : 'activate'} ${deactivateTarget?.name}?`}
        confirmLabel={deactivateTarget?.active ? 'Suspend User' : 'Activate User'}
        isDestructive={deactivateTarget?.active}
      />
    </div>
  );
};
