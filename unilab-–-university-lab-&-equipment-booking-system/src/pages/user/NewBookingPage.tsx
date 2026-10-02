/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getLabs,
  getEquipmentList,
  checkBookingAvailability,
  createBookingRequest,
  getAllBookings
} from '../../services/db';
import { getSmartRecommendations } from '../../services/ai';
import { Lab, Equipment, ResourceType, Booking, RecommendationItem } from '../../types';
import { AvailabilityCalendar } from '../../components/booking/AvailabilityCalendar';
import { SmartRecommendationCard } from '../../components/booking/SmartRecommendationCard';
import {
  FlaskConical,
  Wrench,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Building2,
  Layers
} from 'lucide-react';

export const NewBookingPage: React.FC<{
  initialResourceType?: ResourceType;
  initialResourceId?: string;
  initialDate?: string;
  initialStart?: string;
  initialEnd?: string;
  initialQuantity?: number;
  navigate: (path: string) => void;
}> = ({
  initialResourceType = 'LAB',
  initialResourceId,
  initialDate,
  initialStart = '14:00',
  initialEnd = '16:00',
  initialQuantity = 1,
  navigate
}) => {
  const { currentUser } = useAuth();
  const { success, error, warning } = useToast();

  const [step, setStep] = useState(1);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  // Booking Form State
  const [resourceType, setResourceType] = useState<ResourceType>(initialResourceType);
  const [resourceId, setResourceId] = useState<string>(initialResourceId || '');
  const [bookingDate, setBookingDate] = useState<string>(
    initialDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>(initialStart);
  const [endTime, setEndTime] = useState<string>(initialEnd);
  const [quantity, setQuantity] = useState<number>(() => {
    const q = Number(initialQuantity);
    return !isNaN(q) && q >= 1 ? Math.floor(q) : 1;
  });
  const [purpose, setPurpose] = useState<string>('');

  // Conflict Checking State
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [availableQty, setAvailableQty] = useState<number | undefined>(undefined);

  // AI Recommendation State
  const [aiRecommendations, setAiRecommendations] = useState<RecommendationItem[]>([]);
  const [recommendationSource, setRecommendationSource] = useState<'gemini-ai' | 'deterministic-engine'>('deterministic-engine');
  const [loadingAi, setLoadingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [l, eq, b] = await Promise.all([getLabs(), getEquipmentList(), getAllBookings()]);
      setLabs(l);
      setEquipmentList(eq);
      setAllBookings(b);

      if (!resourceId) {
        if (resourceType === 'LAB' && l.length > 0) setResourceId(l[0].id);
        if (resourceType === 'EQUIPMENT' && eq.length > 0) setResourceId(eq[0].id);
      }
    }
    loadData();
  }, [resourceType]);

  const selectedLab = labs.find(l => l.id === resourceId);
  const selectedEquipment = equipmentList.find(e => e.id === resourceId);
  const selectedResourceName = resourceType === 'LAB' ? selectedLab?.name || '' : selectedEquipment?.name || '';

  // Trigger Availability & Conflict Check
  const runConflictCheck = async (): Promise<boolean> => {
    if (!resourceId) return false;
    setCheckingAvailability(true);
    setConflictError(null);

    const checkQty = resourceType === 'EQUIPMENT' ? (Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1) : 1;

    try {
      const result = await checkBookingAvailability(
        resourceType,
        resourceId,
        bookingDate,
        startTime,
        endTime,
        checkQty
      );

      if (result.hasConflict) {
        setConflictError(result.reason || 'Conflict detected for selected time.');
        setAvailableQty(result.availableQuantity);

        // Fetch smart AI alternatives when a conflict is found
        fetchAiAlternatives();
        return false;
      } else {
        setConflictError(null);
        setAvailableQty(result.availableQuantity);
        return true;
      }
    } catch (err: any) {
      setConflictError(err.message);
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const fetchAiAlternatives = async () => {
    setLoadingAi(true);
    const checkQty = resourceType === 'EQUIPMENT' ? (Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1) : 1;
    try {
      const res = await getSmartRecommendations({
        resourceType,
        resourceName: selectedResourceName,
        departmentId: currentUser?.departmentId,
        preferredDate: bookingDate,
        startTime,
        endTime,
        quantity: checkQty,
        purpose: purpose || 'Academic research and laboratory course requirements'
      });
      setAiRecommendations(res.recommendations);
      setRecommendationSource(res.source);
    } catch (e) {
      console.warn('AI recommendation error:', e);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleNextFromSchedule = async () => {
    const isFree = await runConflictCheck();
    if (isFree) {
      setStep(resourceType === 'EQUIPMENT' ? 3 : 4);
    }
  };

  const handleNextFromQuantity = () => {
    if (resourceType === 'EQUIPMENT') {
      const q = Number(quantity);
      if (isNaN(q) || q < 1) {
        warning('Invalid Quantity', 'Please enter a valid equipment quantity (at least 1 unit).');
        return;
      }
      if (selectedEquipment && q > selectedEquipment.availableQuantity) {
        warning(
          'Insufficient Quantity',
          `Only ${selectedEquipment.availableQuantity} units are currently available in inventory.`
        );
        return;
      }
    }
    setStep(4);
  };

  const handleSubmitBooking = async () => {
    if (!currentUser) {
      error('Authentication Required', 'Please sign in to submit a booking.');
      return;
    }

    // 1. Validate quantity strictly
    const rawQty = Number(quantity);
    let resolvedQuantity: number;

    if (resourceType === 'EQUIPMENT') {
      if (isNaN(rawQty) || rawQty < 1) {
        error('Invalid Quantity', 'Please specify a valid equipment quantity of at least 1 unit.');
        setStep(3);
        return;
      }
      if (selectedEquipment && rawQty > selectedEquipment.availableQuantity) {
        error(
          'Quantity Exceeded',
          `Requested quantity (${rawQty}) exceeds available inventory (${selectedEquipment.availableQuantity} units).`
        );
        setStep(3);
        return;
      }
      resolvedQuantity = Math.floor(rawQty);
    } else {
      // For LAB reservations, 1 laboratory room is reserved. Quantity must NEVER be undefined.
      resolvedQuantity = 1;
    }

    // 2. Validate date and time
    if (!bookingDate) {
      error('Date Required', 'Please select a booking date.');
      setStep(2);
      return;
    }
    if (!startTime || !endTime) {
      error('Time Required', 'Please select both start and end times.');
      setStep(2);
      return;
    }
    if (startTime >= endTime) {
      error('Invalid Time Slot', 'End time must be after start time.');
      setStep(2);
      return;
    }

    // 3. Validate purpose
    const cleanPurpose = (purpose || '').trim();
    if (cleanPurpose.length < 5) {
      error('Purpose Required', 'Please provide an academic justification of at least 5 characters.');
      setStep(4);
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const bookingIdNumber = Math.floor(1000 + Math.random() * 9000);
      
      // Ensure all fields are explicitly defined and non-undefined before submission
      const newBooking: Booking = {
        id: `bkg-${Date.now()}`,
        bookingId: `BKG-2026-${bookingIdNumber}`,
        userId: currentUser.id,
        userName: currentUser.name || 'University User',
        userEmail: currentUser.email || '',
        userRole: currentUser.role || 'STUDENT',
        departmentId: currentUser.departmentId || 'dept-cs',
        resourceType,
        resourceId,
        resourceName: selectedResourceName || (resourceType === 'LAB' ? 'Laboratory' : 'Equipment Item'),
        bookingDate,
        startTime,
        endTime,
        quantity: resolvedQuantity, // Guaranteed number >= 1, NEVER undefined
        purpose: cleanPurpose,
        status: 'PENDING_APPROVAL',
        approvalStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };

      await createBookingRequest(newBooking);
      success('Booking Request Submitted!', `Booking ID: ${newBooking.bookingId}. Awaiting lab staff verification.`);
      navigate(`/bookings/${newBooking.id}`);
    } catch (err: any) {
      console.error('Booking submission technical error:', err);
      let userFriendlyMessage = 'Unable to submit your booking right now. Please check your information and try again.';
      
      if (err instanceof Error) {
        if (
          err.message.includes('conflict') ||
          (err.message.includes('Only') && err.message.includes('units are available')) ||
          err.message.includes('exceeds') ||
          err.message.includes('Start time must be before') ||
          err.message.includes('undergoing maintenance') ||
          err.message.includes('marked as CLOSED')
        ) {
          userFriendlyMessage = err.message;
        } else {
          try {
            const parsed = JSON.parse(err.message);
            if (parsed && typeof parsed.error === 'string') {
              if (
                parsed.error.includes('conflict') ||
                parsed.error.includes('available') ||
                parsed.error.includes('exceeds')
              ) {
                userFriendlyMessage = parsed.error;
              }
            }
          } catch {
            // Keep clean user-friendly message
          }
        }
      }
      error('Submission Unsuccessful', userFriendlyMessage);
      setConflictError(userFriendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const relevantBookingsForDate = allBookings.filter(
    b => b.resourceId === resourceId && b.bookingDate === bookingDate
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Create Booking Reservation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Step-by-step reservation with mathematical conflict checking and AI recommendation fallback.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 self-start sm:self-auto">
            Step {step} of 5
          </span>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
          {[
            { s: 1, label: 'Resource' },
            { s: 2, label: 'Date & Slot' },
            { s: 3, label: 'Quantity' },
            { s: 4, label: 'Purpose' },
            { s: 5, label: 'Review & Submit' }
          ].map(item => (
            <div
              key={item.s}
              className={`p-2 rounded-xl transition-all border ${
                step === item.s
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : step > item.s
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-100'
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wider opacity-80">Step {item.s}</span>
              <span className="hidden sm:inline font-bold">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: SELECT RESOURCE */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 1: Choose Resource Type & Target Item</h2>
            <p className="text-xs text-slate-500 mt-1">Select whether you wish to book a physical laboratory room or checkout equipment kits.</p>
          </div>

          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setResourceType('LAB');
                if (labs.length > 0) setResourceId(labs[0].id);
              }}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                resourceType === 'LAB'
                  ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Laboratory Room</p>
                <p className="text-[11px] text-slate-500 font-normal">Reserve workstations & facility</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setResourceType('EQUIPMENT');
                if (equipmentList.length > 0) setResourceId(equipmentList[0].id);
              }}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                resourceType === 'EQUIPMENT'
                  ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Equipment & Kits</p>
                <p className="text-[11px] text-slate-500 font-normal">Checkout developer boards & tools</p>
              </div>
            </button>
          </div>

          {/* List of items to select */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Select {resourceType === 'LAB' ? 'Laboratory' : 'Equipment Item'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {resourceType === 'LAB'
                ? labs.map(lab => (
                    <button
                      key={lab.id}
                      type="button"
                      onClick={() => setResourceId(lab.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        resourceId === lab.id
                          ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{lab.labId}</span>
                          <span className="text-[10px] font-semibold text-slate-500">{lab.departmentName}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{lab.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{lab.description}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <span>Capacity: <strong>{lab.capacity} seats</strong></span>
                        <span className="font-semibold text-emerald-600">{lab.status}</span>
                      </div>
                    </button>
                  ))
                : equipmentList.map(eq => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => setResourceId(eq.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        resourceId === eq.id
                          ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{eq.equipmentId}</span>
                          <span className="text-[10px] font-semibold text-slate-500">{eq.category}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{eq.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{eq.labName}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-500">Available Stock:</span>
                        <strong className="text-emerald-600 font-bold">{eq.availableQuantity} of {eq.totalQuantity}</strong>
                      </div>
                    </button>
                  ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={!resourceId}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Continue to Date & Time
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT DATE, TIME & CONFLICT CHECK */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 2: Reservation Date & Slot Selection</h2>
              <p className="text-xs text-slate-500 mt-1">
                Booking for: <strong className="text-indigo-600">{selectedResourceName}</strong>
              </p>
            </div>
          </div>

          {/* Date Picker & Time Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reservation Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={e => {
                    setBookingDate(e.target.value);
                    setConflictError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Time (24h)</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={e => {
                    setStartTime(e.target.value);
                    setConflictError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Time (24h)</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={e => {
                    setEndTime(e.target.value);
                    setConflictError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Quick slot picker from Availability Calendar */}
          <div className="pt-2">
            <AvailabilityCalendar
              date={bookingDate}
              selectedStart={startTime}
              selectedEnd={endTime}
              onSelectSlot={(s, e) => {
                setStartTime(s);
                setEndTime(e);
                setConflictError(null);
              }}
              existingBookings={relevantBookingsForDate}
            />
          </div>

          {/* Conflict Display & AI Recommendations */}
          {conflictError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900">Booking Conflict Detected</h4>
                  <p className="text-xs text-rose-700 mt-0.5">{conflictError}</p>
                </div>
              </div>

              {/* AI Alternatives Card */}
              <div className="pt-3 border-t border-rose-200/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h5 className="text-xs font-bold text-slate-900">Smart Resource Recommendations</h5>
                  </div>
                  {loadingAi && <span className="text-[11px] text-purple-600 animate-pulse">Consulting Gemini AI...</span>}
                </div>

                {aiRecommendations.length > 0 ? (
                  <div className="space-y-2">
                    {aiRecommendations.map((rec, idx) => (
                      <SmartRecommendationCard
                        key={idx}
                        recommendation={rec}
                        source={recommendationSource}
                        onSelect={(item) => {
                          setResourceId(item.resourceId);
                          if (item.suggestedSlot && item.suggestedSlot.includes('-')) {
                            const [s, e] = item.suggestedSlot.split('-').map(t => t.trim());
                            if (s && e) {
                              setStartTime(s);
                              setEndTime(e);
                            }
                          }
                          setConflictError(null);
                          success(`Applied recommendation: ${item.resourceName}`);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={fetchAiAlternatives}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-100/70 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✨ Find Available Alternative Labs & Slots
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              disabled={checkingAvailability}
              onClick={handleNextFromSchedule}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {checkingAvailability ? 'Checking Availability...' : 'Validate & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EQUIPMENT QUANTITY (SKIPPED FOR LABS) */}
      {step === 3 && resourceType === 'EQUIPMENT' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 3: Specify Required Equipment Quantity</h2>
            <p className="text-xs text-slate-500 mt-1">
              Item: <strong className="text-indigo-600">{selectedResourceName}</strong>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-slate-500 font-medium">Currently Available in Department Store:</span>
              <strong className="text-emerald-700 font-bold text-sm">
                {selectedEquipment?.availableQuantity || 0} units
              </strong>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-xs font-semibold text-slate-700">Units Requested:</label>
              <input
                type="number"
                min="1"
                max={selectedEquipment?.totalQuantity || 50}
                value={quantity || ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') {
                    setQuantity(1);
                  } else {
                    const parsed = parseInt(val, 10);
                    setQuantity(isNaN(parsed) ? 1 : Math.max(1, parsed));
                  }
                }}
                className="w-24 px-3 py-2 text-center text-sm font-bold rounded-xl border border-slate-300 focus:border-indigo-600 outline-none"
              />
            </div>

            {selectedEquipment && quantity > selectedEquipment.availableQuantity && (
              <div className="mt-3 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Only {selectedEquipment.availableQuantity} units are currently available. Please reduce requested quantity to proceed.
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              disabled={!quantity || quantity < 1 || (selectedEquipment ? quantity > selectedEquipment.availableQuantity : false)}
              onClick={handleNextFromQuantity}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Continue to Purpose
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: ENTER PURPOSE */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 4: Academic Purpose & Project Context</h2>
            <p className="text-xs text-slate-500 mt-1">Provide clear justification for lab staff and coordinator approval.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Course / Capstone / Research Objective <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. EC402 Embedded Systems Project: Designing low-power telemetry node using ESP32 and ultrasonic sensor pack..."
              className="w-full p-3 text-xs rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(resourceType === 'EQUIPMENT' ? 3 : 2)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              disabled={purpose.trim().length < 5}
              onClick={() => setStep(5)}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Review Booking
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & FINAL SUBMISSION */}
      {step === 5 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 5: Review & Confirm Booking Request</h2>
            <p className="text-xs text-slate-500 mt-1">Verify all parameters before transmitting to university department queue.</p>
          </div>

          {/* Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">{resourceType}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedResourceName}</h3>
                <p className="text-slate-500 mt-0.5">
                  Applicant: <strong>{currentUser?.name}</strong> ({currentUser?.role}) • {currentUser?.email}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                Pending Staff Verification
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-400 block font-medium">Date</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{bookingDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Time Window</span>
                <span className="font-bold font-mono text-indigo-700 mt-0.5 block">{startTime} – {endTime}</span>
              </div>
              {resourceType === 'EQUIPMENT' && (
                <div>
                  <span className="text-slate-400 block font-medium">Requested Units</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{quantity} units</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block font-medium">Department</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{currentUser?.departmentName}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <span className="text-slate-400 block font-medium mb-1">Stated Academic Purpose:</span>
              <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-normal">
                {purpose}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Edit
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitBooking}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting to Queue...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Submit Booking</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
