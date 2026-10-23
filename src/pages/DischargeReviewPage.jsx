import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { evaluateDischargeEligibility } from '../utils/calculations';
import { formatDate, formatDateTime, formatTime, getDateOffset } from '../utils/dateFormatters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Calendar,
  Bed,
  Thermometer,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function DischargeReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    patients,
    temperatures,
    visits,
    config,
    currentRole,
    currentUser,
    reviewDischargeEligibility,
    finalizeDischarge,
  } = useApp();

  const activePatients = useMemo(() => patients.filter(p => p.status === 'ADMITTED'), [patients]);

  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    return location.state?.selectedPatientId || (activePatients[0]?.id ?? '');
  });

  // Doctor review state
  const [doctorDecision, setDoctorDecision] = useState('APPROVED'); // 'APPROVED' or 'REJECTED'
  const [doctorNotes, setDoctorNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Secondary viral symptoms or cardiac monitoring required.');

  // Administrator discharge modal state
  const [adminDischargeOpen, setAdminDischargeOpen] = useState(false);
  const [dischargeOutcome, setDischargeOutcome] = useState('Recovered');
  const [dischargeDate, setDischargeDate] = useState(getDateOffset(0));
  const [dischargeTime, setDischargeTime] = useState(new Date().toTimeString().substring(0, 5));
  const [dischargeNotes, setDischargeNotes] = useState('Completed 5-day quarantine and met all afebrile recovery criteria.');

  const currentPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Evaluate clinical eligibility
  const evaluation = useMemo(() => {
    if (!currentPatient) return null;
    return evaluateDischargeEligibility(currentPatient, temperatures, config);
  }, [currentPatient, temperatures, config]);

  // Latest doctor visit
  const latestDoctorVisit = useMemo(() => {
    if (!selectedPatientId) return null;
    const pVisits = visits.filter(v => v.patientId === selectedPatientId);
    return pVisits[0] || null;
  }, [selectedPatientId, visits]);

  // Handle Doctor Approval / Rejection
  const handleDoctorReviewSubmit = (e) => {
    e.preventDefault();
    if (!currentPatient) return;

    if (doctorDecision === 'REJECTED' && !rejectionReason.trim()) {
      alert('A specific clinical reason is required when rejecting discharge eligibility.');
      return;
    }

    reviewDischargeEligibility({
      patientId: currentPatient.id,
      decision: doctorDecision,
      rejectionReason: doctorDecision === 'REJECTED' ? rejectionReason : null,
      notes: doctorNotes,
    });
  };

  // Handle Administrator Final Discharge
  const handleAdminDischargeConfirm = () => {
    if (!currentPatient) return;

    finalizeDischarge({
      patientId: currentPatient.id,
      outcome: dischargeOutcome,
      dischargeDate,
      dischargeTime,
      dischargeNotes,
    });

    setAdminDischargeOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Discharge Eligibility & Clinical Clearance</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Verify three full consecutive afebrile days, complete physician clearance, and execute administrative bed deallocation.
        </p>
      </div>

      {/* Role Notice */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
          <span>
            Current Role: <strong className="text-slate-900">{currentRole}</strong> ({currentUser.name})
          </span>
        </div>
        <div className="text-[11px] text-slate-600">
          {currentRole === 'DOCTOR' && '✓ Authorized to Approve or Reject Eligibility'}
          {currentRole === 'ADMIN' && '✓ Authorized to Finalize Discharge (only after Doctor approval)'}
          {currentRole === 'NURSE' && 'ℹ Read-only: Nurses cannot approve or finalize discharges'}
        </div>
      </div>

      {/* Patient Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Select Patient for Discharge Review
        </label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
        >
          <option value="">-- Select Patient --</option>
          {activePatients.map(p => {
            const ev = evaluateDischargeEligibility(p, temperatures, config);
            return (
              <option key={p.id} value={p.id}>
                Bed {p.bedNumber}: {p.name} ({p.id}) — {ev.isEligible ? '★ 3d Afebrile (Eligible)' : 'Ineligible (Observing)'}
                {p.doctorApproval?.status === 'APPROVED' ? ' [Doctor Approved]' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {currentPatient && evaluation && (
        <div className="space-y-6">
          {/* Patient Overview Strip */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{currentPatient.name}</h2>
                  <span className="font-mono-numbers text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                    {currentPatient.id}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">
                    Bed {currentPatient.bedNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admitted {formatDate(currentPatient.admissionDate)} • Initial Temp: {currentPatient.initialTemperature}°C
                </p>
              </div>

              {/* Eligibility Badge */}
              <div>
                {evaluation.isEligible ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>3-Day Afebrile Criteria Met</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 font-bold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Clinical Criteria Not Met</span>
                  </span>
                )}
              </div>
            </div>

            {/* 3-Day Consecutive Breakdown */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3 Full Consecutive Fever-Free Days Audit (&lt; {config?.feverThreshold ?? 38.0}°C)
                </span>
                <span className="text-[11px] text-slate-500">
                  Missing data never counts as fever-free
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {evaluation.dayChecks.map((dc, index) => (
                  <div
                    key={index}
                    className={`p-3.5 rounded-xl border ${
                      dc.pass
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/70 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs mb-1">
                      <span>{dc.label}</span>
                      {dc.pass ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mb-1">{formatDate(dc.date)}</div>

                    <div className="mt-2 text-xs">
                      {dc.isMissing ? (
                        <span className="font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          MISSING READING
                        </span>
                      ) : dc.hasFever ? (
                        <span className="font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-mono-numbers">
                          FEVER: {dc.maxTemp?.toFixed(1)}°C
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-700 font-mono-numbers">
                          Afebrile ({dc.maxTemp?.toFixed(1)}°C)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reasons if ineligible */}
              {evaluation.reasons.length > 0 && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                  <span className="font-bold block">Disqualification Reason:</span>
                  {evaluation.reasons.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span>•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dual Action Section: Doctor Approval vs Administrator Final Discharge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Doctor Clinical Clearance */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px]">1</span>
                  Doctor Clinical Clearance
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    currentPatient.doctorApproval?.status === 'APPROVED'
                      ? 'bg-purple-100 text-purple-800'
                      : currentPatient.doctorApproval?.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {currentPatient.doctorApproval?.status || 'PENDING'}
                </span>
              </div>

              {/* Doctor Approval Details if already performed */}
              {currentPatient.doctorApproval?.approvedBy && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-3 space-y-1">
                  <div>
                    <strong>Physician:</strong> {currentPatient.doctorApproval.approvedBy}
                  </div>
                  <div>
                    <strong>Timestamp:</strong> {formatDateTime(currentPatient.doctorApproval.approvedAt)}
                  </div>
                  {currentPatient.doctorApproval.notes && (
                    <div>
                      <strong>Notes:</strong> {currentPatient.doctorApproval.notes}
                    </div>
                  )}
                  {currentPatient.doctorApproval.rejectionReason && (
                    <div className="text-rose-700">
                      <strong>Rejection Reason:</strong> {currentPatient.doctorApproval.rejectionReason}
                    </div>
                  )}
                </div>
              )}

              {/* Doctor Form (Only if Doctor, or informative text if another role) */}
              {currentRole === 'DOCTOR' ? (
                <form onSubmit={handleDoctorReviewSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Physician Determination
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDoctorDecision('APPROVED')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          doctorDecision === 'APPROVED'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve Clearance
                      </button>

                      <button
                        type="button"
                        onClick={() => setDoctorDecision('REJECTED')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          doctorDecision === 'REJECTED'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <XCircle className="w-4 h-4" /> Reject / Hold
                      </button>
                    </div>
                  </div>

                  {doctorDecision === 'REJECTED' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mandatory Reason for Rejection <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. Continued fatigue, requires 48h further telemetry..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clinical Clearance Notes
                    </label>
                    <textarea
                      rows={2}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      placeholder="Add post-quarantine self-isolation or home recovery advice..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    Submit Physician Decision
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <p>
                    <strong>Doctor Approval Required:</strong> You are currently acting as <strong>{currentRole}</strong>. Only an Attending Physician can approve or reject clinical clearance.
                  </p>
                  <p className="mt-1 text-slate-500 text-[11px]">
                    Use the role switcher at the top to switch to <strong>Doctor</strong> to submit clearance.
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Administrator Final Discharge & Bed Release */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[11px]">2</span>
                  Administrator Final Discharge
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Bed Release
                </span>
              </div>

              {/* Blocked or Ready Notice */}
              {currentPatient.doctorApproval?.status !== 'APPROVED' ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Discharge Action Blocked</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Facility rules strictly prohibit administrator discharge until an authorized doctor records clinical clearance approval.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 mb-4 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ready for Final Discharge</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Doctor approval granted. Processing final discharge will record the outcome and immediately return Bed {currentPatient.bedNumber} to available inventory.
                  </p>
                </div>
              )}

              {/* Admin Action */}
              {currentRole === 'ADMIN' ? (
                <div>
                  <button
                    type="button"
                    disabled={currentPatient.doctorApproval?.status !== 'APPROVED'}
                    onClick={() => setAdminDischargeOpen(true)}
                    className="w-full py-2.5 text-xs font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Process Final Discharge & Release Bed</span>
                  </button>
                  <p className="text-[11px] text-slate-500 mt-2 text-center">
                    Requires confirmed outcome (Recovered / Deceased / Transferred).
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <p>
                    <strong>Administrator Action Only:</strong> Final discharge and bed deallocation must be executed by the Facility Administrator.
                  </p>
                  <p className="mt-1 text-slate-500 text-[11px]">
                    Switch to the <strong>Administrator</strong> role in the top bar to test final discharge.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Final Discharge Dialog */}
      {adminDischargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Confirm Final Patient Discharge & Bed Release
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Discharging <strong>{currentPatient?.name}</strong> (Bed {currentPatient?.bedNumber}). Bed will immediately become available for new admissions.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recorded Clinical Outcome <span className="text-rose-500">*</span>
                </label>
                <select
                  value={dischargeOutcome}
                  onChange={(e) => setDischargeOutcome(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="Recovered">Recovered (Afebrile criteria met)</option>
                  <option value="Deceased">Deceased (Record clinical fatality)</option>
                  <option value="Transferred">Transferred to Specialized Facility</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discharge Date</label>
                  <input
                    type="date"
                    value={dischargeDate}
                    onChange={(e) => setDischargeDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discharge Time</label>
                  <input
                    type="time"
                    value={dischargeTime}
                    onChange={(e) => setDischargeTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discharge Summary / Notes</label>
                <textarea
                  rows={2}
                  value={dischargeNotes}
                  onChange={(e) => setDischargeNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                ></textarea>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAdminDischargeOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminDischargeConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
              >
                Confirm Discharge & Release Bed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
