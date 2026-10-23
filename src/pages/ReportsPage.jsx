import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateFormatters';
import {
  exportPatientsToCsv,
  exportTemperaturesToCsv,
  exportOutcomesReportToCsv,
} from '../utils/csvExport';
import {
  BarChart3,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Activity,
  Bed,
  Info,
} from 'lucide-react';

export default function ReportsPage() {
  const { patients, temperatures, facilityMetrics } = useApp();

  const dischargedPatients = patients.filter(p => p.status === 'DISCHARGED');
  const incompleteDischarges = dischargedPatients.filter(p => !p.outcome || !p.dischargeDate);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Facility Reports & Outcomes Surveillance</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Clinical outcome metrics, mortality benchmarking, compliance tracking, and CSV audit exports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportOutcomesReportToCsv(patients, facilityMetrics)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Executive Audit</span>
          </button>
        </div>
      </div>

      {/* Demonstration Scientific Disclaimer */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-950 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block text-sky-900 mb-0.5">Statistical Demonstration Disclaimer</span>
          In an ongoing quarantine cohort, crude mortality rates are highly sensitive to small sample sizes and right-censoring (active patients still undergoing treatment). The mortality rate calculation below uses completed outcomes as denominator ({facilityMetrics.totalCompletedOutcomes} recorded outcomes).
        </div>
      </div>

      {/* Executive Key Indicators Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Admissions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Admissions</span>
          <span className="text-2xl font-black font-mono-numbers text-slate-900 mt-1 block">
            {patients.length}
          </span>
          <div className="text-[11px] text-slate-500 mt-1">
            {facilityMetrics.occupiedBeds} currently admitted
          </div>
        </div>

        {/* Total Discharges */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Discharges</span>
          <span className="text-2xl font-black font-mono-numbers text-slate-900 mt-1 block">
            {facilityMetrics.totalDischarged}
          </span>
          <div className="text-[11px] text-slate-500 mt-1">
            {facilityMetrics.recordedRecoveries} recoveries recorded
          </div>
        </div>

        {/* Mortality Rate */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Mortality Rate</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono-numbers text-rose-700">
              {facilityMetrics.mortalityRate}%
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">vs 15% bench</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {facilityMetrics.recordedDeaths} deaths / {facilityMetrics.totalCompletedOutcomes} outcomes
          </div>
        </div>

        {/* Available Beds */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Available Beds</span>
          <span className="text-2xl font-black font-mono-numbers text-emerald-700 mt-1 block">
            {facilityMetrics.availableBeds}
          </span>
          <div className="text-[11px] text-slate-500 mt-1">
            Capacity: {facilityMetrics.totalCapacity} beds ({facilityMetrics.occupancyPercentage}% full)
          </div>
        </div>
      </div>

      {/* Compliance & Coordination Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Temp Check Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-slate-900">Daily Temperature Check Compliance</h3>
            <span className="text-xs font-black font-mono-numbers text-emerald-700">
              {facilityMetrics.dailyTempCheckCompliancePct}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${facilityMetrics.dailyTempCheckCompliancePct}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500">
            Percentage of active admitted patients who have received a recorded temperature check today.
          </p>
        </div>

        {/* Doctor Visit & Temp Coordination */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-slate-900">Doctor Visit & Vitals Coordination</h3>
            <span className="text-xs font-black font-mono-numbers text-sky-700">
              {facilityMetrics.visitTempCoordinationPct}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${facilityMetrics.visitTempCoordinationPct}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500">
            Percentage of clinical doctor visits conducted on the same day as a valid temperature reading.
          </p>
        </div>
      </div>

      {/* Incomplete Records Audit */}
      {incompleteDischarges.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Incomplete Outcome Records Identified ({incompleteDischarges.length})</span>
          </div>
          <p className="text-amber-800">
            The following discharged patients lack a confirmed clinical outcome or complete documentation. These records are isolated to prevent skewing mortality statistics:
          </p>
          <div className="divide-y divide-amber-200/60 pt-1">
            {incompleteDischarges.map(p => (
              <div key={p.id} className="py-1.5 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800">{p.name} ({p.id})</span>
                <span className="text-rose-700 font-bold">Outcome: {p.outcome || 'MISSING / UNCONFIRMED'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Export Center */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="mb-4">
          <h2 className="font-bold text-sm text-slate-900">Facility Data Export Center</h2>
          <p className="text-xs text-slate-500">Download formatted CSV audit reports for offline review and assessment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Patients CSV */}
          <button
            onClick={() => exportPatientsToCsv(patients)}
            className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 text-left transition group"
          >
            <div className="p-2 w-fit rounded-lg bg-sky-100 text-sky-700 mb-2 group-hover:scale-105 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900">Export Patient Directory</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              All {patients.length} admitted and discharged records with bed assignments.
            </div>
          </button>

          {/* Temperatures CSV */}
          <button
            onClick={() => exportTemperaturesToCsv(temperatures, patients)}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition group"
          >
            <div className="p-2 w-fit rounded-lg bg-emerald-100 text-emerald-700 mb-2 group-hover:scale-105 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900">Export Temperature Logs</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Complete audit of {temperatures.length} vitals entries with nurse attribution.
            </div>
          </button>

          {/* Outcomes Report CSV */}
          <button
            onClick={() => exportOutcomesReportToCsv(patients, facilityMetrics)}
            className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left transition group"
          >
            <div className="p-2 w-fit rounded-lg bg-purple-100 text-purple-700 mb-2 group-hover:scale-105 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900">Export Clinical Outcomes</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Executive summary, mortality variance, and discharged patient audit.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
