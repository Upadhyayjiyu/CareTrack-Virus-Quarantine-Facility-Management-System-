import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getDateOffset, formatDate, formatTime } from '../utils/dateFormatters';
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Thermometer,
  ShieldAlert,
  Calendar,
  FileCheck,
  User,
} from 'lucide-react';

export default function DoctorVisitsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patients, temperatures, visits, recordDoctorVisit, currentUser, currentRole, config } = useApp();

  const activePatients = useMemo(() => patients.filter(p => p.status === 'ADMITTED'), [patients]);

  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    return location.state?.selectedPatientId || (activePatients[0]?.id ?? '');
  });

  const [visitDate, setVisitDate] = useState(getDateOffset(0));
  const [visitTime, setVisitTime] = useState(new Date().toTimeString().substring(0, 5));
  const [doctorName, setDoctorName] = useState(currentUser.name || 'Dr. Marcus Vance, MD');
  const [observations, setObservations] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [statusVal, setStatusVal] = useState('Completed');
  const [isUrgentOverride, setIsUrgentOverride] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync doctor name with active user
  useEffect(() => {
    if (currentUser?.name) {
      setDoctorName(currentUser.name);
    }
  }, [currentUser]);

  const currentPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Check if this patient has a temperature reading logged for the selected visitDate
  const hasSameDayTempCheck = useMemo(() => {
    if (!selectedPatientId || !visitDate) return false;
    return temperatures.some(t => {
      const tDate = (t.date || t.timestamp || '').split('T')[0];
      return t.patientId === selectedPatientId && tDate === visitDate;
    });
  }, [selectedPatientId, visitDate, temperatures]);

  // Patient's recent temperatures
  const patientTemps = useMemo(() => {
    if (!selectedPatientId) return [];
    return temperatures
      .filter(t => t.patientId === selectedPatientId)
      .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));
  }, [selectedPatientId, temperatures]);

  // Patient's previous visits
  const patientVisits = useMemo(() => {
    if (!selectedPatientId) return [];
    return visits
      .filter(v => v.patientId === selectedPatientId)
      .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));
  }, [selectedPatientId, visits]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedPatientId) {
      setErrorMsg('Please select an admitted patient.');
      return;
    }

    if (!doctorName.trim()) {
      setErrorMsg('Doctor name is required for medical accountability.');
      return;
    }

    if (!observations.trim()) {
      setErrorMsg('Clinical observations must be documented.');
      return;
    }

    // Guardrail: Missing same-day temperature check
    if (!hasSameDayTempCheck && !isUrgentOverride) {
      setErrorMsg('Warning: No temperature check recorded for this patient on this visit date. Check the "Record urgent clinical visit" box to proceed with an urgent evaluation.');
      return;
    }

    const res = recordDoctorVisit({
      patientId: selectedPatientId,
      date: visitDate,
      time: visitTime,
      doctorName: doctorName.trim(),
      observations: observations.trim(),
      treatmentNotes: treatmentNotes.trim(),
      followUpInstructions: followUpInstructions.trim(),
      status: statusVal,
      hasSameDayTempCheck,
      isUrgentOverride: !hasSameDayTempCheck && isUrgentOverride,
    });

    if (res.success) {
      setObservations('');
      setTreatmentNotes('');
      setFollowUpInstructions('');
      setIsUrgentOverride(false);
      setVisitTime(new Date().toTimeString().substring(0, 5));
    } else {
      setErrorMsg(res.error || 'Failed to record doctor visit.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Doctor Clinical Visits & Assessment</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review temperature trajectories, log clinical observations, prescribe treatment modifications, and mandate follow-ups.
        </p>
      </div>

      {/* Role Notice */}
      <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            <strong>Attending Physician Session:</strong> Recording as <strong>{currentUser.name}</strong> ({currentRole}).
          </span>
        </div>
        <span className="text-[11px] font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-200">
          Medical Authority Active
        </span>
      </div>

      {/* Main Grid: Form + Vitals Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visit Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-sky-600" />
            Clinical Visit Documentation
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Missing Same-Day Temp Check Warning */}
          {!hasSameDayTempCheck && selectedPatientId && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 block">Missing Same-Day Temperature Check Flag</span>
                  No temperature reading has been recorded for this patient on {visitDate}. Hospital protocol advises reviewing daily vitals prior to clinical assessment.
                </div>
              </div>
              <label className="flex items-center gap-2 pt-1 font-semibold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUrgentOverride}
                  onChange={(e) => setIsUrgentOverride(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span>Authorize urgent clinical visit override (preserves incomplete-record audit flag)</span>
              </label>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Patient For Review <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                required
              >
                <option value="">-- Choose Patient --</option>
                {activePatients.map(p => (
                  <option key={p.id} value={p.id}>
                    Bed {p.bedNumber} — {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Visit Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Visit Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Visit Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            {/* Doctor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Attending Physician <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Marcus Vance, MD"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            {/* Clinical Observations */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Observations <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Respiratory effort, lung sounds (crackles/wheeze), oxygen saturation, general alertness..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                required
              ></textarea>
            </div>

            {/* Treatment Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Treatment Plan & Medication Orders
              </label>
              <textarea
                rows={2}
                value={treatmentNotes}
                onChange={(e) => setTreatmentNotes(e.target.value)}
                placeholder="Maintain hydration, prescribe antipyretics, adjust bronchodilator therapy..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
              ></textarea>
            </div>

            {/* Follow-up & Visit Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Follow-up Instructions
                </label>
                <input
                  type="text"
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  placeholder="e.g. Recheck vitals in 6h, evaluate for discharge tomorrow"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Visit Status
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="Completed">Completed (Stable)</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Escalated">Escalated / Critical</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold rounded-xl text-white bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-600/20 transition flex items-center justify-center gap-1.5"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Save Doctor Visit Record</span>
              </button>
            </div>
          </form>
        </div>

        {/* Temperature Trajectory & Previous Visits (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Temperature Review Box (Doctor MUST review before making decisions) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-sky-600" />
                Temperature Trajectory ({patientTemps.length} Readings)
              </h3>
              {hasSameDayTempCheck ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Same-Day Temp Present
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ! Same-Day Temp Missing
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {patientTemps.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No temperature records available.
                </div>
              ) : (
                patientTemps.map(t => {
                  const tempNum = Number(t.temperature);
                  const isFever = tempNum >= (config?.feverThreshold ?? 38.0);
                  return (
                    <div
                      key={t.id}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                        isFever ? 'bg-rose-50/70 border-rose-200 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{formatDate(t.date)} at {formatTime(t.time)}</div>
                        <div className="text-[10px] text-slate-400">By {t.nurseName || 'Nurse'}</div>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono-numbers font-bold text-sm ${isFever ? 'text-rose-700' : 'text-slate-900'}`}>
                          {tempNum.toFixed(1)}°C
                        </span>
                        {isFever && <div className="text-[9px] font-bold text-rose-600">FEVER SPIKE</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Previous Doctor Visits */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Previous Doctor Visits ({patientVisits.length})
            </h3>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {patientVisits.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  No prior visits recorded for this patient.
                </div>
              ) : (
                patientVisits.map(v => (
                  <div key={v.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                      <span>{formatDate(v.date)} at {formatTime(v.time)}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">
                        {v.status}
                      </span>
                    </div>
                    <p className="text-slate-600 truncate">{v.observations}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
