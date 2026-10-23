import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TOTAL_CAPACITY } from '../../utils/calculations';
import { X, Bed, AlertCircle, CheckCircle, User } from 'lucide-react';

export default function BedMapModal({ isOpen, onClose, onSelectPatient }) {
  const { patients, temperatures, config } = useApp();
  const feverThreshold = config?.feverThreshold ?? 38.0;

  if (!isOpen) return null;

  // Map beds to occupied patients
  const bedMap = {};
  const activePatients = patients.filter(p => p.status === 'ADMITTED');

  activePatients.forEach(p => {
    if (p.bedNumber) {
      // Find latest temp
      const pTemps = temperatures
        .filter(t => t.patientId === p.id)
        .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));
      
      const latestReading = pTemps[0];
      const latestTemp = latestReading ? Number(latestReading.temperature) : p.initialTemperature;
      const hasFever = latestTemp >= feverThreshold;

      bedMap[p.bedNumber] = {
        patient: p,
        latestTemp,
        hasFever,
        latestCheckTime: latestReading ? `${latestReading.date} ${latestReading.time || ''}` : 'At admission',
      };
    }
  });

  const beds = Array.from({ length: TOTAL_CAPACITY }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                <Bed className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Facility Bed Map (74 Beds)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visual floor plan of all quarantine ward beds. Click any occupied bed to view patient details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600"></span>
            <span>Occupied — Afebrile (&lt; {feverThreshold.toFixed(1)}°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600"></span>
            <span>Occupied — Fever Spike (≥ {feverThreshold.toFixed(1)}°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300"></span>
            <span>Vacant & Sanitized ({TOTAL_CAPACITY - activePatients.length} Beds)</span>
          </div>
        </div>

        {/* Bed Grid */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
            {beds.map(bedNum => {
              const bedData = bedMap[bedNum];
              const isOccupied = Boolean(bedData);

              if (isOccupied) {
                const { patient, latestTemp, hasFever } = bedData;
                return (
                  <button
                    key={bedNum}
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onSelectPatient) onSelectPatient(patient);
                    }}
                    className={`relative p-2.5 rounded-xl border text-left transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                      hasFever
                        ? 'bg-rose-50 border-rose-300 text-rose-950 hover:border-rose-400'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Bed {bedNum}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          hasFever ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                      ></span>
                    </div>
                    <div className="text-[11px] font-semibold truncate leading-tight">
                      {patient.name}
                    </div>
                    <div className="text-[10px] opacity-80 mt-1 font-mono-numbers">
                      {latestTemp.toFixed(1)}°C
                    </div>
                  </button>
                );
              }

              return (
                <div
                  key={bedNum}
                  className="p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-slate-400 text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-500">Bed {bedNum}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 italic">Vacant</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
          <div>
            Total Capacity: <span className="font-bold text-slate-900">{TOTAL_CAPACITY} Beds</span> | Occupied: <span className="font-bold text-slate-900">{activePatients.length}</span> | Available: <span className="font-bold text-emerald-700">{TOTAL_CAPACITY - activePatients.length}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
}
