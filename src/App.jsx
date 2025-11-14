import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Parcels from './pages/Parcels';
import SimpleRates from './pages/SimpleRates';
import GroupedRates from './pages/GroupedRates';
import ZoneConfiguration from './pages/ZoneConfiguration';
import ProtectedRoute from './components/common/ProtectedRoute';
import WelcomePage from './pages/WelcomePage';
import AgencePartenaire from './pages/AgencePartenaire';

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> {/* Ajouter la route pour l'inscription */}
      <Route 
        path="/app/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="agents" element={<Agents />} />
                <Route path="parcels" element={<Parcels />} />
                <Route path="simple-rates" element={<SimpleRates />} />
                <Route path="grouped-rates" element={<GroupedRates />} />
                <Route path="zone-configuration" element={<ZoneConfiguration />} />
                <Route path="agence-partenaire" element={<AgencePartenaire />} />
                <Route 
                  path="agents" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Agents />
                    </ProtectedRoute>
                  } 
                />
                {/* Redirige toute autre route vers le tableau de bord */}
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;