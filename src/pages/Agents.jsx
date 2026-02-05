import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlusCircle, Loader2, X, Trash2, AlertTriangle, User, Edit, Phone, Mail, Shield, RefreshCw, ChevronDown as LucideChevronDown, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import NotificationPortal from '../components/widget/notification';
import { fetchAgents, addAgent, editAgent, deleteAgent, updateAgentStatus, setAgentStatus } from '../redux/slices/agentSlice';
import Modal from '../components/common/Modal';

const Agents = () => {
  const dispatch = useDispatch();
  const { agents, isLoading, error, hasLoaded } = useSelector((state) => state.agents);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const notificationTimeoutRef = useRef(null);

  const [agentForm, setAgentForm] = useState({
    nom: '',
    prenoms: '',
    telephone: '',
    email: '',
    password: '',
    password_confirmation: '',
    type: 'backoffice',
  });

  const showNotification = useCallback((type, message) => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => () => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      dispatch(fetchAgents());
    }
  }, [dispatch, hasLoaded]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchAgents({ silent: true })).unwrap();
      showNotification('success', 'Liste des agents mise à jour.');
    } catch (err) {
      showNotification('error', 'Erreur lors du rafraîchissement.');
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
      password_confirmation: ''
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
    });
  };

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;
    setIsSubmitting(true);
    try {
      const result = await dispatch(deleteAgent(agentToDelete.id)).unwrap();
      if (result.success) {
        showNotification('success', `L'agent ${agentToDelete.nom} a été supprimé.`);
        // Rafraîchir silencieusement
        dispatch(fetchAgents());
        setAgentToDelete(null);
      } else {
        showNotification('error', 'Erreur lors de la suppression');
      }
    } catch (err) {
      showNotification('error', err.message || 'Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAgent = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (editingAgent) {
        const { id, ...updateData } = agentForm;
        if (!updateData.password) {
          delete updateData.password;
          delete updateData.password_confirmation;
        }
        const result = await dispatch(editAgent({ agentId: id, agentData: updateData })).unwrap();
        if (result.success) {
          showNotification('success', 'Agent modifié avec succès.');
          // Rafraîchir silencieusement
          dispatch(fetchAgents());
          closeModal();
        } else {
          showNotification('error', 'Erreur lors de la modification');
        }
      } else {
        const result = await dispatch(addAgent(agentForm)).unwrap();
        if (result.success) {
          showNotification('success', 'Agent créé avec succès.');
          // Rafraîchir silencieusement
          dispatch(fetchAgents());
          closeModal();
        } else {
          showNotification('error', "Erreur lors de l'ajout");
        }
      }
    } catch (err) {
      showNotification('error', err.message || 'Erreur lors de la soumission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (agent) => {
    const previousStatus = agent.actif;
    const newStatusNumeric = previousStatus ? 0 : 1;
    const newStatusBoolean = !previousStatus;

    // 1. Mise à jour optimiste dans Redux
    dispatch(setAgentStatus({ id: agent.id, actif: newStatusBoolean }));

    try {
      // 2. Appel API
      await dispatch(updateAgentStatus({ agentId: agent.id, status: newStatusNumeric })).unwrap();
      showNotification('success', `Statut mis à jour.`);
    } catch (error) {
      // 3. Rollback en cas d'échec
      dispatch(setAgentStatus({ id: agent.id, actif: previousStatus }));
      showNotification('error', 'Erreur lors du changement de statut (Reversion)');
    }
  };

  // --- Styles ---
  const inputStyle = "w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 bg-slate-50";



  return (
    <div className="space-y-6 pb-12">
      <NotificationPortal notification={notification} onClose={() => setNotification(null)} />

      {/* Header cleanup path */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Gestion des Agents
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les membres de votre équipe
            </p>
          </div>
        </div>


        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Rafraîchir la liste</span>
          </button>
          <button
            onClick={() => { setEditingAgent(null); closeModal(); setIsModalOpen(true); }}
            className="inline-flex items-center justify-center p-3 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>Ajouter un Agent</span>
          </button>
        </div>
      </header>

      {/* Barre unifiée Stats + Recherche */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8 items-stretch lg:items-center">
        <div className="grid grid-cols-2 gap-4 lg:flex lg:gap-4 shrink-0">
          {/* Actives */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
            className={`flex-1 lg:w-64 rounded-lg px-4 py-2 shadow-sm border transition-all cursor-pointer hover:shadow-md ${filterStatus === 'active'
              ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500/10'
              : 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs md:text-sm font-medium mb-1 ${filterStatus === 'active' ? 'text-emerald-800' : 'text-emerald-600/70'}`}>Actifs</p>
                <p className={`text-xl md:text-2xl font-bold ${filterStatus === 'active' ? 'text-emerald-900' : 'text-emerald-700'}`}>
                  {agents.filter(a => a.actif).length}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${filterStatus === 'active' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-emerald-500 border-emerald-100'
                }`}>
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Inactives */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'inactive' ? 'all' : 'inactive')}
            className={`flex-1 lg:w-64 rounded-lg px-4 py-2 shadow-sm border transition-all cursor-pointer hover:shadow-md ${filterStatus === 'inactive'
              ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-500/10'
              : 'bg-rose-50/50 border-rose-100 hover:border-rose-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs md:text-sm font-medium mb-1 ${filterStatus === 'inactive' ? 'text-rose-800' : 'text-rose-600/70'}`}>Inactifs</p>
                <p className={`text-xl md:text-2xl font-bold ${filterStatus === 'inactive' ? 'text-rose-900' : 'text-rose-700'}`}>
                  {agents.filter(a => !a.actif).length}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${filterStatus === 'inactive' ? 'bg-rose-500 text-white border-rose-400' : 'bg-white text-rose-500 border-rose-100'
                }`}>
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-full min-h-[50px] md:min-h-[72px] pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm font-bold placeholder:text-slate-300 placeholder:font-medium"
          />
        </div>
      </div>

      {error && !isLoading && (
        <div className="text-red-700 bg-red-50 p-4 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span className="text-xs font-bold uppercase tracking-wide">{error}</span>
        </div>
      )}

      {isLoading && agents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500">Chargement des agents...</p>
        </div>
      )}

      {!isLoading && agents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <User size={32} className="text-slate-300" />
          </div>
          <p className="text-lg font-bold text-slate-800 tracking-tight">Aucun agent enregistré</p>
          <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">Vous n'avez pas encore d'agents configurés pour cette agence.</p>
          <button
            onClick={() => { setEditingAgent(null); closeModal(); setIsModalOpen(true); }}
            className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-bold rounded-lg transition-colors"
          >
            Créer le premier agent
          </button>
        </div>
      ) : (
        agents.length > 0 && (
          <div className="">
            {/* Desktop Table View - Optimized for enterprise look */}
            <div className="hidden md:block bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {['Membre', 'Téléphone', 'Email', 'Statut', 'Actions'].map(header => (
                      <th key={header} className={`px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest ${header === 'Actions' ? 'text-right' : ''}`}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {agents
                    .filter(agent => {
                      const matchesSearch = agent.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        agent.prenoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        agent.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        agent.email?.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesStatus = filterStatus === 'all' ||
                        (filterStatus === 'active' && agent.actif) ||
                        (filterStatus === 'inactive' && !agent.actif);
                      return matchesSearch && matchesStatus;
                    })
                    .map(agent => (
                      <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 mr-3 text-xs">
                              {agent.nom?.[0]}{agent.prenoms?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{agent.nom} {agent.prenoms}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-semibold text-slate-600 tracking-tight">{agent.telephone}</p>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-semibold text-slate-600 tracking-tight">{agent.email}</p>
                        </td>


                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {isSubmitting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                            ) : (
                              <button
                                onClick={() => toggleUserStatus(agent)}
                                className={`w-8 h-4 rounded-full relative transition-colors duration-200 border ${agent.actif ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-300'}`}
                              >
                                <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all duration-200 ${agent.actif ? 'left-[18px]' : 'left-0.5'}`} />
                              </button>
                            )}
                            <span className={`text-[11px] font-medium p-0.5 rounded ${agent.actif ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {agent.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEditModal(agent)}
                              disabled={isSubmitting}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setAgentToDelete(agent)}
                              disabled={isSubmitting}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Separated Blocks */}
            <div className="md:hidden space-y-4">
              {agents
                .filter(agent => {
                  const matchesSearch = agent.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    agent.prenoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    agent.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    agent.email?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = filterStatus === 'all' ||
                    (filterStatus === 'active' && agent.actif) ||
                    (filterStatus === 'inactive' && !agent.actif);
                  return matchesSearch && matchesStatus;
                })
                .map(agent => (
                  <div key={agent.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 text-xs text-center uppercase">
                          {agent.nom?.[0]}{agent.prenoms?.[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{agent.nom} {agent.prenoms}</h4>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEditModal(agent)} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 rounded-lg border border-slate-100">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setAgentToDelete(agent)} className="p-2 text-red-500 bg-red-50 rounded-lg border border-red-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-300" />
                        <span className="truncate">{agent.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-300" />
                        <span>{agent.telephone}</span>
                      </div>
                    </div>

                  <div className="flex items-center justify-between border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        {isSubmitting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                        ) : (
                          <button
                            onClick={() => toggleUserStatus(agent)}
                            className={`w-8 h-4 rounded-full relative transition-colors duration-200 border ${agent.actif ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-300'}`}
                          >
                            <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all duration-200 ${agent.actif ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        )}
                        <span className={`text-[11px] font-medium ${agent.actif ? 'text-emerald-500' : 'text-slate-300'}`}>
                          {agent.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">ID: {agent.id ? String(agent.id).substring(0, 6) : '...'}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )
      )}

      {/* MODAL SUPPRESSION */}
      <Modal
        isOpen={!!agentToDelete}
        onClose={() => setAgentToDelete(null)}
        title="Supprimer l'accès ?"
        size="md"
        footer={(
          <>
            <button
              onClick={() => setAgentToDelete(null)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteAgent}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-600/10"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
              Supprimer
            </button>
          </>
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <p className="text-sm text-slate-500">
            Êtes-vous sûr de vouloir retirer <span className="font-bold text-slate-900">{agentToDelete?.nom} {agentToDelete?.prenoms}</span> de votre équipe ? Cette action est immédiate.
          </p>
        </div>
      </Modal>

      {/* MODAL AJOUT / MODIF */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAgent ? 'Édition de l\'Agent' : 'Nouveau Compte Agent'}
        subtitle="Remplissez les informations de connexion de l'agent."
        footer={(
          <>
            <button type="button" onClick={closeModal} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              form="agent-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                editingAgent ? 'Sauvegarder' : 'Créer l\'agent'
              )}
            </button>
          </>
        )}
      >
        <form id="agent-form" onSubmit={handleSubmitAgent} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nom <span className="text-red-500">*</span></label>
              <input type="text" name="nom" value={agentForm.nom || ""} onChange={handleInputChange} placeholder="Ex: Dupont" className={inputStyle} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Prénoms <span className="text-red-500">*</span></label>
              <input type="text" name="prenoms" value={agentForm.prenoms || ""} onChange={handleInputChange} placeholder="Ex: Jean" className={inputStyle} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Pro <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" name="telephone" value={agentForm.telephone || ""} onChange={handleInputChange} placeholder="+225 ..." className={`${inputStyle} pl-10`} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="email" name="email" value={agentForm.email || ""} onChange={handleInputChange} placeholder="agent@tousshop.com" className={`${inputStyle} pl-10`} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{editingAgent ? 'Changer MDP' : 'Mot de passe'} {!editingAgent && <span className="text-red-500">*</span>}</label>
              <input type="password" name="password" value={agentForm.password || ""} onChange={handleInputChange} placeholder="••••••••" className={inputStyle} required={!editingAgent} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirmation</label>
              <input type="password" name="password_confirmation" value={agentForm.password_confirmation || ""} onChange={handleInputChange} placeholder="••••••••" className={inputStyle} required={!editingAgent} />
            </div>
          </div>

          {editingAgent && (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex gap-3 text-slate-500 text-[10px] font-medium leading-relaxed italic uppercase tracking-wider">
              <Shield size={14} className="shrink-0 text-slate-400" />
              <p>Laissez les champs "Mot de passe" vides pour conserver l'actuel.</p>
            </div>
          )}
        </form>
      </Modal>
    </div >
  );
};

export default Agents;
