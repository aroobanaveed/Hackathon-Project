# Security Specification & "Dirty Dozen" Invariants

## 1. Data Invariants

1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created or modified by the user with matching `request.auth.uid`, or by an Administrator. Users cannot arbitrarily escalate their role (e.g. from `STUDENT` to `ADMIN`) on creation or self-update.
2. **Booking Ownership Invariant**: A booking document `/bookings/{bookingId}` must have `userId == request.auth.uid`. A student cannot book on behalf of another user ID.
3. **Approval Integrity Invariant**: Only authorized staff (`LAB_STAFF`, `COORDINATOR`, `ADMIN`) can transition a booking from `PENDING_APPROVAL` to `APPROVED` or `REJECTED`. Students can only cancel (`CANCELLED`) their own pending bookings.
4. **Equipment Stock Conservation Invariant**: Issue records in `/issues/{issueId}` can only be created and returned by staff or admin. Normal students cannot self-issue equipment or mark items returned.
5. **Notification Isolation Invariant**: Users can only read notifications where `resource.data.userId == request.auth.uid`.
6. **Maintenance & Audit Integrity Invariant**: Maintenance tasks and Audit logs can only be created by staff or system, and audit logs are append-only/immutable.
7. **Department & Lab Catalogs**: Labs, equipment, categories, and departments can only be modified by staff and administrators. Anyone authenticated can read them.
8. **Settings Guard**: System rules in `/settings/{settingId}` can only be updated by `COORDINATOR` or `ADMIN`.

## 2. The "Dirty Dozen" Attack Payloads

1. **Payload 1 (Privilege Escalation on User Creation)**: A new user registers and sends `role: "ADMIN"` in the document payload.
2. **Payload 2 (User Profile Shadow Injection)**: An authenticated user updates their profile injecting an unapproved field `__superAdmin: true`.
3. **Payload 3 (Booking Identity Spoofing)**: Attacker with UID `attacker123` attempts to create a booking with `userId: "victim456"`.
4. **Payload 4 (Booking Self-Approval)**: Student attacker attempts to create a booking already in `status: "APPROVED"` and `approvalStatus: "APPROVED"`.
5. **Payload 5 (Unapproved Status Skipping)**: Student modifies their existing pending booking directly to `status: "IN_USE"`.
6. **Payload 6 (Terminal State Tampering)**: User attempts to edit a booking that has already reached `status: "COMPLETED"`.
7. **Payload 7 (Inventory Poisoning)**: Student directly updates `/equipment/{equipmentId}` reducing `totalQuantity` from 20 to 0.
8. **Payload 8 (Unauthorized Equipment Return)**: Student creates an `/issues/{issueId}` record marking their own missing equipment as `returnCondition: "EXCELLENT"`.
9. **Payload 9 (PII Notification Snooping)**: User queries `/notifications` without filtering by their own `userId`.
10. **Payload 10 (Audit Log Truncation / Deletion)**: Staff attempts to delete `/auditLogs/{logId}` to hide an unauthorized approval.
11. **Payload 11 (Rule System Hijack)**: Student updates `/settings/global` to set `maxActiveBookingsPerUser: 9999`.
12. **Payload 12 (Oversized Payload / Denial of Wallet)**: Attacker sends a 500KB junk string in the `purpose` field of a booking.

## 3. Test Runner Specification (`firestore.rules.test.ts`)

The rules enforce that all 12 payloads trigger `PERMISSION_DENIED` under rules evaluation.
