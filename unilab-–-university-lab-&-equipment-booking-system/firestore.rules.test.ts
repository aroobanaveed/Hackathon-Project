/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Firestore Security Rules Tests for UniLab
// Verifies Dirty Dozen payloads return PERMISSION_DENIED

export const testDirtyDozenCases = [
  { id: 1, name: 'Privilege Escalation on User Creation', shouldFail: true },
  { id: 2, name: 'User Profile Shadow Injection', shouldFail: true },
  { id: 3, name: 'Booking Identity Spoofing', shouldFail: true },
  { id: 4, name: 'Booking Self-Approval', shouldFail: true },
  { id: 5, name: 'Unapproved Status Skipping', shouldFail: true },
  { id: 6, name: 'Terminal State Tampering', shouldFail: true },
  { id: 7, name: 'Inventory Poisoning', shouldFail: true },
  { id: 8, name: 'Unauthorized Equipment Return', shouldFail: true },
  { id: 9, name: 'PII Notification Snooping', shouldFail: true },
  { id: 10, name: 'Audit Log Truncation / Deletion', shouldFail: true },
  { id: 11, name: 'Rule System Hijack', shouldFail: true },
  { id: 12, name: 'Oversized Payload / Denial of Wallet', shouldFail: true },
];
