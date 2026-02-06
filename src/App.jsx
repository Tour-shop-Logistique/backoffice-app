import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { hideNotification } from './redux/slices/uiSlice';
import NotificationPortal from './components/widget/notification';
import { ROUTES } from './routes';

import ProtectedRoute from './components/common/ProtectedRoute';

// Lazy loading des pages
const Layout = lazy(() => import('./components/layout/Layout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));

// Pages internes de l'application
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agents = lazy(() => import('./pages/Agents'));
const Parcels = lazy(() => import('./pages/Parcels'));
const SimpleRates = lazy(() => import('./pages/SimpleRates'));
const GroupedRates = lazy(() => import('./pages/GroupedRates'));
const ZoneConfiguration = lazy(() => import('./pages/ZoneConfiguration'));
const AgencePartenaire = lazy(() => import('./pages/AgencePartenaire'));
const AgenceDetail = lazy(() => import('./pages/AgenceDetail'));
const Produits = lazy(() => import('./pages/produits'));

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
  </div>
);

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
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Routes Publiques */}
          <Route path={ROUTES.HOME} element={<WelcomePage />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />

          {/* Routes Protégées (Backoffice) */}
          <Route
            path={`${ROUTES.APP}/*`}
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                    <Route path={ROUTES.AGENTS} element={<Agents />} />
                    <Route path={ROUTES.PARCELS} element={<Parcels />} />
                    <Route path={ROUTES.SIMPLE_RATES} element={<SimpleRates />} />
                    <Route path={ROUTES.GROUPED_RATES} element={<GroupedRates />} />
                    <Route path={ROUTES.ZONE_CONFIGURATION} element={<ZoneConfiguration />} />
                    <Route path={ROUTES.AGENCE_PARTENAIRE} element={<AgencePartenaire />} />
                    <Route path={ROUTES.AGENCE_DETAIL} element={<AgenceDetail />} />
                    <Route path={ROUTES.PRODUITS} element={<Produits />} />

                    {/* Redirection par défaut vers le dashboard */}
                    <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;