/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChevronRight, Home } from 'lucide-react';

interface AppLayoutProps {
  currentPath: string;
  navigate: (path: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  navigate,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Generate breadcrumb items from current path
  const pathSegments = currentPath.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const fullPath = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    return { label, path: fullPath };
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentPath={currentPath}
        navigate={navigate}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPath={currentPath}
          navigate={navigate}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Breadcrumb Bar */}
          {currentPath !== '/' && (
            <div className="bg-white/50 border-b border-slate-200/60 px-4 sm:px-8 py-2.5">
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
                {breadcrumbs.map((bc, idx) => (
                  <React.Fragment key={bc.path}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-slate-800">{bc.label}</span>
                    ) : (
                      <button
                        onClick={() => navigate(bc.path)}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {bc.label}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>
          )}

          {/* Page Body Container */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
