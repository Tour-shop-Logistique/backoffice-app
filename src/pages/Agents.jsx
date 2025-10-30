import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlusCircle, Loader2, X, Trash2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import NotificationPortal from '../components/widget/notification';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentToDelete, setAgentToDelete] = useState(null);
    const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const notificationTimeoutRef = useRef(null);
  const notificationRef = useRef(null);
  const [agentForm, setAgentForm] = useState({
    nom: '',
    prenoms: '',
    telephone: '',
    email: '',
    password: '',
    password_confirmation: '',
    type: 'backoffice',
  });




  // Fonction utilitaire de notification
  const showNotification = useCallback((type, message) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    setNotification({ type, message });
    
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);


  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/backoffice/list-users');
      console.log(response, "response!‼️‼️");
      setAgents(response.data.users || []);
    } catch (err) {
      console.log(err, "err!‼️‼️");
      setError('Erreur lors de la récupération des agents.');
    } finally {
      setIsLoading(false);
    }
  };

  // Nettoyer le timeout lors du démontage du composant
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Chargement initial des agents
  useEffect(() => {
    fetchAgents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAgentForm(prev => ({ ...prev, [name]: value }));
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
    
    try {
      await api.delete(`/backoffice/delete-user/${agentToDelete.id}`);
      setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentToDelete.id));
      setAgentToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'agent:', err);
  showNotification('error', "Erreur lors de la suppression de l'agent");
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
        const { data } = await api.put(`/backoffice/edit-user/${id}`, updateData);
        setAgents(prev => prev.map(agent => 
          agent.id === id ? data.user : agent
        ));
        showNotification('success', 'Agent modifié avec succès');
      } else {
        const { data } = await api.post('/backoffice/create-user', agentForm);
        setAgents(prev => [data.user, ...prev]);
        showNotification('success', 'Agent créé avec succès');
      }
      closeModal();
    } catch (err) {
      console.error('Erreur:', err);
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue';
      showNotification('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [userId]: true }));
      const newStatus = !currentStatus;
      await api.put(`/backoffice/status-user/${userId}`, { status: newStatus });
      
      // Mettre à jour l'état local sans recharger toute la liste
      setAgents(prevAgents => 
        prevAgents.map(agent => 
          agent.id === userId ? { ...agent, actif: newStatus } : agent
        )
      );
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Erreur lors de la mise à jour du statut de l\'utilisateur');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      <div className="relative z-50">
        <NotificationPortal
          notification={notification}
          onClose={() => setNotification(null)}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-800">
          Gestion des Agents
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
        >
          <PlusCircle size={20} />
          Ajouter un Agent
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-gray-600" size={48} />
        </div>
      ) : error ? (
        <div className="text-red-700 bg-red-100 p-4 rounded-lg shadow">
          {error}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {['Nom', 'Email', 'Téléphone', 'Statut', 'Actions'].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                      {agent.nom} {agent.prenoms}
                    </td>
                    <td className="px-4 py-3">{agent.email}</td>
                    <td className="px-4 py-3">{agent.telephone}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {updatingStatus[agent.id] ? (
                          <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                        ) : (
                          <button
                            onClick={() =>
                              toggleUserStatus(agent.id, agent.actif)
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                              agent.actif ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                                agent.actif
                                  ? 'translate-x-6'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}
                        <span
                          className={`ml-2 text-sm font-medium ${
                            agent.actif ? 'text-green-700' : 'text-red-600'
                          }`}
                        >
                          {agent.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(agent)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAgentToDelete(agent);
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer"
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
        </div>
      )}

      {/* Confirmation de suppression */}
      {agentToDelete && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-yellow-500 mr-2" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">
                Confirmer la suppression
              </h3>
            </div>
            <p className="mb-6 text-gray-600">
              Êtes-vous sûr de vouloir supprimer{' '}
              <span className="font-semibold">
                {agentToDelete.prenoms} {agentToDelete.nom}
              </span>{' '}
              ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAgentToDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAgent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d’ajout/modification */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                {editingAgent ? 'Modifier un agent' : 'Créer un agent'}
              </h2>
              <button onClick={closeModal}>
                <X size={24} className="text-gray-600 hover:text-gray-900" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitAgent}
              className="space-y-3 sm:space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="nom"
                  value={agentForm.nom}
                  onChange={handleInputChange}
                  placeholder="Nom"
                  className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  name="prenoms"
                  value={agentForm.prenoms}
                  onChange={handleInputChange}
                  placeholder="Prénoms"
                  className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <input
                type="text"
                name="telephone"
                value={agentForm.telephone}
                onChange={handleInputChange}
                placeholder="Téléphone"
                className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                required
              />

              <input
                type="email"
                name="email"
                value={agentForm.email}
                onChange={handleInputChange}
                placeholder="Email"
                className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                required
              />

              {!editingAgent && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    name="password"
                    value={agentForm.password}
                    onChange={handleInputChange}
                    placeholder="Mot de passe"
                    className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <input
                    type="password"
                    name="password_confirmation"
                    value={agentForm.password_confirmation}
                    onChange={handleInputChange}
                    placeholder="Confirmer le mot de passe"
                        className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2 font-medium"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                {editingAgent ? 'Mettre à jour' : 'Créer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
          
};

export default Agents;
