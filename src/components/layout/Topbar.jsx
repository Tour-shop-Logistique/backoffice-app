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
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-2">
          {/* Bouton de menu mobile */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Titre */}
          <h1 className="text-lg font-bold text-slate-800 hidden md:block tracking-tight">
            Dashboard
          </h1>
        </div>

        {/* Section droite */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Barre de recherche */}
          <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-64 focus-within:ring-2 focus-within:ring-slate-900/5 focus-within:border-slate-900 transition-all">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
            />
          </div>

          {/* Notifications */}
          <button
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* Paramètres */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Paramètres"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Séparateur */}
          <div className="hidden sm:block w-px h-8 bg-slate-200"></div>

          {/* Menu utilisateur */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-1 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="hidden md:block text-left leading-none">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || "Administrateur"}
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu déroulant */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsProfileOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-40">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {user?.email || "email@example.com"}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsModalOpen(true);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3 text-slate-400" />
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
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50">
          <SettingsModal closeModal={() => setIsModalOpen(false)} />
        </div>
      )}
    </>
  );
};

export default Topbar;