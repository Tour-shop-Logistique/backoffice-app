import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlusCircle, Loader2, X, Trash2, AlertTriangle, User, Edit, Phone, Mail, Shield } from 'lucide-react';
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
  const inputStyle = "w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50";

  if (isLoading && agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium text-lg">Chargement des agents...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8 pb-10">
      <NotificationPortal notification={notification} onClose={() => setNotification(null)} />

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mr-0 sm:mr-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Gestion des Agents
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Gérez les accès et les comptes des agents de votre agence.</p>
        </div>
        <button
          onClick={() => { setEditingAgent(null); closeModal(); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          <span>Nouvel Agent</span>
        </button>
      </header>

      {error && !isLoading && (
        <div className="text-red-700 bg-red-50 p-4 rounded-xl shadow-sm border border-red-200 flex items-center gap-2 mr-0 sm:mr-6">
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {agents.length === 0 && !isLoading ? (
        <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 mr-0 sm:mr-6">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-800">Aucun agent trouvé.</p>
          <p className="text-gray-500 mt-2">Commencez par ajouter votre premier agent.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sm:mr-6">

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Agent', 'Contact', 'Type', 'Statut', 'Actions'].map(header => (
                    <th key={header} className={`px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest ${header === 'Actions' ? 'text-right' : ''}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {agents.map(agent => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 mr-3">
                          {agent.nom?.[0]}{agent.prenoms?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{agent.prenoms} {agent.nom}</p>
                          <p className="text-xs text-gray-500 leading-none mt-1">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {agent.telephone}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${agent.type === 'backoffice' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                        {agent.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleUserStatus(agent)}
                          disabled={isSubmitting}
                          className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${agent.actif ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${agent.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-[10px] font-bold uppercase ${agent.actif ? 'text-green-600' : 'text-red-500'}`}>
                          {agent.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center space-x-1">
                        <button
                          onClick={() => openEditModal(agent)}
                          disabled={isSubmitting}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setAgentToDelete(agent)}
                          disabled={isSubmitting}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {agents.map(agent => (
              <div key={agent.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                      {agent.nom?.[0]}{agent.prenoms?.[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{agent.prenoms} {agent.nom}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border mt-1 ${agent.type === 'backoffice' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                        {agent.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(agent)} className="p-2 text-blue-600 bg-blue-50 rounded-lg">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => setAgentToDelete(agent)} className="p-2 text-red-600 bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate">{agent.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>{agent.telephone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleUserStatus(agent)}
                      disabled={isSubmitting}
                      className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${agent.actif ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${agent.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-xs font-bold uppercase ${agent.actif ? 'text-green-600' : 'text-red-500'}`}>
                      {agent.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">ID: {agent.id.substring(0, 8)}...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {agentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
            <div className="flex items-center mb-5 border-b border-gray-100 pb-3">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirmer la suppression</h3>
            </div>
            <p className="mb-8 text-gray-600 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer <span className="font-bold text-gray-900">{agentToDelete.prenoms} {agentToDelete.nom}</span> ?
              <br />
              <span className="text-sm text-red-500 font-medium">Cette action est irréversible et retirera tous les accès à cet agent.</span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAgentToDelete(null)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAgent}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                Supprimer l'agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT / MODIF */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                {editingAgent ? <Edit className="text-blue-600" size={22} /> : <PlusCircle className="text-blue-600" size={22} />}
                {editingAgent ? 'Modifier l\'agent' : 'Nouvel Agent'}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAgent} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Prénoms <span className="text-red-500">*</span></label>
                  <input type="text" name="prenoms" value={agentForm.prenoms || ""} onChange={handleInputChange} placeholder="Ex: Jean" className={inputStyle} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nom <span className="text-red-500">*</span></label>
                  <input type="text" name="nom" value={agentForm.nom || ""} onChange={handleInputChange} placeholder="Ex: Dupont" className={inputStyle} required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Téléphone <span className="text-red-500">*</span></label>
                  <input type="text" name="telephone" value={agentForm.telephone || ""} onChange={handleInputChange} placeholder="Ex: +225 ..." className={inputStyle} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Type d'accès <span className="text-red-500">*</span></label>
                  <select name="type" value={agentForm.type || "backoffice"} onChange={handleInputChange} className={inputStyle}>
                    <option value="backoffice">Backoffice</option>
                    <option value="agence">Agence</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Professionnel <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="email" name="email" value={agentForm.email || ""} onChange={handleInputChange} placeholder="agent@agence.com" className={`${inputStyle} pl-10`} required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mot de passe {editingAgent && '(Optionnel)'}</label>
                  <input type="password" name="password" value={agentForm.password || ""} onChange={handleInputChange} placeholder="••••••••" className={inputStyle} required={!editingAgent} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirmation</label>
                  <input type="password" name="password_confirmation" value={agentForm.password_confirmation || ""} onChange={handleInputChange} placeholder="••••••••" className={inputStyle} required={!editingAgent} />
                </div>
              </div>

              {editingAgent && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3 text-amber-800 text-xs leading-relaxed">
                  <Shield size={16} className="shrink-0" />
                  <p>Laissez les champs "Mot de passe" vides si vous ne souhaitez pas les modifier.</p>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold transition-all flex-1 order-2 sm:order-1">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 flex-1 order-1 sm:order-2 disabled:opacity-50">
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    editingAgent ? 'Enregistrer les modifications' : 'Créer le compte agent'
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
