import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PlusCircle,
  Loader2,
  X,
  Trash2,
  Globe,
  Plane,
  Ship,
  Package,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Search,
  Edit2,
  Edit3,
  Tag,
  LayoutGrid
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import NotificationPortal from '../components/widget/notification';
import { fetchCategories } from "../redux/slices/produitSlice";
import { fetchGroupedTarifs, addGroupedTarif, editGroupedTarif, updateGroupedTarifStatus, deleteGroupedTarif } from "../redux/slices/tarificationSlice";
import Addtarifgroupe from '../components/widget/Addtarifgroupe';
import Modal from '../components/common/Modal';
import DeleteModal from '../components/common/DeleteModal';

const GroupedRates = () => {
  const dispatch = useDispatch();
  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tarifToEdit, setTarifToEdit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeType, setActiveType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tarifToDelete, setTarifToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { groupedTarifs, isLoading, error, groupedHasLoaded } = useSelector(
    (state) => state.tarification
  );
  const { categories, hasLoadedCategories } = useSelector(state => state.produits);

  const showNotification = useCallback((type, message) => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => () => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchGroupedTarifs({ silent: true })).unwrap(),
        dispatch(fetchCategories({ silent: true })).unwrap()
      ]);
      showNotification('success', 'Tarifs et catégories mis à jour.');
    } catch (error) {
      showNotification('error', 'Erreur lors du rafraîchissement.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const openModal = (tarif = null) => {
    setTarifToEdit(tarif);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTarifToEdit(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (tarifToEdit) {
        const result = await dispatch(editGroupedTarif({ tarifId: tarifToEdit.id, tarifData: data })).unwrap();
        if (result) {
          showNotification('success', 'Tarif mis à jour avec succès!');
          closeModal();
        }
      } else {
        const result = await dispatch(addGroupedTarif(data)).unwrap();
        if (result) {
          showNotification('success', 'Nouveau tarif ajouté avec succès!');
          closeModal();
        }
      }
    } catch (error) {
      showNotification('error', error.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (tarifId) => {
    try {
      await dispatch(updateGroupedTarifStatus(tarifId)).unwrap();
      showNotification('success', `Statut mis à jour.`);
    } catch (err) {
      showNotification('error', 'Erreur lors de la mise à jour du statut.');
    }
  };

  const handleDelete = async () => {
    if (!tarifToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteGroupedTarif(tarifToDelete.id)).unwrap();
      showNotification('success', 'Tarif supprimé avec succès!');
      setTarifToDelete(null);
    } catch (err) {
      showNotification('error', 'Erreur lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'GROUPAGE_DHD_AERIEN': return <Plane className="h-4 w-4" />;
      case 'GROUPAGE_DHD_MARITIME': return <Ship className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type?.toUpperCase()) {
      case 'GROUPAGE_DHD_AERIEN': return 'Aérien';
      case 'GROUPAGE_DHD_MARITIME': return 'Maritime';
      case 'GROUPAGE_SIMPLE': return 'Simple';
      default: return type || 'N/A';
    }
  };

  const filteredTarifs = useMemo(() => {
    return (groupedTarifs || []).filter(tarif => {
      const matchesSearch =
        (tarif.category?.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tarif.pays || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = activeType === "all" || tarif.type_expedition?.toUpperCase() === activeType.toUpperCase();

      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && tarif.actif) ||
        (filterStatus === 'inactive' && !tarif.actif);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [groupedTarifs, searchTerm, activeType, filterStatus]);

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <NotificationPortal notification={notification} onClose={() => setNotification(null)} />

      {/* HEADER - Mobile Optimized */}
      <header className="space-y-3 md:space-y-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Tarifs Groupés
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Gestion des prix DHD Aérien et Maritime
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
              onClick={() => openModal()}
              className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg hover:shadow-lg transition-colors"
              title="Ajouter"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline md:ml-2">Ajouter</span>
            </button>
          </div>
        </div>
      </header>

      {/* FILTERS & SEARCH - Mobile Optimized */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par pays ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
          />
        </div>
        <div className="relative sm:w-64">
          <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm appearance-none cursor-pointer font-medium text-slate-700"
          >
            <option value="all">Tous les modes</option>
            <option value="GROUPAGE_DHD_AERIEN">DHD Aérien</option>
            <option value="GROUPAGE_DHD_MARITIME">DHD Maritime</option>
            <option value="GROUPAGE_SIMPLE">Groupage Simple</option>
          </select>
        </div>
      </div>

      {/* TABS + CONTENT - Mobile Optimized */}
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
              Toutes ({groupedTarifs.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'active'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Actives ({groupedTarifs.filter(t => t.actif).length})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'inactive'
                ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Inactives ({groupedTarifs.filter(t => !t.actif).length})
            </button>
          </div>
        </div>

        {/* Body Content */}
        {isLoading && (groupedTarifs || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-slate-500 font-medium text-sm">Chargement des tarifs...</p>
          </div>
        ) : filteredTarifs.length === 0 ? (
          <div className="py-20 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Tag className="text-slate-400" size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Aucun tarif trouvé</h3>
            <p className="text-slate-500 text-sm mt-2">Essayez d'ajuster vos filtres.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Catégorie</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Pays / Mode</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Détails Prix</th>
                    <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Statut</th>
                    <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTarifs.map((tarif) => (
                    <tr key={tarif.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{tarif.category?.nom}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-slate-400" />
                            <span className="font-medium text-slate-700">{tarif.pays}</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                            {getTypeIcon(tarif.type_expedition)}
                            {getTypeLabel(tarif.type_expedition)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <div className="inline-flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Base</span>
                            <span className="font-bold text-slate-900">{tarif.tarif_minimum}</span>
                          </div>
                          <div className="inline-flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Exp</span>
                            <span className="font-bold text-slate-900">{tarif.montant_expedition}</span>
                          </div>
                          <div className="inline-flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Prest</span>
                            <span className="font-bold text-slate-900">{tarif.pourcentage_prestation}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleStatusToggle(tarif.id)}
                          className="group relative flex items-center gap-3 transition-all active:scale-95"
                          title={`Cliquez pour ${tarif.actif ? 'désactiver' : 'activer'}`}
                        >
                          <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${tarif.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${tarif.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${tarif.actif ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {tarif.actif ? 'ACTIF' : 'INACTIF'}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openModal(tarif)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setTarifToDelete(tarif)}
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
              {filteredTarifs.map((tarif) => (
                <div key={tarif.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 shrink-0">
                        {getTypeIcon(tarif.type_expedition)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate leading-tight">{tarif.category?.nom}</p>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <Globe size={10} />
                          {tarif.pays}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStatusToggle(tarif.id)}
                      className="flex items-center gap-2 active:scale-95 transition-all"
                    >
                      <div className={`relative w-8 h-4 rounded-full transition-colors ${tarif.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transform transition-transform ${tarif.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <span className={`text-[9px] font-black tracking-tighter ${tarif.actif ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {tarif.actif ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                    <div>
                      <p className="text-[8px] text-slate-400 uppercase font-black">Base</p>
                      <p className="text-xs font-bold text-slate-900">{tarif.tarif_minimum}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 uppercase font-black">Exp</p>
                      <p className="text-xs font-bold text-slate-900">{tarif.montant_expedition}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 uppercase font-black">Prest</p>
                      <p className="text-xs font-bold text-slate-900">{tarif.pourcentage_prestation}%</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(tarif)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                    >
                      <Edit3 size={13} />
                      Modifier
                    </button>
                    <button
                      onClick={() => setTarifToDelete(tarif)}
                      className="inline-flex items-center justify-center p-2 text-red-500 bg-white border border-red-100 rounded-lg transition-all active:scale-95"
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
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={tarifToEdit ? 'Modifier Tarif Groupé' : 'Nouveau Tarif Groupé'}
        subtitle="Configurez les prix pour les expéditions DHD"
        size="xl"
      >
        <Addtarifgroupe
          onClose={closeModal}
          onSubmit={onSubmit}
          initialData={tarifToEdit}
          categories={categories}
          isLoading={isSubmitting}
        />
      </Modal>

      <DeleteModal
        isOpen={!!tarifToDelete}
        onClose={() => setTarifToDelete(null)}
        onConfirm={handleDelete}
        itemName={`${tarifToDelete?.category?.nom} (${tarifToDelete?.pays})`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default GroupedRates;
