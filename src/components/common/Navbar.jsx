import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import RoleSwitcher from './RoleSwitcher';
import ConfigModal from './ConfigModal';
import ConfirmDialog from './ConfirmDialog';
import { Activity, RotateCcw, Settings, Menu, ShieldAlert, Sparkles, User } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { currentUser, resetDemoData, currentRole } = useApp();
  const [configOpen, setConfigOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        {/* Top Assessment Banner */}
        <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white px-4 py-1.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
              Demo Mode
            </span>
            <span className="hidden sm:inline opacity-90">
              CareTrack — Technical Product Manager Assessment (Fictional Quarantine Data)
            </span>
            <span className="sm:hidden opacity-90">CareTrack Demo</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="hidden md:inline">Max Capacity: 74 Beds</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Expected Mortality: 15%</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight">CareTrack</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded-md">v1.0</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium -mt-0.5 hidden sm:block">
                  Virus Quarantine Facility Management
                </div>
              </div>
            </div>
          </div>

          {/* Center / Right: Role Switcher & User Details */}
          <div className="flex items-center gap-3">
            {/* Quick Role Switcher */}
            <div className="hidden sm:block">
              <RoleSwitcher />
            </div>

            {/* Current User Badge */}
            <div className="hidden xl:flex items-center gap-2.5 pl-3 border-l border-slate-200 text-left">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {currentUser.title}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 pl-2 sm:border-l border-slate-200">
              <button
                onClick={() => setConfigOpen(true)}
                title="Configure Clinical Rules (Fever threshold & recovery days)"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span className="hidden md:inline">Rules</span>
              </button>

              <button
                onClick={() => setResetConfirmOpen(true)}
                title="Reset application to original seed demo data"
                className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 text-xs font-semibold border border-transparent hover:border-rose-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline">Reset Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Role Switcher Bar */}
        <div className="sm:hidden px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500">Active Role:</span>
          <RoleSwitcher />
        </div>
      </header>

      {/* Configuration Modal */}
      <ConfigModal isOpen={configOpen} onClose={() => setConfigOpen(false)} />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetConfirmOpen}
        title="Reset Demo Data to Initial State?"
        message="This will reset all patient records, temperature logs, visits, and discharged beds back to the original demonstration dataset. Any newly admitted patients or recent readings will be restored."
        confirmLabel="Reset Everything"
        cancelLabel="Keep Changes"
        isDestructive={true}
        onConfirm={() => {
          resetDemoData();
          setResetConfirmOpen(false);
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </>
  );
}
