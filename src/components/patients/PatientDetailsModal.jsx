import React from 'react';
import { useApp } from '../../context/AppContext';
import { evaluateDischargeEligibility } from '../../utils/calculations';
import { formatDate, formatTime, getDaysSince } from '../../utils/dateFormatters';
import {
  X,
  User,
  Bed,
  Calendar,
  Thermometer,
  Stethoscope,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';

export default function PatientDetailsModal({ patient, isOpen, onClose, onNavigateAction }) {
  const { temperatures, visits, config, currentRole } = useApp();

  if (!isOpen || !patient) return null;

  // Filter temperatures and visits for this patient
  const patientTemps = temperatures
    .filter(t => t.patientId === patient.id)
    .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

  const patientVisits = visits
    .filter(v => v.patientId === patient.id)
    .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

  const eligibility = evaluateDischargeEligibility(patient, temperatures, config);
  const feverThreshold = config?.feverThreshold ?? 38.0;

  const latestTemp = patientTemps[0] ? Number(patientTemps[0].temperature) : patient.initialTemperature;
  const isLatestFever = latestTemp >= feverThreshold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm border border-sky-200">
              {patient.id.replace('CT-2026-', '#')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{patient.name}</h2>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    patient.status === 'ADMITTED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {patient.status}
                </span>
                {patient.outcome && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      patient.outcome === 'Recovered'
                        ? 'bg-blue-100 text-blue-800'
                        : patient.outcome === 'Deceased'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {patient.outcome}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {patient.age} yrs old • {patient.gender} • Admitted {formatDate(patient.admissionDate)} ({getDaysSince(patient.admissionDate)} days in facility)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Vitals Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Assigned Bed</span>
              <span className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-sky-600" />
                {patient.bedNumber ? `Bed ${patient.bedNumber}` : 'Released'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${isLatestFever ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Latest Temp</span>
              <span className={`text-base font-bold font-mono-numbers mt-0.5 flex items-center gap-1 ${isLatestFever ? 'text-rose-700' : 'text-slate-900'}`}>
                <Thermometer className="w-4 h-4" />
                {latestTemp.toFixed(1)}°C
                {isLatestFever && <span className="text-[10px] px-1 bg-rose-200 text-rose-800 rounded font-bold ml-1">FEVER</span>}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Doctor Visit</span>
              <span className="text-xs font-semibold text-slate-800 mt-1 block truncate">
                {patientVisits[0] ? `${patientVisits[0].doctorName.split(',')[0]} (${formatDate(patientVisits[0].date)})` : 'No visits yet'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Discharge Eligibility</span>
              <span className={`text-xs font-bold mt-1 block ${eligibility.isEligible ? 'text-emerald-700' : 'text-amber-700'}`}>
                {eligibility.isEligible ? '✓ Qualifies (3 Days Afebrile)' : '✗ Not Yet Eligible'}
              </span>
            </div>
          </div>

          {/* Clinical Notes */}
          {patient.notes && (
            <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-sky-950">
              <span className="font-bold block mb-0.5">Admission Clinical Notes:</span>
              <p className="leading-relaxed">{patient.notes}</p>
            </div>
          )}

          {/* 3-Day Fever-Free Status Breakdown */}
          {patient.status === 'ADMITTED' && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-sky-600" />
                  3-Day Fever-Free Recovery Checklist (&lt; {feverThreshold.toFixed(1)}°C)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    eligibility.isEligible
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {eligibility.isEligible ? 'ELIGIBLE' : 'INELIGIBLE'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                {eligibility.dayChecks.map((dc, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border text-xs ${
                      dc.pass
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/60 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{dc.label}</span>
                      {dc.pass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                    </div>
                    <div className="text-[11px] mt-1 font-mono-numbers">
                      {dc.isMissing ? 'No reading (MISSING)' : `Max: ${dc.maxTemp?.toFixed(1)}°C`}
                    </div>
                  </div>
                ))}
              </div>

              {eligibility.reasons.length > 0 && (
                <div className="text-[11px] text-rose-700 mt-2 font-medium">
                  • {eligibility.reasons[0]}
                </div>
              )}
            </div>
          )}

          {/* Temperature History Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-sky-600" />
                Temperature Logs ({patientTemps.length})
              </h3>
            </div>

            {patientTemps.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No temperature readings recorded yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Temperature</th>
                      <th className="py-2.5 px-3">Recorded By</th>
                      <th className="py-2.5 px-3">Clinical Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientTemps.map((t) => {
                      const tempNum = Number(t.temperature);
                      const isFever = tempNum >= feverThreshold;
                      return (
                        <tr key={t.id} className={isFever ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}>
                          <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                            {formatDate(t.date)} at {formatTime(t.time)}
                          </td>
                          <td className="py-2 px-3 font-mono-numbers font-bold">
                            <span className={isFever ? 'text-rose-700' : 'text-slate-800'}>
                              {tempNum.toFixed(1)}°C
                            </span>
                            {isFever && (
                              <span className="ml-1.5 text-[9px] px-1 py-0.2 bg-rose-200 text-rose-800 rounded font-bold">
                                FEVER
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{t.nurseName || 'Nurse'}</td>
                          <td className="py-2 px-3 text-slate-500 max-w-xs truncate">{t.notes || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Doctor Visits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-sky-600" />
                Doctor Visits ({patientVisits.length})
              </h3>
            </div>

            {patientVisits.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No doctor visits recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {patientVisits.map((v) => (
                  <div key={v.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-900 mb-1">
                      <span>{v.doctorName} • {formatDate(v.date)} at {formatTime(v.time)}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                        {v.status}
                      </span>
                    </div>
                    {v.observations && (
                      <p className="text-slate-700 mt-1">
                        <strong className="text-slate-900">Observations:</strong> {v.observations}
                      </p>
                    )}
                    {v.treatmentNotes && (
                      <p className="text-slate-700 mt-0.5">
                        <strong className="text-slate-900">Treatment:</strong> {v.treatmentNotes}
                      </p>
                    )}
                    {v.followUpInstructions && (
                      <p className="text-slate-600 mt-0.5 italic">
                        <strong>Follow-up:</strong> {v.followUpInstructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Active Role: <span className="font-bold text-slate-700">{currentRole}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition"
            >
              Close
            </button>

            {patient.status === 'ADMITTED' && onNavigateAction && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateAction('/nurse-entry', patient.id);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition flex items-center gap-1.5"
                >
                  <Thermometer className="w-3.5 h-3.5" /> Log Temp
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigateAction('/doctor-visits', patient.id);
                  }}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition flex items-center gap-1.5"
                >
                  <Stethoscope className="w-3.5 h-3.5" /> Doctor Visit
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigateAction('/discharge-review', patient.id);
                  }}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition flex items-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" /> Discharge Review
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
