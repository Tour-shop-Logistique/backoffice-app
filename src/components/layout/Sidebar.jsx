import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  Archive,
  DollarSign,
  Settings,
  X,
  Box,
  Blocks,
  BadgeEuro,
  Menu
} from "lucide-react";

import logo from "../../assets/logo_transparent.png";

const navigation = [
  { name: "Tableau de bord", href: "/app/dashboard", icon: Home },
  { name: 'Agences partenaires', href: '/app/agence-partenaire', icon: Blocks },
  { name: "Colis", href: "/app/parcels", icon: Archive },
  { name: "Tarification simple", href: "/app/simple-rates", icon: DollarSign },
  { name: "Tarification groupée", href: "/app/grouped-rates", icon: BadgeEuro },
  { name: "Zones d'expéditions", href: "/app/zone-configuration", icon: Settings },
  { name: 'Produits & Catégories', href: '/app/produits', icon: Box },
  { name: "Agents Backoffice", href: "/app/agents", icon: Users, adminOnly: true },
];

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const userRole = "admin";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded bg-white flex items-center justify-center border border-slate-700 p-1">
            <img src={logo} alt="Tous Shop" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Tour Shop
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map(
          (item) =>
            (!item.adminOnly || userRole === "admin") && (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/app/dashboard"}
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`h-4 w-4 mr-3 ${isActive ? "text-slate-100" : "text-slate-500"}`}
                    />
                    <span className="flex-1">{item.name}</span>
                  </>
                )}
              </NavLink>
            )
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Administrateur</p>
              <p className="text-[10px] text-slate-500 truncate lowercase">admin@tousshop.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-full shadow-xl">
          {sidebarContent}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-50">
        <div className="flex-1 flex flex-col min-h-0 border-r border-slate-800">
          {sidebarContent}
        </div>
      </div>
    </>
  );
};

export default Sidebar;