import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ClipboardList,
  Database,
  Edit3,
  FileText,
  Inbox,
  LayoutDashboard,
  LogIn,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APPOINTMENT_TIME_SLOTS, HOSPITAL_IMAGES, NISARGA_CONTACT, SPECIALISTS } from '../data/nisargaContent';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BLOOD_GROUPS,
  CARE_UNITS,
  sanitizeText,
  SCHEMA_LIMITS,
  type AdminRecord,
  type Appointment,
  type AppointmentStatus,
  type BlogPost,
  type BloodGroup,
  type CareUnit,
  type Gender,
  type Inquiry,
  type PatientRecord,
  type PatientStatus,
} from '../types/hospital';
import { AppointmentBookingCard } from './AppointmentBookingCard';
import { BlogManagerPanel } from './BlogManagerPanel';
import { PatientDetailModal } from './PatientDetailModal';

export type PortalTab =
  | 'overview'
  | 'appointments'
  | 'patients'
  | 'inquiries'
  | 'blogs'
  | 'staff'
  | 'book';

interface PortalWorkspaceProps {
  initialTab?: PortalTab;
  onBackToWebsite: () => void;
}

const STATUS_TEXT_STYLE: Record<string, string> = {
  pending: 'text-[#B45309] font-semibold',
  confirmed: 'text-[#15803D] font-semibold',
  completed: 'text-[#135D43] font-semibold',
  cancelled: 'text-[#B91C1C] font-semibold',
  active: 'text-[#15803D] font-semibold',
  respite: 'text-[#B45309] font-semibold',
  discharged: 'text-[#4A5D55] font-medium',
  open: 'text-[#B45309] font-semibold',
  resolved: 'text-[#15803D] font-semibold',
};

