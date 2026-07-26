import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Megaphone, Plus, Trash2, Loader2, Users, Building2, Globe, MapPin, Search, Clock, ChevronLeft, ChevronRight, CalendarClock, RefreshCw, Eye, CheckCircle2 } from 'lucide-react';
import { showNotification } from '../redux/slices/uiSlice';
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement, bulkDeleteAnnouncements } from '../redux/slices/announcementSlice';
import { fetchAgences } from '../redux/slices/agenceSlice';
import Modal from '../components/common/Modal';
import DeleteModal from '../components/common/DeleteModal';

const TARGET_MODES = {
  ALL: 'all',
  AGENCE: 'agence',
  PAYS: 'pays',
  VILLES: 'villes',
};

const emptyForm = {
  titre: '',
  message: '',
  targetMode: TARGET_MODES.ALL,
  agence_id: '',
  pays_cible: [],
  villes_cible: [],
  scheduled_at: '',
};

const Announcements = () => {
  const dispatch = useDispatch();
  const { items, pagination, isLoading, isSending, hasLoaded } = useSelector((state) => state.announcements);
  const { agences, hasLoaded: agencesLoaded } = useSelector((state) => state.agences);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [filters, setFilters] = useState({ from: '', to: '', agence_id: '', q: '', page: 1 });

  const refresh = () => {
    dispatch(fetchAnnouncements({
      from: filters.from || undefined,
      to: filters.to || undefined,
      agence_id: filters.agence_id || undefined,
      q: filters.q || undefined,
      page: filters.page,
    }));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters]);

  useEffect(() => {
    if (!agencesLoaded) {
      dispatch(fetchAgences());
    }
  }, [dispatch, agencesLoaded]);

  const paysDisponibles = useMemo(() => {
    const set = new Set((agences || []).map((a) => a.pays).filter(Boolean));
    return Array.from(set);
  }, [agences]);

  const villesDisponibles = useMemo(() => {
    const set = new Set((agences || []).map((a) => a.ville).filter(Boolean));
    return Array.from(set);
  }, [agences]);

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyForm);
  };

  const togglePays = (pays) => {
    setForm((p) => ({
      ...p,
      pays_cible: p.pays_cible.includes(pays) ? p.pays_cible.filter((x) => x !== pays) : [...p.pays_cible, pays],
    }));
  };

  const toggleVille = (ville) => {
    setForm((p) => ({
      ...p,
      villes_cible: p.villes_cible.includes(ville) ? p.villes_cible.filter((x) => x !== ville) : [...p.villes_cible, ville],
    }));
  };

  const handleSubmit = async () => {
    if (!form.titre.trim() || !form.message.trim()) {
      dispatch(showNotification({ type: 'error', message: 'Le titre et le message sont obligatoires.' }));
      return;
    }

    const payload = { titre: form.titre.trim(), message: form.message.trim() };
    if (form.targetMode === TARGET_MODES.AGENCE) payload.agence_id = form.agence_id || null;
    if (form.targetMode === TARGET_MODES.PAYS) payload.pays_cible = form.pays_cible;
    if (form.targetMode === TARGET_MODES.VILLES) payload.villes_cible = form.villes_cible;
    if (form.scheduled_at) payload.scheduled_at = new Date(form.scheduled_at).toISOString();

    try {
      const result = await dispatch(createAnnouncement(payload)).unwrap();
      dispatch(showNotification({
        type: 'success',
        message: form.scheduled_at
          ? 'Annonce programmée avec succès.'
          : `Annonce envoyée à ${result.nbDestinataires ?? '?'} agence(s).`,
      }));
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
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          title="Actualiser"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Actualiser
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/10"
        >
          <Plus size={16} />
          Nouvelle annonce
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Recherche</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value, page: 1 }))}
              placeholder="Titre ou message..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Du</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value, page: 1 }))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Au</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value, page: 1 }))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
          />
        </div>
        <div className="min-w-[180px]">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Agence</label>
          <select
            value={filters.agence_id}
            onChange={(e) => setFilters((p) => ({ ...p, agence_id: e.target.value, page: 1 }))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
          >
            <option value="">Toutes</option>
            {(agences || []).map((a) => (
              <option key={a.id} value={a.id}>{a.nom_agence}</option>
            ))}
          </select>
        </div>
      </div>

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
            <p className="text-sm text-slate-600 font-medium">Aucune annonce trouvée</p>
            <p className="text-xs text-slate-500 mt-2">Ajustez les filtres ou créez une nouvelle annonce.</p>
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
                    onClick={() => setSelectedAnnouncement(a)}
                    className={`cursor-pointer transition-colors ${selectedIds.includes(a.id) ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                        {a.cible}
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
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedAnnouncement(a)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye size={16} />
                      </button>
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

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Page {pagination.current_page} sur {pagination.last_page} ({pagination.total} annonce{pagination.total > 1 ? 's' : ''})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.current_page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.current_page >= pagination.last_page}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Nouvelle annonce"
        subtitle="Diffusée aux agences concernées"
        size="md"
        onConfirm={handleSubmit}
        isLoading={isSending}
        confirmLabel={form.scheduled_at ? 'Programmer' : 'Envoyer'}
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Destinataires</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { mode: TARGET_MODES.ALL, label: 'Toutes les agences', icon: Users },
                { mode: TARGET_MODES.AGENCE, label: 'Une agence', icon: Building2 },
                { mode: TARGET_MODES.PAYS, label: 'Par pays', icon: Globe },
                { mode: TARGET_MODES.VILLES, label: 'Par ville', icon: MapPin },
              ].map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, targetMode: mode }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                    form.targetMode === mode
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {form.targetMode === TARGET_MODES.AGENCE && (
              <select
                value={form.agence_id}
                onChange={(e) => setForm((p) => ({ ...p, agence_id: e.target.value }))}
                className="w-full mt-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium text-slate-900 transition-all"
              >
                <option value="">Sélectionner une agence</option>
                {(agences || []).filter((a) => a.actif).map((a) => (
                  <option key={a.id} value={a.id}>{a.nom_agence}</option>
                ))}
              </select>
            )}

            {form.targetMode === TARGET_MODES.PAYS && (
              <div className="flex flex-wrap gap-2 mt-2">
                {paysDisponibles.map((pays) => (
                  <button
                    key={pays}
                    type="button"
                    onClick={() => togglePays(pays)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      form.pays_cible.includes(pays)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pays}
                  </button>
                ))}
              </div>
            )}

            {form.targetMode === TARGET_MODES.VILLES && (
              <div className="flex flex-wrap gap-2 mt-2">
                {villesDisponibles.map((ville) => (
                  <button
                    key={ville}
                    type="button"
                    onClick={() => toggleVille(ville)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      form.villes_cible.includes(ville)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {ville}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              <CalendarClock size={14} />
              Programmer l'envoi (optionnel)
            </label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium text-slate-900 transition-all"
            />
            {form.scheduled_at && (
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1.5">
                <Clock size={12} />
                Envoi différé à la date/heure choisie, au lieu d'un envoi immédiat.
              </p>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        title="Détails de l'annonce"
        size="md"
        position="right"
        footer={
          <button
            onClick={() => {
              setToDelete(selectedAnnouncement);
              setSelectedAnnouncement(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
            Supprimer cette annonce
          </button>
        }
      >
        {selectedAnnouncement && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 shadow-lg shadow-slate-900/10">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center mb-3 ring-1 ring-white/10">
                <Megaphone className="text-white" size={20} />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{selectedAnnouncement.titre}</h3>
              <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">{selectedAnnouncement.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2.5">
                  {selectedAnnouncement.agence ? <Building2 size={15} className="text-blue-600" /> : <Users size={15} className="text-blue-600" />}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destinataire</p>
                <p className="text-sm font-bold text-slate-900 leading-snug">{selectedAnnouncement.cible}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lectures</p>
                <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{selectedAnnouncement.nb_lectures}</p>
              </div>

              <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock size={15} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Envoyée le</p>
                  <p className="text-sm font-bold text-slate-900">
                    {format(new Date(selectedAnnouncement.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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
