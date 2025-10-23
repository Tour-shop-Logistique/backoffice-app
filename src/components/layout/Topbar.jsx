import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';

const Topbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="h-16 bg-white shadow-md flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none md:hidden">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold ml-3 hidden md:block">Tableau de bord</h1>
      </div>
      <div className="flex items-center">
        <span className="text-gray-600 mr-4">Bonjour, {user?.name || 'Utilisateur'}</span>
        <button 
          onClick={handleLogout} 
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6 mr-1" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
