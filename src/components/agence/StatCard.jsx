import React from 'react';

const StatCard = ({ label, value, unit = "CFA", icon: Icon, variant = "white", colorClass = "text-slate-900", subtitle }) => {
    const isDark = variant === "dark";
    
    // Determine the accent color from colorClass
    const getAccentColor = () => {
        if (isDark) return 'bg-slate-700';
        if (colorClass.includes('emerald')) return 'bg-emerald-500';
        if (colorClass.includes('blue')) return 'bg-blue-500';
        if (colorClass.includes('amber')) return 'bg-amber-500';
        return 'bg-slate-200';
    };

    return (
        <div className={`group relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            isDark 
                ? 'bg-slate-900 border-slate-800 text-white shadow-2xl' 
                : 'bg-white border-slate-100 text-slate-900 shadow-sm'
        }`}>
            {/* Accent Top Bar */}
            <div className={`absolute top-0 left-0 w-full h-1 ${getAccentColor()} opacity-60`} />
            
            {/* Background Shape */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-50'} transition-transform duration-500 group-hover:scale-150`} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {label}
                    </p>
                    {Icon && (
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'} group-hover:scale-110 transition-transform`}>
                            <Icon size={14} />
                        </div>
                    )}
                </div>

                <div className="flex items-baseline gap-1.5">
                    <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : colorClass.replace('text-', 'text-')}`}>
                        {(value || 0).toLocaleString()}
                    </h3>
                    {unit && (
                        <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                            {unit}
                        </span>
                    )}
                </div>

                {(subtitle || (unit && unit.includes('('))) && (
                    <div className="mt-3 flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                        <p className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {subtitle || unit.split(' ')[1]?.replace(/[()]/g, '') || 'Global'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
