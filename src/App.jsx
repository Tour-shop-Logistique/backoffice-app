import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { hideNotification } from './redux/slices/uiSlice';
import NotificationPortal from './components/widget/notification';
import { ROUTES } from './routes';

import ProtectedRoute from './components/common/ProtectedRoute';

// Composants statiques pour navigation instantanée
import Layout from './components/layout/Layout';
import WelcomePage from './pages/WelcomePage';

import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Parcels from './pages/Parcels';
import SimpleRates from './pages/SimpleRates';
import GroupedRates from './pages/GroupedRates';
import ZoneConfiguration from './pages/ZoneConfiguration';
import AgencePartenaire from './pages/AgencePartenaire';
import AgenceDetail from './pages/AgenceDetail';
import Produits from './pages/produits';
import BackofficeSetup from './pages/BackofficeSetup';

// Composant de chargement
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const dispatch = useDispatch();
  const { notification } = useSelector(state => state.ui);

  return (
    <>
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
            <Route path={ROUTES.SIMPLE_RATES} element={<SimpleRates />} />
            <Route path={ROUTES.GROUPED_RATES} element={<GroupedRates />} />
            <Route path={ROUTES.ZONE_CONFIGURATION} element={<ZoneConfiguration />} />
            <Route path={ROUTES.AGENCE_PARTENAIRE} element={<AgencePartenaire />} />
            <Route path={ROUTES.AGENCE_DETAIL} element={<AgenceDetail />} />
            <Route path={ROUTES.PRODUITS} element={<Produits />} />
            <Route path={ROUTES.BACKOFFICE_SETUP} element={<BackofficeSetup />} />
          </Route>

          {/* Redirection par défaut (catch-all) */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;