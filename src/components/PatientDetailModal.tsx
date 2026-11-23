import React, { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { Activity, FileText, Plus, X } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CARE_LOG_TYPES,
  sanitizeText,
  SCHEMA_LIMITS,
  type CareLog,
  type CareLogType,
  type PatientRecord,
} from '../types/hospital';

interface PatientDetailModalProps {
  patient: PatientRecord;
  isAdmin: boolean;
  isBootstrapAdmin: boolean;
  currentUserUid: string;
  currentUserName: string;
  onClose: () => void;
}

function formatTimestamp(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Just now';
  return ts.toDate().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PatientDetailModal({
  patient,
  isAdmin,
  isBootstrapAdmin,
  currentUserUid,
  currentUserName,
  onClose,
}: PatientDetailModalProps) {
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [showAddLog, setShowAddLog] = useState(false);

  const [logType, setLogType] = useState<CareLogType>('Vitals Check');
  const [bloodPressure, setBloodPressure] = useState('124/78');
  const [pulseBpm, setPulseBpm] = useState('74');
  const [spo2Percent, setSpo2Percent] = useState('98');
  const [bloodSugarMgDl, setBloodSugarMgDl] = useState('112');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const logsPath = `patients/${patient.id}/careLogs`;
    const logsRef = collection(db, 'patients', patient.id, 'careLogs');
    const q = isBootstrapAdmin
      ? query(logsRef)
      : query(logsRef, where('ownerUid', '==', currentUserUid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: CareLog[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CareLog, 'id'>),
        }));
        items.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? Date.now();
          const bTime = b.createdAt?.toMillis?.() ?? Date.now();
          return bTime - aTime;
        });
        setCareLogs(items);
        setLoadingLogs(false);
      },
      (err) => {
        setLoadingLogs(false);
        try {
          handleFirestoreError(err, OperationType.LIST, logsPath);
        } catch {
          setErrorMsg('Unable to load clinical care logs for this resident.');
        }
      },
    );

    return () => unsubscribe();
  }, [patient.id, isBootstrapAdmin, currentUserUid]);

  const handleAddCareLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanSummary = sanitizeText(summary, SCHEMA_LIMITS.CARE_LOG_SUMMARY_MAX);
    const cleanBp = sanitizeText(bloodPressure, SCHEMA_LIMITS.BLOOD_PRESSURE_MAX);
    const pulse = Number(pulseBpm) || 0;
    const spo2 = Number(spo2Percent) || 0;
    const sugar = Number(bloodSugarMgDl) || 0;

    if (cleanSummary.length < 2) {
      setErrorMsg('Please enter clinical observation notes.');
      return;
    }

    setSaving(true);
    const logsPath = `patients/${patient.id}/careLogs`;
    try {
      await addDoc(collection(db, 'patients', patient.id, 'careLogs'), {
        patientId: patient.id,
        ownerUid: patient.ownerUid,
        logType,
        bloodPressure: cleanBp || 'N/A',
        pulseBpm: Math.min(260, Math.max(0, pulse)),
        spo2Percent: Math.min(100, Math.max(0, spo2)),
        bloodSugarMgDl: Math.min(1000, Math.max(0, sugar)),
        summary: cleanSummary,
        recordedBy: sanitizeText(currentUserName || 'Nursing Station', SCHEMA_LIMITS.DISPLAY_NAME_MAX),
        createdAt: serverTimestamp(),
      });
      setSummary('');
      setShowAddLog(false);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, logsPath);
      } catch {
        setErrorMsg('Could not save clinical care log. Ensure you have clinician permissions.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Clinical chart for ${patient.fullName}`}
      className="fixed inset-0 z-50 bg-[#14221D]/45 flex items-center justify-end"
    >
      <div className="w-full max-w-2xl h-full bg-white border-l border-[#E2E7E2] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E2E7E2] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#4A5D55]">
              <span>MRN {patient.mrn}</span>
              <span aria-hidden="true">·</span>
              <span>Room {patient.roomNumber}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{patient.status}</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#14221D] mt-1 truncate">
              {patient.fullName}
            </h2>
            <p className="text-xs text-[#4A5D55] mt-1">
              {patient.age} yrs · {patient.gender} · Blood Group {patient.bloodGroup} · {patient.careUnit}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close clinical chart"
            className="p-2 rounded-lg text-[#4A5D55] hover:bg-[#F1F4F1] hover:text-[#14221D] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#FAF9F6]">
          <section className="bg-white border border-[#E2E7E2] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#135D43]">
              <FileText className="w-4 h-4" />
              <span>Clinical Profile & Care Plan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-[#4A5D55]">Attending Physician</div>
                <div className="font-medium text-[#14221D] mt-0.5">{patient.attendingDoctor}</div>
              </div>
              <div>
                <div className="text-xs text-[#4A5D55]">Admission Date</div>
                <div className="font-mono tabular-nums text-[#14221D] mt-0.5">{patient.admissionDate}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-[#4A5D55]">Primary Diagnosis / Clinical Summary</div>
                <div className="text-[#14221D] mt-0.5">{patient.primaryDiagnosis}</div>
              </div>
              <div>
                <div className="text-xs text-[#4A5D55]">Known Allergies</div>
                <div className="text-[#14221D] mt-0.5">{patient.allergies || 'None reported'}</div>
              </div>
              <div>
                <div className="text-xs text-[#4A5D55]">Therapeutic Diet Plan</div>
                <div className="text-[#14221D] mt-0.5">{patient.dietPlan || 'Standard senior balanced diet'}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-[#4A5D55]">Active Medications</div>
                <div className="text-[#14221D] mt-0.5 whitespace-pre-wrap">
                  {patient.medications || 'Managed as per physician chart'}
                </div>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-[#EDF1EE] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5D55]">
                <span>Emergency Contact: {patient.emergencyContactName}</span>
                <span className="font-mono tabular-nums text-[#14221D]">{patient.emergencyContactPhone}</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#135D43]" />
                <h3 className="font-display text-lg font-semibold text-[#14221D]">
                  Daily Vitals & Nursing Care Logs
                </h3>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddLog((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddLog ? 'Cancel Entry' : 'Log Vitals / Round'}
                </button>
              )}
            </div>

            {errorMsg && (
              <div role="alert" className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            {isAdmin && showAddLog && (
              <form
                onSubmit={handleAddCareLog}
                className="bg-white border border-[#D4DDD6] rounded-xl p-5 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="log-type" className="block text-xs font-medium text-[#4A5D55] mb-1">
                      Entry Category
                    </label>
                    <select
                      id="log-type"
                      value={logType}
                      onChange={(e) => setLogType(e.target.value as CareLogType)}
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                    >
                      {CARE_LOG_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="log-bp" className="block text-xs font-medium text-[#4A5D55] mb-1">
                      Blood Pressure (mmHg)
                    </label>
                    <input
                      id="log-bp"
                      type="text"
                      maxLength={SCHEMA_LIMITS.BLOOD_PRESSURE_MAX}
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      placeholder="120/80"
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="log-pulse" className="block text-xs font-medium text-[#4A5D55] mb-1">
                      Pulse (bpm)
                    </label>
                    <input
                      id="log-pulse"
                      type="number"
                      min={0}
                      max={260}
                      value={pulseBpm}
                      onChange={(e) => setPulseBpm(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                    />
                  </div>
                  <div>
                    <label htmlFor="log-spo2" className="block text-xs font-medium text-[#4A5D55] mb-1">
                      SpO2 (%)
                    </label>
                    <input
                      id="log-spo2"
                      type="number"
                      min={0}
                      max={100}
                      value={spo2Percent}
                      onChange={(e) => setSpo2Percent(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                    />
                  </div>
                  <div>
                    <label htmlFor="log-sugar" className="block text-xs font-medium text-[#4A5D55] mb-1">
                      Sugar (mg/dL)
                    </label>
                    <input
                      id="log-sugar"
                      type="number"
                      min={0}
                      max={1000}
                      value={bloodSugarMgDl}
                      onChange={(e) => setBloodSugarMgDl(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="log-summary" className="block text-xs font-medium text-[#4A5D55] mb-1">
                    Clinical / Nursing Observation Notes
                  </label>
                  <textarea
                    id="log-summary"
                    rows={3}
                    required
                    maxLength={SCHEMA_LIMITS.CARE_LOG_SUMMARY_MAX}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Document vitals stability, mobility exercises, appetite, or doctor instructions..."
                    className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {saving ? 'Saving Log...' : 'Save Clinical Entry'}
                  </button>
                </div>
              </form>
            )}

            {loadingLogs ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-24 bg-white border border-[#E2E7E2] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : careLogs.length === 0 ? (
              <div className="bg-white border border-[#E2E7E2] rounded-xl p-6 text-center space-y-2">
                <p className="text-sm font-medium text-[#14221D]">No clinical care logs recorded yet</p>
                <p className="text-xs text-[#4A5D55]">
                  Daily nursing vitals, doctor rounds, and physiotherapy notes will appear here chronologically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {careLogs.map((log) => (
                  <article
                    key={log.id}
                    className="bg-white border border-[#E2E7E2] rounded-xl p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-medium text-[#14221D]">
                        <span className="text-[#135D43] font-semibold">{log.logType}</span>
                        <span aria-hidden="true" className="text-[#94A39B]">·</span>
                        <span className="text-[#4A5D55]">Recorded by {log.recordedBy}</span>
                      </div>
                      <span className="font-mono tabular-nums text-[#4A5D55]">
                        {formatTimestamp(log.createdAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 pb-2 border-b border-[#EDF1EE] font-mono tabular-nums text-xs">
                      <div>
                        <span className="text-[#4A5D55] block font-sans">BP</span>
                        <span className="text-[#14221D] font-semibold">{log.bloodPressure || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[#4A5D55] block font-sans">Pulse</span>
                        <span className="text-[#14221D] font-semibold">
                          {log.pulseBpm > 0 ? `${log.pulseBpm} bpm` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#4A5D55] block font-sans">SpO2</span>
                        <span className="text-[#14221D] font-semibold">
                          {log.spo2Percent > 0 ? `${log.spo2Percent}%` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#4A5D55] block font-sans">Blood Sugar</span>
                        <span className="text-[#14221D] font-semibold">
                          {log.bloodSugarMgDl > 0 ? `${log.bloodSugarMgDl} mg/dL` : '—'}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-[#2A3F36] leading-relaxed">{log.summary}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
