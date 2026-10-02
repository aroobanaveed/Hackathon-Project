/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, Notification } from '../../types';
import { getUserNotifications, markNotificationAsRead } from '../../services/db';
import {
  FlaskConical,
  Bell,
  Menu,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Sliders,
  Shield,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  currentPath,
  navigate
}) => {
  const { currentUser, isAuthenticated, role, logout } = useAuth();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    async function loadNotifs() {
      try {
        const list = await getUserNotifications(currentUser!.id);
        setNotifications(list);
      } catch (e) {
        console.warn('Notification load error:', e);
      }
    }
    loadNotifs();
    const interval = setInterval(loadNotifs, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const roleMeta: Record<
    UserRole,
    { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    STUDENT: {
      label: 'Student',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: GraduationCap
    },
    FACULTY: {
      label: 'Faculty',
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: Briefcase
    },
    LAB_STAFF: {
      label: 'Lab Staff',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: FlaskConical
    },
    COORDINATOR: {
      label: 'Coordinator',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: Sliders
    },
    ADMIN: {
      label: 'Administrator',
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: Shield
    }
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  const currentRole = role || 'STUDENT';
  const RoleIcon = roleMeta[currentRole].icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">UniLab</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Univ Booking System
              </span>
            </div>
          </button>
        </div>

        {/* Center: Authoritative Non-Switchable Role Badge */}
        {isAuthenticated && currentUser ? (
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${roleMeta[currentRole].color} shadow-2xs`}
            title="Authenticated Session • Role is strictly locked to verified user credentials"
          >
            <Lock className="w-3.5 h-3.5 opacity-60" />
            <RoleIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">
              {roleMeta[currentRole].label} Session
            </span>
            <span className="text-[10px] opacity-70 hidden md:inline">
              ({currentUser.departmentName || 'Campus'})
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Official University Lab Management</span>
          </div>
        )}

        {/* Right Actions: Notifications & User profile OR Login/Register */}
        <div className="flex items-center gap-2.5">
          {isAuthenticated && currentUser ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          navigate('/notifications');
                          setShowNotifMenu(false);
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                      >
                        View All
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 5).map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkAsRead(n.id)}
                            className={`p-3 text-xs rounded-xl cursor-pointer transition-colors ${
                              n.read ? 'opacity-70 hover:bg-slate-50' : 'bg-indigo-50/50 hover:bg-indigo-50 font-medium'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-bold text-slate-900 leading-snug">{n.title}</p>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />}
                            </div>
                            <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 block mt-1.5">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifMenu(false);
                  }}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs overflow-hidden">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0) || 'U'
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleMeta[currentRole].color}`}>
                          {roleMeta[currentRole].label}
                        </span>
                        {(currentUser.studentId || currentUser.employeeId) && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {currentUser.studentId || currentUser.employeeId}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      My Profile
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => navigate('/register')}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
