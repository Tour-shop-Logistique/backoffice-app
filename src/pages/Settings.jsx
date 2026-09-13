import { useState } from 'react';
import { useSelector } from 'react-redux';
import ProfilePage from './ProfilePage';
import BackofficeSetup from './BackofficeSetup';
import ExportConfiguration from './ExportConfiguration';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'is_backoffice_admin';

  // "Sauvegarde des configs" reste réservée aux admins (même règle que
  // l'ancienne route dédiée /export-configuration, adminOnly côté Sidebar).
  const TABS = [
    { id: 'profile', label: 'Mon profil' },
    { id: 'backoffice', label: 'Backoffice' },
    ...(isAdmin ? [{ id: 'backup', label: 'Sauvegarde' }] : []),
  ];

  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Paramètres</h1>
        <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
          Votre compte, la configuration de votre backoffice et la sauvegarde de vos données, au même endroit
        </p>
      </div>

      {/* Onglets pleine largeur, répartis en colonnes égales (2 ou 3 selon
          isAdmin) : pas de largeur fixe (w-fit) qui déborderait sur mobile. */}
      <div className={`grid gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm ${TABS.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 rounded-lg text-sm font-semibold text-center transition-all ${activeTab === tab.id
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
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
      {isAdmin && (
        <div className={activeTab === 'backup' ? '' : 'hidden'}>
          <ExportConfiguration />
        </div>
      )}
    </div>
  );
};

export default Settings;
