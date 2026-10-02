/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';
import { TEST_ACCOUNTS, TestAccount } from '../../lib/auth-service';
import {
  FlaskConical,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Sliders,
  Shield
} from 'lucide-react';

interface LoginPageProps {
  navigate: (path: string) => void;
  initialRole?: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate, initialRole }) => {
  const { loginWithCredentials, loginWithGoogle, isAuthenticated, currentUser, logout, loading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();

  // Read search params if available
  const searchParams = new URLSearchParams(window.location.search);
  const portalParam = (searchParams.get('portal') || searchParams.get('role') || initialRole || 'STUDENT') as UserRole;

  const [activePortal, setActivePortal] = useState<UserRole>(
    ['STUDENT', 'FACULTY', 'LAB_STAFF', 'COORDINATOR', 'ADMIN'].includes(portalParam)
      ? portalParam
      : 'STUDENT'
  );

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, allow quick navigation to dashboard
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setErrorMessage(null);
    }
  }, [isAuthenticated, currentUser]);

  const portalConfig: Record<
    UserRole,
    {
      title: string;
      desc: string;
      icon: React.ComponentType<{ className?: string }>;
      activeClass: string;
      badgeClass: string;
      sampleIdentifier: string;
    }
  > = {
    STUDENT: {
      title: 'Student Portal',
      desc: 'Access laboratory reservations, view booking approvals, and borrow lab components.',
      icon: GraduationCap,
      activeClass: 'border-emerald-600 bg-emerald-50/50 text-emerald-900',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      sampleIdentifier: 'alex.student@unilab.edu or CS-2024-8841'
    },
    FACULTY: {
      title: 'Faculty Portal',
      desc: 'Reserve research facilities, prioritize student capstones, and manage course lab slots.',
      icon: Briefcase,
      activeClass: 'border-teal-600 bg-teal-50/50 text-teal-900',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
      sampleIdentifier: 'dr.vance@unilab.edu or FAC-CS-104'
    },
    LAB_STAFF: {
      title: 'Lab Staff Desk',
      desc: 'Inspect equipment check-in/check-out, verify return condition, and log maintenance.',
      icon: FlaskConical,
      activeClass: 'border-blue-600 bg-blue-50/50 text-blue-900',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      sampleIdentifier: 'marcus.chen@unilab.edu or STF-ENG-089'
    },
    COORDINATOR: {
      title: 'Department Coordinator',
      desc: 'Review high-demand lab requests, configure department booking quotas, and analyze capacity.',
      icon: Sliders,
      activeClass: 'border-purple-600 bg-purple-50/50 text-purple-900',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      sampleIdentifier: 'elena.coord@unilab.edu or CRD-CS-002'
    },
    ADMIN: {
      title: 'Administration Console',
      desc: 'Full system governance, user permissions, audit trails, and multi-department controls.',
      icon: Shield,
      activeClass: 'border-rose-600 bg-rose-50/50 text-rose-900',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      sampleIdentifier: 'admin@unilab.edu or ADM-SYS-001'
    }
  };

  const handlePortalSwitch = (portal: UserRole) => {
    setActivePortal(portal);
    setErrorMessage(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your University Email or ID number.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithCredentials(identifier, password, activePortal);
      if (res.success && res.user) {
        success('Authentication Successful', `Welcome back, ${res.user.name}!`);
        const target = res.targetDashboard || (
          res.user.role === 'ADMIN'
            ? '/admin/dashboard'
            : res.user.role === 'COORDINATOR'
            ? '/coordinator/dashboard'
            : res.user.role === 'LAB_STAFF'
            ? '/staff/dashboard'
            : '/dashboard'
        );
        navigate(target);
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your Email/ID and password.');
        toastError('Login Failed', res.error || 'Authentication error.');
      }
    } catch (err: any) {
      setErrorMessage('An unexpected error occurred during login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      success('Signed in with Google', 'Authentication verified.');
      navigate('/dashboard');
    } catch (err: any) {
      toastError('Google Sign-in Failed', err.message || 'Could not authenticate via Google.');
    }
  };

  const handleFillCredentials = (account: TestAccount) => {
    setIdentifier(account.email);
    setPassword(account.password);
    setActivePortal(account.role);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        {/* UniLab Header Branding */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              UniLab
            </span>
          </button>
          <h1 className="mt-3 text-xl sm:text-2xl font-bold text-slate-900">
            University Laboratory & Resource Portal
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Secure, role-authenticated access for students, researchers, staff, and coordinators
          </p>
        </div>

        {/* If Already Logged In Banner */}
        {isAuthenticated && currentUser && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ✓
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-emerald-900">
                  Currently signed in as {currentUser.name}
                </p>
                <p className="text-emerald-700">
                  Active Role: <span className="font-semibold">{currentUser.role}</span> ({currentUser.email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const target =
                    currentUser.role === 'ADMIN'
                      ? '/admin/dashboard'
                      : currentUser.role === 'COORDINATOR'
                      ? '/coordinator/dashboard'
                      : currentUser.role === 'LAB_STAFF'
                      ? '/staff/dashboard'
                      : '/dashboard';
                  navigate(target);
                }}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                onClick={async () => {
                  await logout();
                  success('Signed Out', 'You have been logged out.');
                }}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Authentication Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Role Portal Selector Tabs */}
          <div className="p-3 bg-slate-100/70 border-b border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
              Select Login Portal
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(['STUDENT', 'FACULTY', 'LAB_STAFF', 'COORDINATOR', 'ADMIN'] as UserRole[]).map((r) => {
                const cfg = portalConfig[r];
                const Icon = cfg.icon;
                const isSelected = activePortal === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handlePortalSwitch(r)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? `${cfg.activeClass} shadow-xs font-bold border-2`
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-[11px] leading-tight truncate w-full">
                      {r === 'LAB_STAFF' ? 'Lab Staff' : r === 'COORDINATOR' ? 'Coordinator' : r === 'ADMIN' ? 'Admin' : r === 'FACULTY' ? 'Faculty' : 'Student'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Portal Info Bar */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${portalConfig[activePortal].badgeClass}`}>
                {portalConfig[activePortal].title}
              </span>
              <span className="text-slate-500 hidden sm:inline">
                {portalConfig[activePortal].desc}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Inline Error Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Authentication Error</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Credential Login Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  University Email or Institutional ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={`e.g. ${portalConfig[activePortal].sampleIdentifier}`}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting || authLoading}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to {portalConfig[activePortal].title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Or sign in with Google
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google Federated Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-300 hover:border-indigo-400 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Workspace Account</span>
            </button>

            {/* Test Accounts Reference Card */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Official Test Accounts & Credentials
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Manual Entry or Fill Helper
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Selecting a role does not automatically authenticate you. Use these verified credentials to test each specific role:
              </p>

              <div className="space-y-2">
                {TEST_ACCOUNTS.map((acc) => {
                  const isCurrentRole = activePortal === acc.role;
                  return (
                    <div
                      key={acc.id}
                      className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                        isCurrentRole
                          ? 'border-indigo-300 bg-indigo-50/40'
                          : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{acc.roleLabel}:</span>
                          <span className="font-medium text-slate-700">{acc.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500 font-mono">
                            ID: {acc.universityId}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                          <span>
                            Email: <code className="text-indigo-700 font-semibold">{acc.email}</code>
                          </span>
                          <span>
                            Password: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-800 font-bold">{acc.password}</code>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFillCredentials(acc)}
                        className="self-start sm:self-center px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px] rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer"
                      >
                        Fill Form Fields
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Registration Link */}
            <div className="mt-6 text-center text-xs text-slate-500">
              New student or faculty member?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Register an institutional account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
