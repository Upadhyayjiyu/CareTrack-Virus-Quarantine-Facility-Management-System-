/**
 * Escapes a cell for CSV formatting
 */
function escapeCsv(cell) {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Triggers a file download in the browser
 */
function downloadFile(content, fileName, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Patient Directory to CSV
 */
export function exportPatientsToCsv(patients = []) {
  const headers = [
    'Patient ID',
    'Name',
    'Age',
    'Gender',
    'Bed Number',
    'Admission Date',
    'Admission Time',
    'Initial Temp (°C)',
    'Status',
    'Outcome',
    'Discharge Date',
    'Doctor Approval Status',
    'Doctor Approved By',
    'Doctor Notes',
    'Clinical Notes',
  ];

  const rows = patients.map(p => [
    p.id,
    p.name,
    p.age,
    p.gender,
    p.bedNumber || 'Unassigned / Discharged',
    p.admissionDate,
    p.admissionTime || '—',
    p.initialTemperature,
    p.status,
    p.outcome || 'Active (Undetermined)',
    p.dischargeDate || '—',
    p.doctorApproval?.status || 'PENDING',
    p.doctorApproval?.approvedBy || '—',
    p.doctorApproval?.notes || p.doctorApproval?.rejectionReason || '—',
    p.notes || '',
  ]);

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ].join('\n');

  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `caretrack_patients_${timestamp}.csv`);
}

/**
 * Exports Temperature Logs to CSV
 */
export function exportTemperaturesToCsv(temperatures = [], patients = []) {
  const patientMap = new Map(patients.map(p => [p.id, p]));

  const headers = [
    'Reading ID',
    'Patient ID',
    'Patient Name',
    'Bed Number',
    'Date',
    'Time',
    'Temperature (°C)',
    'Fever Status (>= 38.0°C)',
    'Recorded By',
    'Clinical Observations / Notes',
  ];

  const rows = temperatures.map(t => {
    const patient = patientMap.get(t.patientId);
    const tempNum = Number(t.temperature);
    const isFever = tempNum >= 38.0 ? 'FEVER' : 'NORMAL';

    return [
      t.id,
      t.patientId,
      patient ? patient.name : 'Unknown',
      patient ? (patient.bedNumber || 'Released') : '—',
      t.date,
      t.time || '—',
      tempNum.toFixed(1),
      isFever,
      t.nurseName || 'Nurse',
      t.notes || '',
    ];
  });

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ].join('\n');

  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `caretrack_temperatures_${timestamp}.csv`);
}

/**
 * Exports Clinical Outcomes Report to CSV
 */
export function exportOutcomesReportToCsv(patients = [], facilityMetrics = {}) {
  const summaryHeaders = ['Metric Description', 'Value'];
  const summaryRows = [
    ['Total Facility Capacity', facilityMetrics.totalCapacity],
    ['Currently Admitted Patients', facilityMetrics.occupiedBeds],
    ['Available Beds', facilityMetrics.availableBeds],
    ['Occupancy Rate', `${facilityMetrics.occupancyPercentage}%`],
    ['Total Discharges', facilityMetrics.totalDischarged],
    ['Recorded Recoveries', facilityMetrics.recordedRecoveries],
    ['Recorded Deaths', facilityMetrics.recordedDeaths],
    ['Total Recorded Outcomes (Denominator)', facilityMetrics.totalCompletedOutcomes],
    ['Facility Mortality Rate', `${facilityMetrics.mortalityRate}%`],
    ['Expected Mortality Benchmark', `${facilityMetrics.mortalityBenchmark}%`],
    ['Mortality Variance', `${facilityMetrics.mortalityVariance}%`],
    ['Incomplete Outcome Records', facilityMetrics.incompleteOutcomeRecordsCount],
    ['Daily Temp Check Compliance Rate', `${facilityMetrics.dailyTempCheckCompliancePct}%`],
    ['Doctor Visit & Temp Coordination Rate', `${facilityMetrics.visitTempCoordinationPct}%`],
  ];

  const detailHeaders = [
    'Patient ID',
    'Name',
    'Age',
    'Admission Date',
    'Discharge Date',
    'Outcome Status',
    'Attending Doctor',
    'Discharged By (Admin)',
    'Discharge Summary / Notes',
  ];

  const detailRows = patients
    .filter(p => p.status === 'DISCHARGED')
    .map(p => [
      p.id,
      p.name,
      p.age,
      p.admissionDate,
      p.dischargeDate || 'MISSING',
      p.outcome || 'INCOMPLETE RECORD',
      p.doctorApproval?.approvedBy || '—',
      p.dischargedBy || '—',
      p.dischargeNotes || '',
    ]);

  const csvContent = [
    '=== CARETRACK FACILITY SUMMARY ===',
    summaryHeaders.map(escapeCsv).join(','),
    ...summaryRows.map(r => r.map(escapeCsv).join(',')),
    '',
    '=== DISCHARGED PATIENT OUTCOMES AUDIT ===',
    detailHeaders.map(escapeCsv).join(','),
    ...detailRows.map(r => r.map(escapeCsv).join(',')),
  ].join('\n');

  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `caretrack_outcomes_audit_${timestamp}.csv`);
}
