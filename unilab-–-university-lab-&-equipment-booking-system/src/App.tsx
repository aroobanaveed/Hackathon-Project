/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { getDashboardForRole } from './lib/auth-service';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// User Pages
import { UserDashboard } from './pages/user/UserDashboard';
import { BrowseLabsPage } from './pages/user/BrowseLabsPage';
import { LabDetailsPage } from './pages/user/LabDetailsPage';
import { BrowseEquipmentPage } from './pages/user/BrowseEquipmentPage';
import { EquipmentDetailsPage } from './pages/user/EquipmentDetailsPage';
import { UserBookingsPage } from './pages/user/UserBookingsPage';
import { NewBookingPage } from './pages/user/NewBookingPage';
import { BookingDetailsPage } from './pages/user/BookingDetailsPage';
import { NotificationsPage } from './pages/user/NotificationsPage';
import { UserProfilePage } from './pages/user/UserProfilePage';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffRequestsPage } from './pages/staff/StaffRequestsPage';
import { StaffBookingsPage } from './pages/staff/StaffBookingsPage';
import { StaffEquipmentPage } from './pages/staff/StaffEquipmentPage';
import { StaffIssueReturnPage } from './pages/staff/StaffIssueReturnPage';
import { StaffMaintenancePage } from './pages/staff/StaffMaintenancePage';

// Coordinator Pages
import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { CoordinatorRulesPage } from './pages/coordinator/CoordinatorRulesPage';
import { CoordinatorAnalyticsPage } from './pages/coordinator/CoordinatorAnalyticsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage';
import { AdminLabsPage } from './pages/admin/AdminLabsPage';
import { AdminEquipmentPage } from './pages/admin/AdminEquipmentPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

