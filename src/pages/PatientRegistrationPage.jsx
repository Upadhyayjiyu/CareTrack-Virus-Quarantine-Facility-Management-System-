import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TOTAL_CAPACITY } from '../utils/calculations';
import { getDateOffset } from '../utils/dateFormatters';
import {
  UserPlus,
  Bed,
  Thermometer,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function PatientRegistrationPage() {
  const navigate = useNavigate();
  const { patients, registerPatient, currentRole, facilityMetrics } = useApp();

  // Find currently occupied bed numbers among admitted patients
  const occupiedBeds = useMemo(() => {
    return new Set(
      patients
        .filter(p => p.status === 'ADMITTED' && p.bedNumber)
        .map(p => Number(p.bedNumber))
    );
  }, [patients]);

  // Find first available bed
  const firstAvailableBed = useMemo(() => {
    for (let i = 1; i <= TOTAL_CAPACITY; i++) {
      if (!occupiedBeds.has(i)) return i;
    }
    return '';
  }, [occupiedBeds]);

  // Suggest a unique Patient ID (CT-2026-XXX)
  const suggestedId = useMemo(() => {
    const existingNums = patients
      .map(p => {
        const match = p.id.match(/CT-2026-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `CT-2026-${String(nextNum).padStart(3, '0')}`;
  }, [patients]);

  const [formData, setFormData] = useState({
    id: suggestedId,
    name: '',
    age: '',
    gender: 'Female',
    bedNumber: firstAvailableBed || '',
    admissionDate: getDateOffset(0),
    admissionTime: new Date().toTimeString().substring(0, 5),
    initialTemperature: '38.2',
    notes: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const isFullCapacity = occupiedBeds.size >= TOTAL_CAPACITY;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation 1: Capacity
    if (isFullCapacity) {
      setErrorMessage(`Facility has reached its maximum capacity of ${TOTAL_CAPACITY} beds. Cannot admit new patients until a bed is released through discharge.`);
      return;
    }

    // Validation 2: Mandatory fields
    if (!formData.id.trim() || !formData.name.trim() || !formData.age || !formData.bedNumber || !formData.initialTemperature) {
      setErrorMessage('Please fill in all mandatory fields (Patient ID, Name, Age, Assigned Bed, Initial Temperature).');
      return;
    }

    // Validation 3: Bed occupancy
    const bedInt = parseInt(formData.bedNumber, 10);
    if (occupiedBeds.has(bedInt)) {
      setErrorMessage(`Bed ${bedInt} is already occupied by an active patient. Please select an available bed.`);
      return;
    }

    // Validation 4: Age range
    const ageInt = parseInt(formData.age, 10);
    if (isNaN(ageInt) || ageInt < 1 || ageInt > 120) {
      setErrorMessage('Please enter a valid age between 1 and 120.');
      return;
    }

    // Validation 5: Temperature range
    const tempFloat = parseFloat(formData.initialTemperature);
    if (isNaN(tempFloat) || tempFloat < 34.0 || tempFloat > 44.0) {
      setErrorMessage('Please enter a realistic clinical initial temperature between 34.0°C and 44.0°C.');
      return;
    }

    // Execute registration
    const result = registerPatient(formData);
    if (result.success) {
      setSuccessResult(result.patient);
    } else {
      setErrorMessage(result.error || 'Failed to register patient.');
    }
  };

  const handleResetForNext = () => {
    setSuccessResult(null);
    setFormData({
      id: suggestedId,
      name: '',
      age: '',
      gender: 'Female',
      bedNumber: firstAvailableBed || '',
      admissionDate: getDateOffset(0),
      admissionTime: new Date().toTimeString().substring(0, 5),
      initialTemperature: '38.2',
      notes: '',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Admission & Bed Assignment</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register arriving patients, validate capacity constraints, assign sanitized beds, and record admission vitals.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Facility Census:</span>
          <span className="font-bold font-mono-numbers px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800">
            {occupiedBeds.size} / {TOTAL_CAPACITY} Beds Occupied
          </span>
        </div>
      </div>

      {/* Role permission info */}
      {currentRole !== 'ADMIN' && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>Administrator Function:</strong> Admissions are typically managed by the Facility Administrator. In demo mode, all roles may test this workflow.
            </span>
          </div>
        </div>
      )}

      {/* Capacity Warning Banner */}
      {isFullCapacity && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 text-xs text-rose-950">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm text-rose-900">Capacity Exceeded Alert</span>
            <p className="mt-0.5 text-rose-800 leading-relaxed">
              The quarantine facility is at maximum capacity (74/74 beds). New admissions are blocked until an attending physician approves discharge and the administrator releases a bed.
            </p>
          </div>
        </div>
      )}

      {/* Success View */}
      {successResult ? (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient Admitted Successfully</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              <strong>{successResult.name}</strong> ({successResult.id}) has been registered and assigned to <strong>Bed {successResult.bedNumber}</strong>. Initial temperature ({successResult.initialTemperature}°C) has been logged.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm mx-auto text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient ID:</span>
              <span className="font-bold font-mono-numbers">{successResult.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bed Number:</span>
              <span className="font-bold text-sky-700">Bed {successResult.bedNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Initial Temperature:</span>
              <span className="font-bold font-mono-numbers">{successResult.initialTemperature}°C</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleResetForNext}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Admit Another Patient
            </button>
            <button
              onClick={() => navigate('/nurse-entry', { state: { selectedPatientId: successResult.id } })}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5"
            >
              <span>Record Follow-up Temp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Admission Form */
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Patient ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Patient Identifier <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                placeholder="e.g. CT-2026-042"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono-numbers"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Must be unique across facility records.</p>
            </div>

            {/* Patient Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Samuel O. Jackson"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Age <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 45"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono-numbers"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Bed Assignment */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Assigned Bed (1–74) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {TOTAL_CAPACITY - occupiedBeds.size} beds available
                </span>
              </div>
              <select
                name="bedNumber"
                value={formData.bedNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white font-mono-numbers"
                required
              >
                <option value="">-- Select an Available Bed --</option>
                {Array.from({ length: TOTAL_CAPACITY }, (_, i) => i + 1).map(num => {
                  const isTaken = occupiedBeds.has(num);
                  return (
                    <option key={num} value={num} disabled={isTaken}>
                      Bed {num} {isTaken ? '(Occupied)' : '(Available)'}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                A bed cannot be assigned to two active patients simultaneously.
              </p>
            </div>

            {/* Admission Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admission Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="admissionDate"
                  value={formData.admissionDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admission Time
                </label>
                <input
                  type="time"
                  name="admissionTime"
                  value={formData.admissionTime}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Initial Temperature */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Initial Temperature (°C) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="34.0"
                  max="44.0"
                  name="initialTemperature"
                  value={formData.initialTemperature}
                  onChange={handleChange}
                  placeholder="38.2"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono-numbers pl-9"
                  required
                />
                <Thermometer className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Baseline reading upon arrival. ≥ 38.0°C flags active fever.
              </p>
            </div>
          </div>

          {/* Clinical Notes / Symptoms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Admission Notes & Symptoms
            </label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Record known viral exposure, symptoms (cough, shortness of breath), and relevant pre-existing medical conditions..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 leading-relaxed"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFullCapacity}
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-sm shadow-sky-600/20 transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Complete Admission</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
