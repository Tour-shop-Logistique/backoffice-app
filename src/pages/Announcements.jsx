import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Megaphone, Plus, Trash2, Loader2, Users, Building2, Globe, MapPin, Search, Clock, ChevronLeft, ChevronRight, CalendarClock, RefreshCw, Eye, CheckCircle2, Pencil, XCircle, Hourglass, Truck, UserRound, Check, Send } from 'lucide-react';
import api from '../services/api';
import { showNotification } from '../redux/slices/uiSlice';
import { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, bulkDeleteAnnouncements } from '../redux/slices/announcementSlice';
import { fetchAgences } from '../redux/slices/agenceSlice';
import { fetchCommunes } from '../redux/slices/communeSlice';
import Modal from '../components/common/Modal';
import DeleteModal from '../components/common/DeleteModal';
import useHasPermission from '../hooks/useHasPermission';

const TARGET_MODES = {
  ALL: 'all',
  AGENCE: 'agence',
  PAYS: 'pays',
  VILLES: 'villes',
};

const CIBLES = [
  { key: 'agences', label: 'Agences', description: 'Partenaires du réseau', icon: Building2 },
  { key: 'clients', label: 'Clients', description: "Utilisateurs de l'app client", icon: UserRound },
  { key: 'livreurs', label: 'Livreurs', description: "Utilisateurs de l'app livreur", icon: Truck },
];

const TYPE_LECTEUR = {
  agence: { label: 'Agence', icon: Building2, tone: 'bg-blue-50 text-blue-600' },
  client: { label: 'Client', icon: UserRound, tone: 'bg-violet-50 text-violet-600' },
  livreur: { label: 'Livreur', icon: Truck, tone: 'bg-amber-50 text-amber-600' },
};

const MESSAGE_MAX = 2000;

const emptyForm = {
  titre: '',
  message: '',
  cibles: CIBLES.map((c) => c.key),
  targetMode: TARGET_MODES.ALL,
  agence_id: '',
  pays_cible: [],
  communes_cible: [],
  programmer: false,
  scheduled_at: '',
};

const formatDate = (iso, pattern = 'dd MMM yyyy à HH:mm') => format(new Date(iso), pattern, { locale: fr });

