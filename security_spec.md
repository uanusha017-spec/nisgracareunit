# Nisarga Care Hospital — Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Identity & Verification Gate**: Every write operation across all collections requires an authenticated user with a verified email (`request.auth != null && request.auth.token.email_verified == true`).
2. **RBAC Privilege Isolation**: Non-admin users can NEVER self-assign `role: "admin"` in `/users/{userId}` or create/modify records in `/admins/{userId}`. Only the bootstrapped admin (`uanusha017@gmail.com`) or an existing record in `/admins/{uid}` holds admin privileges.
3. **PII & Medical Record Isolation**: User profiles (`/users/{userId}`), appointments (`/appointments/{appointmentId}`), patient medical records (`/patients/{patientId}`), care logs (`/patients/{patientId}/careLogs/{logId}`), and family inquiries (`/inquiries/{inquiryId}`) are strictly readable only by the owning user or a verified hospital admin. Zero blanket `isSignedIn()` reads exist.
4. **Master Gate Relational Integrity**: A CareLog document under `/patients/{patientId}/careLogs/{logId}` cannot be created or accessed unless its parent `/patients/{patientId}` exists and `patientId` matches the path variable and `ownerUid` matches the parent patient record's `ownerUid`.
5. **Terminal State Locking**: Once an appointment reaches `status: "completed"` or `status: "cancelled"`, a non-admin patient cannot reopen or modify it.
6. **Temporal Integrity & Immutability**: `createdAt` and `updatedAt` must equal `request.time` on creation/update; `userId`, `ownerUid`, `patientId`, `mrn`, and `createdAt` are immutable after creation.
7. **Strict Schema Enforcement**: Every `create` checks both `hasAll(...)` and `hasOnly(...)` with strict string `.size()` limits, numeric bounds, enum checks, and `isValidId()` regex validation on document IDs.
8. **Blog Publishing Isolation**: Only verified Hospital Admins can create, edit, publish, unpublish, or delete `/blogs/{blogId}` documents; public readers can strictly read/list documents where `status == "published"`, and `coverImage` URLs must use safe `/src/assets/images/` or `https://` prefixes.

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Class | Target Path | Malicious Payload / Operation | Expected Result |
|---|-------------|-------------|-------------------------------|-----------------|
| 1 | **Self-Assigned Admin Escalation** | `/users/{uid}` (create) | `{ uid, displayName: "Eve", email: "eve@x.com", role: "admin", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }` | `PERMISSION_DENIED` |
| 2 | **Role Tampering on Update** | `/users/{uid}` (update) | `{ role: "admin", updatedAt: serverTimestamp() }` | `PERMISSION_DENIED` |
| 3 | **Shadow / Ghost Field Injection** | `/appointments/{id}` (create) | Valid appointment payload + `{ isApprovedByChief: true }` | `PERMISSION_DENIED` |
| 4 | **Identity Spoofing on Booking** | `/appointments/{id}` (create) | `{ userId: "victim-uid", ... }` signed in as `"attacker-uid"` | `PERMISSION_DENIED` |
| 5 | **Appointment Status Shortcutting** | `/appointments/{id}` (create) | Patient creates appointment with `{ status: "confirmed", adminNotes: "VIP" }` | `PERMISSION_DENIED` |
| 6 | **Terminal State Bypass** | `/appointments/{id}` (update) | Patient updates `status: "pending"` on an already `"completed"` appointment | `PERMISSION_DENIED` |
| 7 | **Cross-Patient PII Read** | `/patients/{patientId}` (get) | Authenticated User B reads Patient Record owned by User A | `PERMISSION_DENIED` |
| 8 | **Unauthorized EMR Mutation** | `/patients/{patientId}` (create/update) | Non-admin user tries to alter `medications` or `primaryDiagnosis` | `PERMISSION_DENIED` |
| 9 | **Orphaned CareLog Write** | `/patients/nonexistent/careLogs/{logId}` (create) | Admin or user writes a CareLog for a parent patient document that does not exist | `PERMISSION_DENIED` |
| 10 | **Resource / ID Poisoning** | `/appointments/bad$id..1500chars` (create) | Document ID containing invalid characters or exceeding 128 chars, or `notes` > 1000 chars | `PERMISSION_DENIED` |
| 11 | **Backdated Client Timestamp** | `/inquiries/{id}` (create) | `{ createdAt: new Date("2020-01-01"), ... }` instead of `serverTimestamp()` | `PERMISSION_DENIED` |
| 12 | **Unverified Email Admin Spoof** | `/patients/{patientId}` (get) | Token with `email: "uanusha017@gmail.com"` and `email_verified: false` | `PERMISSION_DENIED` |
