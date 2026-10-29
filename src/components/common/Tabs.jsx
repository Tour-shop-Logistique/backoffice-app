import React from 'react';

/**
 * Onglets soulignés (icône + libellé + pastille de compte), fond transparent.
 * Défilement horizontal quand ils ne tiennent pas en largeur (mobile).
 * tabs : [{ id, label, shortLabel?, icon?, count?, alert? }]
 * `alert` colore la pastille en rouge (ex. messages non lus).
 */
const Tabs = ({ tabs, active, onChange, className = '' }) => (
  <div
    role="tablist"
    className={`flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 ${className}`}
  >
    {tabs.map(({ id, label, shortLabel, icon: Icon, count, alert }) => {
      const isActive = active === id;
      const hasCount = count !== undefined && count !== null && count > 0;
      return (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(id)}
          className={`flex shrink-0 items-center gap-2 px-3 sm:px-4 py-3 -mb-px text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            isActive
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          {Icon && <Icon size={16} className={isActive ? 'text-slate-900' : 'text-slate-400'} />}
          {shortLabel ? (
            <>
              <span className="md:hidden">{shortLabel}</span>
              <span className="hidden md:inline">{label}</span>
            </>
          ) : (
            label
          )}
          {hasCount && (
            <span
              className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold leading-none ${
                alert
                  ? 'bg-red-500 text-white'
                  : isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default Tabs;