function RouterComponent() {
  const [currentUrl, setCurrentUrl] = useState<string>(window.location.pathname + window.location.search);
  const { currentUser, isAuthenticated, loading, isStaff, isCoordinator, isAdmin, role } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentUrl(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentUrl(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [pathOnly, searchOnly] = currentUrl.split('?');
  const queryParams = new URLSearchParams(searchOnly || '');

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-600">Verifying session credentials...</p>
      </div>
    );
  }

  // Guard Helper for Role-Protected Pages
  const renderGuarded = (allowed: boolean, component: React.ReactNode, requiredRoleName: string) => {
    if (!allowed) {
      const fallbackDashboard = role ? getDashboardForRole(role) : '/login';

      return (
        <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-md">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-5">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            This module requires <strong>{requiredRoleName}</strong> authorization.
            Your authenticated role is <span className="font-semibold text-indigo-700">{role || 'Unauthenticated'}</span>.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(fallbackDashboard)}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Your Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      );
    }
    return component;
  };

  // Route Resolver
  const resolvePage = () => {
    // 1. Public Routes (accessible without login)
    if (pathOnly === '/') {
      return <LandingPage navigate={navigate} />;
    }
    if (pathOnly === '/login') {
      return <LoginPage navigate={navigate} />;
    }
    if (pathOnly === '/register') {
      return <RegisterPage navigate={navigate} />;
    }
    if (pathOnly === '/forgot-password') {
      return <ForgotPasswordPage navigate={navigate} />;
    }

    // 2. Protected Route Authentication Gate
    // If not authenticated, require login first
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-lg">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Authentication Required</h2>
            <p className="text-xs text-slate-500 mt-2">
              You must sign in with your university credentials or test account to access this section of UniLab.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Sign In with Credentials
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Back to Home Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 3. Dynamic Parameter Routes (Wrapped in AppLayout)
    if (pathOnly.startsWith('/labs/')) {
      const labId = pathOnly.replace('/labs/', '');
      return (
        <AppLayout currentPath={pathOnly} navigate={navigate}>
          <LabDetailsPage labId={labId} navigate={navigate} />
        </AppLayout>
      );
    }

    if (pathOnly.startsWith('/equipment/')) {
      const eqId = pathOnly.replace('/equipment/', '');
      return (
        <AppLayout currentPath={pathOnly} navigate={navigate}>
          <EquipmentDetailsPage equipmentId={eqId} navigate={navigate} />
        </AppLayout>
      );
    }

    if (pathOnly.startsWith('/bookings/') && pathOnly !== '/bookings/new') {
      const bkgId = pathOnly.replace('/bookings/', '');
      return (
        <AppLayout currentPath={pathOnly} navigate={navigate}>
          <BookingDetailsPage bookingId={bkgId} navigate={navigate} />
        </AppLayout>
      );
    }

    // 4. Standard Role-Governed Routes
    let content: React.ReactNode = null;

    switch (pathOnly) {
      // User / Faculty Routes
      case '/dashboard':
        content = <UserDashboard navigate={navigate} />;
        break;
      case '/labs':
        content = <BrowseLabsPage navigate={navigate} />;
        break;
      case '/equipment':
        content = <BrowseEquipmentPage navigate={navigate} />;
        break;
      case '/bookings':
        content = <UserBookingsPage navigate={navigate} />;
        break;
      case '/bookings/new':
        content = (
          <NewBookingPage
            initialResourceType={(queryParams.get('resourceType') as any) || 'LAB'}
            initialResourceId={queryParams.get('resourceId') || undefined}
            initialDate={queryParams.get('date') || undefined}
            initialStart={queryParams.get('start') || undefined}
            initialEnd={queryParams.get('end') || undefined}
            navigate={navigate}
          />
        );
        break;
      case '/notifications':
        content = <NotificationsPage navigate={navigate} />;
        break;
      case '/profile':
        content = <UserProfilePage navigate={navigate} />;
        break;

      // Staff Routes
      case '/staff/dashboard':
        content = renderGuarded(isStaff, <StaffDashboard navigate={navigate} />, 'Lab Staff / Incharge');
        break;
      case '/staff/requests':
        content = renderGuarded(isStaff, <StaffRequestsPage navigate={navigate} />, 'Lab Staff / Incharge');
        break;
      case '/staff/bookings':
        content = renderGuarded(isStaff, <StaffBookingsPage navigate={navigate} />, 'Lab Staff / Incharge');
        break;
      case '/staff/equipment':
        content = renderGuarded(isStaff, <StaffEquipmentPage navigate={navigate} />, 'Lab Staff / Incharge');
        break;
      case '/staff/issue-return':
        content = renderGuarded(isStaff, <StaffIssueReturnPage navigate={navigate} />, 'Lab Staff / Incharge');
        break;
      case '/staff/maintenance':
        content = renderGuarded(isStaff, <StaffMaintenancePage navigate={navigate} />, 'Lab Staff / Incharge');
        break;

      // Coordinator Routes
      case '/coordinator/dashboard':
        content = renderGuarded(isCoordinator, <CoordinatorDashboard navigate={navigate} />, 'Department Coordinator');
        break;
      case '/coordinator/requests':
        content = renderGuarded(isCoordinator, <StaffRequestsPage navigate={navigate} />, 'Department Coordinator');
        break;
      case '/coordinator/rules':
        content = renderGuarded(isCoordinator, <CoordinatorRulesPage navigate={navigate} />, 'Department Coordinator');
        break;
      case '/coordinator/analytics':
        content = renderGuarded(isCoordinator, <CoordinatorAnalyticsPage navigate={navigate} />, 'Department Coordinator');
        break;

      // Admin Routes
      case '/admin/dashboard':
        content = renderGuarded(isAdmin, <AdminDashboard navigate={navigate} />, 'System Administrator');
        break;
      case '/admin/users':
        content = renderGuarded(isAdmin, <AdminUsersPage navigate={navigate} />, 'System Administrator');
        break;
      case '/admin/departments':
        content = renderGuarded(isAdmin, <AdminDepartmentsPage navigate={navigate} />, 'System Administrator');
        break;
      case '/admin/labs':
        content = renderGuarded(isAdmin, <AdminLabsPage navigate={navigate} />, 'System Administrator');
        break;
      case '/admin/equipment':
        content = renderGuarded(isAdmin, <AdminEquipmentPage navigate={navigate} />, 'System Administrator');
        break;
      case '/admin/categories':
        content = renderGuarded(isAdmin, <AdminCategoriesPage navigate={navigate} />, 'System Administrator');
        break;
      case '/admin/analytics':
        content = renderGuarded(isAdmin, <CoordinatorAnalyticsPage navigate={navigate} />, 'System Administrator');
        break;
      case '/admin/audit-logs':
        content = renderGuarded(isAdmin, <AdminAuditLogsPage navigate={navigate} />, 'System Administrator');
        break;
      case '/admin/settings':
        content = renderGuarded(isAdmin, <AdminSettingsPage navigate={navigate} />, 'System Administrator');
        break;

      default:
        content = <NotFoundPage navigate={navigate} />;
        break;
    }

    return (
      <AppLayout currentPath={pathOnly} navigate={navigate}>
        {content}
      </AppLayout>
    );
  };

  return <>{resolvePage()}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterComponent />
      </ToastProvider>
    </AuthProvider>
  );
}
