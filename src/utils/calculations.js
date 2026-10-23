import { getDateOffset } from './dateFormatters';

export const TOTAL_CAPACITY = 74;
export const DEFAULT_FEVER_THRESHOLD = 38.0;
export const DEFAULT_CONSECUTIVE_DAYS = 3;
export const EXPECTED_MORTALITY_BENCHMARK = 15.0; // 15%

/**
 * Evaluates a patient's discharge eligibility under the 3-full-consecutive-fever-free-days rule.
 * 
 * Clinical Rule Enforcement:
 * 1. Missing temperature data must NEVER count as fever-free.
 * 2. Partial days do not count as full days (must evaluate past full days: yesterday, 2 days ago, 3 days ago).
 * 3. Three full days must be consecutive.
 * 4. A single normal temperature does not qualify.
 * 5. All readings on each qualifying day must be below the configured fever threshold (< 38.0°C).
 * 6. Today's current reading (if present) must also not show active fever.
 */
export function evaluateDischargeEligibility(patient, allTemperatures = [], config = {}) {
  const feverThreshold = Number(config.feverThreshold ?? DEFAULT_FEVER_THRESHOLD);
  const consecutiveDays = Number(config.consecutiveDays ?? DEFAULT_CONSECUTIVE_DAYS);

  // If patient is not currently admitted, they cannot be evaluated for discharge
  if (patient.status !== 'ADMITTED') {
    return {
      isEligible: false,
      statusBadge: 'INELIGIBLE',
      summary: `Patient is not currently admitted (Status: ${patient.status}).`,
      reasons: [`Patient status is ${patient.status}`],
      dayChecks: [],
      todayCheck: null,
      doctorApprovalStatus: patient.doctorApproval?.status || 'NOT_APPLICABLE',
    };
  }

  // Filter temperatures for this patient
  const patientTemps = allTemperatures.filter(t => t.patientId === patient.id);

  // Map readings by calendar date (YYYY-MM-DD)
  const readingsByDate = {};
  patientTemps.forEach(t => {
    const d = (t.date || t.timestamp || '').split('T')[0];
    if (!d) return;
    if (!readingsByDate[d]) readingsByDate[d] = [];
    readingsByDate[d].push(Number(t.temperature));
  });

  const todayIso = getDateOffset(0);
  const dayChecks = [];
  const failureReasons = [];

  // Evaluate the required consecutive full days preceding today (Day -consecutiveDays up to Day -1)
  // For consecutiveDays = 3: Day -3, Day -2, Day -1 (yesterday)
  for (let i = consecutiveDays; i >= 1; i--) {
    const targetDate = getDateOffset(-i);
    const dayReadings = readingsByDate[targetDate] || [];
    const readingsCount = dayReadings.length;
    const maxTemp = readingsCount > 0 ? Math.max(...dayReadings) : null;
    const isMissing = readingsCount === 0;
    const hasFever = maxTemp !== null && maxTemp >= feverThreshold;
    const pass = !isMissing && !hasFever;

    let dayLabel = `${i} day${i > 1 ? 's' : ''} ago`;
    if (i === 1) dayLabel = 'Yesterday (Full Day)';
    if (i === 2) dayLabel = '2 Days Ago (Full Day)';
    if (i === 3) dayLabel = '3 Days Ago (Full Day)';

    if (isMissing) {
      failureReasons.push(`Day ${targetDate} (${dayLabel}) has no recorded temperature check.`);
    } else if (hasFever) {
      failureReasons.push(`Day ${targetDate} (${dayLabel}) recorded fever of ${maxTemp.toFixed(1)}°C (threshold: ${feverThreshold.toFixed(1)}°C).`);
    }

    dayChecks.push({
      dayOffset: -i,
      date: targetDate,
      label: dayLabel,
      readingsCount,
      maxTemp,
      hasFever,
      isMissing,
      pass,
    });
  }

  // Also check today's temperature if one exists: Active fever today immediately invalidates eligibility
  const todayReadings = readingsByDate[todayIso] || [];
  const todayMax = todayReadings.length > 0 ? Math.max(...todayReadings) : null;
  const todayHasFever = todayMax !== null && todayMax >= feverThreshold;

  if (todayHasFever) {
    failureReasons.push(`Active fever detected today (${todayMax.toFixed(1)}°C). Patient cannot be discharged.`);
  }

  const allFullDaysPassed = dayChecks.length === consecutiveDays && dayChecks.every(d => d.pass);
  const isEligible = allFullDaysPassed && !todayHasFever;

  // Doctor approval status
  const doctorApproval = patient.doctorApproval || {
    status: 'PENDING', // 'PENDING' | 'APPROVED' | 'REJECTED'
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    notes: null,
  };

  let summary = '';
  if (isEligible) {
    summary = `Patient has completed ${consecutiveDays} full consecutive fever-free days (< ${feverThreshold.toFixed(1)}°C).`;
  } else {
    summary = `Ineligible: ${failureReasons[0] || 'Incomplete fever-free history.'}`;
  }

  return {
    isEligible,
    consecutiveDaysRequired: consecutiveDays,
    feverThreshold,
    summary,
    reasons: failureReasons,
    dayChecks,
    todayCheck: {
      date: todayIso,
      readingsCount: todayReadings.length,
      maxTemp: todayMax,
      hasFever: todayHasFever,
    },
    doctorApproval,
    canBeDischargedByAdmin: isEligible && doctorApproval.status === 'APPROVED',
  };
}

