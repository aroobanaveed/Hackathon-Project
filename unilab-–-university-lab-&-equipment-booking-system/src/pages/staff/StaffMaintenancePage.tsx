/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  getLabs,
  getEquipmentList
} from '../../services/db';
import { MaintenanceRecord, Lab, Equipment, MaintenanceType } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Sliders, PlusCircle, Wrench, FlaskConical, Calendar, CheckCircle2, Clock } from 'lucide-react';

export const StaffMaintenancePage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // New Maintenance Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'LAB' | 'EQUIPMENT'>('LAB');
  const [targetId, setTargetId] = useState('');
  const [maintType, setMaintType] = useState<MaintenanceType>('ROUTINE');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, l, eq] = await Promise.all([
        getMaintenanceRecords(),
        getLabs(),
        getEquipmentList()
      ]);
      setRecords(m);
      setLabs(l);
      setEquipment(eq);
      if (l.length > 0 && !targetId) setTargetId(l[0].id);
    } catch (err) {
      console.error('Error fetching maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    try {
      const resourceName =
        targetType === 'LAB'
          ? labs.find(l => l.id === targetId)?.name || 'Laboratory'
          : equipment.find(e => e.id === targetId)?.name || 'Equipment Item';

      const newRec: MaintenanceRecord = {
        id: `maint-${Date.now()}`,
        resourceType: targetType,
        resourceId: targetId,
        resourceName,
        type: maintType,
        description: description.trim(),
        scheduledDate,
        status: 'SCHEDULED',
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdAt: new Date().toISOString()
      };

      await createMaintenanceRecord(newRec);
      success('Maintenance Scheduled', `Resource status updated to under maintenance.`);
      setModalOpen(false);
      setDescription('');
      loadData();
    } catch (err: any) {
      error('Failed to schedule', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Facility & Equipment Maintenance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track calibration periods, schedule repairs, and block faulty equipment or rooms from booking queues.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Schedule Maintenance
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading maintenance log...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No active maintenance tasks recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Resource Target</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Scheduled Date</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Scheduled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {rec.resourceType === 'LAB' ? (
                          <FlaskConical className="w-4 h-4 text-purple-600 shrink-0" />
                        ) : (
                          <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <span className="font-bold text-slate-900">{rec.resourceName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700">
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{rec.scheduledDate}</td>
                    <td className="py-3.5 px-4 max-w-sm text-slate-600 leading-relaxed">{rec.description}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={rec.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{rec.createdByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Resource Maintenance"
        subtitle="This will automatically block the resource from being booked during the downtime"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Resource Type</label>
              <select
                value={targetType}
                onChange={e => {
                  const t = e.target.value as 'LAB' | 'EQUIPMENT';
                  setTargetType(t);
                  setTargetId(t === 'LAB' ? labs[0]?.id || '' : equipment[0]?.id || '');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
              >
                <option value="LAB">Laboratory Room</option>
                <option value="EQUIPMENT">Equipment Kit</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Item</label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
              >
                {targetType === 'LAB'
                  ? labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                  : equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maintenance Type</label>
              <select
                value={maintType}
                onChange={e => setMaintType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
              >
                <option value="ROUTINE">Routine Servicing</option>
                <option value="CALIBRATION">Calibration & Verification</option>
                <option value="REPAIR">Hardware Repair</option>
                <option value="EMERGENCY">Emergency Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Task Scope & Fault Notes</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Inspecting probe attenuation on channel 1; replacing frayed BNC connector..."
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
            >
              {saving ? 'Scheduling...' : 'Confirm & Block Resource'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
