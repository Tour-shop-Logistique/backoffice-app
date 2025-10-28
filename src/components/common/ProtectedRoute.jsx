import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== 'is_backoffice_admin') {
    // Redirige vers la page d'accueil si l'utilisateur n'est pas admin
    // ou affiche une page "Non autorisé"
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