/**
 * Calculates all real-time facility metrics from patient and temperature state
 */
export function calculateFacilityMetrics(patients = [], temperatures = [], visits = [], config = {}) {
  const todayIso = getDateOffset(0);

  const activePatients = patients.filter(p => p.status === 'ADMITTED');
  const dischargedPatients = patients.filter(p => p.status === 'DISCHARGED');

  const occupiedBeds = activePatients.length;
  const availableBeds = Math.max(0, TOTAL_CAPACITY - occupiedBeds);
  const occupancyPercentage = ((occupiedBeds / TOTAL_CAPACITY) * 100).toFixed(1);

  // Group temperatures by patient for today
  const patientTempsToday = new Map();
  temperatures.forEach(t => {
    const d = (t.date || t.timestamp || '').split('T')[0];
    if (d === todayIso) {
      patientTempsToday.set(t.patientId, true);
    }
  });

  // Group visits by patient for today
  const patientVisitsToday = new Map();
  visits.forEach(v => {
    const d = (v.date || v.timestamp || '').split('T')[0];
    if (d === todayIso) {
      patientVisitsToday.set(v.patientId, true);
    }
  });

  // Patients requiring today's temperature check
  const patientsNeedingTempToday = activePatients.filter(p => !patientTempsToday.has(p.id));

  // Patients awaiting a doctor visit today
  const patientsAwaitingVisitToday = activePatients.filter(p => !patientVisitsToday.has(p.id));

  // Patients awaiting discharge review (clinically eligible, doctor approval pending)
  const dischargeEligiblePatients = [];
  const awaitingDoctorDischargeReview = [];
  const doctorApprovedAwaitingAdminDischarge = [];

  activePatients.forEach(p => {
    const evalResult = evaluateDischargeEligibility(p, temperatures, config);
    if (evalResult.isEligible) {
      dischargeEligiblePatients.push(p);
      if (evalResult.doctorApproval.status === 'PENDING') {
        awaitingDoctorDischargeReview.push(p);
      } else if (evalResult.doctorApproval.status === 'APPROVED') {
        doctorApprovedAwaitingAdminDischarge.push(p);
      }
    }
  });

  // Recorded outcomes
  const recoveredPatients = dischargedPatients.filter(p => p.outcome === 'Recovered');
  const deceasedPatients = dischargedPatients.filter(p => p.outcome === 'Deceased');
  const totalCompletedOutcomes = recoveredPatients.length + deceasedPatients.length;

  // Mortality rate calculation with explicit denominator
  const mortalityRate = totalCompletedOutcomes > 0
    ? ((deceasedPatients.length / totalCompletedOutcomes) * 100).toFixed(1)
    : '0.0';

  const recoveryRate = totalCompletedOutcomes > 0
    ? ((recoveredPatients.length / totalCompletedOutcomes) * 100).toFixed(1)
    : '0.0';

  const mortalityVariance = (parseFloat(mortalityRate) - EXPECTED_MORTALITY_BENCHMARK).toFixed(1);

  // Incomplete outcome records (e.g. discharged with no recorded outcome or missing date)
  const incompleteOutcomeRecords = dischargedPatients.filter(p => !p.outcome || !p.dischargeDate);

  // Compliance metrics
  const dailyTempCheckCompliancePct = activePatients.length > 0
    ? (((activePatients.length - patientsNeedingTempToday.length) / activePatients.length) * 100).toFixed(1)
    : '100.0';

  // Doctor visits completed on same day as temperature check
  let visitsWithSameDayTemp = 0;
  visits.forEach(v => {
    const vDate = (v.date || v.timestamp || '').split('T')[0];
    const hasSameDayTemp = temperatures.some(t => {
      const tDate = (t.date || t.timestamp || '').split('T')[0];
      return t.patientId === v.patientId && tDate === vDate;
    });
    if (hasSameDayTemp) visitsWithSameDayTemp++;
  });

  const visitTempCoordinationPct = visits.length > 0
    ? ((visitsWithSameDayTemp / visits.length) * 100).toFixed(1)
    : '100.0';

  // Warnings count for incomplete records across facility
  const incompleteRecordWarningsCount = patientsNeedingTempToday.length + incompleteOutcomeRecords.length;

  return {
    totalCapacity: TOTAL_CAPACITY,
    occupiedBeds,
    availableBeds,
    occupancyPercentage,
    totalAdmitted: activePatients.length,
    patientsNeedingTempTodayCount: patientsNeedingTempToday.length,
    patientsNeedingTempToday,
    patientsAwaitingVisitTodayCount: patientsAwaitingVisitToday.length,
    patientsAwaitingVisitToday,
    dischargeEligibleCount: dischargeEligiblePatients.length,
    awaitingDoctorDischargeReviewCount: awaitingDoctorDischargeReview.length,
    doctorApprovedAwaitingAdminDischargeCount: doctorApprovedAwaitingAdminDischarge.length,
    totalDischarged: dischargedPatients.length,
    recordedRecoveries: recoveredPatients.length,
    recordedDeaths: deceasedPatients.length,
    totalCompletedOutcomes,
    mortalityRate,
    recoveryRate,
    mortalityBenchmark: EXPECTED_MORTALITY_BENCHMARK,
    mortalityVariance,
    incompleteOutcomeRecordsCount: incompleteOutcomeRecords.length,
    incompleteRecordWarningsCount,
    dailyTempCheckCompliancePct,
    visitTempCoordinationPct,
    visitsCount: visits.length,
  };
}

/**
 * Checks if a proposed temperature reading might be a duplicate or rapid repeat
 */
export function checkDuplicateTemperature(patientId, targetDate, allTemperatures = []) {
  const dIso = targetDate.split('T')[0];
  const existingToday = allTemperatures.filter(t => {
    const tIso = (t.date || t.timestamp || '').split('T')[0];
    return t.patientId === patientId && tIso === dIso;
  });

  if (existingToday.length > 0) {
    const latest = existingToday[existingToday.length - 1];
    return {
      isDuplicate: true,
      count: existingToday.length,
      latestReading: latest,
      warningMessage: `Notice: ${existingToday.length} reading${existingToday.length > 1 ? 's' : ''} already recorded for this patient on ${dIso} (Latest: ${latest.temperature}°C by ${latest.nurseName || 'Nurse'} at ${latest.time || 'earlier'}). Repeat readings are allowed for verification, but ensure this is intentional.`,
    };
  }

  return { isDuplicate: false };
}
