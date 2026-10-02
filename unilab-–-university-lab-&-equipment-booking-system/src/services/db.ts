/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import {
  Lab,
  Equipment,
  Department,
  EquipmentCategory,
  Booking,
  Issue,
  Notification,
  MaintenanceRecord,
  AuditLog,
  SystemSetting,
  UserProfile,
  UserRole
} from '../types';
import {
  SEED_DEPARTMENTS,
  SEED_CATEGORIES,
  SEED_LABS,
  SEED_EQUIPMENT,
  SEED_SETTINGS,
  SEED_BOOKINGS,
  SEED_ISSUES,
  SEED_NOTIFICATIONS,
  SEED_MAINTENANCE,
  SEED_AUDIT_LOGS,
  DEMO_USERS
} from '../lib/seed-data';

/**
 * Recursively strips undefined fields from an object before writing to Firestore.
 * Firestore setDoc/updateDoc/addDoc crashes if any field is undefined.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => (typeof item === 'object' && item !== null && !(item instanceof Date)) ? cleanFirestoreData(item) : item) as any;
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        result[key] = cleanFirestoreData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

// ==========================================
// Safe Idempotent Database Initialization
// ==========================================
export async function initializeDatabaseIfEmpty(): Promise<boolean> {
  const path = 'settings';
  try {
    const settingRef = doc(db, 'settings', 'global-rules');
    const snap = await getDoc(settingRef);

    if (snap.exists()) {
      return false; // Already initialized
    }

    // Seed global settings
    await setDoc(settingRef, cleanFirestoreData(SEED_SETTINGS));

    // Seed departments
    for (const dept of SEED_DEPARTMENTS) {
      await setDoc(doc(db, 'departments', dept.id), cleanFirestoreData(dept));
    }

    // Seed categories
    for (const cat of SEED_CATEGORIES) {
      await setDoc(doc(db, 'equipmentCategories', cat.id), cleanFirestoreData(cat));
    }

    // Seed labs
    for (const lab of SEED_LABS) {
      await setDoc(doc(db, 'labs', lab.id), cleanFirestoreData(lab));
    }

    // Seed equipment
    for (const eq of SEED_EQUIPMENT) {
      await setDoc(doc(db, 'equipment', eq.id), cleanFirestoreData(eq));
    }

    // Seed demo users
    for (const user of DEMO_USERS) {
      await setDoc(doc(db, 'users', user.id), cleanFirestoreData(user));
    }

    // Seed bookings
    for (const bkg of SEED_BOOKINGS) {
      const sanitized = cleanFirestoreData({
        ...bkg,
        quantity: typeof bkg.quantity === 'number' && bkg.quantity >= 1 ? Math.floor(bkg.quantity) : 1
      });
      await setDoc(doc(db, 'bookings', bkg.id), sanitized);
    }

    // Seed issues
    for (const iss of SEED_ISSUES) {
      await setDoc(doc(db, 'issues', iss.id), cleanFirestoreData(iss));
    }

    // Seed notifications
    for (const notif of SEED_NOTIFICATIONS) {
      await setDoc(doc(db, 'notifications', notif.id), cleanFirestoreData(notif));
    }

    // Seed maintenance
    for (const m of SEED_MAINTENANCE) {
      await setDoc(doc(db, 'maintenance', m.id), cleanFirestoreData(m));
    }

    // Seed audit logs
    for (const a of SEED_AUDIT_LOGS) {
      await setDoc(doc(db, 'auditLogs', a.id), cleanFirestoreData(a));
    }

    return true;
  } catch (error) {
    console.warn('Initialization note (may be running with mock/fallback or permission check):', error);
    return false;
  }
}

// ==========================================
// USER SERVICES
// ==========================================
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    // Check demo users fallback
    const foundDemo = DEMO_USERS.find(u => u.id === userId || u.email === userId);
    return foundDemo || null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return DEMO_USERS;
    }
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (error) {
    console.warn('Error fetching users from Firestore, using demo set:', error);
    return DEMO_USERS;
  }
}

// ==========================================
// LAB SERVICES
// ==========================================
export async function getLabs(): Promise<Lab[]> {
  const path = 'labs';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return SEED_LABS;
    }
    return snap.docs.map(d => d.data() as Lab);
  } catch (error) {
    console.warn('Using seed labs fallback:', error);
    return SEED_LABS;
  }
}

export async function getLabById(id: string): Promise<Lab | null> {
  const path = `labs/${id}`;
  try {
    const snap = await getDoc(doc(db, 'labs', id));
    if (snap.exists()) return snap.data() as Lab;
    return SEED_LABS.find(l => l.id === id || l.labId === id) || null;
  } catch (error) {
    return SEED_LABS.find(l => l.id === id || l.labId === id) || null;
  }
}

export async function saveLab(lab: Lab): Promise<void> {
  const path = `labs/${lab.id}`;
  try {
    await setDoc(doc(db, 'labs', lab.id), lab, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLabDoc(id: string): Promise<void> {
  const path = `labs/${id}`;
  try {
    await deleteDoc(doc(db, 'labs', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// EQUIPMENT SERVICES
// ==========================================
export async function getEquipmentList(): Promise<Equipment[]> {
  const path = 'equipment';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return SEED_EQUIPMENT;
    return snap.docs.map(d => d.data() as Equipment);
  } catch (error) {
    console.warn('Using seed equipment fallback:', error);
    return SEED_EQUIPMENT;
  }
}

export async function getEquipmentById(id: string): Promise<Equipment | null> {
  const path = `equipment/${id}`;
  try {
    const snap = await getDoc(doc(db, 'equipment', id));
    if (snap.exists()) return snap.data() as Equipment;
    return SEED_EQUIPMENT.find(e => e.id === id || e.equipmentId === id) || null;
  } catch (error) {
    return SEED_EQUIPMENT.find(e => e.id === id || e.equipmentId === id) || null;
  }
}

export async function saveEquipment(item: Equipment): Promise<void> {
  const path = `equipment/${item.id}`;
  try {
    await setDoc(doc(db, 'equipment', item.id), item, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEquipmentDoc(id: string): Promise<void> {
  const path = `equipment/${id}`;
  try {
    await deleteDoc(doc(db, 'equipment', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// DEPARTMENTS & CATEGORIES
// ==========================================
export async function getDepartments(): Promise<Department[]> {
  const path = 'departments';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return SEED_DEPARTMENTS;
    return snap.docs.map(d => d.data() as Department);
  } catch (error) {
    return SEED_DEPARTMENTS;
  }
}

export async function saveDepartment(dept: Department): Promise<void> {
  const path = `departments/${dept.id}`;
  try {
    await setDoc(doc(db, 'departments', dept.id), dept, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDepartmentDoc(id: string): Promise<void> {
  const path = `departments/${id}`;
  try {
    await deleteDoc(doc(db, 'departments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getCategories(): Promise<EquipmentCategory[]> {
  const path = 'equipmentCategories';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return SEED_CATEGORIES;
    return snap.docs.map(d => d.data() as EquipmentCategory);
  } catch (error) {
    return SEED_CATEGORIES;
  }
}

export async function saveCategory(cat: EquipmentCategory): Promise<void> {
  const path = `equipmentCategories/${cat.id}`;
  try {
    await setDoc(doc(db, 'equipmentCategories', cat.id), cat, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryDoc(id: string): Promise<void> {
  const path = `equipmentCategories/${id}`;
  try {
    await deleteDoc(doc(db, 'equipmentCategories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// SYSTEM SETTINGS
// ==========================================
export async function getSystemSettings(): Promise<SystemSetting> {
  const path = 'settings/global-rules';
  try {
    const snap = await getDoc(doc(db, 'settings', 'global-rules'));
    if (snap.exists()) return snap.data() as SystemSetting;
    return SEED_SETTINGS;
  } catch (error) {
    return SEED_SETTINGS;
  }
}

export async function updateSystemSettings(settings: SystemSetting): Promise<void> {
  const path = 'settings/global-rules';
  try {
    await setDoc(doc(db, 'settings', 'global-rules'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// CONFLICT & AVAILABILITY CHECKING ENGINE
// ==========================================
export interface ConflictCheckResult {
  hasConflict: boolean;
  reason?: string;
  availableQuantity?: number;
  conflictingBookings?: Booking[];
  suggestedSlots?: { startTime: string; endTime: string }[];
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function doTimesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

export async function checkBookingAvailability(
  resourceType: 'LAB' | 'EQUIPMENT',
  resourceId: string,
  date: string,
  startTime: string,
  endTime: string,
  requestedQuantity: number = 1,
  excludeBookingId?: string
): Promise<ConflictCheckResult> {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin >= endMin) {
    return {
      hasConflict: true,
      reason: 'Start time must be before end time.'
    };
  }

  // 1. Check resource status & maintenance
  if (resourceType === 'LAB') {
    const lab = await getLabById(resourceId);
    if (!lab) return { hasConflict: true, reason: 'Laboratory not found.' };
    if (lab.status === 'CLOSED') return { hasConflict: true, reason: 'Laboratory is currently marked as CLOSED.' };
    if (lab.status === 'MAINTENANCE') return { hasConflict: true, reason: 'Laboratory is currently under scheduled maintenance.' };
  } else {
    const eq = await getEquipmentById(resourceId);
    if (!eq) return { hasConflict: true, reason: 'Equipment not found.' };
    if (eq.maintenanceStatus === 'UNDER_MAINTENANCE') return { hasConflict: true, reason: 'Equipment is currently undergoing maintenance.' };
    if (requestedQuantity > eq.totalQuantity) {
      return {
        hasConflict: true,
        reason: `Requested quantity (${requestedQuantity}) exceeds total inventory (${eq.totalQuantity}).`,
        availableQuantity: eq.availableQuantity
      };
    }
  }

  // 2. Fetch existing bookings on the same date for this resource
  const allBookings = await getAllBookings();
  const relevantBookings = allBookings.filter(b =>
    b.resourceId === resourceId &&
    b.bookingDate === date &&
    b.id !== excludeBookingId &&
    (b.status === 'APPROVED' || b.status === 'RESERVED' || b.status === 'IN_USE' || b.status === 'PENDING_APPROVAL')
  );

  if (resourceType === 'LAB') {
    const overlapping = relevantBookings.filter(b => doTimesOverlap(startTime, endTime, b.startTime, b.endTime));
    if (overlapping.length > 0) {
      // Find alternative open slots for today (09:00 - 18:00)
      const suggestions = [
        { startTime: '09:00', endTime: '11:00' },
        { startTime: '11:00', endTime: '13:00' },
        { startTime: '13:00', endTime: '15:00' },
        { startTime: '15:00', endTime: '17:00' }
      ].filter(slot => !relevantBookings.some(b => doTimesOverlap(slot.startTime, slot.endTime, b.startTime, b.endTime)));

      return {
        hasConflict: true,
        reason: `Booking conflict detected: Lab is already booked from ${overlapping[0].startTime} to ${overlapping[0].endTime}.`,
        conflictingBookings: overlapping,
        suggestedSlots: suggestions
      };
    }
  } else {
    // Equipment quantity calculation during the window
    const eq = (await getEquipmentById(resourceId))!;
    let maxReservedDuringWindow = 0;

    // Check overlaps
    const overlapping = relevantBookings.filter(b => doTimesOverlap(startTime, endTime, b.startTime, b.endTime));
    const reservedInSlot = overlapping.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    const effectiveAvailable = Math.max(0, eq.totalQuantity - eq.inUseQuantity - reservedInSlot);

    if (requestedQuantity > effectiveAvailable) {
      return {
        hasConflict: true,
        reason: `Only ${effectiveAvailable} units are available during the requested time window (${eq.totalQuantity} total, ${eq.inUseQuantity} in use, ${reservedInSlot} reserved).`,
        availableQuantity: effectiveAvailable,
        conflictingBookings: overlapping
      };
    }
  }

  return {
    hasConflict: false,
    availableQuantity: resourceType === 'EQUIPMENT' ? (await getEquipmentById(resourceId))?.availableQuantity : undefined
  };
}

// ==========================================
// BOOKING LIFECYCLE & MUTATIONS
// ==========================================
export async function getAllBookings(): Promise<Booking[]> {
  const path = 'bookings';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return SEED_BOOKINGS;
    return snap.docs.map(d => d.data() as Booking);
  } catch (error) {
    return SEED_BOOKINGS;
  }
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const all = await getAllBookings();
  return all.filter(b => b.userId === userId);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const path = `bookings/${id}`;
  try {
    const snap = await getDoc(doc(db, 'bookings', id));
    if (snap.exists()) return snap.data() as Booking;
    const all = await getAllBookings();
    return all.find(b => b.id === id || b.bookingId === id) || null;
  } catch (error) {
    const all = await getAllBookings();
    return all.find(b => b.id === id || b.bookingId === id) || null;
  }
}

export async function createBookingRequest(booking: Booking): Promise<Booking> {
  const path = `bookings/${booking.id}`;
  try {
    // 1. Ensure quantity is NEVER undefined, NaN, or non-numeric
    const rawQty = Number(booking.quantity);
    const validQuantity = (!isNaN(rawQty) && rawQty >= 1)
      ? Math.floor(rawQty)
      : 1;

    // 2. Sanitize complete booking payload ensuring zero undefined fields
    const sanitizedBooking: Booking = cleanFirestoreData({
      id: booking.id || `bkg-${Date.now()}`,
      bookingId: booking.bookingId || `BKG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: booking.userId || '',
      userName: booking.userName || 'University User',
      userEmail: booking.userEmail || '',
      userRole: booking.userRole || 'STUDENT',
      departmentId: booking.departmentId || 'dept-cs',
      resourceType: booking.resourceType || 'LAB',
      resourceId: booking.resourceId,
      resourceName: booking.resourceName || (booking.resourceType === 'LAB' ? 'Laboratory' : 'Equipment Item'),
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      quantity: validQuantity,
      purpose: (booking.purpose || '').trim() || 'Academic laboratory course work',
      status: booking.status || 'PENDING_APPROVAL',
      approvalStatus: booking.approvalStatus || 'PENDING',
      createdAt: booking.createdAt || new Date().toISOString()
    });

    // 3. Re-verify availability with the validated quantity
    const check = await checkBookingAvailability(
      sanitizedBooking.resourceType,
      sanitizedBooking.resourceId,
      sanitizedBooking.bookingDate,
      sanitizedBooking.startTime,
      sanitizedBooking.endTime,
      sanitizedBooking.quantity
    );

    if (check.hasConflict) {
      throw new Error(check.reason || 'Booking conflict detected.');
    }

    // 4. Safely set document in Firestore without any undefined fields
    await setDoc(doc(db, 'bookings', sanitizedBooking.id), sanitizedBooking);

    // If equipment, update reservedQuantity
    if (sanitizedBooking.resourceType === 'EQUIPMENT') {
      const eq = await getEquipmentById(sanitizedBooking.resourceId);
      if (eq) {
        const qty = sanitizedBooking.quantity;
        await setDoc(doc(db, 'equipment', eq.id), cleanFirestoreData({
          ...eq,
          reservedQuantity: (eq.reservedQuantity || 0) + qty,
          availableQuantity: Math.max(0, (eq.availableQuantity || 0) - qty),
          updatedAt: new Date().toISOString()
        }), { merge: true });
      }
    }

    // Create notification for staff
    const notif: Notification = cleanFirestoreData({
      id: `notif-${Date.now()}`,
      userId: 'user-staff-marcus',
      title: 'New Booking Request',
      message: `${sanitizedBooking.userName} submitted a request for ${sanitizedBooking.resourceName} (Qty: ${sanitizedBooking.quantity}) on ${sanitizedBooking.bookingDate} (${sanitizedBooking.startTime}-${sanitizedBooking.endTime}).`,
      type: 'INFO',
      read: false,
      relatedBookingId: sanitizedBooking.id,
      createdAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'notifications', notif.id), notif);

    // Create Audit Log
    const audit: AuditLog = cleanFirestoreData({
      id: `audit-${Date.now()}`,
      userId: sanitizedBooking.userId,
      userName: sanitizedBooking.userName,
      userRole: sanitizedBooking.userRole,
      action: 'SUBMIT_BOOKING_REQUEST',
      entityType: 'BOOKING',
      entityId: sanitizedBooking.id,
      details: `Created booking ${sanitizedBooking.bookingId} for ${sanitizedBooking.resourceName} (Quantity: ${sanitizedBooking.quantity})`,
      timestamp: new Date().toISOString()
    });
    await setDoc(doc(db, 'auditLogs', audit.id), audit);

    return sanitizedBooking;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function approveBooking(
  bookingId: string,
  approver: UserProfile
): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    const booking = await getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found.');

    // Re-verify availability
    const check = await checkBookingAvailability(
      booking.resourceType,
      booking.resourceId,
      booking.bookingDate,
      booking.startTime,
      booking.endTime,
      booking.quantity || 1,
      booking.id
    );

    if (check.hasConflict) {
      throw new Error(`Cannot approve due to conflict: ${check.reason}`);
    }

    const now = new Date().toISOString();
    await setDoc(doc(db, 'bookings', bookingId), cleanFirestoreData({
      status: 'APPROVED',
      approvalStatus: 'APPROVED',
      approvedBy: approver.id,
      approvedByName: approver.name,
      approvedAt: now,
      updatedAt: now
    }), { merge: true });

    // Notify applicant
    const notif: Notification = cleanFirestoreData({
      id: `notif-${Date.now()}`,
      userId: booking.userId,
      title: 'Booking Approved',
      message: `Your booking for ${booking.resourceName} on ${booking.bookingDate} (${booking.startTime}-${booking.endTime}) has been approved!`,
      type: 'SUCCESS',
      read: false,
      relatedBookingId: booking.id,
      createdAt: now
    });
    await setDoc(doc(db, 'notifications', notif.id), notif);

    // Audit log
    const audit: AuditLog = cleanFirestoreData({
      id: `audit-${Date.now()}`,
      userId: approver.id,
      userName: approver.name,
      userRole: approver.role,
      action: 'APPROVE_BOOKING',
      entityType: 'BOOKING',
      entityId: booking.id,
      details: `Approved booking ${booking.bookingId}`,
      timestamp: now
    });
    await setDoc(doc(db, 'auditLogs', audit.id), audit);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function rejectBooking(
  bookingId: string,
  reason: string,
  reviewer: UserProfile
): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    const booking = await getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found.');

    const now = new Date().toISOString();
    await setDoc(doc(db, 'bookings', bookingId), cleanFirestoreData({
      status: 'REJECTED',
      approvalStatus: 'REJECTED',
      rejectionReason: reason,
      updatedAt: now
    }), { merge: true });

    // Restore equipment reserved quantity
    if (booking.resourceType === 'EQUIPMENT') {
      const eq = await getEquipmentById(booking.resourceId);
      if (eq) {
        const qty = booking.quantity || 1;
        await setDoc(doc(db, 'equipment', eq.id), cleanFirestoreData({
          ...eq,
          reservedQuantity: Math.max(0, (eq.reservedQuantity || 0) - qty),
          availableQuantity: (eq.availableQuantity || 0) + qty,
          updatedAt: now
        }), { merge: true });
      }
    }

    // Notify user
    const notif: Notification = cleanFirestoreData({
      id: `notif-${Date.now()}`,
      userId: booking.userId,
      title: 'Booking Request Rejected',
      message: `Your booking for ${booking.resourceName} was rejected. Reason: ${reason}`,
      type: 'ALERT',
      read: false,
      relatedBookingId: booking.id,
      createdAt: now
    });
    await setDoc(doc(db, 'notifications', notif.id), notif);

    // Audit
    const audit: AuditLog = cleanFirestoreData({
      id: `audit-${Date.now()}`,
      userId: reviewer.id,
      userName: reviewer.name,
      userRole: reviewer.role,
      action: 'REJECT_BOOKING',
      entityType: 'BOOKING',
      entityId: booking.id,
      details: `Rejected booking ${booking.bookingId}. Reason: ${reason}`,
      timestamp: now
    });
    await setDoc(doc(db, 'auditLogs', audit.id), audit);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cancelBooking(bookingId: string, user: UserProfile): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    const booking = await getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.userId !== user.id && user.role === 'STUDENT') {
      throw new Error('You do not have permission to cancel this booking.');
    }
    if (booking.status === 'COMPLETED' || booking.status === 'IN_USE') {
      throw new Error('Cannot cancel a booking that is currently in use or completed.');
    }

    const now = new Date().toISOString();
    await setDoc(doc(db, 'bookings', bookingId), cleanFirestoreData({
      status: 'CANCELLED',
      updatedAt: now
    }), { merge: true });

    // Release equipment quantity if reserved
    if (booking.resourceType === 'EQUIPMENT') {
      const eq = await getEquipmentById(booking.resourceId);
      if (eq) {
        const qty = booking.quantity || 1;
        await setDoc(doc(db, 'equipment', eq.id), cleanFirestoreData({
          ...eq,
          reservedQuantity: Math.max(0, (eq.reservedQuantity || 0) - qty),
          availableQuantity: (eq.availableQuantity || 0) + qty,
          updatedAt: now
        }), { merge: true });
      }
    }

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CANCEL_BOOKING',
      entityType: 'BOOKING',
      entityId: booking.id,
      details: `Cancelled booking ${booking.bookingId}`,
      timestamp: now
    };
    await setDoc(doc(db, 'auditLogs', audit.id), audit);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// ISSUE & RETURN LOGIC
// ==========================================
export async function getAllIssues(): Promise<Issue[]> {
  const path = 'issues';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return SEED_ISSUES;
    return snap.docs.map(d => d.data() as Issue);
  } catch (error) {
    return SEED_ISSUES;
  }
}

export async function issueEquipment(
  bookingId: string,
  staffUser: UserProfile,
  expectedReturnAt: string
): Promise<Issue> {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error('Booking not found.');
  if (booking.resourceType !== 'EQUIPMENT') throw new Error('Can only issue equipment.');

  const eq = await getEquipmentById(booking.resourceId);
  if (!eq) throw new Error('Equipment item not found.');

  const qty = booking.quantity || 1;
  const now = new Date().toISOString();

  const issueId = `iss-${Date.now()}`;
  const newIssue: Issue = {
    id: issueId,
    issueId: `ISS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    bookingId: booking.id,
    equipmentId: eq.id,
    equipmentName: eq.name,
    userId: booking.userId,
    userName: booking.userName,
    issuedBy: staffUser.id,
    issuedByName: staffUser.name,
    quantity: qty,
    issuedAt: now,
    expectedReturnAt: expectedReturnAt || `${booking.bookingDate}T${booking.endTime}:00Z`,
    status: 'ISSUED'
  };

  // Update issue doc
  await setDoc(doc(db, 'issues', issueId), cleanFirestoreData(newIssue));

  // Update booking status to IN_USE
  await updateDoc(doc(db, 'bookings', booking.id), cleanFirestoreData({
    status: 'IN_USE',
    updatedAt: now
  }));

  // Update equipment stock: reserved -> inUse
  await updateDoc(doc(db, 'equipment', eq.id), cleanFirestoreData({
    reservedQuantity: Math.max(0, (eq.reservedQuantity || 0) - qty),
    inUseQuantity: (eq.inUseQuantity || 0) + qty,
    updatedAt: now
  }));

  // Notify student
  const notif: Notification = cleanFirestoreData({
    id: `notif-${Date.now()}`,
    userId: booking.userId,
    title: 'Equipment Checked Out',
    message: `${qty} unit(s) of ${eq.name} have been handed to you. Please return by ${expectedReturnAt}.`,
    type: 'INFO',
    read: false,
    relatedBookingId: booking.id,
    createdAt: now
  });
  await setDoc(doc(db, 'notifications', notif.id), notif);

  // Audit
  const audit: AuditLog = cleanFirestoreData({
    id: `audit-${Date.now()}`,
    userId: staffUser.id,
    userName: staffUser.name,
    userRole: staffUser.role,
    action: 'ISSUE_EQUIPMENT',
    entityType: 'ISSUE',
    entityId: issueId,
    details: `Issued ${qty}x ${eq.name} to ${booking.userName}`,
    timestamp: now
  });
  await setDoc(doc(db, 'auditLogs', audit.id), audit);

  return newIssue;
}

export async function processEquipmentReturn(
  issueId: string,
  params: {
    returnCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED' | 'MISSING';
    damageReport?: string;
    missingQuantity?: number;
    remarks?: string;
    staffUser: UserProfile;
  }
): Promise<void> {
  const path = `issues/${issueId}`;
  try {
    const issueSnap = await getDoc(doc(db, 'issues', issueId));
    const issueData = issueSnap.exists() ? (issueSnap.data() as Issue) : SEED_ISSUES.find(i => i.id === issueId);
    if (!issueData) throw new Error('Issue record not found.');

    const now = new Date();
    const nowIso = now.toISOString();
    const expectedTime = new Date(issueData.expectedReturnAt);

    // Detect late return
    const isLate = now.getTime() > expectedTime.getTime() + 15 * 60 * 1000; // 15 min grace period
    const isDamaged = params.returnCondition === 'DAMAGED';
    const missingQty = params.missingQuantity || 0;

    let finalStatus: Issue['status'] = 'RETURNED';
    if (isDamaged) finalStatus = 'DAMAGED';
    else if (isLate) finalStatus = 'RETURNED_LATE';

    await updateDoc(doc(db, 'issues', issueId), {
      actualReturnAt: nowIso,
      returnCondition: params.returnCondition,
      damageReport: params.damageReport || '',
      missingQuantity: missingQty,
      remarks: params.remarks || '',
      status: finalStatus
    });

    // Update equipment quantities
    const eq = await getEquipmentById(issueData.equipmentId);
    if (eq) {
      const returnedSound = Math.max(0, issueData.quantity - missingQty);
      const newInUse = Math.max(0, (eq.inUseQuantity || 0) - issueData.quantity);
      const newAvailable = (eq.availableQuantity || 0) + (isDamaged ? 0 : returnedSound);

      await updateDoc(doc(db, 'equipment', eq.id), cleanFirestoreData({
        inUseQuantity: newInUse,
        availableQuantity: newAvailable,
        totalQuantity: Math.max(0, eq.totalQuantity - missingQty),
        condition: isDamaged ? 'NEEDS_REPAIR' : eq.condition,
        updatedAt: nowIso
      }));
    }

    // Update Booking status to COMPLETED
    if (issueData.bookingId) {
      await updateDoc(doc(db, 'bookings', issueData.bookingId), cleanFirestoreData({
        status: isDamaged ? 'DAMAGED' : isLate ? 'RETURNED_LATE' : 'COMPLETED',
        updatedAt: nowIso
      }));
    }

    // Notify user
    const notif: Notification = cleanFirestoreData({
      id: `notif-${Date.now()}`,
      userId: issueData.userId,
      title: 'Equipment Return Recorded',
      message: `Return for ${issueData.equipmentName} processed. Condition: ${params.returnCondition}. Status: ${finalStatus}.`,
      type: isDamaged || isLate ? 'WARNING' : 'SUCCESS',
      read: false,
      relatedBookingId: issueData.bookingId,
      createdAt: nowIso
    });
    await setDoc(doc(db, 'notifications', notif.id), notif);

    // Audit
    const audit: AuditLog = cleanFirestoreData({
      id: `audit-${Date.now()}`,
      userId: params.staffUser.id,
      userName: params.staffUser.name,
      userRole: params.staffUser.role,
      action: 'PROCESS_RETURN',
      entityType: 'ISSUE',
      entityId: issueId,
      details: `Return of ${issueData.quantity}x ${issueData.equipmentName} logged with status ${finalStatus}`,
      timestamp: nowIso
    });
    await setDoc(doc(db, 'auditLogs', audit.id), audit);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// NOTIFICATIONS
// ==========================================
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const path = 'notifications';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return SEED_NOTIFICATIONS.filter(n => n.userId === userId);
    return snap.docs
      .map(d => d.data() as Notification)
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    return SEED_NOTIFICATIONS.filter(n => n.userId === userId);
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const path = `notifications/${id}`;
  try {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  } catch (error) {
    console.warn('Could not update notification in DB, updating local state:', error);
  }
}

// ==========================================
// MAINTENANCE
// ==========================================
export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  const path = 'maintenance';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return SEED_MAINTENANCE;
    return snap.docs.map(d => d.data() as MaintenanceRecord);
  } catch (error) {
    return SEED_MAINTENANCE;
  }
}

export async function createMaintenanceRecord(record: MaintenanceRecord): Promise<void> {
  const path = `maintenance/${record.id}`;
  try {
    await setDoc(doc(db, 'maintenance', record.id), record);
    // If equipment or lab, update status
    if (record.resourceType === 'LAB') {
      await updateDoc(doc(db, 'labs', record.resourceId), {
        status: 'MAINTENANCE',
        updatedAt: new Date().toISOString()
      });
    } else {
      await updateDoc(doc(db, 'equipment', record.resourceId), {
        maintenanceStatus: 'UNDER_MAINTENANCE',
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ==========================================
// AUDIT LOGS
// ==========================================
export async function getAuditLogs(): Promise<AuditLog[]> {
  const path = 'auditLogs';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return SEED_AUDIT_LOGS;
    return snap.docs
      .map(d => d.data() as AuditLog)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    return SEED_AUDIT_LOGS;
  }
}
