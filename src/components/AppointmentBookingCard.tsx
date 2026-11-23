import React, { useEffect, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APPOINTMENT_TIME_SLOTS, NISARGA_CONTACT, SPECIALISTS } from '../data/nisargaContent';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CARE_UNITS,
  sanitizeText,
  SCHEMA_LIMITS,
  VISIT_TYPES,
  type CareUnit,
  type VisitType,
} from '../types/hospital';

interface AppointmentBookingCardProps {
  defaultDepartment?: CareUnit;
  defaultDoctor?: string;
  onSuccessNavigatePortal?: () => void;
}

function getTomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function AppointmentBookingCard({
  defaultDepartment,
  defaultDoctor,
  onSuccessNavigatePortal,
}: AppointmentBookingCardProps) {
  const { user, signInWithGoogle, authBusy } = useAuth();
  const [activeTab, setActiveTab] = useState<'appointment' | 'inquiry'>('appointment');

  // Appointment fields
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('72');
  const [contactPhone, setContactPhone] = useState('');
  const [department, setDepartment] = useState<CareUnit>(
    defaultDepartment ?? "Dementia & Alzheimer's Care",
  );
  const [doctorName, setDoctorName] = useState(defaultDoctor ?? SPECIALISTS[1].name);
  const [visitType, setVisitType] = useState<VisitType>('In-Person Consultation');
  const [appointmentDate, setAppointmentDate] = useState(getTomorrowIso());
  const [timeSlot, setTimeSlot] = useState<string>(APPOINTMENT_TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');

  // Inquiry fields
  const [senderName, setSenderName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [careInterest, setCareInterest] = useState<string>(CARE_UNITS[0]);
  const [inquiryMessage, setInquiryMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    type: 'appointment' | 'inquiry';
    refId: string;
    summary: string;
  } | null>(null);

  useEffect(() => {
    if (defaultDepartment) {
      setDepartment(defaultDepartment);
      const matched = SPECIALISTS.find((s) => s.department === defaultDepartment);
      if (matched && !defaultDoctor) {
        setDoctorName(matched.name);
      }
    }
  }, [defaultDepartment, defaultDoctor]);

  useEffect(() => {
    if (defaultDoctor) {
      setDoctorName(defaultDoctor);
    }
  }, [defaultDoctor]);

  useEffect(() => {
    if (user?.displayName && !senderName) {
      setSenderName(user.displayName);
    }
  }, [user, senderName]);

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError('Please sign in with Google to save your appointment and track status updates.');
      return;
    }

    const cleanName = sanitizeText(patientName, SCHEMA_LIMITS.DISPLAY_NAME_MAX);
    const cleanPhone = sanitizeText(contactPhone, SCHEMA_LIMITS.PHONE_MAX);
    const cleanNotes = sanitizeText(notes, SCHEMA_LIMITS.NOTES_MAX);
    const parsedAge = Number(patientAge);

    if (cleanName.length < 2) {
      setFormError('Please enter the patient or resident’s full name.');
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 125) {
      setFormError('Please enter a valid patient age between 1 and 125.');
      return;
    }
    if (cleanPhone.length < 7) {
      setFormError('Please enter a valid contact phone number.');
      return;
    }
    if (!SCHEMA_LIMITS.DATE_PATTERN.test(appointmentDate)) {
      setFormError('Please select a valid appointment date.');
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        patientName: cleanName,
        patientAge: parsedAge,
        contactPhone: cleanPhone,
        contactEmail: sanitizeText(user.email || 'family@nisargacare.com', SCHEMA_LIMITS.EMAIL_MAX),
        department,
        doctorName: sanitizeText(doctorName, SCHEMA_LIMITS.DISPLAY_NAME_MAX),
        visitType,
        appointmentDate,
        timeSlot,
        notes: cleanNotes,
        adminNotes: '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setConfirmation({
        type: 'appointment',
        refId: docRef.id.slice(0, 8).toUpperCase(),
        summary: `${visitType} for ${cleanName} (${department}) on ${appointmentDate} at ${timeSlot}.`,
      });
      setPatientName('');
      setNotes('');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'appointments');
      } catch {
        setFormError('Could not save appointment right now. Please try again or call +91 97312 56246.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError('Please sign in with Google to submit a tracked family callback request.');
      return;
    }

    const cleanSender = sanitizeText(senderName, SCHEMA_LIMITS.DISPLAY_NAME_MAX);
    const cleanPhone = sanitizeText(inquiryPhone, SCHEMA_LIMITS.PHONE_MAX);
    const cleanMsg = sanitizeText(inquiryMessage, SCHEMA_LIMITS.NOTES_MAX);

    if (cleanSender.length < 2 || cleanPhone.length < 7 || cleanMsg.length < 5) {
      setFormError('Please provide your name, phone number, and a brief note about care needs.');
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'inquiries'), {
        userId: user.uid,
        senderName: cleanSender,
        phone: cleanPhone,
        careInterest: sanitizeText(careInterest, SCHEMA_LIMITS.DISPLAY_NAME_MAX),
        message: cleanMsg,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setConfirmation({
        type: 'inquiry',
        refId: docRef.id.slice(0, 8).toUpperCase(),
        summary: `Callback request logged for ${careInterest}. Our Bengaluru care coordinator will reach out on ${cleanPhone}.`,
      });
      setInquiryMessage('');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'inquiries');
      } catch {
        setFormError('Could not send inquiry right now. Please try again or call +91 97312 56246.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2E7E2] rounded-2xl p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E8EDE9]">
        <div>
          <h3 className="font-display text-2xl font-semibold text-[#14221D]">
            Schedule a Visit or Consultation
          </h3>
          <p className="text-sm text-[#4A5D55] mt-1">
            {NISARGA_CONTACT.visitingHours} · {NISARGA_CONTACT.sundayNote}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F1F4F1] rounded-lg">
          <button
            type="button"
            onClick={() => {
              setActiveTab('appointment');
              setConfirmation(null);
              setFormError(null);
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'appointment'
                ? 'bg-white text-[#14221D] shadow-sm'
                : 'text-[#4A5D55] hover:text-[#14221D]'
            }`}
          >
            Book Appointment
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('inquiry');
              setConfirmation(null);
              setFormError(null);
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'inquiry'
                ? 'bg-white text-[#14221D] shadow-sm'
                : 'text-[#4A5D55] hover:text-[#14221D]'
            }`}
          >
            Request Callback
          </button>
        </div>
      </div>

      {!user && (
        <div className="mt-6 p-4 bg-[#F4F7F5] border border-[#DCE5DF] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-[#2A3F36]">
            Sign in with Google to confirm appointments, receive live status updates, and access your family portal.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={authBusy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {authBusy ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      )}

      {confirmation && (
        <div
          role="status"
          className="mt-6 p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl space-y-3"
        >
          <div className="flex items-center gap-2.5 text-[#15803D]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">
              {confirmation.type === 'appointment' ? 'Appointment Request Recorded' : 'Callback Request Submitted'} · Ref #{confirmation.refId}
            </span>
          </div>
          <p className="text-sm text-[#14532D]">{confirmation.summary}</p>
          {onSuccessNavigatePortal && (
            <button
              type="button"
              onClick={onSuccessNavigatePortal}
              className="text-sm font-semibold text-[#135D43] hover:underline cursor-pointer"
            >
              View in Patient & Family Portal →
            </button>
          )}
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="mt-5 p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm rounded-lg"
        >
          {formError}
        </div>
      )}

      {activeTab === 'appointment' ? (
        <form onSubmit={handleAppointmentSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="appt-patient-name" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
                Patient / Resident Full Name
              </label>
              <input
                id="appt-patient-name"
                type="text"
                required
                maxLength={SCHEMA_LIMITS.DISPLAY_NAME_MAX}
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g., Srinivas Murthy"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              />
            </div>

            <div>
              <label htmlFor="appt-patient-age" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
                Age (Years)
              </label>
              <input
                id="appt-patient-age"
                type="number"
                required
                min={1}
                max={125}
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="appt-phone" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
                Family Contact Phone
              </label>
              <input
                id="appt-phone"
                type="tel"
                required
                maxLength={SCHEMA_LIMITS.PHONE_MAX}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98450 00000"
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              />
            </div>

            <div>
              <label htmlFor="appt-visit-type" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
                Visit Type
              </label>
              <select
                id="appt-visit-type"
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as VisitType)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              >
                {VISIT_TYPES.map((vt) => (
                  <option key={vt} value={vt}>
                    {vt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="appt-department" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
                Care Unit / Specialty
              </label>
              <select
                id="appt-department"
                value={department}
                onChange={(e) => {
                  const nextDept = e.target.value as CareUnit;
                  setDepartment(nextDept);
                  const match = SPECIALISTS.find((s) => s.department === nextDept);
                  if (match) setDoctorName(match.name);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              >
                {CARE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="appt-doctor" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
                Consulting Specialist
              </label>
              <select
                id="appt-doctor"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              >
                {SPECIALISTS.map((doc) => (
                  <option key={doc.name} value={doc.name}>
                    {doc.name} ({doc.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="appt-date" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
                Preferred Date
              </label>
              <input
                id="appt-date"
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              />
            </div>

            <div>
              <label htmlFor="appt-slot" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
                Preferred Time Slot
              </label>
              <select
                id="appt-slot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
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
            <label htmlFor="appt-notes" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
              Clinical Context or Mobility / Admission Notes (Optional)
            </label>
            <textarea
              id="appt-notes"
              rows={3}
              maxLength={SCHEMA_LIMITS.NOTES_MAX}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share current mobility level, post-hospital discharge summary, or preferred room type..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <span className="text-xs text-[#4A5D55]">
              Instant booking confirmation recorded to your Nisarga Care account.
            </span>
            <button
              type="submit"
              disabled={submitting || !user}
              className="px-6 py-3 text-sm font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] disabled:opacity-45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Confirm Appointment Request'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleInquirySubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inq-name" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
                Your Full Name
              </label>
              <input
                id="inq-name"
                type="text"
                required
                maxLength={SCHEMA_LIMITS.DISPLAY_NAME_MAX}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g., Priya Nair"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              />
            </div>

            <div>
              <label htmlFor="inq-phone" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
                Phone / WhatsApp Number
              </label>
              <input
                id="inq-phone"
                type="tel"
                required
                maxLength={SCHEMA_LIMITS.PHONE_MAX}
                value={inquiryPhone}
                onChange={(e) => setInquiryPhone(e.target.value)}
                placeholder="+91 98450 00000"
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="inq-interest" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
              Care Program of Interest
            </label>
            <select
              id="inq-interest"
              value={careInterest}
              onChange={(e) => setCareInterest(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
            >
              {CARE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
              <option value="Short-Term Respite Stay">Short-Term Respite Stay</option>
              <option value="Long-Term Assisted Living">Long-Term Assisted Living</option>
            </select>
          </div>

          <div>
            <label htmlFor="inq-message" className="block text-xs font-medium text-[#4A5D55] mb-1.5">
              How Can Our Team Help?
            </label>
            <textarea
              id="inq-message"
              rows={3}
              required
              maxLength={SCHEMA_LIMITS.NOTES_MAX}
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder="Tell us about your loved one's care requirements or preferred time to call..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || !user}
              className="px-6 py-3 text-sm font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] disabled:opacity-45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submitting ? 'Sending...' : 'Request Care Coordinator Callback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
