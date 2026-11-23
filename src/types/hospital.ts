import type { Timestamp } from 'firebase/firestore';

export type CareUnit =
  | "Dementia & Alzheimer's Care"
  | "Parkinson's & Stroke Rehab"
  | '24/7 Geriatric & Nursing Care'
  | 'Post-Operative & Bedridden Care'
  | 'Palliative & Respite Care'
  | 'Psychiatric Rehabilitation';

export type VisitType =
  | 'In-Person Consultation'
  | 'Campus Tour & Admission'
  | 'Physiotherapy Assessment'
  | 'Video Family Consultation';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type PatientStatus = 'active' | 'respite' | 'discharged';

export type Gender = 'Female' | 'Male' | 'Other';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export type CareLogType =
  | 'Vitals Check'
  | 'Doctor Round'
  | 'Physiotherapy'
  | 'Nutrition & Hygiene'
  | 'Medication';

export type InquiryStatus = 'open' | 'resolved';

export type BlogCategory =
  | 'Dementia & Memory Care'
  | 'Rehabilitation & Mobility'
  | 'Senior Living & Nutrition'
  | 'Mental Health & Wellness'
  | 'Hospital Updates';

export type BlogStatus = 'draft' | 'published';

/**
 * Verbatim schema limits synchronized with firebase-blueprint.json & firestore.rules.
 */
export const SCHEMA_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  MRN_PATTERN: /^[A-Z0-9-]+$/,
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  SLUG_PATTERN: /^[a-z0-9-]+$/,
  SAFE_COVER_URL_PATTERN: /^(\/src\/assets\/images\/|https:\/\/).+$/,
  DISPLAY_NAME_MAX: 120,
  EMAIL_MAX: 200,
  PHONE_MAX: 30,
  ROOM_MAX: 30,
  DIAGNOSIS_MAX: 300,
  ALLERGIES_MAX: 300,
  DIET_PLAN_MAX: 300,
  MEDICATIONS_MAX: 1000,
  NOTES_MAX: 1000,
  CARE_LOG_SUMMARY_MAX: 1200,
  BLOOD_PRESSURE_MAX: 20,
  TITLE_MAX: 100,
  BLOG_TITLE_MAX: 180,
  BLOG_SLUG_MAX: 140,
  BLOG_EXCERPT_MAX: 400,
  BLOG_CONTENT_MAX: 12000,
  BLOG_COVER_MAX: 400,
} as const;

export const BLOG_CATEGORIES: BlogCategory[] = [
  'Dementia & Memory Care',
  'Rehabilitation & Mobility',
  'Senior Living & Nutrition',
  'Mental Health & Wellness',
  'Hospital Updates',
];

export const CARE_UNITS: CareUnit[] = [
  "Dementia & Alzheimer's Care",
  "Parkinson's & Stroke Rehab",
  '24/7 Geriatric & Nursing Care',
  'Post-Operative & Bedridden Care',
  'Palliative & Respite Care',
  'Psychiatric Rehabilitation',
];

export const VISIT_TYPES: VisitType[] = [
  'In-Person Consultation',
  'Campus Tour & Admission',
  'Physiotherapy Assessment',
  'Video Family Consultation',
];

export const BLOOD_GROUPS: BloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'Unknown',
];

export const CARE_LOG_TYPES: CareLogType[] = [
  'Vitals Check',
  'Doctor Round',
  'Physiotherapy',
  'Nutrition & Hygiene',
  'Medication',
];

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  role: 'patient' | 'admin';
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface AdminRecord {
  uid: string;
  email: string;
  fullName: string;
  title: string;
  grantedBy: string;
  createdAt: Timestamp | null;
}

export interface Appointment {
  id: string;
  userId: string;
  patientName: string;
  patientAge: number;
  contactPhone: string;
  contactEmail: string;
  department: CareUnit;
  doctorName: string;
  visitType: VisitType;
  appointmentDate: string;
  timeSlot: string;
  notes: string;
  adminNotes: string;
  status: AppointmentStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface PatientRecord {
  id: string;
  mrn: string;
  ownerUid: string;
  fullName: string;
  age: number;
  gender: Gender;
  bloodGroup: BloodGroup;
  careUnit: CareUnit;
  roomNumber: string;
  attendingDoctor: string;
  primaryDiagnosis: string;
  allergies: string;
  medications: string;
  dietPlan: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  admissionDate: string;
  status: PatientStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface CareLog {
  id: string;
  patientId: string;
  ownerUid: string;
  logType: CareLogType;
  bloodPressure: string;
  pulseBpm: number;
  spo2Percent: number;
  bloodSugarMgDl: number;
  summary: string;
  recordedBy: string;
  createdAt: Timestamp | null;
}

export interface Inquiry {
  id: string;
  userId: string;
  senderName: string;
  phone: string;
  careInterest: string;
  message: string;
  status: InquiryStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: BlogCategory;
  excerpt: string;
  content: string;
  coverImage: string;
  authorName: string;
  authorUid: string;
  readTimeMinutes: number;
  status: BlogStatus;
  publishedAt: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function slugifyTitle(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SCHEMA_LIMITS.BLOG_SLUG_MAX);
  return cleaned.length >= 3 ? cleaned : `nisarga-post-${Date.now().toString().slice(-5)}`;
}
