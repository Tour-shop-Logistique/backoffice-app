import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import usePushNotifications from '../../hooks/usePushNotifications';

/**
 * Bannière discrète proposant d'activer les notifications push navigateur,
 * affichée une seule fois tant que l'utilisateur n'a pas répondu (accepté,
 * refusé, ou fermé la bannière).
 */
const PushNotificationPrompt = () => {
  const { permission, isSubscribed, isLoading, subscribe, isSupported } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('push-prompt-dismissed') === '1');

  if (!isSupported || permission !== 'default' || isSubscribed || dismissed) {
    return null;
  }

  const dismiss = () => {
    sessionStorage.setItem('push-prompt-dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <Bell size={16} className="text-indigo-600" />
        </div>
        <span className="text-sm font-medium">Activez les notifications pour être alerté même quand cet onglet est fermé.</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={subscribe}
          disabled={isLoading}
          className="text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          Activer
        </button>
        <button onClick={dismiss} className="p-1.5 text-indigo-400 hover:text-indigo-700 rounded-lg transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
