import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Megaphone, Plus, Trash2, Loader2, Users, Building2 } from 'lucide-react';
import { showNotification } from '../redux/slices/uiSlice';
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement, bulkDeleteAnnouncements } from '../redux/slices/announcementSlice';
import { fetchAgences } from '../redux/slices/agenceSlice';
import Modal from '../components/common/Modal';
import DeleteModal from '../components/common/DeleteModal';

const Announcements = () => {
  const dispatch = useDispatch();
  const { items, isLoading, isSending, hasLoaded } = useSelector((state) => state.announcements);
  const { agences, hasLoaded: agencesLoaded } = useSelector((state) => state.agences);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({ titre: '', message: '', agence_id: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      dispatch(fetchAnnouncements());
    }
  }, [dispatch, hasLoaded, isLoading]);

  useEffect(() => {
    if (!agencesLoaded) {
      dispatch(fetchAgences());
    }
  }, [dispatch, agencesLoaded]);

  const closeModal = () => {
    setIsModalOpen(false);
    setForm({ titre: '', message: '', agence_id: '' });
  };

  const handleSubmit = async () => {
    if (!form.titre.trim() || !form.message.trim()) {
      dispatch(showNotification({ type: 'error', message: 'Le titre et le message sont obligatoires.' }));
      return;
    }
    try {
      await dispatch(createAnnouncement({
        titre: form.titre.trim(),
        message: form.message.trim(),
        agence_id: form.agence_id || null,
      })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Annonce envoyée avec succès.' }));
      closeModal();
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || "Erreur lors de l'envoi de l'annonce" }));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteAnnouncement(toDelete.id)).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Annonce supprimée.' }));
      setToDelete(null);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || 'Erreur lors de la suppression' }));
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((a) => a.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await dispatch(bulkDeleteAnnouncements(selectedIds)).unwrap();
      dispatch(showNotification({ type: 'success', message: `${selectedIds.length} annonce(s) supprimée(s).` }));
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || 'Erreur lors de la suppression' }));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12 font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Annonces</h1>
          <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
            Communications envoyées aux agences partenaires
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/10"
        >
          <Plus size={16} />
          Nouvelle annonce
        </button>
      </header>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 rounded-lg shadow-md">
          <span className="text-sm font-semibold text-white">
            {selectedIds.length} annonce{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white uppercase tracking-widest transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
            <p className="text-sm text-slate-600 font-medium">Chargement des annonces...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <Megaphone className="text-slate-300 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-sm text-slate-600 font-medium">Aucune annonce envoyée</p>
            <p className="text-xs text-slate-500 mt-2">Créez votre première annonce pour informer les agences partenaires.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-widest">
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4">Annonce</th>
                  <th className="px-6 py-4">Destinataire</th>
                  <th className="px-6 py-4 text-center">Lectures</th>
                  <th className="px-6 py-4">Envoyée le</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((a) => (
                  <tr
                    key={a.id}
                    className={`transition-colors ${selectedIds.includes(a.id) ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a.id)}
                        onChange={() => toggleSelect(a.id)}
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="font-bold text-slate-900 text-sm">{a.titre}</p>
                      <p className="text-sm text-slate-500 mt-0.5 truncate">{a.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${a.agence ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {a.agence ? <Building2 size={12} /> : <Users size={12} />}
                        {a.agence ? a.agence.nom_agence : 'Toutes les agences'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-slate-700">{a.nb_lectures}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {format(new Date(a.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setToDelete(a)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Nouvelle annonce"
        subtitle="Envoyée en temps réel aux agences concernées"
        size="md"
        onConfirm={handleSubmit}
        isLoading={isSending}
        confirmLabel="Envoyer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Titre</label>
            <input
              type="text"
              value={form.titre}
              onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
              placeholder="Ex: Nouvelle procédure de retrait"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium text-slate-900 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Détail du message à communiquer..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium text-slate-900 transition-all min-h-[100px] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Destinataire</label>
            <select
              value={form.agence_id}
              onChange={(e) => setForm((p) => ({ ...p, agence_id: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium text-slate-900 transition-all"
            >
              <option value="">Toutes les agences actives</option>
              {(agences || []).filter((a) => a.actif).map((a) => (
                <option key={a.id} value={a.id}>{a.nom_agence}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <DeleteModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Supprimer l'annonce"
        message={`L'annonce "${toDelete?.titre}" sera définitivement supprimée.`}
      />

      <DeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        title="Supprimer les annonces"
        message={`${selectedIds.length} annonce(s) seront définitivement supprimée(s).`}
      />
    </div>
  );
};

export default Announcements;
