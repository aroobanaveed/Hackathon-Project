/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Booking } from '../../types';
import { doTimesOverlap } from '../../services/db';
import { Clock, Check, XCircle } from 'lucide-react';

interface AvailabilityCalendarProps {
  date: string;
  selectedStart: string;
  selectedEnd: string;
  onSelectSlot: (start: string, end: string) => void;
  existingBookings: Booking[];
}

const DEFAULT_SLOTS = [
  { start: '09:00', end: '11:00', label: '09:00 AM – 11:00 AM (Morning 1)' },
  { start: '11:00', end: '13:00', label: '11:00 AM – 01:00 PM (Morning 2)' },
  { start: '13:00', end: '14:00', label: '01:00 PM – 02:00 PM (Lunch Hour)' },
  { start: '14:00', end: '16:00', label: '02:00 PM – 04:00 PM (Afternoon 1)' },
  { start: '16:00', end: '18:00', label: '04:00 PM – 06:00 PM (Afternoon 2)' },
  { start: '18:00', end: '20:00', label: '06:00 PM – 08:00 PM (Evening Research)' }
];

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  date,
  selectedStart,
  selectedEnd,
  onSelectSlot,
  existingBookings
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-1">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          Standard Time Slots for {date || 'Selected Date'}
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Booked / Conflict
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {DEFAULT_SLOTS.map((slot, i) => {
          const isBooked = existingBookings.some(b =>
            (b.status === 'APPROVED' || b.status === 'RESERVED' || b.status === 'IN_USE' || b.status === 'PENDING_APPROVAL') &&
            doTimesOverlap(slot.start, slot.end, b.startTime, b.endTime)
          );

          const isSelected = selectedStart === slot.start && selectedEnd === slot.end;

          return (
            <button
              key={i}
              type="button"
              disabled={isBooked}
              onClick={() => onSelectSlot(slot.start, slot.end)}
              className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                isBooked
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  : isSelected
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-semibold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50/80 cursor-pointer shadow-xs'
              }`}
            >
              <div>
                <p className="font-semibold text-slate-900">{slot.label.split('(')[0].trim()}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isBooked ? 'Reserved by another user' : slot.label.split('(')[1]?.replace(')', '') || 'Available slot'}
                </p>
              </div>

              <div className="shrink-0 ml-2">
                {isBooked ? (
                  <XCircle className="w-4 h-4 text-rose-500" />
                ) : isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
