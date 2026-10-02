/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'STUDENT' | 'FACULTY' | 'LAB_STAFF' | 'COORDINATOR' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  studentId?: string;
  employeeId?: string;
  phone?: string;
  active: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LabStatus = 'AVAILABLE' | 'RESERVED' | 'IN_USE' | 'MAINTENANCE' | 'CLOSED';

export interface Lab {
  id: string;
  labId: string; // e.g. "LAB-CS-101"
  name: string;
  departmentId: string;
  departmentName: string;
  capacity: number;
  location: string;
  facilities: string[];
  status: LabStatus;
  description: string;
  imageUrl?: string;
  equipmentIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export type EquipmentCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DECOMMISSIONED';
export type MaintenanceStatus = 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'CALIBRATION_DUE';

export interface Equipment {
  id: string;
  equipmentId: string; // e.g. "EQ-ARD-001"
  name: string;
  category: string;
  labId: string;
  labName: string;
  departmentId: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  inUseQuantity: number;
  condition: EquipmentCondition;
  maintenanceStatus: MaintenanceStatus;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ResourceType = 'LAB' | 'EQUIPMENT';

export type BookingStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'RESERVED'
  | 'IN_USE'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'OVERDUE'
  | 'RETURNED_LATE'
  | 'DAMAGED';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Booking {
  id: string;
  bookingId: string; // e.g. "BKG-2026-1001"
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  departmentId: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string;   // HH:mm (24hr e.g. "09:00")
  endTime: string;     // HH:mm (24hr e.g. "11:00")
  quantity: number;    // Mandatory number: unit count for equipment; 1 for lab room reservation
  purpose: string;
  status: BookingStatus;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type IssueStatus = 'ISSUED' | 'RETURNED' | 'RETURNED_LATE' | 'DAMAGED' | 'OVERDUE';
export type ReturnCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED' | 'MISSING';

export interface Issue {
  id: string;
  issueId: string;
  bookingId: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  issuedBy: string;
  issuedByName: string;
  quantity: number;
  issuedAt: string;
  expectedReturnAt: string;
  actualReturnAt?: string;
  returnCondition?: ReturnCondition;
  damageReport?: string;
  missingQuantity?: number;
  remarks?: string;
  status: IssueStatus;
}

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  relatedBookingId?: string;
  createdAt: string;
}

export type MaintenanceType = 'ROUTINE' | 'REPAIR' | 'CALIBRATION' | 'EMERGENCY';
export type MaintenanceTaskStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MaintenanceRecord {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
  type: MaintenanceType;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  status: MaintenanceTaskStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headName: string;
  email: string;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  maxBookingDurationHours: number;
  maxActiveBookingsPerUser: number;
  maxEquipmentQuantityPerBooking: number;
  minAdvanceBookingHours: number;
  cancellationDeadlineHours: number;
  allowCrossDepartmentBooking: boolean;
  autoApprovalForFaculty: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface RecommendationRequest {
  resourceType: ResourceType;
  resourceName?: string;
  category?: string;
  departmentId?: string;
  preferredDate: string;
  startTime: string;
  endTime: string;
  quantity?: number;
  purpose: string;
}

export interface RecommendationItem {
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  matchScore: number; // 0 to 100
  status: 'AVAILABLE' | 'CONFLICT' | 'PARTIAL';
  suggestedSlot?: string;
  rationale: string;
  location?: string;
  availableQuantity?: number;
}
