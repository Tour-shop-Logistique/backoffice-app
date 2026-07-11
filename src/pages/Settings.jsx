import { useState } from 'react';
import { User, Building2 } from 'lucide-react';
import ProfilePage from './ProfilePage';
import BackofficeSetup from './BackofficeSetup';

const TABS = [
  { id: 'profile', label: 'Mon profil', icon: User },
  { id: 'backoffice', label: 'Configuration du backoffice', icon: Building2 },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Paramètres</h1>
        <p className="text-sm md:text-base text-slate-600 mt-1 font-medium">
          Votre compte et la configuration de votre backoffice, au même endroit
        </p>
      </div>

      <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={activeTab === 'profile' ? '' : 'hidden'}>
        <ProfilePage />
      </div>
      <div className={activeTab === 'backoffice' ? '' : 'hidden'}>
        <BackofficeSetup />
      </div>
    </div>
  );
};

export default Settings;
