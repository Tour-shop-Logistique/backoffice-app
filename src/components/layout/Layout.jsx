import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBackofficeConfig } from '../../redux/slices/backofficeSlice';
import { fetchTarifs, fetchGroupedTarifs } from '../../redux/slices/tarificationSlice';
import { fetchZones } from '../../redux/slices/zoneSlice';
import { fetchAgences } from '../../redux/slices/agenceSlice';
import { fetchProduits } from '../../redux/slices/produitSlice';
import SettingsModal from './SettingsModal';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(true);
  const dispatch = useDispatch();
  const { isConfigured, loading } = useSelector((state) => state.backoffice);
  const { hasLoaded: tarifsLoaded } = useSelector((state) => state.tarification);
  const { hasLoaded: zonesLoaded } = useSelector((state) => state.zones);
  const { hasLoaded: agencesLoaded } = useSelector((state) => state.agences);
  const { hasLoadedProduits: produitsLoaded } = useSelector((state) => state.produits);

  useEffect(() => {
    if (loading === 'idle') {
      dispatch(fetchBackofficeConfig());
    }
  }, [dispatch, loading]);

  // Chargement des données globales au démarrage
  useEffect(() => {
    if (!tarifsLoaded) {
      dispatch(fetchTarifs());
      dispatch(fetchGroupedTarifs());
    }
    if (!zonesLoaded) dispatch(fetchZones());
    if (!agencesLoaded) dispatch(fetchAgences());
    if (!produitsLoaded) dispatch(fetchProduits());
  }, [dispatch, tarifsLoaded, zonesLoaded, agencesLoaded, produitsLoaded]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-surface-50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Topbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface-100 p-4 md:p-6 lg:p-8">
          {loading === 'failed' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex justify-between items-center">
              <span>Erreur lors du chargement de la configuration. Certaines fonctionnalités peuvent être limitées.</span>
              <button onClick={() => dispatch(fetchBackofficeConfig())} className="text-sm font-bold underline">Réessayer</button>
            </div>
          )}
          {children}
        </main>
      </div>
      {!isConfigured && showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
          <SettingsModal closeModal={() => setShowConfigModal(false)} />
        </div>
      )}
    </div>
  );
};

export default Layout;
