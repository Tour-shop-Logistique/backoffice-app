import React from 'react';

const StatCard = ({ label, value, unit = "CFA", icon: Icon, variant = "white", colorClass = "text-slate-900", subtitle }) => {
    const isDark = variant === "dark";
    
    // Déterminer la couleur de fond pour l'icône selon la couleur du texte
    const getIconBgColor = () => {
        if (colorClass.includes('emerald')) return 'bg-emerald-50';
        if (colorClass.includes('blue')) return 'bg-blue-50';
        if (colorClass.includes('amber')) return 'bg-amber-50';
        if (colorClass.includes('orange')) return 'bg-orange-50';
        if (colorClass.includes('purple')) return 'bg-purple-50';
        if (colorClass.includes('rose')) return 'bg-rose-50';
        return 'bg-slate-50';
    };
    
    // Déterminer la couleur de l'icône
    const getIconColor = () => {
        if (colorClass.includes('emerald')) return 'text-emerald-600';
        if (colorClass.includes('blue')) return 'text-blue-600';
        if (colorClass.includes('amber')) return 'text-amber-600';
        if (colorClass.includes('orange')) return 'text-orange-600';
        if (colorClass.includes('purple')) return 'text-purple-600';
        if (colorClass.includes('rose')) return 'text-rose-600';
        return 'text-slate-600';
    };

    return (
        <div className={`rounded-xl shadow-sm border border-slate-200 p-6 transition-all duration-300 hover:shadow-md ${
            isDark 
                ? 'bg-slate-900 border-slate-800 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
        }`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {label}
                    </p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : colorClass}`}>
                            {(value || 0).toLocaleString()}
                        </p>
                        {unit && (
                            <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {unit}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className={`text-xs text-slate-500 mt-2`}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-lg ${getIconBgColor()} ml-4`}>
                        <Icon className={getIconColor()} size={20} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
