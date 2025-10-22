import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UsersIcon, ArchiveBoxIcon, CurrencyDollarIcon, DocumentDuplicateIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: HomeIcon },
  { name: 'Agents', href: '/agents', icon: UsersIcon, adminOnly: true },
  { name: 'Colis', href: '/parcels', icon: ArchiveBoxIcon },
  { name: 'Tarification simple', href: '/simple-rates', icon: CurrencyDollarIcon },
  { name: 'Tarification groupé', href: '/grouped-rates', icon: DocumentDuplicateIcon },
  { name: 'Configuration Zone', href: '/zone-configuration', icon: Cog6ToothIcon },
];

const Sidebar = () => {
  // Idéalement, le rôle de l'utilisateur viendrait de Redux
  const userRole = 'admin'; // ou 'agent'

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="h-16 flex items-center justify-center text-2xl font-bold">Backoffice</div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) =>
          (!item.adminOnly || userRole === 'admin') && (
            <NavLink
              key={item.name}
              to={item.href}
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
};

export default Sidebar;
