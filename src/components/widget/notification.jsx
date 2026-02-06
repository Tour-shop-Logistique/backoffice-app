import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info, Bell } from 'lucide-react';

const NotificationPortal = ({ notification, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setMounted(true);
    if (notification) {
      // Trigger entry animation
      const entryTimer = setTimeout(() => setIsVisible(true), 10);

      // Progress bar animation
      const progressTimer = setTimeout(() => setProgress(0), 50);

      const closeTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }, 4500);

      return () => {
        clearTimeout(entryTimer);
        clearTimeout(progressTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [notification, onClose, notification?.id]);

  if (!mounted || !notification) return null;

  const portalRoot = document.getElementById('notification-root');
  if (!portalRoot) return null;

  const config = {
    success: {
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500',
      iconShadow: 'shadow-emerald-500/20',
      Icon: CheckCircle2,
      label: 'Succès'
    },
    error: {
      border: 'border-rose-500/20',
      iconBg: 'bg-rose-500',
      iconShadow: 'shadow-rose-500/20',
      Icon: AlertCircle,
      label: 'Erreur'
    },
    info: {
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500',
      iconShadow: 'shadow-blue-500/20',
      Icon: Info,
      label: 'Information'
    },
    default: {
      border: 'border-slate-500/20',
      iconBg: 'bg-slate-800',
      iconShadow: 'shadow-slate-500/20',
      Icon: Bell,
      label: 'Notification'
    }
  };

  const current = config[notification.type] || config.default;
  const { Icon } = current;

  return ReactDOM.createPortal(
    <div
      className={`fixed top-6 right-6 z-[10000] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
        }`}
    >
      <div className={`
        relative flex items-center gap-4 p-4 pr-5
        bg-white/95 backdrop-blur-xl border ${current.border}
        rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] min-w-[340px] max-w-[440px]
        overflow-hidden group
      `}>
        {/* Progress bar at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-50">
          <div
            className={`h-full ${current.iconBg} transition-all duration-[4500ms] ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={`
          flex h-8 w-8 shrink-0 items-center justify-center rounded-xl 
          ${current.iconBg} text-white shadow-lg ${current.iconShadow}
          animate-in zoom-in-50 duration-500
        `}>
          <Icon size={20} strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-0.5">
            {current.label}
          </p>
          <p className="text-slate-900 text-sm font-medium leading-relaxed">
            {notification.message}
          </p>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 500);
          }}
          className="p-2 -mr-1 hover:bg-slate-100 rounded-xl transition-all duration-200 text-slate-300 hover:text-slate-500"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>
    </div>,
    portalRoot
  );
};

export default NotificationPortal;
