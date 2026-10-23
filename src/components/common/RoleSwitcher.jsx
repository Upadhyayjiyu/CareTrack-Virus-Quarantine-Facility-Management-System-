import React, { useState } from 'react';
import { useApp, USER_ROLES } from '../../context/AppContext';
import { ShieldCheck, Stethoscope, UserCog, HeartPulse, ChevronDown } from 'lucide-react';

export default function RoleSwitcher() {
  const { currentRole, setCurrentRole, currentUser, addToast } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleRoleSelect = (roleKey) => {
    if (roleKey !== currentRole) {
      setCurrentRole(roleKey);
      const newRole = USER_ROLES[roleKey];
      addToast('info', `Switched Role to ${newRole.label}`, `Now acting as ${newRole.name}. Permissions updated.`);
    }
    setDropdownOpen(false);
  };

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'NURSE':
        return <HeartPulse className="w-4 h-4 text-emerald-600" />;
      case 'DOCTOR':
        return <Stethoscope className="w-4 h-4 text-sky-600" />;
      case 'ADMIN':
        return <UserCog className="w-4 h-4 text-purple-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Role Pill Switcher */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
        {Object.keys(USER_ROLES).map((roleKey) => {
          const role = USER_ROLES[roleKey];
          const isActive = currentRole === roleKey;

          return (
            <button
              key={roleKey}
              onClick={() => handleRoleSelect(roleKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title={role.description}
            >
              {getRoleIcon(roleKey)}
              <span>{role.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
