import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BedMapModal from '../dashboard/BedMapModal';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Thermometer,
  Stethoscope,
  FileCheck,
  BarChart3,
  Bed,
  AlertTriangle,
  ChevronRight,
  Shield,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, onSelectPatient }) {
  const { facilityMetrics, currentRole, TOTAL_CAPACITY } = useApp();
  const [bedMapOpen, setBedMapOpen] = useState(false);

  const navLinks = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      roleTag: null,
    },
    {
      to: '/patients',
      label: 'Patient Directory',
      icon: Users,
      badge: facilityMetrics.totalAdmitted,
      badgeColor: 'bg-slate-100 text-slate-700',
      roleTag: null,
    },
    {
      to: '/register',
      label: 'Patient Admission',
      icon: UserPlus,
      badge: null,
      roleTag: 'ADMIN',
      roleNote: 'Admin Only',
    },
    {
      to: '/nurse-entry',
      label: 'Temperature Entry',
      icon: Thermometer,
      badge: facilityMetrics.patientsNeedingTempTodayCount > 0 ? facilityMetrics.patientsNeedingTempTodayCount : null,
      badgeColor: 'bg-amber-100 text-amber-800',
      roleTag: 'NURSE',
      roleNote: 'Nurse Action',
    },
    {
      to: '/doctor-visits',
      label: 'Doctor Visits',
      icon: Stethoscope,
      badge: facilityMetrics.patientsAwaitingVisitTodayCount > 0 ? facilityMetrics.patientsAwaitingVisitTodayCount : null,
      badgeColor: 'bg-sky-100 text-sky-800',
      roleTag: 'DOCTOR',
      roleNote: 'Doctor Action',
    },
    {
      to: '/discharge-review',
      label: 'Discharge Review',
      icon: FileCheck,
      badge: facilityMetrics.dischargeEligibleCount > 0 ? facilityMetrics.dischargeEligibleCount : null,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      roleTag: 'DOCTOR & ADMIN',
      roleNote: 'Clinical & Admin',
    },
    {
      to: '/reports',
      label: 'Reports & Outcomes',
      icon: BarChart3,
      badge: facilityMetrics.incompleteRecordWarningsCount > 0 ? '!' : null,
      badgeColor: 'bg-rose-100 text-rose-700 font-bold',
      roleTag: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-[calc(100vh-65px)] transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Facility Workflows
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isRoleMatched =
              !link.roleTag ||
              link.roleTag === currentRole ||
              (link.roleTag === 'DOCTOR & ADMIN' && (currentRole === 'DOCTOR' || currentRole === 'ADMIN'));

            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 shadow-xs border border-sky-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${!isRoleMatched ? 'opacity-85' : ''}`
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-slate-800" />
                  <span className="truncate">{link.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {link.badge !== null && link.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded-md font-bold ${
                        link.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                  {link.roleNote && (
                    <span className="hidden xl:inline text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                      {link.roleNote}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Facility Capacity Card at bottom */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-sky-600" /> Bed Occupancy
              </span>
              <span className="text-xs font-mono-numbers font-bold text-slate-700">
                {facilityMetrics.occupiedBeds} / {facilityMetrics.totalCapacity}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  facilityMetrics.occupiedBeds >= 70
                    ? 'bg-rose-500'
                    : facilityMetrics.occupiedBeds >= 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${facilityMetrics.occupancyPercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2.5">
              <span>{facilityMetrics.availableBeds} beds available</span>
              <span>{facilityMetrics.occupancyPercentage}% full</span>
            </div>

            <button
              onClick={() => setBedMapOpen(true)}
              className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <span>View 74-Bed Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Bed Map Modal */}
      <BedMapModal
        isOpen={bedMapOpen}
        onClose={() => setBedMapOpen(false)}
        onSelectPatient={onSelectPatient}
      />
    </>
  );
}
