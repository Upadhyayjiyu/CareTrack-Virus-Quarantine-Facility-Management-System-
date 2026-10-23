import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sliders, AlertCircle, X, Check } from 'lucide-react';

export default function ConfigModal({ isOpen, onClose }) {
  const { config, updateConfig } = useApp();
  const [feverThreshold, setFeverThreshold] = useState(config?.feverThreshold ?? 38.0);
  const [consecutiveDays, setConsecutiveDays] = useState(config?.consecutiveDays ?? 3);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    updateConfig({
      feverThreshold: parseFloat(feverThreshold),
      consecutiveDays: parseInt(consecutiveDays, 10),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Clinical Rules Configuration</h3>
              <p className="text-xs text-slate-500">Configure quarantine recovery and fever parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Demonstration Notice:</strong> In a real clinical environment, threshold alterations require authorized institutional ethics and clinical protocol approval.
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Fever Threshold (°C)
            </label>
            <input
              type="number"
              step="0.1"
              min="37.0"
              max="40.0"
              value={feverThreshold}
              onChange={(e) => setFeverThreshold(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono-numbers"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Standard clinical demonstration threshold is 38.0°C. Readings at or above this trigger fever alerts and disqualify recovery days.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Consecutive Fever-Free Full Days Required
            </label>
            <input
              type="number"
              min="1"
              max="14"
              value={consecutiveDays}
              onChange={(e) => setConsecutiveDays(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono-numbers"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Assessment requirement: 3 full consecutive fever-free calendar days before doctor discharge review.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
