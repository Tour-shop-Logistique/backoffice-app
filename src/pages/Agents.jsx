import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PlusCircle, Loader2, X, Trash2, AlertTriangle, User, Edit, Phone, Mail, Shield, RefreshCw, ChevronDown as LucideChevronDown, CheckCircle2, XCircle, Search, Edit2, Edit3, Mail as MailIcon, Phone as PhoneIcon, UserCircle2, Eye, EyeOff, KeyRound, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../redux/slices/uiSlice';
import { fetchAgents, addAgent, editAgent, deleteAgent, updateAgentStatus, setAgentStatus } from '../redux/slices/agentSlice';
import { fetchRoles, addRole, editRole, deleteRole } from '../redux/slices/roleSlice';
import Modal from '../components/common/Modal';
import DeleteModal from '../components/common/DeleteModal';
import RowActions from '../components/common/RowActions';

// Doit rester synchronisé avec BackofficeRoleController::AVAILABLE_PAGES côté backend.
const AVAILABLE_PAGES = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'parcels', label: 'Colis à contrôler' },
  { key: 'incoming_parcels', label: 'Arrivages prévus' },
  { key: 'historique', label: 'Historique' },
  { key: 'agence_partenaire', label: 'Agences partenaires' },
  { key: 'comptabilite', label: 'Comptabilité' },
  { key: 'communication', label: 'Communication' },
  { key: 'tarification', label: 'Tarification' },
  { key: 'zone_configuration', label: "Zones d'expéditions" },
  { key: 'produits', label: 'Produits & Catégories' },
  { key: 'agents', label: 'Équipe & Accès' },
];