function generateMrn(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `NC-${new Date().getFullYear()}-${num}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PortalWorkspace({ initialTab, onBackToWebsite }: PortalWorkspaceProps) {
  const { user, profile, isAdmin, isBootstrapAdmin, authReady, authBusy, authError, signInWithGoogle, signOut } =
    useAuth();

  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab ?? 'appointments');

  // Firestore collections state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filters & search
  const [apptFilter, setApptFilter] = useState<'all' | AppointmentStatus>('all');
  const [apptSearch, setApptSearch] = useState('');
  const [patientFilter, setPatientFilter] = useState<'all' | PatientStatus>('all');
  const [patientSearch, setPatientSearch] = useState('');

  // Modals & action feedback
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [actionBanner, setActionBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Admin staff form
  const [staffUid, setStaffUid] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffTitle, setStaffTitle] = useState('Resident Physician');

  // Set default tab based on role when auth settles
  useEffect(() => {
    if (authReady && user) {
      if (initialTab && (isAdmin || (initialTab !== 'overview' && initialTab !== 'blogs' && initialTab !== 'staff'))) {
        setActiveTab(initialTab);
      } else {
        setActiveTab(isAdmin ? 'overview' : 'appointments');
      }
    }
  }, [authReady, user, isAdmin, initialTab]);

  // Attach real-time Firestore listeners only when authenticated and verified
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setAppointments([]);
      setPatients([]);
      setInquiries([]);
      setBlogs([]);
      setAdmins([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    const apptQuery = isBootstrapAdmin
      ? query(collection(db, 'appointments'))
      : query(collection(db, 'appointments'), where('userId', '==', user.uid));

    const unsubAppts = onSnapshot(
      apptQuery,
      (snap) => {
        const list: Appointment[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Appointment, 'id'>),
        }));
        list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setAppointments(list);
        setLoadingData(false);
      },
      (err) => {
        setLoadingData(false);
        try {
          handleFirestoreError(err, OperationType.LIST, 'appointments');
        } catch {
          setActionBanner({ kind: 'err', text: 'Could not load appointments.' });
        }
      },
    );

    const patientQuery = isBootstrapAdmin
      ? query(collection(db, 'patients'))
      : query(collection(db, 'patients'), where('ownerUid', '==', user.uid));

    const unsubPatients = onSnapshot(
      patientQuery,
      (snap) => {
        const list: PatientRecord[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PatientRecord, 'id'>),
        }));
        list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setPatients(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'patients');
        } catch {
          setActionBanner({ kind: 'err', text: 'Could not load patient records.' });
        }
      },
    );

    const inquiryQuery = isBootstrapAdmin
      ? query(collection(db, 'inquiries'))
      : query(collection(db, 'inquiries'), where('userId', '==', user.uid));

    const unsubInquiries = onSnapshot(
      inquiryQuery,
      (snap) => {
        const list: Inquiry[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Inquiry, 'id'>),
        }));
        list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setInquiries(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'inquiries');
        } catch {
          setActionBanner({ kind: 'err', text: 'Could not load family inquiries.' });
        }
      },
    );

    const blogsQuery = isBootstrapAdmin
      ? query(collection(db, 'blogs'))
      : query(collection(db, 'blogs'), where('status', '==', 'published'));

    const unsubBlogs = onSnapshot(
      blogsQuery,
      (snap) => {
        const list: BlogPost[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BlogPost, 'id'>),
        }));
        list.sort((a, b) => {
          const dateCmp = (b.publishedAt || '').localeCompare(a.publishedAt || '');
          if (dateCmp !== 0) return dateCmp;
          return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);
        });
        setBlogs(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'blogs');
        } catch {
          // Non-blocking
        }
      },
    );

    let unsubAdmins: (() => void) | null = null;
    if (isBootstrapAdmin) {
      unsubAdmins = onSnapshot(
        query(collection(db, 'admins')),
        (snap) => {
          const list: AdminRecord[] = snap.docs.map((d) => d.data() as AdminRecord);
          setAdmins(list);
        },
        (err) => {
          try {
            handleFirestoreError(err, OperationType.LIST, 'admins');
          } catch {
            // Non-blocking
          }
        },
      );
    }

    return () => {
      unsubAppts();
      unsubPatients();
      unsubInquiries();
      unsubBlogs();
      if (unsubAdmins) unsubAdmins();
    };
  }, [authReady, user, isBootstrapAdmin]);

  // Filtered views
  const filteredAppointments = useMemo(() => {
    const q = apptSearch.trim().toLowerCase();
    return appointments.filter((a) => {
      const matchesStatus = apptFilter === 'all' || a.status === apptFilter;
      const matchesQuery =
        !q ||
        a.patientName.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.contactPhone.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [appointments, apptFilter, apptSearch]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesStatus = patientFilter === 'all' || p.status === patientFilter;
      const matchesQuery =
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.roomNumber.toLowerCase().includes(q) ||
        p.careUnit.toLowerCase().includes(q) ||
        p.primaryDiagnosis.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [patients, patientFilter, patientSearch]);

  // KPI metrics
  const kpis = useMemo(() => {
    const activeResidents = patients.filter((p) => p.status !== 'discharged').length;
    const pendingAppts = appointments.filter((a) => a.status === 'pending').length;
    const confirmedAppts = appointments.filter((a) => a.status === 'confirmed').length;
    const openInquiries = inquiries.filter((i) => i.status === 'open').length;
    return { activeResidents, pendingAppts, confirmedAppts, openInquiries };
  }, [patients, appointments, inquiries]);

  const careUnitCensus = useMemo(() => {
    return CARE_UNITS.map((unit) => ({
      unit,
      count: patients.filter((p) => p.careUnit === unit && p.status !== 'discharged').length,
    }));
  }, [patients]);

  // Handlers
  const handleQuickAppointmentStatus = async (appt: Appointment, nextStatus: AppointmentStatus) => {
    setActionBanner(null);
    const path = `appointments/${appt.id}`;
    try {
      await updateDoc(doc(db, 'appointments', appt.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      setActionBanner({
        kind: 'ok',
        text: `Appointment for ${appt.patientName} marked as ${nextStatus}.`,
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch {
        setActionBanner({ kind: 'err', text: 'Could not update appointment status.' });
      }
    }
  };

  const handleToggleInquiryStatus = async (inq: Inquiry) => {
    setActionBanner(null);
    const nextStatus = inq.status === 'open' ? 'resolved' : 'open';
    const path = `inquiries/${inq.id}`;
    try {
      await updateDoc(doc(db, 'inquiries', inq.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      setActionBanner({ kind: 'ok', text: `Inquiry from ${inq.senderName} marked ${nextStatus}.` });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch {
        setActionBanner({ kind: 'err', text: 'Unable to update inquiry status.' });
      }
    }
  };

  const handleDeletePatient = async (patient: PatientRecord) => {
    setActionBanner(null);
    const path = `patients/${patient.id}`;
    try {
      await deleteDoc(doc(db, 'patients', patient.id));
      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(null);
      }
      setActionBanner({ kind: 'ok', text: `Removed patient record ${patient.mrn}.` });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch {
        setActionBanner({ kind: 'err', text: 'Unable to delete patient record.' });
      }
    }
  };

  const handleSeedDemoHospitalData = async () => {
    if (!user || !isAdmin || seeding) return;
    setSeeding(true);
    setActionBanner(null);

    try {
      const samplePatients = [
        {
          mrn: 'NC-2026-1041',
          ownerUid: user.uid,
          fullName: 'Venkatesh Rao',
          age: 78,
          gender: 'Male' as Gender,
          bloodGroup: 'O+' as BloodGroup,
          careUnit: "Dementia & Alzheimer's Care" as CareUnit,
          roomNumber: 'Garden Suite 104',
          attendingDoctor: 'Dr. Kavitha Sundaram',
          primaryDiagnosis: 'Moderate Alzheimer’s Dementia · Well-controlled Hypertension',
          allergies: 'Penicillin',
          medications: 'Donepezil 5mg HS, Amlodipine 5mg OD, Vitamin B12',
          dietPlan: 'Low-sodium soft South Indian meals · Assisted evening hydration',
          emergencyContactName: 'Ananya Deshpande (Daughter)',
          emergencyContactPhone: '+91 98450 22190',
          admissionDate: '2026-09-14',
          status: 'active' as PatientStatus,
        },
        {
          mrn: 'NC-2026-1088',
          ownerUid: user.uid,
          fullName: 'Lakshmi Narayanan',
          age: 73,
          gender: 'Female' as Gender,
          bloodGroup: 'B+' as BloodGroup,
          careUnit: "Parkinson's & Stroke Rehab" as CareUnit,
          roomNumber: 'Veranda Wing 202',
          attendingDoctor: 'Dr. Arjun Deshmukh',
          primaryDiagnosis: 'Post-Ischemic Left Hemiparesis · Intensive Neuro-Physiotherapy',
          allergies: 'None reported',
          medications: 'Clopidogrel 75mg OD, Atorvastatin 20mg HS, Metformin 500mg BD',
          dietPlan: 'Diabetic high-protein vegetarian diet · No added sugar',
          emergencyContactName: 'Suresh Narayanan (Son)',
          emergencyContactPhone: '+91 98451 64012',
          admissionDate: '2026-10-03',
          status: 'active' as PatientStatus,
        },
        {
          mrn: 'NC-2026-1112',
          ownerUid: user.uid,
          fullName: 'Sharada Kulkarni',
          age: 81,
          gender: 'Female' as Gender,
          bloodGroup: 'A+' as BloodGroup,
          careUnit: 'Post-Operative & Bedridden Care' as CareUnit,
          roomNumber: 'Nursing Wing 109',
          attendingDoctor: 'Dr. Meenakshi Iyer',
          primaryDiagnosis: 'Post Right Hip Bipolar Hemiarthroplasty · Mobility Recovery',
          allergies: 'Sulfa drugs',
          medications: 'Enoxaparin prophylaxis, Calcium + D3, Paracetamol SOS',
          dietPlan: 'Calcium-rich soft home-cooked meals · Morning ragi malt',
          emergencyContactName: 'Vikramaditya Rao (Son)',
          emergencyContactPhone: '+91 97400 88123',
          admissionDate: '2026-11-10',
          status: 'respite' as PatientStatus,
        },
      ];

      for (const rec of samplePatients) {
        const ref = await addDoc(collection(db, 'patients'), {
          ...rec,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, 'patients', ref.id, 'careLogs'), {
          patientId: ref.id,
          ownerUid: rec.ownerUid,
          logType: 'Vitals Check',
          bloodPressure: '124/78',
          pulseBpm: 74,
          spo2Percent: 98,
          bloodSugarMgDl: 114,
          summary:
            'Morning vitals stable. Enjoyed breakfast and 20-minute assisted garden veranda walk. Medications administered on schedule.',
          recordedBy: 'Sr. Nurse Deepa M.',
          createdAt: serverTimestamp(),
        });
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        patientName: 'Subramanya Bhat',
        patientAge: 76,
        contactPhone: '+91 98801 44512',
        contactEmail: user.email || 'family@nisargacare.com',
        department: "Parkinson's & Stroke Rehab",
        doctorName: 'Dr. Arjun Deshmukh',
        visitType: 'Campus Tour & Admission',
        appointmentDate: tomorrowStr,
        timeSlot: '10:45 AM',
        notes: 'Family visiting Horamavu campus to assess stroke rehab suite and physiotherapy plan.',
        adminNotes: '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setActionBanner({
        kind: 'ok',
        text: 'Loaded 3 sample Nisarga Care resident charts with vitals logs and 1 pending appointment.',
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'patients');
      } catch {
        setActionBanner({ kind: 'err', text: 'Could not load sample clinical data.' });
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    const cleanUid = staffUid.trim();
    if (!SCHEMA_LIMITS.ID_PATTERN.test(cleanUid)) {
      setActionBanner({ kind: 'err', text: 'Enter a valid alphanumeric Firebase User UID.' });
      return;
    }

    const path = `admins/${cleanUid}`;
    try {
      await setDoc(doc(db, 'admins', cleanUid), {
        uid: cleanUid,
        email: sanitizeText(staffEmail, SCHEMA_LIMITS.EMAIL_MAX),
        fullName: sanitizeText(staffName, SCHEMA_LIMITS.DISPLAY_NAME_MAX),
        title: sanitizeText(staffTitle, SCHEMA_LIMITS.TITLE_MAX),
        grantedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setStaffUid('');
      setStaffName('');
      setStaffEmail('');
      setActionBanner({ kind: 'ok', text: `Admin dashboard access granted to ${staffName}.` });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch {
        setActionBanner({ kind: 'err', text: 'Could not grant admin access.' });
      }
    }
  };

  const handleRevokeAdmin = async (targetUid: string) => {
    const path = `admins/${targetUid}`;
    try {
      await deleteDoc(doc(db, 'admins', targetUid));
      setActionBanner({ kind: 'ok', text: 'Staff admin access revoked.' });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch {
        setActionBanner({ kind: 'err', text: 'Unable to revoke admin access.' });
      }
    }
  };

  // Sign-in gate
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="text-sm text-[#4A5D55]">Connecting to Nisarga Care Hospital Portal...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
        <header className="bg-white border-b border-[#E2E7E2] px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToWebsite}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4A5D55] hover:text-[#14221D] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Nisarga Care Website
          </button>
          <img
            src={HOSPITAL_IMAGES.logoTheme}
            alt="Nisarga Care"
            referrerPolicy="no-referrer"
            className="h-8 w-auto object-contain"
          />
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E2E7E2] rounded-2xl p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#135D43]">Hospital Portal & Clinical Console</p>
              <h1 className="font-display text-2xl font-semibold text-[#14221D]">
                Sign in to Nisarga Care
              </h1>
              <p className="text-sm text-[#4A5D55] leading-relaxed">
                Access appointment scheduling, linked resident care logs and vitals, or authorized
                hospital administrative dashboards.
              </p>
            </div>

            {authError && (
              <div
                role="alert"
                className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs rounded-lg"
              >
                {authError}
              </div>
            )}

            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={authBusy}
              className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {authBusy ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="pt-4 border-t border-[#EDF1EE] space-y-1.5 text-xs text-[#4A5D55]">
              <p>Protected role-based access: patient families see only their own records.</p>
              <p>
                24/7 Care Helpline:{' '}
                <a
                  href={`tel:${NISARGA_CONTACT.phoneRaw}`}
                  className="font-mono tabular-nums text-[#135D43] font-medium"
                >
                  {NISARGA_CONTACT.phoneDisplay}
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const navItems: { id: PortalTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    ...(isAdmin
      ? [{ id: 'overview' as PortalTab, label: 'Clinical Overview', icon: <LayoutDashboard className="w-4 h-4" /> }]
      : []),
    {
      id: 'appointments',
      label: isAdmin ? 'Appointments Queue' : 'My Appointments',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'patients',
      label: isAdmin ? 'Patient Records (EMR)' : 'Linked Care Summary',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: 'inquiries',
      label: isAdmin ? 'Family Inquiries' : 'My Inquiries',
      icon: <Inbox className="w-4 h-4" />,
    },
    ...(isAdmin
      ? [{ id: 'blogs' as PortalTab, label: 'Blogs & Articles', icon: <BookOpen className="w-4 h-4" /> }]
      : []),
    ...(isBootstrapAdmin
      ? [{ id: 'staff' as PortalTab, label: 'Staff Access (RBAC)', icon: <ShieldCheck className="w-4 h-4" /> }]
      : []),
    {
      id: 'book',
      label: 'New Appointment',
      icon: <Plus className="w-4 h-4" />,
    },
  ];

  const activeNavLabel = navItems.find((n) => n.id === activeTab)?.label ?? 'Portal';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#14221D] flex flex-col lg:flex-row">
      {/* Sidebar (260px desktop) */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#E2E7E2] flex flex-col shrink-0">
        <div className="h-16 px-5 border-b border-[#E2E7E2] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBackToWebsite}
            aria-label="Return to Nisarga Care website"
            className="inline-flex items-center hover:opacity-85 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            <img
              src={HOSPITAL_IMAGES.logoTheme}
              alt="Nisarga Care"
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain"
            />
          </button>
          <span className="text-xs font-medium text-[#135D43] whitespace-nowrap">
            {isAdmin ? 'Admin' : 'Family'}
          </span>
        </div>

        <nav aria-label="Hospital portal navigation" className="p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible flex-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setActionBanner(null);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#EAF2ED] text-[#135D43]'
                    : 'text-[#4A5D55] hover:bg-[#F4F7F5] hover:text-[#14221D]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E2E7E2] space-y-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#14221D] truncate">
              {profile?.displayName || user.displayName || 'Hospital Member'}
            </div>
            <div className="text-xs text-[#4A5D55] truncate">{user.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToWebsite}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#14221D] border border-[#D4DDD6] rounded-lg hover:bg-[#F1F4F1] transition-colors whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Website
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A5D55] border border-[#D4DDD6] rounded-lg hover:bg-[#FEF2F2] hover:text-[#B91C1C] hover:border-[#FECACA] transition-colors whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Breadcrumb Bar */}
        <header className="h-16 bg-white border-b border-[#E2E7E2] px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-[#4A5D55] hidden sm:inline">Nisarga Care Portal</span>
            <span aria-hidden="true" className="text-[#94A39B] hidden sm:inline">/</span>
            <h1 className="font-semibold text-[#14221D] truncate">{activeNavLabel}</h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingPatient(null);
                  setShowPatientForm(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Admit Patient
              </button>
            )}
            {!isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Book Appointment
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
          {actionBanner && (
            <div
              role="status"
              className={`px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-4 border ${
                actionBanner.kind === 'ok'
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]'
                  : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
              }`}
            >
              <span>{actionBanner.text}</span>
              <button
                type="button"
                onClick={() => setActionBanner(null)}
                aria-label="Dismiss notification"
                className="p-1 hover:opacity-75 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* OVERVIEW TAB (Admin) */}
          {activeTab === 'overview' && isAdmin && (
            <div className="space-y-6">
              {/* 4-column tabular KPI strip */}
              <div className="bg-white border border-[#E2E7E2] rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E7E2]">
                <div className="p-5">
                  <div className="text-xs text-[#4A5D55]">Active & Respite Residents</div>
                  <div className="font-mono tabular-nums text-3xl font-semibold text-[#14221D] mt-1">
                    {kpis.activeResidents}
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs text-[#4A5D55]">Pending Appointments</div>
                  <div className="font-mono tabular-nums text-3xl font-semibold text-[#B45309] mt-1">
                    {kpis.pendingAppts}
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs text-[#4A5D55]">Confirmed Visits</div>
                  <div className="font-mono tabular-nums text-3xl font-semibold text-[#15803D] mt-1">
                    {kpis.confirmedAppts}
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs text-[#4A5D55]">Open Family Inquiries</div>
                  <div className="font-mono tabular-nums text-3xl font-semibold text-[#135D43] mt-1">
                    {kpis.openInquiries}
                  </div>
                </div>
              </div>

              {patients.length === 0 && !loadingData && (
                <div className="bg-white border border-[#D4DDD6] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-lg font-semibold text-[#14221D]">
                      Hospital database is ready
                    </h2>
                    <p className="text-sm text-[#4A5D55]">
                      Admit your first resident manually or populate sample Nisarga Care resident
                      records and vitals logs to explore the clinical workflows immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSeedDemoHospitalData()}
                    disabled={seeding}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Database className="w-4 h-4" />
                    {seeding ? 'Populating Records...' : 'Load Sample Clinical Records'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Care Unit Census */}
                <section className="lg:col-span-5 bg-white border border-[#E2E7E2] rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-[#14221D]">
                      Care Unit Census
                    </h2>
                    <span className="text-xs text-[#4A5D55]">Horamavu Campus</span>
                  </div>
                  <div className="divide-y divide-[#EDF1EE]">
                    {careUnitCensus.map((item) => (
                      <div key={item.unit} className="py-3 flex items-center justify-between gap-4 text-sm">
                        <span className="text-[#2A3F36] truncate">{item.unit}</span>
                        <span className="font-mono tabular-nums font-semibold text-[#14221D] shrink-0">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Pending Appointments Queue */}
                <section className="lg:col-span-7 bg-white border border-[#E2E7E2] rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-[#14221D]">
                      Upcoming Appointments
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('appointments')}
                      className="text-xs font-semibold text-[#135D43] hover:underline cursor-pointer"
                    >
                      Manage All →
                    </button>
                  </div>

                  {appointments.length === 0 ? (
                    <p className="text-sm text-[#4A5D55] py-6 text-center">
                      No appointments scheduled yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#EDF1EE]">
                      {appointments.slice(0, 5).map((appt) => (
                        <div
                          key={appt.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#14221D]">
                              <span className="truncate">{appt.patientName}</span>
                              <span aria-hidden="true" className="text-[#94A39B]">·</span>
                              <span className={`text-xs capitalize ${STATUS_TEXT_STYLE[appt.status]}`}>
                                {appt.status}
                              </span>
                            </div>
                            <div className="text-xs text-[#4A5D55] mt-0.5">
                              {appt.department} ·{' '}
                              <span className="font-mono tabular-nums">
                                {appt.appointmentDate} {appt.timeSlot}
                              </span>
                            </div>
                          </div>

                          {appt.status === 'pending' && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => void handleQuickAppointmentStatus(appt, 'confirmed')}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingAppt(appt)}
                                className="px-3 py-1.5 text-xs font-medium text-[#14221D] border border-[#D4DDD6] rounded-lg hover:bg-[#F1F4F1] cursor-pointer"
                              >
                                Details
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <section className="bg-white border border-[#E2E7E2] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#E2E7E2] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-[#4A5D55] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={apptSearch}
                    onChange={(e) => setApptSearch(e.target.value)}
                    placeholder="Search patient, care unit, doctor..."
                    aria-label="Search appointments"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#F1F4F1] rounded-lg overflow-x-auto">
                  {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setApptFilter(st)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        apptFilter === st
                          ? 'bg-white text-[#14221D] shadow-sm'
                          : 'text-[#4A5D55] hover:text-[#14221D]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {loadingData ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-12 bg-[#F4F7F5] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <p className="text-sm font-medium text-[#14221D]">No matching appointments found</p>
                  <p className="text-xs text-[#4A5D55]">
                    Schedule a consultation, campus tour, or admission assessment to see it tracked here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('book')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Schedule First Appointment
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E7E2] bg-[#FAF9F6] text-xs font-medium text-[#4A5D55]">
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Care Unit & Visit</th>
                        <th className="py-3 px-4">Specialist</th>
                        <th className="py-3 px-4">Schedule</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF1EE] text-sm">
                      {filteredAppointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-[#FAF9F6]/70">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#14221D]">{appt.patientName}</div>
                            <div className="text-xs font-mono tabular-nums text-[#4A5D55]">
                              {appt.patientAge} yrs · {appt.contactPhone}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[#14221D]">{appt.department}</div>
                            <div className="text-xs text-[#4A5D55]">{appt.visitType}</div>
                          </td>
                          <td className="py-3.5 px-4 text-[#2A3F36]">{appt.doctorName}</td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-[#14221D] whitespace-nowrap">
                            <div>{appt.appointmentDate}</div>
                            <div className="text-[#4A5D55]">{appt.timeSlot}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs capitalize whitespace-nowrap">
                            <span className={STATUS_TEXT_STYLE[appt.status]}>{appt.status}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              {isAdmin ? (
                                <>
                                  {appt.status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => void handleQuickAppointmentStatus(appt, 'confirmed')}
                                      className="px-2.5 py-1 text-xs font-semibold text-[#15803D] hover:bg-[#F0FDF4] rounded-md cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                  )}
                                  {appt.status === 'confirmed' && (
                                    <button
                                      type="button"
                                      onClick={() => void handleQuickAppointmentStatus(appt, 'completed')}
                                      className="px-2.5 py-1 text-xs font-semibold text-[#135D43] hover:bg-[#EAF2ED] rounded-md cursor-pointer"
                                    >
                                      Complete
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setEditingAppt(appt)}
                                    className="px-2.5 py-1 text-xs font-medium text-[#14221D] border border-[#D4DDD6] rounded-md hover:bg-[#F1F4F1] cursor-pointer"
                                  >
                                    Manage
                                  </button>
                                </>
                              ) : (
                                (appt.status === 'pending' || appt.status === 'confirmed') && (
                                  <button
                                    type="button"
                                    onClick={() => void handleQuickAppointmentStatus(appt, 'cancelled')}
                                    className="px-2.5 py-1 text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] rounded-md cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* PATIENT RECORDS (EMR) TAB */}
          {activeTab === 'patients' && (
            <section className="bg-white border border-[#E2E7E2] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#E2E7E2] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-[#4A5D55] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search MRN, resident name, room..."
                    aria-label="Search patient records"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#F1F4F1] rounded-lg">
                  {(['all', 'active', 'respite', 'discharged'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPatientFilter(st)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        patientFilter === st
                          ? 'bg-white text-[#14221D] shadow-sm'
                          : 'text-[#4A5D55] hover:text-[#14221D]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {loadingData ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-12 bg-[#F4F7F5] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <p className="text-sm font-medium text-[#14221D]">
                    {isAdmin
                      ? 'No resident medical records found'
                      : 'No resident record is currently linked to your account'}
                  </p>
                  <p className="text-xs text-[#4A5D55] max-w-md mx-auto">
                    {isAdmin
                      ? 'Register a new inpatient/resident record to manage rooms, medications, diet plans, and daily nursing vitals.'
                      : 'Once your loved one is admitted at Nisarga Care, our admissions desk links their chart to your Google account so you can review daily vitals and doctor rounds.'}
                  </p>
                  {isAdmin && (
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPatient(null);
                          setShowPatientForm(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Admit Patient
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSeedDemoHospitalData()}
                        disabled={seeding}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#14221D] border border-[#D4DDD6] rounded-lg hover:bg-[#F1F4F1] cursor-pointer"
                      >
                        Load Sample Records
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E7E2] bg-[#FAF9F6] text-xs font-medium text-[#4A5D55]">
                        <th className="py-3 px-4">MRN & Resident</th>
                        <th className="py-3 px-4">Care Unit & Room</th>
                        <th className="py-3 px-4">Attending Doctor</th>
                        <th className="py-3 px-4">Diagnosis</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF1EE] text-sm">
                      {filteredPatients.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAF9F6]/70">
                          <td className="py-3.5 px-4">
                            <div className="font-mono tabular-nums text-xs text-[#135D43] font-semibold">
                              {p.mrn}
                            </div>
                            <div className="font-semibold text-[#14221D]">{p.fullName}</div>
                            <div className="text-xs text-[#4A5D55]">
                              <span className="font-mono tabular-nums">{p.age}</span> yrs · {p.gender} ·{' '}
                              {p.bloodGroup}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[#14221D]">{p.careUnit}</div>
                            <div className="text-xs font-mono tabular-nums text-[#4A5D55]">
                              {p.roomNumber}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#2A3F36]">{p.attendingDoctor}</td>
                          <td className="py-3.5 px-4 text-xs text-[#4A5D55] max-w-xs truncate">
                            {p.primaryDiagnosis}
                          </td>
                          <td className="py-3.5 px-4 text-xs capitalize whitespace-nowrap">
                            <span className={STATUS_TEXT_STYLE[p.status]}>{p.status}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedPatient(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#135D43] bg-[#EAF2ED] hover:bg-[#135D43] hover:text-white rounded-md transition-colors cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Chart & Vitals
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPatient(p);
                                      setShowPatientForm(true);
                                    }}
                                    aria-label={`Edit ${p.fullName}`}
                                    className="p-1.5 text-[#4A5D55] hover:text-[#14221D] hover:bg-[#F1F4F1] rounded-md cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeletePatient(p)}
                                    aria-label={`Delete ${p.fullName}`}
                                    className="p-1.5 text-[#4A5D55] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-md cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* INQUIRIES TAB */}
          {activeTab === 'inquiries' && (
            <section className="bg-white border border-[#E2E7E2] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#E2E7E2] flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-[#14221D]">
                  {isAdmin ? 'Family Admission Inquiries' : 'My Submitted Callback Requests'}
                </h2>
                <span className="font-mono tabular-nums text-xs text-[#4A5D55]">
                  {inquiries.length} total
                </span>
              </div>

              {inquiries.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#4A5D55]">
                  No family callback inquiries recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-[#EDF1EE]">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-[#14221D]">{inq.senderName}</span>
                          <span aria-hidden="true" className="text-[#94A39B]">·</span>
                          <span className="font-mono tabular-nums text-xs text-[#4A5D55]">
                            {inq.phone}
                          </span>
                          <span aria-hidden="true" className="text-[#94A39B]">·</span>
                          <span className={`text-xs capitalize ${STATUS_TEXT_STYLE[inq.status]}`}>
                            {inq.status}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-[#135D43]">{inq.careInterest}</div>
                        <p className="text-sm text-[#2A3F36] leading-relaxed">{inq.message}</p>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => void handleToggleInquiryStatus(inq)}
                          className="px-3.5 py-2 text-xs font-medium text-[#14221D] border border-[#D4DDD6] rounded-lg hover:bg-[#F1F4F1] whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {inq.status === 'open' ? 'Mark Resolved' : 'Reopen'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* BLOGS CRUD TAB (Admin) */}
          {activeTab === 'blogs' && isAdmin && (
            <BlogManagerPanel
              blogs={blogs}
              loading={loadingData}
              authorUid={user.uid}
              defaultAuthorName={profile?.displayName || user.displayName || 'Nisarga Care Clinical Team'}
              onNotify={(banner) => setActionBanner(banner)}
            />
          )}

          {/* STAFF RBAC TAB (Bootstrap Admin) */}
          {activeTab === 'staff' && isBootstrapAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-5 bg-white border border-[#E2E7E2] rounded-xl p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-semibold text-[#14221D]">
                    Authorize Clinical Staff
                  </h2>
                  <p className="text-xs text-[#4A5D55]">
                    Grant verified staff members role-based access to patient records and clinical
                    vitals logging by their Firebase UID.
                  </p>
                </div>

                <form onSubmit={handleGrantAdmin} className="space-y-3.5">
                  <div>
                    <label htmlFor="staff-uid" className="block text-xs font-medium text-[#4A5D55] mb-1">
                      Staff Firebase User UID
                    </label>
                    <input
                      id="staff-uid"
                      type="text"
                      required
                      value={staffUid}
                      onChange={(e) => setStaffUid(e.target.value)}
                      placeholder="Alphanumeric UID"
                      className="w-full px-3 py-2 text-sm font-mono bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                    />
                  </div>
                  <div>
                    <label htmlFor="staff-name" className="block text-xs font-medium text-[#4A5D55] mb-1">
                      Clinician / Admin Full Name
                    </label>
                    <input
                      id="staff-name"
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Dr. Raghavendra Kulkarni"
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                    />
                  </div>
                  <div>
                    <label htmlFor="staff-email" className="block text-xs font-medium text-[#4A5D55] mb-1">
                      Verified Google Email
                    </label>
                    <input
                      id="staff-email"
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="doctor@nisargacare.com"
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                    />
                  </div>
                  <div>
                    <label htmlFor="staff-title" className="block text-xs font-medium text-[#4A5D55] mb-1">
                      Clinical Role / Title
                    </label>
                    <input
                      id="staff-title"
                      type="text"
                      required
                      value={staffTitle}
                      onChange={(e) => setStaffTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] cursor-pointer"
                  >
                    Grant Staff Access
                  </button>
                </form>
              </section>

              <section className="lg:col-span-7 bg-white border border-[#E2E7E2] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#135D43]" />
                    <h2 className="font-display text-lg font-semibold text-[#14221D]">
                      Authorized Administrators
                    </h2>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-[#4A5D55]">
                    Your UID: {user.uid.slice(0, 10)}…
                  </span>
                </div>

                <div className="p-4 bg-[#FAF9F6] border border-[#E8EDE9] rounded-lg text-xs text-[#2A3F36]">
                  Primary Hospital Administrator:{' '}
                  <span className="font-mono font-semibold">{user.email}</span> (Bootstrapped)
                </div>

                {admins.length === 0 ? (
                  <p className="text-sm text-[#4A5D55] py-4">
                    No additional staff admin records added yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[#EDF1EE]">
                    {admins.map((adm) => (
                      <div key={adm.uid} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#14221D] truncate">
                            {adm.fullName}
                          </div>
                          <div className="text-xs text-[#4A5D55] truncate">
                            {adm.title} · {adm.email}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRevokeAdmin(adm.uid)}
                          className="px-3 py-1.5 text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] rounded-md cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* BOOK NEW APPOINTMENT TAB */}
          {activeTab === 'book' && (
            <div className="max-w-3xl">
              <AppointmentBookingCard
                onSuccessNavigatePortal={() => setActiveTab('appointments')}
              />
            </div>
          )}
        </main>
      </div>

      {/* Patient Chart & Care Logs Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          isAdmin={isAdmin}
          isBootstrapAdmin={isBootstrapAdmin}
          currentUserUid={user.uid}
          currentUserName={profile?.displayName || user.displayName || 'Nisarga Clinician'}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {/* Admit / Edit Patient Record Modal (Admin) */}
      {showPatientForm && isAdmin && (
        <PatientRecordFormModal
          initialRecord={editingPatient}
          defaultOwnerUid={user.uid}
          onClose={() => {
            setShowPatientForm(false);
            setEditingPatient(null);
          }}
          onSaved={(msg) => {
            setShowPatientForm(false);
            setEditingPatient(null);
            setActionBanner({ kind: 'ok', text: msg });
          }}
        />
      )}

      {/* Admin Manage Appointment Modal */}
      {editingAppt && isAdmin && (
        <AdminAppointmentModal
          appointment={editingAppt}
          onClose={() => setEditingAppt(null)}
          onSaved={(msg) => {
            setEditingAppt(null);
            setActionBanner({ kind: 'ok', text: msg });
          }}
        />
      )}
    </div>
  );
}

/* ============================================================================
 * Patient Record Admission / Edit Modal
 * ========================================================================== */
function PatientRecordFormModal({
  initialRecord,
  defaultOwnerUid,
  onClose,
  onSaved,
}: {
  initialRecord: PatientRecord | null;
  defaultOwnerUid: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [mrn, setMrn] = useState(initialRecord?.mrn ?? generateMrn());
  const [ownerUid, setOwnerUid] = useState(initialRecord?.ownerUid ?? defaultOwnerUid);
  const [fullName, setFullName] = useState(initialRecord?.fullName ?? '');
  const [age, setAge] = useState(String(initialRecord?.age ?? 74));
  const [gender, setGender] = useState<Gender>(initialRecord?.gender ?? 'Female');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(initialRecord?.bloodGroup ?? 'O+');
  const [careUnit, setCareUnit] = useState<CareUnit>(
    initialRecord?.careUnit ?? "Dementia & Alzheimer's Care",
  );
  const [roomNumber, setRoomNumber] = useState(initialRecord?.roomNumber ?? 'Garden Suite 102');
  const [attendingDoctor, setAttendingDoctor] = useState(
    initialRecord?.attendingDoctor ?? SPECIALISTS[0].name,
  );
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(initialRecord?.primaryDiagnosis ?? '');
  const [allergies, setAllergies] = useState(initialRecord?.allergies ?? 'None reported');
  const [medications, setMedications] = useState(initialRecord?.medications ?? '');
  const [dietPlan, setDietPlan] = useState(
    initialRecord?.dietPlan ?? 'Balanced home-cooked senior vegetarian meals',
  );
  const [emergencyContactName, setEmergencyContactName] = useState(
    initialRecord?.emergencyContactName ?? '',
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    initialRecord?.emergencyContactPhone ?? '',
  );
  const [admissionDate, setAdmissionDate] = useState(initialRecord?.admissionDate ?? todayIso());
  const [status, setStatus] = useState<PatientStatus>(initialRecord?.status ?? 'active');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanMrn = mrn.trim().toUpperCase().slice(0, 32);
    const cleanOwnerUid = ownerUid.trim();
    const parsedAge = Number(age);

    if (!SCHEMA_LIMITS.MRN_PATTERN.test(cleanMrn) || cleanMrn.length < 4) {
      setErrorMsg('MRN must be 4–32 uppercase letters, numbers, or hyphens (e.g., NC-2026-1024).');
      return;
    }
    if (!SCHEMA_LIMITS.ID_PATTERN.test(cleanOwnerUid)) {
      setErrorMsg('Linked Family UID must be alphanumeric (use your own UID if unassigned).');
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 125) {
      setErrorMsg('Please enter a valid age between 1 and 125.');
      return;
    }

    setSaving(true);
    const payload = {
      ownerUid: cleanOwnerUid,
      fullName: sanitizeText(fullName, SCHEMA_LIMITS.DISPLAY_NAME_MAX),
      age: parsedAge,
      gender,
      bloodGroup,
      careUnit,
      roomNumber: sanitizeText(roomNumber, SCHEMA_LIMITS.ROOM_MAX),
      attendingDoctor: sanitizeText(attendingDoctor, SCHEMA_LIMITS.DISPLAY_NAME_MAX),
      primaryDiagnosis: sanitizeText(primaryDiagnosis, SCHEMA_LIMITS.DIAGNOSIS_MAX),
      allergies: sanitizeText(allergies, SCHEMA_LIMITS.ALLERGIES_MAX),
      medications: sanitizeText(medications, SCHEMA_LIMITS.MEDICATIONS_MAX),
      dietPlan: sanitizeText(dietPlan, SCHEMA_LIMITS.DIET_PLAN_MAX),
      emergencyContactName: sanitizeText(emergencyContactName, SCHEMA_LIMITS.DISPLAY_NAME_MAX),
      emergencyContactPhone: sanitizeText(emergencyContactPhone, SCHEMA_LIMITS.PHONE_MAX),
      admissionDate,
      status,
      updatedAt: serverTimestamp(),
    };

    try {
      if (initialRecord) {
        await updateDoc(doc(db, 'patients', initialRecord.id), payload);
        onSaved(`Updated resident record for ${payload.fullName}.`);
      } else {
        await addDoc(collection(db, 'patients'), {
          mrn: cleanMrn,
          ...payload,
          createdAt: serverTimestamp(),
        });
        onSaved(`Admitted resident ${payload.fullName} (MRN ${cleanMrn}).`);
      }
    } catch (err) {
      try {
        handleFirestoreError(
          err,
          initialRecord ? OperationType.UPDATE : OperationType.CREATE,
          initialRecord ? `patients/${initialRecord.id}` : 'patients',
        );
      } catch {
        setErrorMsg('Could not save resident record. Please verify all fields and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={initialRecord ? 'Edit patient record' : 'Admit new patient'}
      className="fixed inset-0 z-50 bg-[#14221D]/45 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl max-h-[90vh] bg-white border border-[#E2E7E2] rounded-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E7E2] flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[#14221D]">
            {initialRecord ? `Edit Resident · ${initialRecord.mrn}` : 'Admit / Register Resident'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-[#4A5D55] hover:bg-[#F1F4F1] rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div role="alert" className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">MRN</label>
              <input
                type="text"
                required
                disabled={Boolean(initialRecord)}
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg disabled:opacity-60"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Full Name</label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.DISPLAY_NAME_MAX}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Age</label>
              <input
                type="number"
                required
                min={1}
                max={125}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PatientStatus)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              >
                <option value="active">Active</option>
                <option value="respite">Respite</option>
                <option value="discharged">Discharged</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Care Unit</label>
              <select
                value={careUnit}
                onChange={(e) => setCareUnit(e.target.value as CareUnit)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              >
                {CARE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Room / Suite</label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.ROOM_MAX}
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Attending Doctor</label>
              <select
                value={attendingDoctor}
                onChange={(e) => setAttendingDoctor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              >
                {SPECIALISTS.map((doc) => (
                  <option key={doc.name} value={doc.name}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Admission Date</label>
              <input
                type="date"
                required
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A5D55] mb-1">
              Primary Diagnosis / Clinical Summary
            </label>
            <input
              type="text"
              required
              maxLength={SCHEMA_LIMITS.DIAGNOSIS_MAX}
              value={primaryDiagnosis}
              onChange={(e) => setPrimaryDiagnosis(e.target.value)}
              placeholder="e.g., Post-stroke left hemiparesis, Type 2 Diabetes"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Allergies</label>
              <input
                type="text"
                maxLength={SCHEMA_LIMITS.ALLERGIES_MAX}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Therapeutic Diet Plan</label>
              <input
                type="text"
                maxLength={SCHEMA_LIMITS.DIET_PLAN_MAX}
                value={dietPlan}
                onChange={(e) => setDietPlan(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A5D55] mb-1">Current Medications</label>
            <textarea
              rows={2}
              maxLength={SCHEMA_LIMITS.MEDICATIONS_MAX}
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Emergency Contact Name</label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.DISPLAY_NAME_MAX}
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                required
                maxLength={SCHEMA_LIMITS.PHONE_MAX}
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A5D55] mb-1">
              Linked Family Account UID (for Family Portal Read Access)
            </label>
            <input
              type="text"
              required
              value={ownerUid}
              onChange={(e) => setOwnerUid(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-[#E8EDE9] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#4A5D55] border border-[#D4DDD6] rounded-lg hover:bg-[#F1F4F1] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : initialRecord ? 'Save Changes' : 'Admit Resident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
 * Admin Manage Appointment Modal
 * ========================================================================== */
function AdminAppointmentModal({
  appointment,
  onClose,
  onSaved,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [doctorName, setDoctorName] = useState(appointment.doctorName);
  const [appointmentDate, setAppointmentDate] = useState(appointment.appointmentDate);
  const [timeSlot, setTimeSlot] = useState(appointment.timeSlot);
  const [adminNotes, setAdminNotes] = useState(appointment.adminNotes);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrMsg(null);
    const path = `appointments/${appointment.id}`;
    try {
      await updateDoc(doc(db, 'appointments', appointment.id), {
        status,
        doctorName: sanitizeText(doctorName, SCHEMA_LIMITS.DISPLAY_NAME_MAX),
        appointmentDate,
        timeSlot: sanitizeText(timeSlot, 30),
        adminNotes: sanitizeText(adminNotes, SCHEMA_LIMITS.NOTES_MAX),
        updatedAt: serverTimestamp(),
      });
      onSaved(`Updated appointment for ${appointment.patientName}.`);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch {
        setErrMsg('Could not update appointment.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Manage appointment"
      className="fixed inset-0 z-50 bg-[#14221D]/45 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg bg-white border border-[#E2E7E2] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E7E2] flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#14221D]">
              Manage Appointment
            </h2>
            <p className="text-xs text-[#4A5D55]">
              {appointment.patientName} ({appointment.patientAge} yrs) · {appointment.contactPhone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-[#4A5D55] hover:bg-[#F1F4F1] rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {errMsg && (
            <div role="alert" className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs rounded-lg">
              {errMsg}
            </div>
          )}

          {appointment.notes && (
            <div className="p-3.5 bg-[#FAF9F6] border border-[#E8EDE9] rounded-lg text-xs text-[#2A3F36]">
              <span className="font-semibold block text-[#4A5D55] mb-1">Family Notes</span>
              {appointment.notes}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Assigned Specialist</label>
              <select
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              >
                {SPECIALISTS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Date</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5D55] mb-1">Time Slot</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
              >
                {APPOINTMENT_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A5D55] mb-1">
              Clinical / Reception Desk Notes
            </label>
            <textarea
              rows={3}
              maxLength={SCHEMA_LIMITS.NOTES_MAX}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Room availability, pre-admission documents requested, follow-up instructions..."
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#4A5D55] border border-[#D4DDD6] rounded-lg hover:bg-[#F1F4F1] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Updating...' : 'Save Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
