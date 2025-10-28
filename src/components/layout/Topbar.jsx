import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import SettingsModal from './SettingsModal';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const Topbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <>
      <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-6 border-b border-gray-100">
        <div className="flex items-center">
          {/* Bouton de menu mobile */}
          <button
            onClick={toggleSidebar}
            className="text-gray-600 hover:text-gray-800 focus:outline-none md:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <h1 className="text-lg font-semibold ml-3 hidden md:block text-gray-800">
            Tableau de bord
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium hidden sm:block">
            Bonjour, {user?.name || 'Utilisateur'}
          </span>

          {/* Icône paramètres */}
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            className="text-gray-600 hover:text-gray-800 focus:outline-none"
            title="Paramètres"
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </button>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-red-600 focus:outline-none transition-colors"
            title="Déconnexion"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6 mr-1" />
            {/* <span className="hidden sm:inline font-medium">Déconnexion</span> */}
          </button>
        </div>
      </header>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          {/* Le contenu du modal sera ici */}
          <SettingsModal closeModal={() => setIsModalOpen(false)} />
        </div>
      )}
    </>
  );
};
export default Topbar;