const Agents = () => {
  const dispatch = useDispatch();
  const { agents, isLoading, error, hasLoaded } = useSelector((state) => state.agents);
  const { roles, isLoading: isLoadingRoles, hasLoaded: rolesLoaded } = useSelector((state) => state.roles);

  const [activeTab, setActiveTab] = useState('agents');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agentForm, setAgentForm] = useState({
    nom: '',
    prenoms: '',
    telephone: '',
    email: '',
    password: '',
    password_confirmation: '',
    type: 'backoffice',
    role_id: '',
  });

  // Gestion des rôles
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleForm, setRoleForm] = useState({ nom: '', description: '', pages: [] });

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      dispatch(fetchAgents());
    }
  }, [dispatch, hasLoaded, isLoading]);

  useEffect(() => {
    if (!rolesLoaded && !isLoadingRoles) {
      dispatch(fetchRoles());
    }
  }, [dispatch, rolesLoaded, isLoadingRoles]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchAgents({ silent: true })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Liste des agents mise à jour.' }));
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAgentForm((prev) => ({ ...prev, [name]: value }));
  };

  const openEditModal = (agent) => {
    setEditingAgent(agent);
    setAgentForm({
      id: agent.id,
      nom: agent.nom || '',
      prenoms: agent.prenoms || '',
      telephone: agent.telephone || '',
      email: agent.email || '',
      type: agent.type || 'backoffice',
      password: '',
      password_confirmation: '',
      role_id: agent.role_id || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
    setAgentForm({
      nom: '',
      prenoms: '',
      telephone: '',
      email: '',
      password: '',
      password_confirmation: '',
      type: 'backoffice',
      role_id: '',
    });
  };

  // ── Gestion des rôles ──
  const openRoleModal = (role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ id: role.id, nom: role.nom || '', description: role.description || '', pages: role.pages || [] });
    } else {
      setEditingRole(null);
      setRoleForm({ nom: '', description: '', pages: [] });
    }
    setIsRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
    setEditingRole(null);
    setRoleForm({ nom: '', description: '', pages: [] });
  };

  const toggleRolePage = (pageKey) => {
    setRoleForm((prev) => ({
      ...prev,
      pages: prev.pages.includes(pageKey)
        ? prev.pages.filter((p) => p !== pageKey)
        : [...prev.pages, pageKey],
    }));
  };

  const handleSubmitRole = async (e) => {
    e.preventDefault();
    if (isSubmittingRole) return;

    if (!roleForm.nom.trim()) {
      return dispatch(showNotification({ type: 'error', message: 'Le nom du rôle est requis.' }));
    }
    if (roleForm.pages.length === 0) {
      return dispatch(showNotification({ type: 'error', message: 'Sélectionnez au moins une page accessible.' }));
    }

    setIsSubmittingRole(true);
    try {
      if (editingRole) {
        const { id, ...roleData } = roleForm;
        await dispatch(editRole({ roleId: id, roleData })).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Rôle mis à jour avec succès.' }));
      } else {
        await dispatch(addRole(roleForm)).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Rôle créé avec succès.' }));
      }
      closeRoleModal();
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err?.message || 'Erreur lors de la soumission du rôle.' }));
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsSubmittingRole(true);
    try {
      await dispatch(deleteRole(roleToDelete.id)).unwrap();
      dispatch(showNotification({ type: 'success', message: `Le rôle ${roleToDelete.nom} a été supprimé.` }));
      setRoleToDelete(null);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err?.message || 'Erreur lors de la suppression du rôle.' }));
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;
    setIsSubmitting(true);
    try {
      const result = await dispatch(deleteAgent(agentToDelete.id)).unwrap();
      if (result.success || result) { // handle potential different API response formats
        dispatch(showNotification({ type: 'success', message: `L'agent ${agentToDelete.nom} a été supprimé.` }));
        setAgentToDelete(null);
      } else {
        dispatch(showNotification({ type: 'error', message: 'Erreur lors de la suppression' }));
      }
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err.message || 'Erreur lors de la suppression' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAgent = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Basic validation
    if (!agentForm.nom || !agentForm.prenoms || !agentForm.telephone || !agentForm.email) {
      return dispatch(showNotification({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires.' }));
    }

    setIsSubmitting(true);
    try {
      if (editingAgent) {
        const { id, ...updateData } = agentForm;
        if (!updateData.password) {
          delete updateData.password;
          delete updateData.password_confirmation;
        }
        updateData.role_id = updateData.role_id || null;
        const result = await dispatch(editAgent({ agentId: id, agentData: updateData })).unwrap();
        if (result.success || result) {
          dispatch(showNotification({ type: 'success', message: 'Agent modifié avec succès.' }));
          closeModal();
          dispatch(fetchAgents({ silent: true }));
          dispatch(fetchRoles());
        } else {
          dispatch(showNotification({ type: 'error', message: 'Erreur lors de la modification' }));
        }
      } else {
        if (!agentForm.password) {
          setIsSubmitting(false);
          return dispatch(showNotification({ type: 'error', message: 'Le mot de passe est requis pour un nouvel agent.' }));
        }
        const result = await dispatch(addAgent({ ...agentForm, role_id: agentForm.role_id || null })).unwrap();
        if (result.success || result) {
          dispatch(showNotification({ type: 'success', message: 'Agent créé avec succès.' }));
          closeModal();
          dispatch(fetchAgents({ silent: true }));
          dispatch(fetchRoles());
        } else {
          dispatch(showNotification({ type: 'error', message: "Erreur lors de l'ajout" }));
        }
      }
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err.message || 'Erreur lors de la soumission.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (agent) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [agent.id]: true }));
      const newStatusNumeric = agent.actif ? 0 : 1;

      await dispatch(updateAgentStatus({ agentId: agent.id, status: newStatusNumeric })).unwrap();
      // dispatch(showNotification({ type: 'success', message: `Statut mis à jour.` }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du changement de statut' }));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [agent.id]: false }));
    }
  };

  const inputStyle = "w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 bg-slate-50";

  // 1. Filtrer d'abord par recherche (pour les compteurs)
  const filteredBySearch = useMemo(() => {
    return (agents || []).filter(agent => {
      const nom = agent.nom?.toLowerCase() || '';
      const prenoms = agent.prenoms?.toLowerCase() || '';
      const telephone = agent.telephone?.toLowerCase() || '';
      const email = agent.email?.toLowerCase() || '';
      const searchable = searchTerm.toLowerCase();

      return nom.includes(searchable) ||
        prenoms.includes(searchable) ||
        telephone.includes(searchable) ||
        email.includes(searchable);
    });
  }, [agents, searchTerm]);

  // 2. Filtrer par statut pour l'affichage
  const filteredAgents = useMemo(() => {
    return filteredBySearch.filter(agent => {
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && agent.actif) ||
        (filterStatus === 'inactive' && !agent.actif);
      return matchesStatus;
    });
  }, [filteredBySearch, filterStatus]);

  // 3. Compteurs basés sur la recherche uniquement
  const counts = useMemo(() => ({
    all: filteredBySearch.length,
    active: filteredBySearch.filter(a => a.actif).length,
    inactive: filteredBySearch.filter(a => !a.actif).length
  }), [filteredBySearch]);

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">

      {/* STICKY HEADER & SEARCH */}
      <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
        {/* HEADER SECTION */}
        <header className="space-y-3 md:space-y-0 text-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'agents' ? 'Gestion des Agents' : 'Rôles & Permissions'}
              </h1>
              <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
                {activeTab === 'agents' ? 'Gérez les membres de votre équipe' : "Définissez les pages accessibles pour chaque rôle"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'agents' && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
                  title="Rafraîchir"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline md:ml-2">Rafraîchir</span>
                </button>
              )}

              <button
                onClick={() => (activeTab === 'agents' ? setIsModalOpen(true) : openRoleModal(null))}
                className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all"
                title="Ajouter"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden md:inline md:ml-2">{activeTab === 'agents' ? 'Ajouter un agent' : 'Nouveau rôle'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* MAIN TABS: Agents / Roles */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1.5 w-fit shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'agents' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Users size={14} />
            Agents
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'roles' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <KeyRound size={14} />
            Rôles
          </button>
        </div>

        {/* SEARCH BAR */}
        {activeTab === 'agents' && (
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400 text-black font-medium"
            />
          </div>
        )}
      </div>

      {activeTab === 'roles' ? (
        <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoadingRoles && roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
              <p className="text-slate-500 font-medium text-sm">Chargement des rôles...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="py-20 text-center px-6">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="text-slate-400" size={32} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Aucun rôle créé</h3>
              <p className="text-slate-500 text-sm mt-2">Créez un rôle pour restreindre l'accès de certains agents à des pages précises.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {roles.map((role) => (
                <div key={role.id} className="p-4 md:p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{role.nom}</p>
                      <span className="text-xs font-bold text-slate-400">
                        {role.users_count || 0} agent{(role.users_count || 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                    {role.description && <p className="text-sm text-slate-500 mt-0.5">{role.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(role.pages || []).map((pageKey) => (
                        <span key={pageKey} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                          {AVAILABLE_PAGES.find((p) => p.key === pageKey)?.label || pageKey}
                        </span>
                      ))}
                    </div>
                  </div>
                  <RowActions onEdit={() => openRoleModal(role)} onDelete={() => setRoleToDelete(role)} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <>
      {/* TABS + TABLE - Mobile Optimized */}
      <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'all'
                ? 'text-slate-900 border-b-2 border-slate-900 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Tous ({counts.all})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'active'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Actifs ({counts.active})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'inactive'
                ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Inactifs ({counts.inactive})
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading && agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-slate-500 font-medium text-sm">Chargement des agents...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle2 className="text-slate-400" size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Aucun agent trouvé</h3>
            <p className="text-slate-500 text-sm mt-2">Ajustez vos filtres ou ajoutez un nouvel agent.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Membre</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAgents.map((agent, index) => (
                    <tr key={agent.id || `agent-${index}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 text-xs">
                            {agent.nom?.[0]}{agent.prenoms?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{agent.nom} {agent.prenoms}</p>
                            <p className="text-xs text-slate-500 uppercase font-medium">{agent.type || 'Agent'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <PhoneIcon size={13} className="text-slate-400" />
                            <span className="text-xs font-medium">{agent.telephone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MailIcon size={13} className="text-slate-400" />
                            <span className="text-xs font-medium">{agent.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {agent.custom_role?.nom ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                            <KeyRound size={12} />
                            {agent.custom_role.nom}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Accès complet</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUserStatus(agent)}
                          disabled={updatingStatus[agent.id]}
                          className="group relative flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                          title={`Cliquez pour ${agent.actif ? 'désactiver' : 'activer'}`}
                        >
                          <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${agent.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${agent.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <RowActions
                            onEdit={() => openEditModal(agent)}
                            onDelete={() => setAgentToDelete(agent)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards - Native App Style */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredAgents.map((agent, index) => (
                <div key={agent.id || `agent-mobile-${index}`} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 text-xs shrink-0">
                        {agent.nom?.[0]}{agent.prenoms?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate leading-tight">{agent.nom} {agent.prenoms}</p>
                        <p className="text-xs text-slate-500 truncate lowercase">{agent.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleUserStatus(agent)}
                      disabled={updatingStatus[agent.id]}
                      className="flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <div className={`relative w-8 h-4 rounded-full transition-colors ${agent.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transform transition-transform ${agent.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 px-1 font-medium">
                    <PhoneIcon size={11} className="text-slate-400" />
                    <span className="text-xs">{agent.telephone}</span>
                    <span className="mx-1 text-slate-300">|</span>
                    <span className="text-xs text-slate-500 font-bold uppercase">{agent.type || 'Agent'}</span>
                  </div>

                  {agent.custom_role?.nom && (
                    <div className="px-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                        <KeyRound size={12} />
                        {agent.custom_role.nom}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openEditModal(agent)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                    >
                      <Edit3 size={13} />
                      Modifier
                    </button>
                    <button
                      onClick={() => setAgentToDelete(agent)}
                      className="inline-flex items-center justify-center p-2 text-red-500 active:bg-red-50 border border-red-100 rounded-lg transition-all active:scale-95"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      </>
      )}

      {/* MODALS */}
      {/* Ajout / Edition Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAgent ? "Modifier l'Agent" : 'Nouvel Agent'}
        subtitle={editingAgent ? 'Mettez à jour les informations de connexion' : 'Créez un nouvel accès au backoffice'}
        size="lg"
        confirmFormId="agent-form"
        isLoading={isSubmitting}
        confirmLabel={editingAgent ? 'Mettre à jour' : 'Enregistrer'}
      >
        <form id="agent-form" onSubmit={handleSubmitAgent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nom <span className="text-red-500">*</span></label>
              <input type="text" name="nom" value={agentForm.nom || ""} onChange={handleInputChange} placeholder="Ex: Dupont" className={inputStyle} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Prénoms <span className="text-red-500">*</span></label>
              <input type="text" name="prenoms" value={agentForm.prenoms || ""} onChange={handleInputChange} placeholder="Ex: Jean" className={inputStyle} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Téléphone <span className="text-red-500">*</span></label>
            <input type="text" name="telephone" value={agentForm.telephone || ""} onChange={handleInputChange} placeholder="+225 ..." className={inputStyle} required />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email <span className="text-red-500">*</span></label>
            <input type="email" name="email" value={agentForm.email || ""} onChange={handleInputChange} placeholder="agent@tousshop.com" className={inputStyle} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{editingAgent ? 'Nouveau mot de passe' : 'Mot de passe'} {!editingAgent && <span className="text-red-500">*</span>}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={agentForm.password || ""} onChange={handleInputChange} placeholder="••••••••" className={`${inputStyle} pr-10`} required={!editingAgent} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirmation</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} name="password_confirmation" value={agentForm.password_confirmation || ""} onChange={handleInputChange} placeholder="••••••••" className={`${inputStyle} pr-10`} required={!editingAgent} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {editingAgent && (
            <div className="px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg flex gap-2.5 items-center text-blue-700 text-xs font-medium">
              <Shield size={14} className="shrink-0 text-blue-500" />
              <p>Laissez vide pour conserver le mot de passe actuel.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Rôle</label>
            <select
              name="role_id"
              value={agentForm.role_id || ''}
              onChange={handleInputChange}
              className={inputStyle}
            >
              <option value="">Accès complet (aucun rôle)</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.nom}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 ml-1">Sans rôle, l'agent a accès à toutes les pages.</p>
          </div>
        </form>
      </Modal>

      <DeleteModal
        isOpen={!!agentToDelete}
        onClose={() => setAgentToDelete(null)}
        onConfirm={handleDeleteAgent}
        itemName={`${agentToDelete?.nom} ${agentToDelete?.prenoms}`}
        isLoading={isSubmitting}
      />

      {/* Ajout / Edition Rôle Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={closeRoleModal}
        title={editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}
        subtitle="Définissez les pages accessibles pour ce rôle"
        size="lg"
        confirmFormId="role-form"
        isLoading={isSubmittingRole}
        confirmLabel={editingRole ? 'Mettre à jour' : 'Enregistrer'}
      >
        <form id="role-form" onSubmit={handleSubmitRole} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nom du rôle <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={roleForm.nom}
              onChange={(e) => setRoleForm((p) => ({ ...p, nom: e.target.value }))}
              placeholder="Ex: Comptable"
              className={inputStyle}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
            <textarea
              value={roleForm.description}
              onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description facultative du rôle..."
              rows={2}
              className={`${inputStyle} resize-none`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              Pages accessibles <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {AVAILABLE_PAGES.map((page) => {
                const checked = roleForm.pages.includes(page.key);
                return (
                  <label
                    key={page.key}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                      checked ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRolePage(page.key)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-white border-white' : 'border-slate-300'}`}>
                      {checked && <CheckCircle2 size={12} className="text-slate-900" />}
                    </div>
                    <span className="text-sm font-medium">{page.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      <DeleteModal
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDeleteRole}
        itemName={roleToDelete?.nom}
        isLoading={isSubmittingRole}
      />
    </div>
  );
};

export default Agents;
