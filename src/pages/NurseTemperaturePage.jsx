import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getDateOffset, formatDate, formatTime } from '../utils/dateFormatters';
import { checkDuplicateTemperature } from '../utils/calculations';
import {
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  User,
  Bed,
  ShieldAlert,
  Flame,
} from 'lucide-react';

export default function NurseTemperaturePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patients, temperatures, recordTemperature, config, currentUser, currentRole } = useApp();

  const activePatients = useMemo(() => patients.filter(p => p.status === 'ADMITTED'), [patients]);

  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    return location.state?.selectedPatientId || (activePatients[0]?.id ?? '');
  });

  const [temperatureVal, setTemperatureVal] = useState('37.0');
  const [dateVal, setDateVal] = useState(getDateOffset(0));
  const [timeVal, setTimeVal] = useState(new Date().toTimeString().substring(0, 5));
  const [nurseName, setNurseName] = useState(currentUser.name || 'Elena Rostova, RN');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep nurse name in sync with user
  useEffect(() => {
    if (currentUser?.name) {
      setNurseName(currentUser.name);
    }
  }, [currentUser]);

  // Selected patient object
  const currentPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Check for duplicate or rapid repeat reading today
  const duplicateWarning = useMemo(() => {
    if (!selectedPatientId || !dateVal) return { isDuplicate: false };
    return checkDuplicateTemperature(selectedPatientId, dateVal, temperatures);
  }, [selectedPatientId, dateVal, temperatures]);

  // Temperature threshold check
  const feverThreshold = config?.feverThreshold ?? 38.0;
  const tempNumber = parseFloat(temperatureVal);
  const isFever = !isNaN(tempNumber) && tempNumber >= feverThreshold;

  // Patient's recent temperatures
  const patientHistory = useMemo(() => {
    if (!selectedPatientId) return [];
    return temperatures
      .filter(t => t.patientId === selectedPatientId)
      .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));
  }, [selectedPatientId, temperatures]);

  // List of patients needing today's temperature check
  const patientsNeedingCheckToday = useMemo(() => {
    const todayIso = getDateOffset(0);
    const checkedTodayIds = new Set(
      temperatures
        .filter(t => (t.date || '').split('T')[0] === todayIso)
        .map(t => t.patientId)
    );
    return activePatients.filter(p => !checkedTodayIds.has(p.id));
  }, [activePatients, temperatures]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedPatientId) {
      setErrorMsg('Please select an admitted patient.');
      return;
    }

    const t = parseFloat(temperatureVal);
    if (isNaN(t) || t < 34.0 || t > 44.0) {
      setErrorMsg('Please enter a valid clinical temperature between 34.0°C and 44.0°C.');
      return;
    }

    if (!nurseName.trim()) {
      setErrorMsg('Nurse name is required for clinical accountability.');
      return;
    }

    const res = recordTemperature({
      patientId: selectedPatientId,
      temperature: t,
      date: dateVal,
      time: timeVal,
      nurseName: nurseName.trim(),
      notes: notes.trim(),
    });

    if (res.success) {
      setNotes('');
      // update time to current
      setTimeVal(new Date().toTimeString().substring(0, 5));
    } else {
      setErrorMsg(res.error || 'Failed to record temperature.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nurse Temperature Recording</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Record verified daily vitals, detect duplicate entries, track afebrile progression, and flag clinical pyrexia.
        </p>
      </div>

      {/* Role Context Notice */}
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Clinical Responsibility:</strong> Recorded by <strong>{currentUser.name}</strong> ({currentRole}). Every entry is timestamped and auditable.
          </span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
          Threshold: {feverThreshold.toFixed(1)}°C
        </span>
      </div>

      {/* Patients Needing Check Today Quick Bar */}
      {patientsNeedingCheckToday.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              {patientsNeedingCheckToday.length} Patient{patientsNeedingCheckToday.length > 1 ? 's' : ''} Still Requiring Today's Check
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">Click to quick-select</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {patientsNeedingCheckToday.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPatientId(p.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                  selectedPatientId === p.id
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                }`}
              >
                Bed {p.bedNumber}: {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Entry Form + History Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-sky-600" />
            Vitals Entry Form
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Duplicate Reading Warning */}
          {duplicateWarning.isDuplicate && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-amber-900 block mb-0.5">Potential Duplicate Entry Notice</span>
                {duplicateWarning.warningMessage}
              </div>
            </div>
          )}

          {/* High Fever Alert Indicator */}
          {isFever && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-950 flex items-start gap-2.5">
              <Flame className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-rose-900 block mb-0.5">
                  Pyrexia / Fever Alert (≥ {feverThreshold.toFixed(1)}°C)
                </span>
                Entering this reading will flag an active fever spike, reset consecutive afebrile recovery days, and notify attending physicians.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Admitted Patient <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white font-medium"
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

            {/* Temperature Value */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Temperature (°C) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="34.0"
                  max="44.0"
                  value={temperatureVal}
                  onChange={(e) => setTemperatureVal(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-base font-bold rounded-xl border focus:outline-none focus:ring-2 font-mono-numbers pl-9 ${
                    isFever
                      ? 'border-rose-400 text-rose-700 bg-rose-50/30 focus:ring-rose-500'
                      : 'border-slate-300 text-slate-900 focus:ring-sky-500'
                  }`}
                  required
                />
                <Thermometer className={`w-4 h-4 absolute left-3 top-3.5 ${isFever ? 'text-rose-500' : 'text-slate-400'}`} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Standard Range: 36.0°C – 37.5°C</span>
                <span className={isFever ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                  {isFever ? 'Fever Spike' : 'Afebrile'}
                </span>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Check Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Check Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={timeVal}
                  onChange={(e) => setTimeVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            {/* Nurse Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Nurse Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nurseName}
                onChange={(e) => setNurseName(e.target.value)}
                placeholder="e.g. Elena Rostova, RN"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            {/* Clinical Observations / Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Observations & Symptoms (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Patient reporting chills, diaphoresis, good oral intake, resting comfortably..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              ></textarea>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-2.5 text-xs font-bold rounded-xl text-white shadow-sm transition flex items-center justify-center gap-1.5 ${
                  isFever
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Thermometer className="w-4 h-4" />
                <span>Save Temperature Reading</span>
              </button>
            </div>
          </form>
        </div>

        {/* Patient Profile & Log History (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {currentPatient ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{currentPatient.name}</h3>
                  <div className="text-xs text-slate-500 font-mono-numbers">
                    {currentPatient.id} • Bed {currentPatient.bedNumber}
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Admitted
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <div><strong>Age/Gender:</strong> {currentPatient.age}y / {currentPatient.gender}</div>
                <div><strong>Admission Date:</strong> {formatDate(currentPatient.admissionDate)}</div>
                {currentPatient.notes && (
                  <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">
                    "{currentPatient.notes}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              Select a patient to inspect their vitals history.
            </div>
          )}

          {/* History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-sky-600" />
                Recorded History ({patientHistory.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {patientHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No readings recorded yet for this patient.
                </div>
              ) : (
                patientHistory.map((h) => {
                  const tempNum = Number(h.temperature);
                  const hFever = tempNum >= feverThreshold;

                  return (
                    <div
                      key={h.id}
                      className={`p-2.5 rounded-xl border text-xs ${
                        hFever ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-800">
                          {formatDate(h.date)} • {formatTime(h.time)}
                        </span>
                        <span className={`font-mono-numbers font-bold ${hFever ? 'text-rose-700' : 'text-slate-900'}`}>
                          {tempNum.toFixed(1)}°C
                          {hFever && <span className="text-[9px] px-1 bg-rose-200 text-rose-800 rounded ml-1">FEVER</span>}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                        <span>By: {h.nurseName || 'Nurse'}</span>
                        {h.notes && <span className="truncate max-w-[140px] italic">{h.notes}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
