import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlusCircle, Loader2, X, Trash2, AlertTriangle, User, Edit, Phone, Mail, Shield, RefreshCw, ChevronDown as LucideChevronDown, CheckCircle2, XCircle, Search, Edit2, Edit3, Mail as MailIcon, Phone as PhoneIcon, UserCircle2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import NotificationPortal from '../components/widget/notification';
import { fetchAgents, addAgent, editAgent, deleteAgent, updateAgentStatus, setAgentStatus } from '../redux/slices/agentSlice';
import Modal from '../components/common/Modal';
import DeleteModal from '../components/common/DeleteModal';

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
      if (result.success || result) { // handle potential different API response formats
        showNotification('success', `L'agent ${agentToDelete.nom} a été supprimé.`);
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

    // Basic validation
    if (!agentForm.nom || !agentForm.prenoms || !agentForm.telephone || !agentForm.email) {
      return showNotification('error', 'Veuillez remplir tous les champs obligatoires.');
    }

    setIsSubmitting(true);
    try {
      if (editingAgent) {
        const { id, ...updateData } = agentForm;
        if (!updateData.password) {
          delete updateData.password;
          delete updateData.password_confirmation;
        }
        const result = await dispatch(editAgent({ agentId: id, agentData: updateData })).unwrap();
        if (result.success || result) {
          showNotification('success', 'Agent modifié avec succès.');
          closeModal();
        } else {
          showNotification('error', 'Erreur lors de la modification');
        }
      } else {
        if (!agentForm.password) {
          setIsSubmitting(false);
          return showNotification('error', 'Le mot de passe est requis pour un nouvel agent.');
        }
        const result = await dispatch(addAgent(agentForm)).unwrap();
        if (result.success || result) {
          showNotification('success', 'Agent créé avec succès.');
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

    dispatch(setAgentStatus({ id: agent.id, actif: newStatusBoolean }));

    try {
      await dispatch(updateAgentStatus({ agentId: agent.id, status: newStatusNumeric })).unwrap();
      showNotification('success', `Statut mis à jour.`);
    } catch (error) {
      dispatch(setAgentStatus({ id: agent.id, actif: previousStatus }));
      showNotification('error', 'Erreur lors du changement de statut');
    }
  };

  const inputStyle = "w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 bg-slate-50";

  const filteredAgents = (agents || []).filter(agent => {
    const nom = agent.nom?.toLowerCase() || '';
    const prenoms = agent.prenoms?.toLowerCase() || '';
    const telephone = agent.telephone?.toLowerCase() || '';
    const email = agent.email?.toLowerCase() || '';
    const searchable = searchTerm.toLowerCase();

    const matchesSearch = nom.includes(searchable) ||
      prenoms.includes(searchable) ||
      telephone.includes(searchable) ||
      email.includes(searchable);

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && agent.actif) ||
      (filterStatus === 'inactive' && !agent.actif);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <NotificationPortal notification={notification} onClose={() => setNotification(null)} />

      {/* HEADER - Mobile Optimized */}
      <header className="space-y-3 md:space-y-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Gestion des Agents
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Gérez les membres de votre équipe
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline md:ml-2">Rafraîchir</span>
            </button>

            <button
              onClick={() => { setIsModalOpen(true); }}
              className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg hover:shadow-lg transition-colors"
              title="Ajouter"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline md:ml-2">Ajouter</span>
            </button>
          </div>
        </div>
      </header>

      {/* SEARCH BAR - Mobile Optimized */}
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
        />
      </div>

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
              Tous ({agents.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'active'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Actifs ({agents.filter(a => a.actif).length})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'inactive'
                ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Inactifs ({agents.filter(a => !a.actif).length})
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading && agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-slate-500 font-medium text-sm">Chargement des agents...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="py-20 text-center">
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
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAgents.map(agent => (
                    <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 text-xs">
                            {agent.nom?.[0]}{agent.prenoms?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{agent.nom} {agent.prenoms}</p>
                            <p className="text-[11px] text-slate-500 uppercase font-medium">{agent.type || 'Agent'}</p>
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
                        <button
                          onClick={() => toggleUserStatus(agent)}
                          disabled={isSubmitting}
                          className="group relative flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                          title={`Cliquez pour ${agent.actif ? 'désactiver' : 'activer'}`}
                        >
                          <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${agent.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${agent.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <span className={`text-[10px] font-medium ${agent.actif ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {agent.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(agent)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setAgentToDelete(agent)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Supprimer"
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

            {/* Mobile Cards - Native App Style */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredAgents.map(agent => (
                <div key={agent.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 text-[10px] shrink-0">
                        {agent.nom?.[0]}{agent.prenoms?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate leading-tight">{agent.nom} {agent.prenoms}</p>
                        <p className="text-[11px] text-slate-500 truncate lowercase">{agent.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleUserStatus(agent)}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 active:scale-95 transition-all"
                    >
                      <div className={`relative w-8 h-4 rounded-full transition-colors ${agent.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transform transition-transform ${agent.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <span className={`text-[9px] font-medium ${agent.actif ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {agent.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 px-1 font-medium">
                    <PhoneIcon size={11} className="text-slate-400" />
                    <span className="text-[11px]">{agent.telephone}</span>
                    <span className="mx-1 text-slate-300">|</span>
                    <span className="text-[11px] text-slate-400 font-bold uppercase">{agent.type || 'Agent'}</span>
                  </div>

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

      {/* MODALS */}
      {/* Ajout / Edition Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAgent ? 'Modifier l\'Agent' : 'Nouvel Agent'}
        subtitle={editingAgent ? 'Mettez à jour les informations de connexion' : 'Créez un nouvel accès au backoffice'}
        size="lg"
        footer={(
          <>
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest"
            >
              Annuler
            </button>
            <button
              form="agent-form"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-slate-900/10"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : editingAgent ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </>
        )}
      >
        <form id="agent-form" onSubmit={handleSubmitAgent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Téléphone <span className="text-red-500">*</span></label>
            <input type="text" name="telephone" value={agentForm.telephone || ""} onChange={handleInputChange} placeholder="+225 ..." className={inputStyle} required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email <span className="text-red-500">*</span></label>
            <input type="email" name="email" value={agentForm.email || ""} onChange={handleInputChange} placeholder="agent@tousshop.com" className={inputStyle} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{editingAgent ? 'Nouveau mot de passe' : 'Mot de passe'} {!editingAgent && <span className="text-red-500">*</span>}</label>
              <input type="password" name="password" value={agentForm.password || ""} onChange={handleInputChange} placeholder="••••••••" className={inputStyle} required={!editingAgent} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirmation</label>
              <input type="password" name="password_confirmation" value={agentForm.password_confirmation || ""} onChange={handleInputChange} placeholder="••••••••" className={inputStyle} required={!editingAgent} />
            </div>
          </div>

          {editingAgent && (
            <div className="px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg flex gap-2.5 items-center text-blue-700 text-[11px] font-medium">
              <Shield size={14} className="shrink-0 text-blue-500" />
              <p>Laissez vide pour conserver le mot de passe actuel.</p>
            </div>
          )}
        </form>
      </Modal>

      <DeleteModal
        isOpen={!!agentToDelete}
        onClose={() => setAgentToDelete(null)}
        onConfirm={handleDeleteAgent}
        itemName={`${agentToDelete?.nom} ${agentToDelete?.prenoms}`}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default Agents;
