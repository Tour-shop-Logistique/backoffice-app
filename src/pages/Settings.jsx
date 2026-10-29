import { useState } from 'react';
import { useSelector } from 'react-redux';
import ProfilePage from './ProfilePage';
import BackofficeSetup from './BackofficeSetup';
import ExportConfiguration from './ExportConfiguration';
import Tabs from '../components/common/Tabs';

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

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

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
