import React from 'react';

const StatCard = ({ label, value, unit = "CFA", icon: Icon, variant = "white", colorClass = "text-slate-900" }) => {
    const isDark = variant === "dark";
    
    return (
        <div className={`${isDark ? 'bg-slate-900 border-slate-800 shadow-lg' : 'bg-white border-slate-200 shadow-sm'} p-5 rounded-xl border relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {Icon && <Icon size={64} className={isDark ? 'text-white' : 'text-slate-800'} />}
            </div>
            <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-400'} uppercase tracking-widest mb-1`}>{label}</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : colorClass}`}>
                {value?.toLocaleString() || 0} {unit && <span className={`text-xs font-medium uppercase ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>{unit}</span>}
            </p>
        </div>
    );
};

export default StatCard;
