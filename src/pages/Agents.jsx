import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlusCircle, Loader2, X, Trash2, AlertTriangle, User, Edit } from 'lucide-react';
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

  // --- Notification helper ---
  const showNotification = useCallback((type, message) => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => () => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
  }, []);

  // --- Chargement initial des agents avec sessionStorage ---
  useEffect(() => {
    dispatch(fetchAgents())
  }, [dispatch]);

  // --- Gestion des inputs ---
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

  // --- CRUD Actions ---
  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;
    const result = await dispatch(deleteAgent(agentToDelete.id));
    if (deleteAgent.fulfilled.match(result)) {
      dispatch(fetchAgents()).unwrap().then((data) => sessionStorage.setItem('agents', JSON.stringify(data)));
      showNotification('success', `L'agent ${agentToDelete.nom} a été supprimé.`);
      setAgentToDelete(null);
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
        const result = await dispatch(editAgent({ agentId: id, agentData: updateData }));
        if (editAgent.fulfilled.match(result)) {
          const data = await dispatch(fetchAgents()).unwrap();
          sessionStorage.setItem('agents', JSON.stringify(data));
          showNotification('success', 'Agent modifié avec succès.');
        }
      } else {
        const result = await dispatch(addAgent(agentForm));
        if (addAgent.fulfilled.match(result)) {
          const data = await dispatch(fetchAgents()).unwrap();
          sessionStorage.setItem('agents', JSON.stringify(data));
          showNotification('success', 'Agent créé avec succès.');
        }
      }
      closeModal();
    } catch (err) {
      showNotification('error', err.message || 'Erreur lors de la soumission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const result = await dispatch(updateAgentStatus({ agentId: userId, status: !currentStatus }));
    if (updateAgentStatus.fulfilled.match(result)) {
      const data = await dispatch(fetchAgents()).unwrap();
      sessionStorage.setItem('agents', JSON.stringify(data));
      showNotification('success', `Statut mis à jour pour l'agent ID: ${userId}.`);
    }
  };

  // --- Styles (optionnel) ---
  const inputStyle = "w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 focus:shadow-md";
  const buttonPrimaryStyle = "w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 flex justify-center items-center gap-2 font-semibold shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed";
  const buttonSecondaryStyle = "px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors";

  // --- JSX Rendu ---
  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <NotificationPortal notification={notification} onClose={() => setNotification(null)} />

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <User size={28} className="text-blue-600" />
          Gestion des Agents
        </h1>
        <button onClick={() => { setEditingAgent(null); closeModal(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-semibold shadow-md transition-all duration-300 active:scale-95 mt-4 sm:mt-0">
          <PlusCircle size={20} /> Ajouter un Agent
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : error ? (
        <div className="text-red-700 bg-red-100 p-4 rounded-xl shadow border border-red-300 flex items-center gap-2">
          <AlertTriangle size={20} /> {error}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-lg border border-gray-100">
          <User size={40} className="text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-800">Aucun agent trouvé.</p>
          <p className="text-gray-500 mt-2">Commencez par ajouter votre premier agent.</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>{['Nom', 'Email', 'Téléphone', 'Type', 'Statut', 'Actions'].map(header => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{header}</th>
                ))}</tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {agents.map(agent => (
                  <tr key={agent.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{agent.prenoms} {agent.nom}</td>
                    <td className="px-6 py-4 text-gray-600">{agent.email}</td>
                    <td className="px-6 py-4 text-gray-600">{agent.telephone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase`} style={{ backgroundColor: agent.type==='backoffice'? '#EBF5FF':'#FFF3E0', color: agent.type==='backoffice'? '#1E88E5':'#FF9800' }}>{agent.type}</span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button onClick={() => toggleUserStatus(agent.id, agent.actif)}
                        title={agent.actif ? "Désactiver" : "Activer"}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${agent.actif?'bg-green-500':'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${agent.actif?'translate-x-6':'translate-x-1'}`} />
                      </button>
                      <span className={`text-xs font-bold uppercase ${agent.actif?'text-green-700':'text-red-600'}`}>{agent.actif?'Actif':'Inactif'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap  gap-3">
                      <button onClick={() => openEditModal(agent)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors" title="Modifier"><Edit size={18} /></button>
                      <button onClick={() => setAgentToDelete(agent)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors" title="Supprimer"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals (ajout/modif et suppression) */}
      {agentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center mb-5 border-b pb-3">
              <AlertTriangle className="text-yellow-500 mr-3" size={28} />
              <h3 className="text-xl font-bold text-gray-900">Confirmer la suppression</h3>
            </div>
            <p className="mb-8 text-gray-700">
              Êtes-vous sûr de vouloir supprimer <span className="font-extrabold text-red-600">{agentToDelete.prenoms} {agentToDelete.nom}</span>? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setAgentToDelete(null)} className={buttonSecondaryStyle}>Annuler</button>
              <button onClick={handleDeleteAgent} className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold flex items-center gap-2">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold">{editingAgent?'Modifier l\'agent':'Créer un nouvel agent'}</h2>
              <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-100"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitAgent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" name="nom" value={agentForm.nom} onChange={handleInputChange} placeholder="Nom" className={inputStyle} required />
                <input type="text" name="prenoms" value={agentForm.prenoms} onChange={handleInputChange} placeholder="Prénoms" className={inputStyle} required />
              </div>
              <input type="text" name="telephone" value={agentForm.telephone} onChange={handleInputChange} placeholder="Téléphone" className={inputStyle} required />
              <input type="email" name="email" value={agentForm.email} onChange={handleInputChange} placeholder="Email" className={inputStyle} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="password" name="password" value={agentForm.password} onChange={handleInputChange} placeholder="Mot de passe" className={inputStyle} required={!editingAgent} />
                <input type="password" name="password_confirmation" value={agentForm.password_confirmation} onChange={handleInputChange} placeholder="Confirmer mot de passe" className={inputStyle} required={!editingAgent} />
              </div>
              <button type="submit" disabled={isSubmitting} className={buttonPrimaryStyle + " mt-6"}>{isSubmitting?'Chargement...':editingAgent?'Mettre à jour':'Créer l\'Agent'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
