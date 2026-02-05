import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const NotificationPortal = ({ notification, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !notification) return null;

  const portalRoot = document.getElementById('notification-root');
  if (!portalRoot) {
    console.warn("Element #notification-root non trouvé dans le DOM");
    return null;
  }

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'error': return 'bg-rose-600 border-rose-700 shadow-rose-200';
      case 'success': return 'bg-emerald-600 border-emerald-700 shadow-emerald-200';
      case 'info': return 'bg-blue-600 border-blue-700 shadow-blue-200';
      default: return 'bg-slate-800 border-slate-900 shadow-slate-200';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'error': return <AlertCircle size={18} />;
      case 'success': return <CheckCircle2 size={18} />;
      default: return <Info size={18} />;
    }
  };

  return ReactDOM.createPortal(
    <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl z-[10000] border ${getTypeStyles()} text-white min-w-[320px] max-w-[400px] flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300`}>
      <div className="flex items-center gap-3">
        <div className="shrink-0 opacity-90">
          {getIcon()}
        </div>
        <span className="font-bold text-sm tracking-wide leading-tight">{notification.message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors shrink-0"
        title="Fermer"
      >
        <X size={18} />
      </button>
    </div>,
    portalRoot
  );
};

export default NotificationPortal;
