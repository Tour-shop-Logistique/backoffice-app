import { NavLink, useLocation } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  ClipboardCheck,
  ArrowDownToLine,
  History,
  Store,
  Wallet,
  DollarSign,
  Globe,
  Tag,
  Users,
  Settings,
  MessageSquare,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectUnreadConversationsCount } from "../../redux/slices/messageSlice";
import { canAccessPage as checkCanAccessPage } from "../../utils/permissions";

import logo from "../../assets/logo_transparent.png";

// Doit rester synchronisé avec BackofficeRoleController::AVAILABLE_PAGES côté backend.
const PAGE_KEY_BY_HREF = {
  "/dashboard": "dashboard",
  "/parcels": "parcels",
  "/incoming-parcels": "incoming_parcels",
  "/historique": "historique",
  "/agence-partenaire": "agence_partenaire",
  "/comptabilite": "comptabilite",
  "/messages": "communication",
  "/tarification": "tarification",
  "/zone-configuration": "zone_configuration",
  "/produits": "produits",
  "/agents": "agents",
};

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { user } = useSelector(state => state.auth);
  const { isConfigured } = useSelector(state => state.backoffice);
  const unreadConversationsCount = useSelector(selectUnreadConversationsCount);
  const location = useLocation(); // Hook inside component

  const isAdmin = user?.role === 'is_backoffice_admin';
  const canAccessPage = (pageKey) => checkCanAccessPage(user, isAdmin, pageKey);

  // Navigation groupée par section, avec une icône colorée par entrée pour
  // repérer les options d'un coup d'œil sans avoir à lire chaque libellé.
  const navigationSections = [
    {
      label: null, // Pas de titre : c'est l'accueil
      items: [
        { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, color: "text-indigo-400" },
      ],
    },
    {
      label: "Logistique",
      items: [
        { name: "Colis à contrôler", href: "/parcels", icon: ClipboardCheck, color: "text-blue-400" },
        { name: "Arrivages prévus", href: "/incoming-parcels", icon: ArrowDownToLine, color: "text-emerald-400" },
        { name: "Historique", href: "/historique", icon: History, color: "text-slate-400" },
      ],
    },
    {
      label: "Réseau & Finance",
      items: [
        { name: "Agences partenaires", href: "/agence-partenaire", icon: Store, color: "text-purple-400" },
        { name: "Comptabilité", href: "/comptabilite", icon: Wallet, color: "text-amber-400" },
        { name: "Communication", href: "/messages", icon: MessageSquare, color: "text-cyan-400" },
      ],
    },
    {
      label: "Configuration",
      items: [
        { name: "Tarification", href: "/tarification", icon: DollarSign, color: "text-emerald-400" },
        { name: "Zones d'expéditions", href: "/zone-configuration", icon: Globe, color: "text-sky-400" },
        { name: "Produits & Catégories", href: "/produits", icon: Tag, color: "text-rose-400" },
        { name: "Équipe & Accès", href: "/agents", icon: Users, color: "text-indigo-400", adminOnly: true },
      ],
    },
  ]
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        const pageKey = PAGE_KEY_BY_HREF[item.href];
        return !pageKey || canAccessPage(pageKey);
      }),
    }))
    .filter(section => section.items.length > 0);

  // Navigation restreinte (si backoffice non configuré)
  const setupNavigationSections = [
    {
      label: null,
      items: [{ name: "Configuration Backoffice", href: "/backoffice-setup", icon: Settings, color: "text-indigo-400" }],
    },
  ];

  const currentSections = isConfigured ? navigationSections : setupNavigationSections;

  const isLinkActive = (href) => {
    const path = location.pathname;
    // Exact match
    if (href === path) return true;
    // La page Communication couvre /messages et /annonces (onglets internes)
    if (href === '/messages' && path === '/annonces') return true;
    // Detail page handling
    if (path.startsWith('/parcels/control/')) {
      const from = location.state?.from;
      if (href === '/parcels-history' && from === 'history') return true;
      if (href === '/incoming-parcels' && from === 'incoming') return true;
      if (href === '/parcels' && (!from || from === 'todo')) return true;
      return false;
    }
    // Default active logic (prevent partial matches across distinct roots e.g. /parcels vs /parcels-history unless explicit)
    if (href === '/parcels' && path.startsWith('/parcels-history')) return false;

    return path.startsWith(href) && href !== '/';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm p-1 shrink-0">
            <img src={logo} alt="Tour Shop" className="w-full h-full object-contain" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">
            Tour Shop
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto">
        {currentSections.map((section, sectionIdx) => (
          <div key={section.label || `section-${sectionIdx}`}>
            {section.label && (
              <p className="px-2.5 mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isLinkActive(item.href);
                const showBadge = item.href === "/messages" && unreadConversationsCount > 0;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={toggleSidebar}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 text-sm font-semibold rounded-lg transition-all ${active
                      ? "bg-indigo-500/15 text-white"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                      }`}
                  >
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors ${active
                        ? "bg-indigo-500 shadow-sm shadow-indigo-500/30"
                        : "bg-slate-800/70 group-hover:bg-slate-700"
                        }`}
                    >
                      <item.icon size={16} className={active ? "text-white" : item.color} />
                    </span>
                    <span className="flex-1 leading-tight">{item.name}</span>
                    {showBadge && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full shadow-sm shadow-red-500/40 ring-1 ring-red-400/20 shrink-0">
                        {unreadConversationsCount > 99 ? "99+" : unreadConversationsCount}
                      </span>
                    )}
                    {active && !showBadge && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
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
