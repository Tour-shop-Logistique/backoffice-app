import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlusCircle, Loader2, X, Trash2, AlertTriangle, User, Edit, Phone, Mail, Shield, ChevronDown as LucideChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import NotificationPortal from '../components/widget/notification';
import { fetchAgents, addAgent, editAgent, deleteAgent, updateAgentStatus } from '../redux/slices/agentSlice';

const Agents = () => {
  const dispatch = useDispatch();
  const { agents, isLoading, error } = useSelector((state) => state.agents);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    dispatch(fetchAgents());
  }, [dispatch]);

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
    setIsSubmitting(true);
    try {
      const newStatus = agent.actif ? 0 : 1;
      await dispatch(updateAgentStatus({ agentId: agent.id, status: newStatus })).unwrap();
      showNotification('success', `Statut mis à jour pour l'agent.`);
      // Rafraîchir silencieusement
      dispatch(fetchAgents());
    } catch (error) {
      showNotification('error', 'Erreur lors du changement de statut');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Styles ---
  const inputStyle = "w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 bg-slate-50";

  if (isLoading && agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-slate-900" size={40} />
        <p className="text-slate-500 font-medium text-sm tracking-wide uppercase">Chargement des agents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <NotificationPortal notification={notification} onClose={() => setNotification(null)} />

      {/* Header cleanup path */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestion des Agents
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Contrôlez les accès et les permissions des membres de votre équipe.</p>
        </div>
        <button
          onClick={() => { setEditingAgent(null); closeModal(); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          <span>Nouvel Agent</span>
        </button>
      </header>

      {error && !isLoading && (
        <div className="text-red-700 bg-red-50 p-4 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span className="text-xs font-bold uppercase tracking-wide">{error}</span>
        </div>
      )}

      {agents.length === 0 && !isLoading ? (
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Desktop Table View - Optimized for enterprise look */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Membre', 'Contact', 'Rôle', 'Statut', 'Actions'].map(header => (
                    <th key={header} className={`px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest ${header === 'Actions' ? 'text-right' : ''}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {agents.map(agent => (
                  <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 mr-3 text-xs">
                          {agent.nom?.[0]}{agent.prenoms?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{agent.prenoms} {agent.nom}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-semibold text-slate-600 tracking-tight">{agent.telephone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${agent.type === 'backoffice' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                        {agent.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(agent)}
                        disabled={isSubmitting}
                        className={`group flex items-center gap-2 py-1 px-3 rounded-full border transition-all ${agent.actif ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${agent.actif ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{agent.actif ? 'Actif' : 'Inactif'}</span>
                      </button>
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

          {/* Mobile Card View - Cleaner */}
          <div className="md:hidden divide-y divide-slate-100">
            {agents.map(agent => (
              <div key={agent.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 text-xs">
                      {agent.nom?.[0]}{agent.prenoms?.[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{agent.prenoms} {agent.nom}</h4>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border mt-1 ${agent.type === 'backoffice' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                        {agent.type}
                      </span>
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

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <button
                    onClick={() => toggleUserStatus(agent)}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 py-1 px-3 rounded-full border transition-all ${agent.actif ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  >
                    <div className={`w-1 h-1 rounded-full ${agent.actif ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className="text-[9px] font-bold tracking-tight uppercase">{agent.actif ? 'Actif' : 'Inactif'}</span>
                  </button>
                  <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">ID: {agent.id.substring(0, 6)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION - Clean style */}
      {agentToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Supprimer l'accès ?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Êtes-vous sûr de vouloir retirer <span className="font-bold text-slate-900">{agentToDelete.prenoms} {agentToDelete.nom}</span> de votre équipe ? Cette action est immédiate.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
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
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT / MODIF - Unified style */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {editingAgent ? 'Édition de l\'Agent' : 'Nouveau Compte Agent'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">Remplissez les informations de connexion de l'agent.</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAgent} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Prénoms <span className="text-red-500">*</span></label>
                    <input type="text" name="prenoms" value={agentForm.prenoms || ""} onChange={handleInputChange} placeholder="Ex: Jean" className={inputStyle} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nom <span className="text-red-500">*</span></label>
                    <input type="text" name="nom" value={agentForm.nom || ""} onChange={handleInputChange} placeholder="Ex: Dupont" className={inputStyle} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Pro <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" name="telephone" value={agentForm.telephone || ""} onChange={handleInputChange} placeholder="+225 ..." className={`${inputStyle} pl-10`} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Type de Profil <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select name="type" value={agentForm.type || "backoffice"} onChange={handleInputChange} className={`${inputStyle} appearance-none cursor-pointer`}>
                        <option value="backoffice">Accès Backoffice</option>
                        <option value="agence">Accès Agence</option>
                      </select>
                      <LucideChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
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
              </div>

              {/* Sticky Footer for Modal */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <button type="button" onClick={closeModal} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    editingAgent ? 'Sauvegarder' : 'Créer l\'agent'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
