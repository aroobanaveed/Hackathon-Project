/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getSystemSettings, updateSystemSettings } from '../../services/db';
import { SystemSetting } from '../../types';
import { Sliders, Save, CheckCircle2, ShieldCheck, Clock, Users, Wrench } from 'lucide-react';

export const CoordinatorRulesPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const s = await getSystemSettings();
        setSettings(s);
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !currentUser) return;
    setSaving(true);
    try {
      const updated: SystemSetting = {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.id
      };
      await updateSystemSettings(updated);
      success('Booking Rules Updated', 'New policy limits have been applied campus-wide.');
    } catch (err: any) {
      error('Failed to update rules', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading booking policies...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">University Booking Rules & Policies</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure resource reservation quotas, duration limits, lead times, and cross-departmental access privileges.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">Global Reservation Thresholds</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Last Modified: {new Date(settings.updatedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <label className="block font-bold text-slate-800 mb-1">
              Maximum Booking Duration (Hours)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">Longest continuous reservation allowed per session</p>
            <input
              type="number"
              min="1"
              max="12"
              required
              value={settings.maxBookingDurationHours}
              onChange={e => setSettings({ ...settings, maxBookingDurationHours: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white outline-none"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <label className="block font-bold text-slate-800 mb-1">
              Max Active Bookings Per User
            </label>
            <p className="text-[11px] text-slate-500 mb-2">Simultaneous pending or active sessions per student</p>
            <input
              type="number"
              min="1"
              max="10"
              required
              value={settings.maxActiveBookingsPerUser}
              onChange={e => setSettings({ ...settings, maxActiveBookingsPerUser: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white outline-none"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <label className="block font-bold text-slate-800 mb-1">
              Max Equipment Units Per Booking
            </label>
            <p className="text-[11px] text-slate-500 mb-2">Cap on single-request inventory quantities</p>
            <input
              type="number"
              min="1"
              max="50"
              required
              value={settings.maxEquipmentQuantityPerBooking}
              onChange={e => setSettings({ ...settings, maxEquipmentQuantityPerBooking: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white outline-none"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <label className="block font-bold text-slate-800 mb-1">
              Minimum Advance Booking Time (Hours)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">Notice required before session start</p>
            <input
              type="number"
              min="1"
              max="48"
              required
              value={settings.minAdvanceBookingHours}
              onChange={e => setSettings({ ...settings, minAdvanceBookingHours: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white outline-none"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowCrossDepartmentBooking}
              onChange={e => setSettings({ ...settings, allowCrossDepartmentBooking: e.target.checked })}
              className="mt-0.5 rounded text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="font-bold text-slate-900 block">Allow Cross-Department Bookings</span>
              <span className="text-[11px] text-slate-500">
                Permits students from other faculties (e.g. Electrical) to book Computer Science labs.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoApprovalForFaculty}
              onChange={e => setSettings({ ...settings, autoApprovalForFaculty: e.target.checked })}
              className="mt-0.5 rounded text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="font-bold text-slate-900 block">Auto-Approval for Faculty Members</span>
              <span className="text-[11px] text-slate-500">
                Immediately confirms lab room bookings requested by verified Professors without staff review.
              </span>
            </div>
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Updating Policies...' : 'Save & Publish Rules'}
          </button>
        </div>
      </form>
    </div>
  );
};
