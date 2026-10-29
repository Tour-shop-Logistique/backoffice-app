import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Megaphone, MessageSquare } from 'lucide-react';
import { selectUnreadConversationsCount } from '../redux/slices/messageSlice';
import Announcements from './Announcements';
import Messages from './Messages';
import { ROUTES } from '../routes';
import Tabs from '../components/common/Tabs';

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
      <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 md:-mx-8 md:px-8 pt-4 lg:pt-2 pb-3 flex flex-wrap items-center justify-between gap-3">
        <header>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Communication</h1>
          <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
            Annonces et messagerie avec les agences partenaires
          </p>
        </header>

        <Tabs
          className="w-full sm:w-auto"
          tabs={TABS.map((tab) => ({
            id: tab.key,
            label: tab.label,
            icon: tab.icon,
            count: tab.key === 'messages' ? unreadConversationsCount : undefined,
            alert: true,
          }))}
          active={activeTab}
          onChange={(key) => handleTabChange(TABS.find((tab) => tab.key === key))}
        />
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
