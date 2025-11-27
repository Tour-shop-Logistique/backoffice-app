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

const navigation = [
  { name: "Tableau de bord", href: "/app/dashboard", icon: Home },
  { name: "Agents", href: "/app/agents", icon: Users, adminOnly: true },
  { name: "Colis", href: "/app/parcels", icon: Archive },
  { name: "Tarification simple", href: "/app/simple-rates", icon: DollarSign },
  { name: "Tarification groupé", href: "/app/grouped-rates", icon: BadgeEuro },
  { name: "Configuration Zone", href: "/app/zone-configuration", icon: Settings },
  { name: 'Agences', href: '/app/agence-partenaire', icon: Blocks },
  { name: 'Produits', href: '/app/produits', icon: Box },
];

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const userRole = "admin";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Menu className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Backoffice
          </span>
        </div>
        <button 
          onClick={toggleSidebar} 
          className="md:hidden p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map(
          (item) =>
            (!item.adminOnly || userRole === "admin") && (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/app/dashboard"}
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20" 
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon 
                      className={`h-5 w-5 mr-3 transition-transform duration-200 ${
                        isActive ? "scale-110" : "group-hover:scale-110"
                      }`} 
                    />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            )
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Administrateur</p>
              <p className="text-xs text-gray-400 truncate">admin@backoffice.com</p>
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out md:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full bg-gray-800 shadow-2xl">
          {sidebarContent}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 md:z-50">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-800 shadow-xl">
          {sidebarContent}
        </div>
      </div>
    </>
  );
};

export default Sidebar;