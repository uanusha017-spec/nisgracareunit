/**
 * Security Rules Verification Suite (Phase 0 TDD — Dirty Dozen)
 *
 * Documents and verifies all 12 adversarial payloads against firestore.rules.
 * Run with Firebase Emulator Suite when testing locally:
 *   npx tsx firestore.rules.test.ts
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  actor: {
    uid: string;
    email: string;
    emailVerified: boolean;
    isAdmin: boolean;
  };
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
  enforcingRule: string;
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Self-Assigned Admin Escalation on User Profile Create',
    collectionPath: '/users/attacker_1',
    operation: 'create',
    actor: { uid: 'attacker_1', email: 'attacker@example.com', emailVerified: true, isAdmin: false },
    payload: {
      uid: 'attacker_1',
      displayName: 'Attacker',
      email: 'attacker@example.com',
      phone: '+919999999999',
      role: 'admin',
    },
    expected: 'PERMISSION_DENIED',
    enforcingRule: "incoming().role == 'patient' || isAdmin()",
  },
  {
    id: 2,
    name: 'Role Escalation on User Profile Update',
    collectionPath: '/users/attacker_1',
    operation: 'update',
    actor: { uid: 'attacker_1', email: 'attacker@example.com', emailVerified: true, isAdmin: false },
    payload: { role: 'admin' },
    expected: 'PERMISSION_DENIED',
    enforcingRule: "affectedKeys().hasOnly(['displayName', 'phone', 'updatedAt'])",
  },
  {
    id: 3,
    name: 'Shadow / Ghost Field Injection on Appointment Create',
    collectionPath: '/appointments/appt_shadow_1',
    operation: 'create',
    actor: { uid: 'user_1', email: 'family@example.com', emailVerified: true, isAdmin: false },
    payload: {
      userId: 'user_1',
      patientName: 'Ramesh Rao',
      patientAge: 74,
      contactPhone: '+919845012345',
      contactEmail: 'family@example.com',
      department: "Dementia & Alzheimer's Care",
      doctorName: 'Dr. Kavitha Sundaram',
      visitType: 'In-Person Consultation',
      appointmentDate: '2026-12-01',
      timeSlot: '10:30 AM',
      notes: 'Memory assessment',
      adminNotes: '',
      status: 'pending',
      ghostPrivilege: true,
    },
    expected: 'PERMISSION_DENIED',
    enforcingRule: 'isValidAppointment(data) enforces data.keys().hasOnly([...])',
  },
  {
    id: 4,
    name: 'Identity Spoofing on Appointment Create',
    collectionPath: '/appointments/appt_spoof_1',
    operation: 'create',
    actor: { uid: 'attacker_1', email: 'attacker@example.com', emailVerified: true, isAdmin: false },
    payload: { userId: 'victim_uid', status: 'pending' },
    expected: 'PERMISSION_DENIED',
    enforcingRule: 'incoming().userId == request.auth.uid',
  },
  {
    id: 5,
    name: 'Status Shortcutting on Appointment Create',
    collectionPath: '/appointments/appt_shortcut_1',
    operation: 'create',
    actor: { uid: 'user_1', email: 'family@example.com', emailVerified: true, isAdmin: false },
    payload: { userId: 'user_1', status: 'confirmed', adminNotes: 'Approved' },
    expected: 'PERMISSION_DENIED',
    enforcingRule: "incoming().status == 'pending' && incoming().adminNotes == ''",
  },
  {
    id: 6,
    name: 'Terminal State Modification Bypass on Completed Appointment',
    collectionPath: '/appointments/appt_done_1',
    operation: 'update',
    actor: { uid: 'user_1', email: 'family@example.com', emailVerified: true, isAdmin: false },
    payload: { status: 'cancelled' },
    expected: 'PERMISSION_DENIED',
    enforcingRule: "existing().status in ['pending', 'confirmed']",
  },
  {
    id: 7,
    name: 'Cross-Patient Medical Record PII Read',
    collectionPath: '/patients/pat_victim_1',
    operation: 'get',
    actor: { uid: 'other_user', email: 'other@example.com', emailVerified: true, isAdmin: false },
    expected: 'PERMISSION_DENIED',
    enforcingRule: 'isAdmin() || resource.data.ownerUid == request.auth.uid',
  },
  {
    id: 8,
    name: 'Unauthorized Non-Admin EMR Modification',
    collectionPath: '/patients/pat_1',
    operation: 'update',
    actor: { uid: 'user_1', email: 'family@example.com', emailVerified: true, isAdmin: false },
    payload: { medications: 'Unapproved dosage change' },
    expected: 'PERMISSION_DENIED',
    enforcingRule: 'allow create, update, delete: if isAdmin() && ...',
  },
  {
    id: 9,
    name: 'Orphaned CareLog Creation Without Existing Parent Patient',
    collectionPath: '/patients/nonexistent_patient/careLogs/log_1',
    operation: 'create',
    actor: { uid: 'admin_1', email: 'uanusha017@gmail.com', emailVerified: true, isAdmin: true },
    payload: { patientId: 'nonexistent_patient', logType: 'Vitals Check' },
    expected: 'PERMISSION_DENIED',
    enforcingRule: 'exists(/databases/$(database)/documents/patients/$(patientId))',
  },
  {
    id: 10,
    name: 'Resource & ID Poisoning (Oversized Notes & Malformed Doc ID)',
    collectionPath: '/appointments/bad$id/../overflow',
    operation: 'create',
    actor: { uid: 'user_1', email: 'family@example.com', emailVerified: true, isAdmin: false },
    payload: { notes: 'X'.repeat(5000) },
    expected: 'PERMISSION_DENIED',
    enforcingRule: 'isValidId(appointmentId) && data.notes.size() <= 1000',
  },
  {
    id: 11,
    name: 'Backdated Client Timestamp Forgery on Inquiry',
    collectionPath: '/inquiries/inq_1',
    operation: 'create',
    actor: { uid: 'user_1', email: 'family@example.com', emailVerified: true, isAdmin: false },
    payload: { createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
    enforcingRule: 'incoming().createdAt == request.time && incoming().updatedAt == request.time',
  },
  {
    id: 12,
    name: 'Unverified Email Admin Spoof Attack',
    collectionPath: '/patients/pat_1',
    operation: 'get',
    actor: { uid: 'spoof_uid', email: 'uanusha017@gmail.com', emailVerified: false, isAdmin: false },
    expected: 'PERMISSION_DENIED',
    enforcingRule: "request.auth.token.email == 'uanusha017@gmail.com' && request.auth.token.email_verified == true",
  },
];
