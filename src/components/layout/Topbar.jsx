import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { performLogout } from "../../redux/slices/authSlice";
import { LogOut, Menu, Settings } from "lucide-react";
import { ROUTES } from "../../routes";
import NotificationBell from "../widget/NotificationBell";

const Topbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(performLogout());
  };

  const getInitials = (name) => {
    if (!name) return "AD";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSettingsClick = () => {
    navigate(ROUTES.SETTINGS);
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800/70 sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center space-x-2">
        {/* Bouton de menu mobile */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Titre */}
        <h1 className="text-lg font-bold text-white hidden md:block tracking-tight">
          Dashboard
        </h1>
      </div>

      {/* Section droite */}
      <div className="flex items-center gap-2 md:gap-3">
        <NotificationBell />

        <button
          onClick={handleSettingsClick}
          title="Paramètres"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors"
        >
          <Settings className="h-5 w-5" />
        </button>

        <div className="w-px h-7 bg-slate-700"></div>

        <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
          {getInitials(user?.name || (user?.nom ? (user.nom + " " + (user.prenoms || "")) : ""))}
        </div>
        <p className="hidden md:block text-sm font-semibold text-white">
          {user?.name || (user?.nom ? (user.nom + " " + (user.prenoms || "")) : "Administrateur")}
        </p>

        <div className="w-px h-7 bg-slate-700"></div>

        <button
          onClick={handleLogout}
          title="Déconnexion"
          className="p-2 text-rose-400 hover:text-rose-300 hover:bg-slate-800/70 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