const Announcements = () => {
  const dispatch = useDispatch();
  const { items, pagination, isLoading, isSending, hasLoaded } = useSelector((state) => state.announcements);
  const { agences, hasLoaded: agencesLoaded } = useSelector((state) => state.agences);
  const { communes, hasLoaded: communesLoaded, isLoading: communesLoading } = useSelector((state) => state.communes);
  const canCreate = useHasPermission('announcements.create');
  const canEdit = useHasPermission('announcements.edit');
  const canDelete = useHasPermission('announcements.delete');
  const canBulkDelete = useHasPermission('announcements.bulk_delete');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [lectures, setLectures] = useState(null);
  const [lecturesTab, setLecturesTab] = useState('lus');

  useEffect(() => {
    if (!selectedAnnouncement) return;
    let annule = false;
    setLectures(null);
    setLecturesTab('lus');
    api.get(`/backoffice/announcements/${selectedAnnouncement.id}/lectures`)
      .then(({ data }) => { if (!annule) setLectures(data); })
      .catch(() => { if (!annule) setLectures({ lecteurs: [], agences_non_lues: [], erreur: true }); });
    return () => { annule = true; };
  }, [selectedAnnouncement]);

  const [filters, setFilters] = useState({ from: '', to: '', agence_id: '', q: '', page: 1 });
  const isFirstRun = useRef(true);

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
    // Au tout premier montage, ne recharge que si rien n'est deja en cache
    // (evite un fetch inutile a chaque retour sur la page/l'onglet).
    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (!hasLoaded) refresh();
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters]);

  useEffect(() => {
    if (!agencesLoaded) {
      dispatch(fetchAgences());
    }
  }, [dispatch, agencesLoaded]);

  useEffect(() => {
    if (!communesLoaded && !communesLoading) {
      dispatch(fetchCommunes());
    }
  }, [dispatch, communesLoaded, communesLoading]);

  const paysDisponibles = useMemo(() => {
    const set = new Set((agences || []).map((a) => a.pays).filter(Boolean));
    return Array.from(set);
  }, [agences]);

  // Communes réellement utilisées par au moins une agence existante
  // (référentiel structuré, remplace l'ancien ciblage par ville texte
  // libre - voir Announcement::communes_cible côté backend).
  const communesDisponibles = useMemo(() => {
    const idsUtilises = new Set((agences || []).map((a) => a.commune_id).filter(Boolean));
    return (communes || []).filter((c) => idsUtilises.has(c.id));
  }, [agences, communes]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEditModal = (a) => {
    setEditingId(a.id);
    setForm({
      titre: a.titre,
      message: a.message,
      cibles: a.cibles?.length ? a.cibles : ['agences'],
      targetMode: a.agence ? TARGET_MODES.AGENCE : TARGET_MODES.ALL,
      agence_id: a.agence?.id || '',
      pays_cible: [],
      communes_cible: [],
      programmer: !!a.scheduled_at,
      scheduled_at: a.scheduled_at ? format(new Date(a.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '',
    });
    setSelectedAnnouncement(null);
    setIsModalOpen(true);
  };

  const togglePays = (pays) => {
    setForm((p) => ({
      ...p,
      pays_cible: p.pays_cible.includes(pays) ? p.pays_cible.filter((x) => x !== pays) : [...p.pays_cible, pays],
    }));
  };

  const toggleCommune = (communeId) => {
    setForm((p) => ({
      ...p,
      communes_cible: p.communes_cible.includes(communeId) ? p.communes_cible.filter((x) => x !== communeId) : [...p.communes_cible, communeId],
    }));
  };

  const toggleCible = (key) => {
    setForm((p) => ({
      ...p,
      cibles: p.cibles.includes(key) ? p.cibles.filter((x) => x !== key) : [...p.cibles, key],
    }));
  };

  const ciblesAgences = form.cibles.includes('agences');

  const handleSubmit = async () => {
    const erreur =
      (!form.titre.trim() || !form.message.trim()) ? 'Le titre et le message sont obligatoires.'
      : form.cibles.length === 0 ? 'Choisissez au moins un type de destinataire.'
      : ciblesAgences && form.targetMode === TARGET_MODES.AGENCE && !form.agence_id ? 'Sélectionnez une agence.'
      : ciblesAgences && form.targetMode === TARGET_MODES.PAYS && form.pays_cible.length === 0 ? 'Sélectionnez au moins un pays.'
      : ciblesAgences && form.targetMode === TARGET_MODES.VILLES && form.communes_cible.length === 0 ? 'Sélectionnez au moins une ville.'
      : form.programmer && !form.scheduled_at ? "Choisissez la date et l'heure d'envoi."
      : null;
    if (erreur) {
      dispatch(showNotification({ type: 'error', message: erreur }));
      return;
    }

    const payload = { titre: form.titre.trim(), message: form.message.trim(), cibles: form.cibles };
    if (ciblesAgences) {
      if (form.targetMode === TARGET_MODES.AGENCE) payload.agence_id = form.agence_id;
      if (form.targetMode === TARGET_MODES.PAYS) payload.pays_cible = form.pays_cible;
      if (form.targetMode === TARGET_MODES.VILLES) payload.communes_cible = form.communes_cible;
    }
    if (form.programmer) payload.scheduled_at = new Date(form.scheduled_at).toISOString();

    try {
      if (editingId) {
        await dispatch(updateAnnouncement({ id: editingId, payload })).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Annonce mise à jour.' }));
      } else {
        const result = await dispatch(createAnnouncement(payload)).unwrap();
        dispatch(showNotification({
          type: 'success',
          message: form.programmer
            ? 'Annonce programmée avec succès.'
            : `Annonce envoyée à ${result.nbDestinataires ?? '?'} destinataire(s).`,
        }));
      }
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
      {/* Filtres + actions */}
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
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/10"
            >
              <Plus size={16} />
              Nouvelle annonce
            </button>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-900 rounded-lg shadow-md">
          <span className="text-sm font-semibold text-white">
            {selectedIds.length} annonce{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white uppercase tracking-widest transition-colors"
            >
              Annuler
            </button>
            {canBulkDelete && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            )}
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
                  <th className="px-6 py-4 text-center">Statut</th>
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
                      {a.statut === 'programmee' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 whitespace-nowrap">
                          <Hourglass size={12} />
                          Programmée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap">
                          <CheckCircle2 size={12} />
                          Envoyée
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">
                        {a.nb_lectures}{a.nb_destinataires != null ? `/${a.nb_destinataires}` : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {a.statut === 'programmee' && a.scheduled_at
                          ? `Prévue le ${format(new Date(a.scheduled_at), 'dd MMM yyyy à HH:mm', { locale: fr })}`
                          : format(new Date(a.sent_at || a.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
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
                      {canEdit && a.statut === 'programmee' && (
                        <button
                          onClick={() => openEditModal(a)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier la programmation"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setToDelete(a)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={a.statut === 'programmee' ? 'Annuler la programmation' : 'Supprimer'}
                        >
                          {a.statut === 'programmee' ? <XCircle size={16} /> : <Trash2 size={16} />}
                        </button>
                      )}
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
        title={editingId ? "Modifier l'annonce programmée" : 'Nouvelle annonce'}
        subtitle={form.cibles.length ? `Pour : ${CIBLES.filter((c) => form.cibles.includes(c.key)).map((c) => c.label.toLowerCase()).join(', ')}` : 'Aucun destinataire choisi'}
        size="4xl"
        onConfirm={handleSubmit}
        isLoading={isSending}
        confirmLabel={editingId ? 'Enregistrer' : (form.programmer ? 'Programmer' : 'Envoyer')}
      >
        <div className="grid gap-6 md:grid-cols-5 md:gap-8">
          <div className="space-y-5 md:col-span-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Titre</label>
              <input
                type="text"
                value={form.titre}
                maxLength={255}
                onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
                placeholder="Ex : Nouvelle procédure de retrait"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Message</label>
                <span className={`text-xs tabular-nums ${form.message.length > MESSAGE_MAX * 0.9 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                  {form.message.length}/{MESSAGE_MAX}
                </span>
              </div>
              <textarea
                value={form.message}
                maxLength={MESSAGE_MAX}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="Détail du message à communiquer..."
                className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[180px] resize-y"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">Aperçu</p>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                <div className="flex gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Megaphone size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${form.titre.trim() ? 'text-slate-900' : 'text-slate-400'}`}>
                        {form.titre.trim() || 'Titre de l’annonce'}
                      </p>
                      <span className="text-[11px] text-slate-400 shrink-0">maintenant</span>
                    </div>
                    <p className={`text-xs mt-0.5 line-clamp-3 whitespace-pre-line break-words ${form.message.trim() ? 'text-slate-600' : 'text-slate-400'}`}>
                      {form.message.trim() || 'Le message apparaîtra ici, tel que vos destinataires le verront.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 md:col-span-2 md:border-l md:border-slate-100 md:pl-8">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">Destinataires</p>
              <div className="space-y-2">
                {CIBLES.map(({ key, label, description, icon: Icon }) => {
                  const actif = form.cibles.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      role="checkbox"
                      aria-checked={actif}
                      onClick={() => toggleCible(key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        actif
                          ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${actif ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">{label}</span>
                        <span className="block text-xs text-slate-500">{description}</span>
                      </span>
                      <span className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center ${actif ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {actif && <Check size={13} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {ciblesAgences && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">Quelles agences ?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { mode: TARGET_MODES.ALL, label: 'Toutes', icon: Users },
                    { mode: TARGET_MODES.AGENCE, label: 'Une agence', icon: Building2 },
                    { mode: TARGET_MODES.PAYS, label: 'Par pays', icon: Globe },
                    { mode: TARGET_MODES.VILLES, label: 'Par ville', icon: MapPin },
                  ].map(({ mode, label, icon: Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, targetMode: mode }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                        form.targetMode === mode
                          ? 'border-indigo-500 bg-indigo-50/60 text-indigo-700 ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
                    className="w-full mt-2 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  >
                    <option value="">Sélectionner une agence</option>
                    {(agences || []).filter((a) => a.actif).map((a) => (
                      <option key={a.id} value={a.id}>{a.nom_agence}</option>
                    ))}
                  </select>
                )}

                {form.targetMode === TARGET_MODES.PAYS && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {paysDisponibles.map((pays) => (
                      <button
                        key={pays}
                        type="button"
                        onClick={() => togglePays(pays)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
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
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {communesDisponibles.map((commune) => (
                      <button
                        key={commune.id}
                        type="button"
                        onClick={() => toggleCommune(commune.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          form.communes_cible.includes(commune.id)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {commune.nom}
                      </button>
                    ))}
                    {communesDisponibles.length === 0 && (
                      <p className="text-xs text-slate-400">Aucune commune n'est encore utilisée par une agence.</p>
                    )}
                  </div>
                )}

                {(form.cibles.includes('clients') || form.cibles.includes('livreurs')) && form.targetMode !== TARGET_MODES.ALL && (
                  <p className="text-xs text-slate-500 mt-2">Ce choix ne concerne que les agences : clients et livreurs reçoivent l'annonce partout.</p>
                )}
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">Envoi</p>
              {!editingId && (
                <div className="space-y-2">
                  {[
                    { programmer: false, label: 'Maintenant', description: 'Diffusée dès la validation', icon: Send },
                    { programmer: true, label: 'Programmer', description: 'À une date et une heure précises', icon: CalendarClock },
                  ].map(({ programmer, label, description, icon: Icon }) => {
                    const actif = form.programmer === programmer;
                    return (
                      <button
                        key={label}
                        type="button"
                        role="radio"
                        aria-checked={actif}
                        onClick={() => setForm((p) => ({ ...p, programmer }))}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          actif
                            ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${actif ? 'border-indigo-600' : 'border-slate-300'}`}>
                          {actif && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">{label}</span>
                          <span className="block text-xs text-slate-500">{description}</span>
                        </span>
                        <Icon size={16} className={actif ? 'text-indigo-600' : 'text-slate-400'} />
                      </button>
                    );
                  })}
                </div>
              )}
              {form.programmer && (
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                  className="w-full mt-2 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        title="Détails de l'annonce"
        size="xl"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {canDelete ? (
              <button
                onClick={() => {
                  setToDelete(selectedAnnouncement);
                  setSelectedAnnouncement(null);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                {selectedAnnouncement?.statut === 'programmee' ? 'Annuler la programmation' : 'Supprimer'}
              </button>
            ) : <span />}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest"
              >
                Fermer
              </button>
              {canEdit && selectedAnnouncement?.statut === 'programmee' && (
                <button
                  onClick={() => openEditModal(selectedAnnouncement)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                >
                  <Pencil size={14} />
                  Modifier
                </button>
              )}
            </div>
          </div>
        }
      >
        {selectedAnnouncement && (
          <AnnouncementDetails
            annonce={selectedAnnouncement}
            lectures={lectures}
            tab={lecturesTab}
            onTabChange={setLecturesTab}
          />
        )}
      </Modal>

      <DeleteModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={toDelete?.statut === 'programmee' ? 'Annuler la programmation' : "Supprimer l'annonce"}
        message={
          toDelete?.statut === 'programmee'
            ? `L'annonce "${toDelete?.titre}" ne sera jamais envoyée.`
            : `L'annonce "${toDelete?.titre}" sera définitivement supprimée.`
        }
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

const AnnouncementDetails = ({ annonce, lectures, tab, onTabChange }) => {
  const programmee = annonce.statut === 'programmee';
  const lus = annonce.nb_lectures || 0;
  const total = annonce.nb_destinataires;
  const taux = total ? Math.min(100, Math.round((lus / total) * 100)) : null;
  const nonLues = lectures?.agences_non_lues || [];
  const liste = tab === 'lus' ? (lectures?.lecteurs || []) : nonLues;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {programmee ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-semibold bg-amber-50 text-amber-700">
            <Hourglass size={12} /> Programmée
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-semibold bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={12} /> Envoyée
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-slate-500">
          <Clock size={12} />
          {programmee && annonce.scheduled_at
            ? `Prévue le ${formatDate(annonce.scheduled_at, 'dd MMMM yyyy à HH:mm')}`
            : formatDate(annonce.sent_at || annonce.created_at, 'dd MMMM yyyy à HH:mm')}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 bg-white p-4 sm:p-5">
        <h3 className="text-lg font-bold text-slate-900 leading-snug break-words">{annonce.titre}</h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{annonce.message}</p>
      </div>

      <div className="flex items-start gap-2 text-sm">
        <Users size={16} className="text-slate-400 mt-0.5 shrink-0" />
        <span className="text-slate-500">Destinataires :</span>
        <span className="font-semibold text-slate-900">{annonce.cible}</span>
      </div>

      {!programmee && (
        <>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Lectures</span>
              <span className="text-sm text-slate-500 tabular-nums">
                <span className="text-xl font-black text-slate-900">{lus}</span>
                {total != null && <> / {total}</>}
                {taux != null && <span className="ml-2 font-bold text-emerald-600">{taux}%</span>}
              </span>
            </div>
            {taux != null && (
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${taux}%` }} />
              </div>
            )}
          </div>

          <div>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-3">
              {[
                { key: 'lus', label: 'Ont lu', count: lectures?.lecteurs?.length },
                { key: 'non_lus', label: 'Agences pas encore lu', count: nonLues.length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onTabChange(key)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-bold transition-all ${
                    tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}{lectures && <span className="ml-1 tabular-nums text-slate-400">({count ?? 0})</span>}
                </button>
              ))}
            </div>

            {!lectures ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-slate-400" size={22} />
              </div>
            ) : lectures.erreur ? (
              <p className="text-center text-sm text-red-600 py-6">Impossible de charger les lectures.</p>
            ) : liste.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">
                {tab === 'lus' ? "Personne n'a encore lu cette annonce." : 'Toutes les agences ciblées ont lu l’annonce.'}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 max-h-72 overflow-y-auto custom-scrollbar">
                {liste.map((l, i) => {
                  const t = TYPE_LECTEUR[l.type] || TYPE_LECTEUR.agence;
                  const Icon = t.icon;
                  return (
                    <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.tone}`}>
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{l.nom || '—'}</p>
                        <p className="text-xs text-slate-500 truncate">{t.label}{l.detail ? ` · ${l.detail}` : ''}</p>
                      </div>
                      {l.read_at && (
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatDate(l.read_at, 'dd MMM, HH:mm')}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Announcements;
