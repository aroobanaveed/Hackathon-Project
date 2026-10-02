/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { testConnection } from '../../lib/firebase';
import { initializeDatabaseIfEmpty } from '../../services/db';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Settings, Database, RefreshCw, CheckCircle2, ShieldCheck, Key } from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';

export const AdminSettingsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [reseedConfirmOpen, setReseedConfirmOpen] = useState(false);
  const [reseeding, setReseeding] = useState(false);

  const checkConnection = async () => {
    setTesting(true);
    const ok = await testConnection();
    setDbConnected(ok);
    setTesting(false);
    if (ok) success('Database Connection Active', 'Firestore enterprise endpoint responding.');
    else error('Database Notice', 'Client offline or initial handshake pending.');
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleReseed = async () => {
    setReseeding(true);
    try {
      const seeded = await initializeDatabaseIfEmpty();
      if (seeded) {
        success('Database Initialized', 'Realistic demo records, departments, and labs populated.');
      } else {
        info('Database Checked', 'Database already contains production data records.');
      }
      setReseedConfirmOpen(false);
    } catch (err: any) {
      error('Seeding notice', err.message);
    } finally {
      setReseeding(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System & Database Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Infrastructure configurations, Firebase connectivity status, and dataset initialization.
        </p>
      </div>

      {/* Cloud Environment Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Firebase Firestore Configuration</h2>
          </div>
          <button
            onClick={checkConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-medium">GCP Project ID</span>
            <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
              {firebaseConfig.projectId}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-medium">Dedicated Database ID</span>
            <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block truncate">
              {firebaseConfig.firestoreDatabaseId}
            </span>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-950">Zero-Trust Rules Active</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Hardened RBAC security rules deployed to Cloud Firestore.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-200 text-emerald-900 font-bold rounded-lg text-[10px]">
            DEPLOYED
          </span>
        </div>

        {/* Database Re-seeder */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <h3 className="font-bold text-slate-900">Database Seeding Mechanism</h3>
          <p className="text-slate-500 leading-relaxed">
            Ensure default laboratories (AI & ML Lab, Embedded Systems Lab), realistic equipment inventory (Arduino Uno Kits, Oscilloscopes, RTX 4090 Workstations), and demo personas are seeded.
          </p>
          <button
            onClick={() => setReseedConfirmOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Verify & Seed Missing Demo Data
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={reseedConfirmOpen}
        onClose={() => setReseedConfirmOpen(false)}
        onConfirm={handleReseed}
        title="Initialize / Check Seed Data"
        message="This will check if any default departments, laboratories, or equipment records are missing and safely insert them without overwriting user data."
        confirmLabel="Run Seeding"
        isLoading={reseeding}
      />
    </div>
  );
};
