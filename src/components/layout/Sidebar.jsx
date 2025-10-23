import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UsersIcon, ArchiveBoxIcon, CurrencyDollarIcon, DocumentDuplicateIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Agents', href: '/dashboard/agents', icon: UsersIcon, adminOnly: true },
  { name: 'Colis', href: '/dashboard/parcels', icon: ArchiveBoxIcon },
  { name: 'Tarification simple', href: '/dashboard/simple-rates', icon: CurrencyDollarIcon },
  { name: 'Tarification groupé', href: '/dashboard/grouped-rates', icon: DocumentDuplicateIcon },
  { name: 'Configuration Zone', href: '/dashboard/zone-configuration', icon: Cog6ToothIcon },
];

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const userRole = 'admin'; // Replace with Redux state

  const sidebarContent = (
    <div className="flex flex-col flex-1">
      <div className="h-16 flex items-center justify-between px-4">
        <span className="text-2xl font-bold">Backoffice</span>
        <button onClick={toggleSidebar} className="md:hidden">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) =>
          (!item.adminOnly || userRole === 'admin') && (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/dashboard'}
              onClick={toggleSidebar} // Close sidebar on link click on mobile
              className={({ isActive }) =>
                `flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-gray-900' : 'hover:bg-gray-700'}`
              }
            >
              <item.icon className="h-6 w-6 mr-3" />
              {item.name}
            </NavLink>
          )
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
        <div className="relative w-64 h-full bg-gray-800 text-white">
          {sidebarContent}
        </div>
      </div>
      {isSidebarOpen && <div className="fixed inset-0 z-20 bg-black opacity-50 md:hidden" onClick={toggleSidebar}></div>}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-800 text-white">
          {sidebarContent}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
