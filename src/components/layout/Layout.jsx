import React, { useState, useEffect, Suspense } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchBackofficeConfig } from '../../redux/slices/backofficeSlice';
import { fetchTarifs, fetchGroupedTarifs } from '../../redux/slices/tarificationSlice';
import { fetchZones } from '../../redux/slices/zoneSlice';
import { fetchAgences } from '../../redux/slices/agenceSlice';
import { fetchProduits } from '../../redux/slices/produitSlice';
import { ROUTES } from '../../routes';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Building2 } from 'lucide-react';

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isConfigured, loading, config } = useSelector((state) => state.backoffice);
  const { hasLoaded: tarifsLoaded } = useSelector((state) => state.tarification);
  const { hasLoaded: zonesLoaded } = useSelector((state) => state.zones);
  const { hasLoaded: agencesLoaded } = useSelector((state) => state.agences);
  const { hasLoadedProduits: produitsLoaded } = useSelector((state) => state.produits);

  useEffect(() => {
    // Ne charger que si pas de config en cache et pas déjà en cours de chargement
    if (loading === 'idle' && !config) {
      dispatch(fetchBackofficeConfig());
    }
  }, [dispatch, loading, config]);

  // Redirection forcée vers le setup si non configuré
  useEffect(() => {
    // Rediriger si le chargement est fini (succès ou échec "normal" de non-config) et que ce n'est pas configuré
    const isFinished = loading === 'succeeded' || loading === 'failed';
    if (isFinished && !isConfigured && location.pathname !== ROUTES.BACKOFFICE_SETUP) {
      navigate(ROUTES.BACKOFFICE_SETUP);
    }
  }, [loading, isConfigured, navigate, location.pathname]);

  // Chargement des données globales au démarrage
  useEffect(() => {
    if (isConfigured) {
      if (!tarifsLoaded) {
        dispatch(fetchTarifs());
        dispatch(fetchGroupedTarifs());
      }
      if (!zonesLoaded) dispatch(fetchZones());
      if (!agencesLoaded) dispatch(fetchAgences());
      if (!produitsLoaded) dispatch(fetchProduits());
    }
  }, [dispatch, isConfigured, tarifsLoaded, zonesLoaded, agencesLoaded, produitsLoaded]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-surface-50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Topbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface-100 p-4 md:p-6 lg:p-8">
          {loading === 'pending' && <LoadingSpinner fullScreen={false} />}

          {loading === 'failed' && !isConfigured && (
            <div className=" p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex justify-between items-center transition-all animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Building2 size={16} />
                </div>
                <span className="text-sm font-medium">Votre espace n'est pas encore configuré.</span>
              </div>
              <button onClick={() => navigate(ROUTES.BACKOFFICE_SETUP)} className="text-xs font-bold uppercase tracking-widest bg-amber-200/50 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">Configurer</button>
            </div>
          )}

          {loading === 'failed' && isConfigured && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex justify-between items-center">
              <span>Erreur lors de la synchronisation de la configuration.</span>
              <button onClick={() => dispatch(fetchBackofficeConfig())} className="text-sm font-bold underline">Réessayer</button>
            </div>
          )}
          <Suspense fallback={<LoadingSpinner />}>
            {/* Si en chargement, on ne montre rien (le spinner global au dessus s'en occupe) */}
            {loading === 'pending' ? null : (
              /* Si non configuré, on ne rend que la page de setup, rien d'autre */
              !isConfigured && (loading === 'succeeded' || loading === 'failed') && location.pathname !== ROUTES.BACKOFFICE_SETUP ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Configuration requise</h3>
                    <p className="text-slate-500 mt-2 mb-6">Veuillez d'abord configurer votre backoffice pour accéder aux fonctionnalités.</p>
                    <button
                      onClick={() => navigate(ROUTES.BACKOFFICE_SETUP)}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm tracking-wide"
                    >
                      Aller à la configuration
                    </button>
                  </div>
                </div>
              ) : (
                children
              )
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default Layout;
