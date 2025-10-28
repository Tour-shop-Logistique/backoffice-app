import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, X, Trash2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useSelector } from 'react-redux';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const { backoffice_id } = useSelector((state) => state.backoffice);
  const [agentForm, setAgentForm] = useState({
    nom: '',
    prenoms: '',
    telephone: '',
    email: '',
    password: '',
    password_confirmation: '',
    type: 'backoffice',
    // agence_id: backoffice_id,
  });

  const fetchAgents = async () => {
    console.log(backoffice_id, "backoffice_id!‼️‼️");
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
      // Ne pas inclure les mots de passe par défaut pour la modification
      ...(editingAgent === null && { 
        password: '',
        password_confirmation: '' 
      })
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
      setError('Erreur lors de la suppression de l\'agent');
      setAgentToDelete(null);
    }
  };

  const handleSubmitAgent = async (e) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        // Mise à jour d'un utilisateur existant
        const { id, ...updateData } = agentForm;
        // Ne pas envoyer les champs de mot de passe vides
        if (!updateData.password) {
          delete updateData.password;
          delete updateData.password_confirmation;
        }
        await api.put(`/backoffice/edit-user/${id}`, updateData);
      } else {
        // Création d'un nouvel utilisateur
        await api.post('/backoffice/create-user', agentForm);
      }
      closeModal();
      fetchAgents(); // Rafraîchir la liste
    } catch (err) {
      if (err.response) {
        console.error("💥 Erreur API:", err.response.data);
        setError(err.response.data?.message || 'Une erreur est survenue');
      } else {
        console.error("Erreur inconnue:", err.message);
        setError('Erreur de connexion au serveur');
      }
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Agents</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <PlusCircle size={20} />
          Ajouter un Agent
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" size={48} /></div>
      ) : error ? (
        <div className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{agent.nom} {agent.prenoms}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{agent.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{agent.telephone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {updatingStatus[agent.id] ? (
                        <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                      ) : (
                        <button
                          onClick={() => toggleUserStatus(agent.id, agent.actif)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full ${agent.actif ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${agent.actif ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      )}
                      <span className={`ml-2 text-sm font-medium ${agent.actif ? 'text-green-700' : 'text-red-700'}`}>
                        {agent.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(agent)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Modifier"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAgentToDelete(agent);
                        }}
                        className="text-red-600 hover:text-red-900 ml-2"
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
      )}

      {/* Confirmation de suppression */}
      {agentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-yellow-500 mr-2" size={24} />
              <h3 className="text-lg font-semibold">Confirmer la suppression</h3>
            </div>
            <p className="mb-6">
              Êtes-vous sûr de vouloir supprimer l'agent <span className="font-semibold">{agentToDelete.prenoms} {agentToDelete.nom}</span> ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setAgentToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAgent}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 size={16} className="mr-1" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout/modification */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingAgent ? 'Modifier l\'agent' : 'Ajouter un nouvel agent'}
              </h2>
              <button type="button" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitAgent} className="space-y-4">
              <input type="text" name="nom" value={agentForm.nom} placeholder="Nom" onChange={handleInputChange} className="w-full p-2 border rounded" required />
              <input type="text" name="prenoms" value={agentForm.prenoms} placeholder="Prénoms" onChange={handleInputChange} className="w-full p-2 border rounded" required />
              <input type="text" name="telephone" value={agentForm.telephone} placeholder="Téléphone" onChange={handleInputChange} className="w-full p-2 border rounded" required />
              <input type="email" name="email" value={agentForm.email} placeholder="Email" onChange={handleInputChange} className="w-full p-2 border rounded" required />
              
              {!editingAgent && (
                <>
                  <input type="password" name="password" value={agentForm.password} placeholder="Mot de passe" onChange={handleInputChange} className="w-full p-2 border rounded" required={!editingAgent} />
                  <input type="password" name="password_confirmation" value={agentForm.password_confirmation} placeholder="Confirmer le mot de passe" onChange={handleInputChange} className="w-full p-2 border rounded" required={!editingAgent} />
                </>
              )}
              
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                  {editingAgent ? 'Mettre à jour' : 'Créer l\'agent'}
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
