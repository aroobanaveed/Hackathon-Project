/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookingStatus, LabStatus, EquipmentCondition, MaintenanceStatus, IssueStatus } from '../../types';

interface StatusBadgeProps {
  status: BookingStatus | LabStatus | EquipmentCondition | MaintenanceStatus | IssueStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let label = status.replace(/_/g, ' ');

  switch (normalized) {
    case 'APPROVED':
    case 'AVAILABLE':
    case 'OPERATIONAL':
    case 'EXCELLENT':
    case 'COMPLETED':
    case 'RETURNED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      dotColor = 'bg-emerald-500';
      break;

    case 'PENDING_APPROVAL':
    case 'PENDING':
    case 'RESERVED':
    case 'SCHEDULED':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200/80';
      dotColor = 'bg-amber-500';
      label = normalized === 'PENDING_APPROVAL' ? 'Pending Approval' : label;
      break;

    case 'IN_USE':
    case 'ISSUED':
    case 'IN_PROGRESS':
    case 'GOOD':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200/80';
      dotColor = 'bg-blue-500';
      break;

    case 'MAINTENANCE':
    case 'UNDER_MAINTENANCE':
    case 'CALIBRATION_DUE':
    case 'FAIR':
    case 'NEEDS_REPAIR':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200/80';
      dotColor = 'bg-purple-500';
      break;

    case 'REJECTED':
    case 'CANCELLED':
    case 'CLOSED':
    case 'DECOMMISSIONED':
    case 'OVERDUE':
    case 'DAMAGED':
    case 'RETURNED_LATE':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
      dotColor = 'bg-rose-500';
      break;

    default:
      break;
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${paddingClass} ${colorClasses} tracking-wide capitalize font-semibold shadow-xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};
