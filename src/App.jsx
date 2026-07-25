import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { hideNotification } from './redux/slices/uiSlice';
import NotificationPortal from './components/widget/notification';
import { ROUTES } from './routes';

import ProtectedRoute from './components/common/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';

// Composants statiques pour navigation instantanée
import Layout from './components/layout/Layout';
import WelcomePage from './pages/WelcomePage';

// Pages chargées à la demande (code-splitting par route)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agents = lazy(() => import('./pages/Agents'));
const Parcels = lazy(() => import('./pages/Parcels'));
const ParcelHistory = lazy(() => import('./pages/ParcelHistory'));
const Tarification = lazy(() => import('./pages/Tarification'));
const ZoneConfiguration = lazy(() => import('./pages/ZoneConfiguration'));
const AgencePartenaire = lazy(() => import('./pages/AgencePartenaire'));
const AgenceDetail = lazy(() => import('./pages/AgenceDetail'));
const Produits = lazy(() => import('./pages/produits'));
const BackofficeSetup = lazy(() => import('./pages/BackofficeSetup'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ParcelControl = lazy(() => import('./pages/ParcelControl'));
const IncomingParcels = lazy(() => import('./pages/IncomingParcels'));
const Comptabilite = lazy(() => import('./pages/Comptabilite'));
const Historique = lazy(() => import('./pages/Historique'));
const Settings = lazy(() => import('./pages/Settings'));
const Announcements = lazy(() => import('./pages/Announcements'));

// Composant de chargement
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const dispatch = useDispatch();
  const { notification } = useSelector(state => state.ui);

  return (
    <>
      <ScrollToTop />
      <NotificationPortal
        notification={notification}
        onClose={() => dispatch(hideNotification())}
      />
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          {/* Routes Publiques */}
          <Route path={ROUTES.HOME} element={<WelcomePage />} />

          {/* Routes Protégées (Backoffice) */}
          <Route
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Outlet />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          >
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.AGENTS} element={
              <ProtectedRoute adminOnly={true}>
                <Agents />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.PARCELS} element={<Parcels />} />
            <Route path={ROUTES.PARCEL_HISTORY} element={<ParcelHistory />} />
            <Route path={ROUTES.TARIFICATION} element={<Tarification />} />
            <Route path={ROUTES.ZONE_CONFIGURATION} element={<ZoneConfiguration />} />
            <Route path={ROUTES.AGENCE_PARTENAIRE} element={<AgencePartenaire />} />
            <Route path={ROUTES.AGENCE_DETAIL} element={<AgenceDetail />} />
            <Route path={ROUTES.PRODUITS} element={<Produits />} />
            <Route path={ROUTES.BACKOFFICE_SETUP} element={<BackofficeSetup />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.PARCEL_CONTROL} element={<ParcelControl />} />
            <Route path={ROUTES.INCOMING_PARCELS} element={<IncomingParcels />} />
            <Route path={ROUTES.COMPTABILITE} element={<Comptabilite />} />
            <Route path={ROUTES.HISTORIQUE} element={<Historique />} />
            <Route path={ROUTES.SETTINGS} element={<Settings />} />
            <Route path={ROUTES.ANNOUNCEMENTS} element={<Announcements />} />
          </Route>

          {/* Redirection par défaut (catch-all) */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
