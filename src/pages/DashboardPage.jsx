import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDate, formatDateTime } from '../utils/dateFormatters';
import BedMapModal from '../components/dashboard/BedMapModal';
import PatientDetailsModal from '../components/patients/PatientDetailsModal';
import {
  Bed,
  Users,
  Thermometer,
  Stethoscope,
  FileCheck,
  UserCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Activity,
  HeartPulse,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { facilityMetrics, activities, patients, temperatures, config } = useApp();
  const [bedMapOpen, setBedMapOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Quick navigation handler
  const handleNavigateToWorkflow = (path, patientId) => {
    navigate(path, { state: { selectedPatientId: patientId } });
  };

  // Status breakdown for visual stats
  const activePatients = patients.filter(p => p.status === 'ADMITTED');
  const feverThreshold = config?.feverThreshold ?? 38.0;

  let activeFeverSpikes = 0;
  let activeAfebrile = 0;

  activePatients.forEach(p => {
    const pTemps = temperatures
      .filter(t => t.patientId === p.id)
      .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));
    const latest = pTemps[0] ? Number(pTemps[0].temperature) : p.initialTemperature;
    if (latest >= feverThreshold) activeFeverSpikes++;
    else activeAfebrile++;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Facility Overview Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time quarantine census, clinical workflows, bed allocation, and outcome surveillance.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setBedMapOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Bed className="w-4 h-4 text-sky-600" />
            <span>Interactive Bed Map</span>
          </button>
          <button
            onClick={() => navigate('/nurse-entry')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 transition flex items-center gap-1.5"
          >
            <Thermometer className="w-4 h-4" />
            <span>Record Temp</span>
          </button>
        </div>
      </div>

      {/* Incomplete Records Warning Banner (if any) */}
      {facilityMetrics.incompleteRecordWarningsCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-xs text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-sm text-amber-900">
              Workflow Attention Required ({facilityMetrics.incompleteRecordWarningsCount} Pending Item{facilityMetrics.incompleteRecordWarningsCount > 1 ? 's' : ''})
            </span>
            <p className="mt-0.5 text-amber-800">
              {facilityMetrics.patientsNeedingTempTodayCount} admitted patient{facilityMetrics.patientsNeedingTempTodayCount > 1 ? 's' : ''} require today's temperature check.
              {facilityMetrics.incompleteOutcomeRecordsCount > 0 &&
                ` ${facilityMetrics.incompleteOutcomeRecordsCount} discharged patient has missing outcome documentation.`}
            </p>
          </div>
          <button
            onClick={() => navigate('/nurse-entry')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shrink-0 transition"
          >
            Review Checks
          </button>
        </div>
      )}

      {/* Top Census Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Capacity & Occupancy */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Facility Capacity</span>
            <Bed className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono-numbers">
              {facilityMetrics.occupiedBeds}
            </span>
            <span className="text-xs font-semibold text-slate-500">/ {facilityMetrics.totalCapacity} Beds</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>{facilityMetrics.availableBeds} Available</span>
            <span className="font-bold text-slate-700">{facilityMetrics.occupancyPercentage}% Occupied</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-sky-600 rounded-full"
              style={{ width: `${facilityMetrics.occupancyPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Needs Today's Temp Check */}
        <div
          onClick={() => navigate('/nurse-entry')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Temp Today</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono-numbers ${facilityMetrics.patientsNeedingTempTodayCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {facilityMetrics.patientsNeedingTempTodayCount}
            </span>
            <span className="text-xs font-medium text-slate-500">patients</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Daily check pending</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1.5">
            {facilityMetrics.dailyTempCheckCompliancePct}% Completion Rate
          </div>
        </div>

        {/* Awaiting Doctor Visit */}
        <div
          onClick={() => navigate('/doctor-visits')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-sky-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Doctor</span>
            <Stethoscope className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono-numbers text-sky-600">
              {facilityMetrics.patientsAwaitingVisitTodayCount}
            </span>
            <span className="text-xs font-medium text-slate-500">pending visit</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Needs clinical review</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-[10px] text-sky-700 font-bold mt-1.5">
            {facilityMetrics.visitTempCoordinationPct}% Coordinated with Temp
          </div>
        </div>

        {/* Discharge Review / Ready */}
        <div
          onClick={() => navigate('/discharge-review')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-purple-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Discharge Review</span>
            <FileCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono-numbers text-purple-600">
              {facilityMetrics.dischargeEligibleCount}
            </span>
            <span className="text-xs font-medium text-slate-500">qualify (3d afebrile)</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{facilityMetrics.doctorApprovedAwaitingAdminDischargeCount} Doctor Approved</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-[10px] text-purple-700 font-bold mt-1.5">
            {facilityMetrics.awaitingDoctorDischargeReviewCount} Awaiting Doctor Sign-off
          </div>
        </div>
      </div>

      {/* Outcome Statistics & Benchmark Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mortality vs 15% Benchmark */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900">Outcome & Mortality Surveillance</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Completed Outcomes
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-3xl font-black font-mono-numbers text-slate-900">
                {facilityMetrics.mortalityRate}%
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">Actual Mortality</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 block">Expected Benchmark</span>
              <span className="text-sm font-black font-mono-numbers text-slate-700">15.0%</span>
            </div>
          </div>

          {/* Variance indicator */}
          <div className={`p-2 rounded-xl text-xs flex items-center justify-between font-semibold ${
            parseFloat(facilityMetrics.mortalityVariance) <= 0
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <span>Variance vs Benchmark:</span>
            <span>
              {parseFloat(facilityMetrics.mortalityVariance) > 0 ? '+' : ''}
              {facilityMetrics.mortalityVariance}%
            </span>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            Calculated as <span className="font-mono">{facilityMetrics.recordedDeaths} Deaths / {facilityMetrics.totalCompletedOutcomes} Recorded Outcomes</span>. Active admitted patients are not included in the mortality denominator until outcome is determined.
          </div>
        </div>

        {/* Discharges & Recovery Summary */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900">Discharges & Recovery Breakdown</h3>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Recovered</span>
              <span className="text-xl font-bold font-mono-numbers text-emerald-900">
                {facilityMetrics.recordedRecoveries}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">
                {facilityMetrics.recoveryRate}% of outcomes
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
              <span className="text-[11px] font-semibold text-rose-800 uppercase block">Deceased</span>
              <span className="text-xl font-bold font-mono-numbers text-rose-900">
                {facilityMetrics.recordedDeaths}
              </span>
              <span className="text-[10px] text-rose-700 block mt-0.5">
                {facilityMetrics.mortalityRate}% of outcomes
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
            <span>Total Discharges Processed:</span>
            <span className="font-bold text-slate-900 font-mono-numbers">{facilityMetrics.totalDischarged}</span>
          </div>
        </div>

        {/* Clinical Ward Status */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900">Active Patient Clinical Status</h3>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Afebrile (&lt; {feverThreshold.toFixed(1)}°C)
              </span>
              <span className="font-bold font-mono-numbers text-slate-900">{activeAfebrile}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                Fever Spike (≥ {feverThreshold.toFixed(1)}°C)
              </span>
              <span className="font-bold font-mono-numbers text-rose-600">{activeFeverSpikes}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                Discharge Approved (Pending Admin)
              </span>
              <span className="font-bold font-mono-numbers text-purple-700">
                {facilityMetrics.doctorApprovedAwaitingAdminDischargeCount}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => navigate('/patients')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition flex items-center gap-1"
            >
              <span>View All Patients Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Log & Priority Patient Action List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Attention List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Priority Clinical Attention</h2>
              <p className="text-[11px] text-slate-500">Patients requiring immediate nurse checks or doctor review</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              Active Ward
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {activePatients.slice(0, 6).map((patient) => {
              // Find latest temperature
              const pTemps = temperatures
                .filter(t => t.patientId === patient.id)
                .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));
              const latestTemp = pTemps[0] ? Number(pTemps[0].temperature) : patient.initialTemperature;
              const hasFever = latestTemp >= feverThreshold;

              return (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">{patient.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                        Bed {patient.bedNumber}
                      </span>
                      {patient.doctorApproval?.status === 'APPROVED' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-100 text-purple-800">
                          Discharge Approved
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {patient.notes || 'Admitted for quarantine surveillance'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-mono-numbers font-bold text-xs ${hasFever ? 'text-rose-600' : 'text-slate-800'}`}>
                      {latestTemp.toFixed(1)}°C
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {hasFever ? 'Fever Spike' : 'Afebrile'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Facility Activity Log */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Recent Facility Activity</h2>
              <p className="text-[11px] text-slate-500">Chronological audit log of clinical and administrative events</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {activities.slice(0, 7).map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  act.type === 'FEVER_ALERT'
                    ? 'bg-rose-100 text-rose-600'
                    : act.type === 'PATIENT_DISCHARGED'
                    ? 'bg-purple-100 text-purple-600'
                    : act.type === 'DOCTOR_APPROVAL'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-sky-100 text-sky-600'
                }`}>
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800 leading-snug">{act.message}</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <span>{formatDateTime(act.timestamp)}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-600">{act.actorRole}: {act.actorName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bed Map Modal */}
      <BedMapModal
        isOpen={bedMapOpen}
        onClose={() => setBedMapOpen(false)}
        onSelectPatient={(p) => setSelectedPatient(p)}
      />

      {/* Patient Profile Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        onNavigateAction={handleNavigateToWorkflow}
      />
    </div>
  );
}
