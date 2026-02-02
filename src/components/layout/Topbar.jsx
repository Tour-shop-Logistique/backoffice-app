import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { performLogout } from "../../redux/slices/authSlice";
import SettingsModal from "./SettingsModal";
import { LogOut, Menu, Settings, Bell, Search, ChevronDown } from "lucide-react";

const Topbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(performLogout());
  };

  return (
    <>
      <header className="h-20 bg-white shadow-sm flex items-center justify-between px-4 md:px-8 border-b border-surface-200 sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          {/* Bouton de menu mobile */}
          <button
            onClick={toggleSidebar}
            className="p-2.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Titre */}
          <h1 className="text-xl font-bold text-surface-900 hidden md:block tracking-tight">
            Dashboard
          </h1>
        </div>

        {/* Section droite */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Barre de recherche (optionnelle) */}
          <div className="hidden lg:flex items-center bg-surface-100 rounded-xl px-4 py-2.5 w-72 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:bg-white border border-transparent focus-within:border-primary-200 transition-all duration-200">
            <Search className="h-4.5 w-4.5 text-surface-400 mr-2.5" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="bg-transparent text-sm text-surface-700 placeholder:text-surface-400 outline-none w-full"
            />
          </div>

          {/* Notifications */}
          <button
            className="relative p-2.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            title="Notifications"
          >
            <Bell className="h-5.5 w-5.5" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm shake-animation"></span>
          </button>

          {/* Paramètres */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            title="Paramètres"
          >
            <Settings className="h-5.5 w-5.5" />
          </button>

          {/* Séparateur */}
          <div className="hidden sm:block w-px h-10 bg-surface-200/80"></div>

          {/* Menu utilisateur */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-1.5 pr-3 rounded-2xl hover:bg-surface-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 border border-transparent hover:border-surface-200"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-500/20">
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-surface-900 leading-none mb-0.5">
                  {user?.name || "Administrateur"}
                </p>
                <p className="text-[11px] font-medium text-surface-500 uppercase tracking-tighter">Admin Principal</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-surface-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu déroulant */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsProfileOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">
                      {user?.name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.email || "email@example.com"}
                    </p>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsModalOpen(true);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-400" />
                      Paramètres
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modal paramètres */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
          <SettingsModal closeModal={() => setIsModalOpen(false)} />
        </div>
      )}
    </>
  );
};

export default Topbar;