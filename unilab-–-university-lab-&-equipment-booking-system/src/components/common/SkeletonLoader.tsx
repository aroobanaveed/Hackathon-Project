/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        <div className="w-20 h-6 bg-slate-100 rounded-full" />
      </div>
      <div className="h-5 bg-slate-200 rounded-md w-3/4 mb-2" />
      <div className="h-4 bg-slate-100 rounded-md w-1/2 mb-4" />
      <div className="h-10 bg-slate-100 rounded-xl w-full" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs animate-pulse">
      <div className="h-12 bg-slate-100/60 border-b border-slate-100 px-6" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/6" />
            <div className="h-4 bg-slate-100 rounded w-1/5" />
            <div className="h-6 bg-slate-100 rounded-full w-20" />
            <div className="h-8 bg-slate-200 rounded-lg w-24" />
          </div>
        ))}
      </div>
    </div>
  );
};
