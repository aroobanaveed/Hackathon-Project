/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  FlaskConical,
  Wrench,
  CalendarCheck,
  PlusCircle,
  ClipboardList,
  ArrowRightLeft,
  Sliders,
  Shield,
  Users,
  Building2,
  Boxes,
  Layers,
  History,
  Settings,
  Bell,
  BarChart3,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  navigate: (path: string) => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPath,
  navigate
}) => {
  const { isStaff, isCoordinator, isAdmin } = useAuth();

  const userItems: NavItem[] = [
    { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Laboratories', path: '/labs', icon: FlaskConical },
    { label: 'Equipment Catalog', path: '/equipment', icon: Wrench },
    { label: 'My Bookings', path: '/bookings', icon: CalendarCheck },
    { label: 'Book Resource', path: '/bookings/new', icon: PlusCircle },
    { label: 'Notifications', path: '/notifications', icon: Bell }
  ];

  const staffItems: NavItem[] = [
    { label: 'Staff Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
    { label: 'Pending Requests', path: '/staff/requests', icon: ClipboardList },
    { label: 'Issue & Return Desk', path: '/staff/issue-return', icon: ArrowRightLeft },
    { label: 'Inventory Manager', path: '/staff/equipment', icon: Boxes },
    { label: 'Maintenance Log', path: '/staff/maintenance', icon: Sliders },
    { label: 'All University Bookings', path: '/staff/bookings', icon: CalendarCheck }
  ];

  const coordinatorItems: NavItem[] = [
    { label: 'Coordinator Overview', path: '/coordinator/dashboard', icon: LayoutDashboard },
    { label: 'Department Approvals', path: '/coordinator/requests', icon: ClipboardList },
    { label: 'Booking Rules & Limits', path: '/coordinator/rules', icon: Sliders },
    { label: 'Resource Utilization', path: '/coordinator/analytics', icon: BarChart3 }
  ];

  const adminItems: NavItem[] = [
    { label: 'Admin Command Center', path: '/admin/dashboard', icon: Shield },
    { label: 'User Accounts', path: '/admin/users', icon: Users },
    { label: 'Departments', path: '/admin/departments', icon: Building2 },
    { label: 'Laboratories CRUD', path: '/admin/labs', icon: FlaskConical },
    { label: 'Equipment Master', path: '/admin/equipment', icon: Boxes },
    { label: 'Equipment Categories', path: '/admin/categories', icon: Layers },
    { label: 'System Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Audit Trail Logs', path: '/admin/audit-logs', icon: History },
    { label: 'System Settings', path: '/admin/settings', icon: Settings }
  ];

  const renderSection = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      <h5 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        {title}
      </h5>
      <nav className="space-y-1">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path + '/'));

          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between lg:hidden mb-4 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderSection('Student / Faculty', userItems)}
        {isStaff && renderSection('Lab Staff & Incharge', staffItems)}
        {isCoordinator && renderSection('Department Coordinator', coordinatorItems)}
        {isAdmin && renderSection('System Administrator', adminItems)}

        <div className="mt-8 pt-4 border-t border-slate-100 px-3">
          <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/80 text-xs">
            <p className="font-bold text-indigo-950">UniLab Enterprise</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Live automated conflict detection & Gemini resource matching.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
