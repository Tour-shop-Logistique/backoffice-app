import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Megaphone, MessageSquare } from 'lucide-react';
import { selectUnreadConversationsCount } from '../redux/slices/messageSlice';
import Announcements from './Announcements';
import Messages from './Messages';
import { ROUTES } from '../routes';

const TABS = [
  { key: 'annonces', label: 'Annonces', icon: Megaphone, path: ROUTES.ANNOUNCEMENTS },
  { key: 'messages', label: 'Messages', icon: MessageSquare, path: ROUTES.MESSAGES },
];

const Communication = () => {
  const navigate = useNavigate();
  const unreadConversationsCount = useSelector(selectUnreadConversationsCount);

  // Toujours revenir sur l'onglet Annonces par defaut en revisitant la page,
  // meme si "Messages" etait actif la derniere fois qu'on l'a quittee.
  const [activeTab, setActiveTab] = useState('annonces');

  const handleTabChange = (tab) => {
    setActiveTab(tab.key);
    navigate(tab.path, { replace: true });
  };

  return (
    <div className="space-y-4 md:space-y-6 font-sans">
      <header>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Communication</h1>
        <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
          Annonces et messagerie avec les agences partenaires
        </p>
      </header>

      <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 md:-mx-8 md:px-8 pt-2 pb-3">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1.5 w-fit shadow-sm">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const showBadge = tab.key === 'messages' && unreadConversationsCount > 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
                {showBadge && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {unreadConversationsCount > 99 ? '99+' : unreadConversationsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Les deux pages restent montees en permanence (juste masquees) pour ne
          pas relancer leur chargement initial a chaque changement d'onglet. */}
      <div className={activeTab === 'annonces' ? '' : 'hidden'}>
        <Announcements />
      </div>
      <div className={activeTab === 'messages' ? '' : 'hidden'}>
        <Messages />
      </div>
    </div>
  );
};

export default Communication;
