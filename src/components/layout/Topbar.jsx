import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Topbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="h-16 bg-white shadow-md flex items-center justify-between px-6">
      <div>
        {/* Vous pouvez ajouter un titre de page ici */}
      </div>
      <div className="flex items-center">
        <span className="text-gray-600 mr-4">Bonjour, {user?.name || 'Utilisateur'}</span>
        <button 
          onClick={handleLogout} 
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6 mr-1" />
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default Topbar;
