import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import ToastContainer from './components/common/ToastContainer';
import PatientDetailsModal from './components/patients/PatientDetailsModal';

// Pages
import DashboardPage from './pages/DashboardPage';
import PatientRegistrationPage from './pages/PatientRegistrationPage';
import PatientDirectoryPage from './pages/PatientDirectoryPage';
import NurseTemperaturePage from './pages/NurseTemperaturePage';
import DoctorVisitsPage from './pages/DoctorVisitsPage';
import DischargeReviewPage from './pages/DischargeReviewPage';
import ReportsPage from './pages/ReportsPage';

function AppLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalModalPatient, setGlobalModalPatient] = useState(null);

  const handleGlobalNavigate = (path, patientId) => {
    navigate(path, { state: { selectedPatientId: patientId } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectPatient={(p) => setGlobalModalPatient(p)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientDirectoryPage />} />
            <Route path="/register" element={<PatientRegistrationPage />} />
            <Route path="/nurse-entry" element={<NurseTemperaturePage />} />
            <Route path="/doctor-visits" element={<DoctorVisitsPage />} />
            <Route path="/discharge-review" element={<DischargeReviewPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Global Patient Details Modal if selected from Bed Map */}
      <PatientDetailsModal
        patient={globalModalPatient}
        isOpen={Boolean(globalModalPatient)}
        onClose={() => setGlobalModalPatient(null)}
        onNavigateAction={(path, patientId) => {
          setGlobalModalPatient(null);
          handleGlobalNavigate(path, patientId);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  );
}
