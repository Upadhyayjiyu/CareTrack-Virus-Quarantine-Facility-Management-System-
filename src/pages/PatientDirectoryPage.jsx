import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDate, formatTime, getDaysSince } from '../utils/dateFormatters';
import { evaluateDischargeEligibility } from '../utils/calculations';
import PatientDetailsModal from '../components/patients/PatientDetailsModal';
import {
  Search,
  Filter,
  Eye,
  Thermometer,
  Stethoscope,
  FileCheck,
  UserPlus,
  Bed,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function PatientDirectoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patients, temperatures, visits, config, currentRole } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL_ACTIVE'); // ALL_ACTIVE, NEEDS_TEMP, NEEDS_DOCTOR, ELIGIBLE, DISCHARGED, ALL
  const [selectedPatient, setSelectedPatient] = useState(null);

  const feverThreshold = config?.feverThreshold ?? 38.0;

  // Enrich patient list with latest temperature and visit info
  const enrichedPatients = useMemo(() => {
    return patients.map(p => {
      const pTemps = temperatures
        .filter(t => t.patientId === p.id)
        .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

      const latestTemp = pTemps[0] ? Number(pTemps[0].temperature) : p.initialTemperature;
      const lastCheckDate = pTemps[0] ? pTemps[0].date : p.admissionDate;
      const lastCheckTime = pTemps[0] ? pTemps[0].time : p.admissionTime;

      // Has today's temp check?
      const todayIso = new Date().toISOString().split('T')[0];
      const hasTodayTemp = pTemps.some(t => (t.date || '').split('T')[0] === todayIso);

      // Has today's doctor visit?
      const pVisits = visits.filter(v => v.patientId === p.id);
      const hasTodayVisit = pVisits.some(v => (v.date || '').split('T')[0] === todayIso);
      const latestVisit = pVisits[0];

      // Discharge eligibility
      const eligibility = evaluateDischargeEligibility(p, temperatures, config);

      return {
        ...p,
        latestTemp,
        isFever: latestTemp >= feverThreshold,
        lastCheckDate,
        lastCheckTime,
        hasTodayTemp,
        hasTodayVisit,
        latestVisit,
        isEligible: eligibility.isEligible,
        doctorApprovalStatus: p.doctorApproval?.status || 'PENDING',
      };
    });
  }, [patients, temperatures, visits, config, feverThreshold]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return enrichedPatients.filter(p => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(search) ||
        p.id.toLowerCase().includes(search) ||
        (p.bedNumber && String(p.bedNumber).includes(search));

      if (!matchesSearch) return false;

      // Filter
      if (statusFilter === 'ALL_ACTIVE') return p.status === 'ADMITTED';
      if (statusFilter === 'NEEDS_TEMP') return p.status === 'ADMITTED' && !p.hasTodayTemp;
      if (statusFilter === 'NEEDS_DOCTOR') return p.status === 'ADMITTED' && !p.hasTodayVisit;
      if (statusFilter === 'ELIGIBLE') return p.status === 'ADMITTED' && p.isEligible;
      if (statusFilter === 'DISCHARGED') return p.status === 'DISCHARGED';
      return true; // ALL
    });
  }, [enrichedPatients, searchTerm, statusFilter]);

  const handleNavigateAction = (path, patientId) => {
    navigate(path, { state: { selectedPatientId: patientId } });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Directory & Profiles</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, filter, and review active quarantine cases, clinical history, and discharge status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/register')}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Admit Patient</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search patient name, ID, or bed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          {[
            { id: 'ALL_ACTIVE', label: 'All Admitted' },
            { id: 'NEEDS_TEMP', label: 'Needs Temp Check' },
            { id: 'NEEDS_DOCTOR', label: 'Needs Doctor Visit' },
            { id: 'ELIGIBLE', label: 'Discharge Eligible' },
            { id: 'DISCHARGED', label: 'Discharged' },
            { id: 'ALL', label: 'All Records' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Bed</th>
                <th className="py-3 px-4">Admitted</th>
                <th className="py-3 px-4">Latest Temp</th>
                <th className="py-3 px-4">Daily Checks</th>
                <th className="py-3 px-4">Doctor Status</th>
                <th className="py-3 px-4">Discharge Eligibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No patients match the current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50/70 transition">
                    {/* Patient Name & ID */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{patient.name}</div>
                      <div className="text-[11px] font-mono-numbers text-slate-500">
                        {patient.id} • {patient.age}y {patient.gender.charAt(0)}
                      </div>
                    </td>

                    {/* Bed */}
                    <td className="py-3 px-4">
                      {patient.bedNumber ? (
                        <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                          Bed {patient.bedNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None (Discharged)</span>
                      )}
                    </td>

                    {/* Admission */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <div>{formatDate(patient.admissionDate)}</div>
                      <div className="text-[10px] text-slate-400">{getDaysSince(patient.admissionDate)} days in facility</div>
                    </td>

                    {/* Latest Temp */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono-numbers">
                      <span className={`font-bold ${patient.isFever ? 'text-rose-600' : 'text-slate-800'}`}>
                        {patient.latestTemp.toFixed(1)}°C
                      </span>
                      {patient.isFever && (
                        <span className="ml-1 text-[9px] px-1 bg-rose-100 text-rose-700 font-bold rounded">
                          FEVER
                        </span>
                      )}
                      <div className="text-[10px] text-slate-400 font-sans">
                        {patient.lastCheckTime ? formatTime(patient.lastCheckTime) : 'Admission'}
                      </div>
                    </td>

                    {/* Today's check status */}
                    <td className="py-3 px-4">
                      {patient.status === 'ADMITTED' ? (
                        patient.hasTodayTemp ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Checked Today
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Temp Pending
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Doctor Visit Status */}
                    <td className="py-3 px-4">
                      {patient.status === 'ADMITTED' ? (
                        patient.hasTodayVisit ? (
                          <span className="text-sky-700 font-semibold text-[11px]">Visited Today</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Visit Pending</span>
                        )
                      ) : (
                        <span className="text-slate-400">{patient.outcome || 'Closed'}</span>
                      )}
                    </td>

                    {/* Discharge status */}
                    <td className="py-3 px-4">
                      {patient.status === 'ADMITTED' ? (
                        patient.doctorApprovalStatus === 'APPROVED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            Approved (Ready for Admin)
                          </span>
                        ) : patient.isEligible ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            3d Afebrile (Eligible)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Observing
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {patient.outcome || 'Discharged'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="px-2.5 py-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg font-semibold transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        onNavigateAction={handleNavigateAction}
      />
    </div>
  );
}
