import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

const NotificationPortal = ({ notification, onClose }) => {
  const portalRoot = document.getElementById('notification-root');
  if (!portalRoot || !notification) return null;

  return ReactDOM.createPortal(
    <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl z-[10000] ${notification.type === 'error'
      ? 'bg-red-500 border-red-700'
      : 'bg-green-500 border-green-700'
      } text-white min-w-[300px] flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300`}>
      <span className="font-bold text-sm tracking-wide">{notification.message}</span>
      <button
        onClick={onClose}
        className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
        title="Fermer"
      >
        <X size={18} />
      </button>
    </div>,
    portalRoot
  );
};

export default NotificationPortal;
