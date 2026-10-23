import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getInitialDemoData } from '../utils/demoData';
import { calculateFacilityMetrics, evaluateDischargeEligibility, TOTAL_CAPACITY } from '../utils/calculations';
import { getDateOffset } from '../utils/dateFormatters';

const STORAGE_KEY = 'caretrack_quarantine_v1';

export const USER_ROLES = {
  NURSE: {
    id: 'NURSE',
    label: 'Nurse',
    name: 'Elena Rostova, RN',
    title: 'Staff Nurse — Quarantine Ward A',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Responsible for patient monitoring, vitals logging, and identifying temperature spikes.',
  },
  DOCTOR: {
    id: 'DOCTOR',
    label: 'Doctor',
    name: 'Dr. Marcus Vance, MD',
    title: 'Attending Physician & Infectious Disease Specialist',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    description: 'Reviews clinical records, conducts visits, and evaluates discharge eligibility.',
  },
  ADMIN: {
    id: 'ADMIN',
    label: 'Administrator',
    name: 'Arthur Pendelton',
    title: 'Facility Operations & Clinical Records Administrator',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Manages patient admissions, bed inventory, final discharge processing, and outcome reports.',
  },
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Demo Role state (default: Doctor or Nurse, let's start with Doctor or Admin)
  const [currentRole, setCurrentRole] = useState('DOCTOR');
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Load from localStorage or initialize from demoData
  const [facilityData, setFacilityData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.patients && parsed.temperatures && parsed.visits) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved CareTrack data, using defaults:', e);
    }
    return getInitialDemoData();
  });

  // Save to localStorage whenever facilityData updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(facilityData));
    } catch (e) {
      console.error('Failed to save CareTrack data to localStorage:', e);
    }
  }, [facilityData]);

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Helper to add activity log
  const logActivity = (type, actorRole, actorName, patientId, patientName, message) => {
    const newActivity = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      actorRole,
      actorName,
      patientId,
      patientName,
      message,
    };
    return newActivity;
  };

  // Reset Demo Data
  const resetDemoData = () => {
    const initial = getInitialDemoData();
    setFacilityData(initial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    addToast('success', 'Demo Data Reset', 'Facility records restored to initial demonstration state.');
  };

  // Update Config
  const updateConfig = (newConfig) => {
    setFacilityData(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig },
    }));
    addToast('success', 'Settings Updated', 'Clinical evaluation thresholds updated.');
  };

  // Register New Patient
  const registerPatient = (patientFormData) => {
    // 1. Capacity limit check
    const activePatients = facilityData.patients.filter(p => p.status === 'ADMITTED');
    if (activePatients.length >= TOTAL_CAPACITY) {
      addToast('error', 'Capacity Reached', `Facility is at maximum capacity (${TOTAL_CAPACITY}/${TOTAL_CAPACITY} beds). Cannot admit new patients.`);
      return { success: false, error: `Facility is at maximum capacity (${TOTAL_CAPACITY}/${TOTAL_CAPACITY} beds).` };
    }

    // 2. Bed occupancy check
    const bedNum = parseInt(patientFormData.bedNumber, 10);
    if (!bedNum || bedNum < 1 || bedNum > TOTAL_CAPACITY) {
      addToast('error', 'Invalid Bed', `Bed number must be between 1 and ${TOTAL_CAPACITY}.`);
      return { success: false, error: `Bed number must be between 1 and ${TOTAL_CAPACITY}.` };
    }

    const bedOccupied = activePatients.some(p => p.bedNumber === bedNum);
    if (bedOccupied) {
      addToast('error', 'Bed Occupied', `Bed ${bedNum} is currently assigned to another active patient.`);
      return { success: false, error: `Bed ${bedNum} is currently assigned to another active patient.` };
    }

    // 3. Unique Patient ID check
    const cleanId = (patientFormData.id || '').trim();
    if (!cleanId) {
      return { success: false, error: 'Patient ID is required.' };
    }
    const idExists = facilityData.patients.some(p => p.id.toLowerCase() === cleanId.toLowerCase());
    if (idExists) {
      addToast('error', 'Duplicate ID', `Patient ID ${cleanId} already exists in the system.`);
      return { success: false, error: `Patient ID ${cleanId} already exists in the system.` };
    }

    const todayDate = getDateOffset(0);
    const admissionTime = patientFormData.admissionTime || new Date().toTimeString().substring(0, 5);

    const newPatient = {
      id: cleanId,
      name: patientFormData.name.trim(),
      age: parseInt(patientFormData.age, 10),
      gender: patientFormData.gender || 'Not Specified',
      bedNumber: bedNum,
      admissionDate: patientFormData.admissionDate || todayDate,
      admissionTime,
      initialTemperature: parseFloat(patientFormData.initialTemperature),
      status: 'ADMITTED',
      notes: patientFormData.notes || '',
      doctorApproval: {
        status: 'PENDING',
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        notes: null,
      },
    };

    // Also automatically create initial temperature log
    const initialTempReading = {
      id: `T-${Date.now()}`,
      patientId: newPatient.id,
      temperature: newPatient.initialTemperature,
      date: newPatient.admissionDate,
      time: newPatient.admissionTime,
      nurseName: USER_ROLES[currentRole]?.name || 'Admitting Staff',
      notes: 'Initial admission temperature check.',
    };

    const newAct = logActivity(
      'PATIENT_ADMITTED',
      USER_ROLES[currentRole]?.label || 'Staff',
      USER_ROLES[currentRole]?.name || 'Staff',
      newPatient.id,
      newPatient.name,
      `Admitted ${newPatient.name} (Bed ${newPatient.bedNumber}). Initial temp: ${newPatient.initialTemperature}°C.`
    );

    setFacilityData(prev => ({
      ...prev,
      patients: [newPatient, ...prev.patients],
      temperatures: [initialTempReading, ...prev.temperatures],
      activities: [newAct, ...prev.activities],
    }));

    addToast('success', 'Patient Admitted', `${newPatient.name} has been admitted and assigned to Bed ${newPatient.bedNumber}.`);
    return { success: true, patient: newPatient };
  };

  // Record Temperature
  const recordTemperature = (tempData) => {
    const patient = facilityData.patients.find(p => p.id === tempData.patientId);
    if (!patient) {
      addToast('error', 'Error', 'Patient not found.');
      return { success: false, error: 'Patient not found.' };
    }

    if (patient.status !== 'ADMITTED') {
      addToast('error', 'Patient Inactive', 'Cannot log temperature for a discharged patient.');
      return { success: false, error: 'Cannot log temperature for a discharged patient.' };
    }

    const tempVal = parseFloat(tempData.temperature);
    if (isNaN(tempVal) || tempVal < 34.0 || tempVal > 44.0) {
      addToast('error', 'Invalid Temperature', 'Please enter a realistic temperature between 34.0°C and 44.0°C.');
      return { success: false, error: 'Please enter a realistic temperature between 34.0°C and 44.0°C.' };
    }

    const reading = {
      id: `T-${Date.now()}`,
      patientId: patient.id,
      temperature: tempVal,
      date: tempData.date || getDateOffset(0),
      time: tempData.time || new Date().toTimeString().substring(0, 5),
      nurseName: tempData.nurseName || USER_ROLES[currentRole]?.name || 'Elena Rostova, RN',
      notes: tempData.notes || '',
    };

    const isFever = tempVal >= (facilityData.config?.feverThreshold || 38.0);
    const newAct = logActivity(
      isFever ? 'FEVER_ALERT' : 'TEMP_LOGGED',
      USER_ROLES[currentRole]?.label || 'Nurse',
      reading.nurseName,
      patient.id,
      patient.name,
      isFever
        ? `HIGH FEVER ALERT: ${tempVal}°C recorded for ${patient.name} (Bed ${patient.bedNumber}). Escalated to Doctor.`
        : `Logged temperature of ${tempVal}°C for ${patient.name} (Bed ${patient.bedNumber}).`
    );

    setFacilityData(prev => ({
      ...prev,
      temperatures: [reading, ...prev.temperatures],
      activities: [newAct, ...prev.activities],
    }));

    if (isFever) {
      addToast('warning', 'Fever Reading Recorded', `Recorded ${tempVal}°C for ${patient.name}. Medical review required.`);
    } else {
      addToast('success', 'Temperature Saved', `Recorded ${tempVal}°C for ${patient.name}.`);
    }

    return { success: true, reading };
  };

  // Record Doctor Visit
  const recordDoctorVisit = (visitData) => {
    const patient = facilityData.patients.find(p => p.id === visitData.patientId);
    if (!patient) {
      addToast('error', 'Error', 'Patient not found.');
      return { success: false, error: 'Patient not found.' };
    }

    const visit = {
      id: `V-${Date.now()}`,
      patientId: patient.id,
      date: visitData.date || getDateOffset(0),
      time: visitData.time || new Date().toTimeString().substring(0, 5),
      doctorName: visitData.doctorName || USER_ROLES[currentRole]?.name || 'Dr. Marcus Vance, MD',
      observations: visitData.observations || '',
      treatmentNotes: visitData.treatmentNotes || '',
      followUpInstructions: visitData.followUpInstructions || '',
      status: visitData.status || 'Completed',
      hasSameDayTempCheck: visitData.hasSameDayTempCheck ?? true,
      isUrgentOverride: visitData.isUrgentOverride || false,
    };

    const newAct = logActivity(
      'DOCTOR_VISIT',
      'Doctor',
      visit.doctorName,
      patient.id,
      patient.name,
      `Completed doctor visit for ${patient.name} (Bed ${patient.bedNumber}). Status: ${visit.status}.`
    );

    setFacilityData(prev => ({
      ...prev,
      visits: [visit, ...prev.visits],
      activities: [newAct, ...prev.activities],
    }));

    addToast('success', 'Doctor Visit Logged', `Clinical visit recorded for ${patient.name}.`);
    return { success: true, visit };
  };

  // Review Discharge Eligibility (Doctor approval or rejection)
  const reviewDischargeEligibility = ({ patientId, decision, rejectionReason, notes }) => {
    const patient = facilityData.patients.find(p => p.id === patientId);
    if (!patient) {
      addToast('error', 'Error', 'Patient not found.');
      return { success: false, error: 'Patient not found.' };
    }

    // Role check
    if (currentRole !== 'DOCTOR') {
      addToast('error', 'Permission Denied', 'Only a Doctor can approve or reject discharge eligibility.');
      return { success: false, error: 'Only a Doctor can approve or reject discharge eligibility.' };
    }

    const doctorName = USER_ROLES[currentRole].name;
    const nowIso = new Date().toISOString();

    const updatedApproval = {
      status: decision, // 'APPROVED' or 'REJECTED'
      approvedBy: doctorName,
      approvedAt: nowIso,
      rejectionReason: decision === 'REJECTED' ? rejectionReason : null,
      notes: notes || '',
    };

    const updatedPatients = facilityData.patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          doctorApproval: updatedApproval,
        };
      }
      return p;
    });

    const newAct = logActivity(
      decision === 'APPROVED' ? 'DOCTOR_APPROVAL' : 'DOCTOR_REJECTION',
      'Doctor',
      doctorName,
      patient.id,
      patient.name,
      decision === 'APPROVED'
        ? `Doctor approved discharge eligibility for ${patient.name} (Bed ${patient.bedNumber}). Ready for Administrator final discharge.`
        : `Doctor rejected discharge eligibility for ${patient.name}. Reason: ${rejectionReason}`
    );

    setFacilityData(prev => ({
      ...prev,
      patients: updatedPatients,
      activities: [newAct, ...prev.activities],
    }));

    if (decision === 'APPROVED') {
      addToast('success', 'Discharge Approved', `Doctor clinical clearance granted for ${patient.name}. Awaiting Administrator final discharge.`);
    } else {
      addToast('warning', 'Discharge Rejected', `Discharge rejected for ${patient.name}. Patient remains in facility for observation.`);
    }

    return { success: true };
  };

  // Finalize Discharge (Administrator action)
  const finalizeDischarge = ({ patientId, outcome, dischargeDate, dischargeTime, dischargeNotes }) => {
    const patient = facilityData.patients.find(p => p.id === patientId);
    if (!patient) {
      addToast('error', 'Error', 'Patient not found.');
      return { success: false, error: 'Patient not found.' };
    }

    // 1. Role check: Only Administrator can perform final discharge
    if (currentRole !== 'ADMIN') {
      addToast('error', 'Permission Denied', 'Only an Administrator can process final patient discharge and bed release.');
      return { success: false, error: 'Only an Administrator can process final patient discharge and bed release.' };
    }

    // 2. Doctor approval check (Guardrail: Cannot discharge without doctor's clinical approval)
    if (patient.doctorApproval?.status !== 'APPROVED') {
      addToast('error', 'Doctor Approval Required', 'Administrator cannot discharge a patient without prior Doctor clinical approval.');
      return { success: false, error: 'Administrator cannot discharge a patient without prior Doctor clinical approval.' };
    }

    const adminName = USER_ROLES[currentRole].name;
    const releasedBed = patient.bedNumber;
    const finalDate = dischargeDate || getDateOffset(0);
    const finalTime = dischargeTime || new Date().toTimeString().substring(0, 5);

    const updatedPatients = facilityData.patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          status: 'DISCHARGED',
          bedNumber: null, // Bed released immediately!
          outcome: outcome || 'Recovered',
          dischargeDate: finalDate,
          dischargeTime: finalTime,
          dischargedBy: adminName,
          dischargeNotes: dischargeNotes || '',
        };
      }
      return p;
    });

    const newAct = logActivity(
      'PATIENT_DISCHARGED',
      'Administrator',
      adminName,
      patient.id,
      patient.name,
      `Processed final discharge for ${patient.name} (Outcome: ${outcome}). Bed ${releasedBed} is now vacant and ready for sanitization.`
    );

    setFacilityData(prev => ({
      ...prev,
      patients: updatedPatients,
      activities: [newAct, ...prev.activities],
    }));

    addToast('success', 'Patient Discharged', `${patient.name} has been discharged (${outcome}). Bed ${releasedBed} has been released.`);
    return { success: true, releasedBed };
  };

  // Computed facility metrics
  const facilityMetrics = useMemo(() => {
    return calculateFacilityMetrics(
      facilityData.patients,
      facilityData.temperatures,
      facilityData.visits,
      facilityData.config
    );
  }, [facilityData]);

  const value = {
    currentRole,
    setCurrentRole,
    currentUser: USER_ROLES[currentRole],
    roles: USER_ROLES,
    patients: facilityData.patients,
    temperatures: facilityData.temperatures,
    visits: facilityData.visits,
    activities: facilityData.activities,
    config: facilityData.config,
    facilityMetrics,
    toasts,
    addToast,
    removeToast,
    resetDemoData,
    updateConfig,
    registerPatient,
    recordTemperature,
    recordDoctorVisit,
    reviewDischargeEligibility,
    finalizeDischarge,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
