import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessPage } from '../../utils/permissions';

const ProtectedRoute = ({ children, adminOnly = false, pageKey = null }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const isAdmin = user?.role === 'is_backoffice_admin';

  if (adminOnly && !isAdmin) {
    // Redirige vers la page d'accueil si l'utilisateur n'est pas admin
    // ou affiche une page "Non autorisé"
    return <Navigate to="/" replace />;
  }

  if (pageKey && !canAccessPage(user, isAdmin, pageKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
