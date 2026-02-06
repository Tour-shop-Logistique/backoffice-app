import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PlusCircle,
  Loader2,
  Trash2,
  Globe,
  Package,
  RefreshCw,
  Search,
  Edit2,
  Edit3,
  Tag,
  LayoutGrid,
  Filter,
  ChevronDown,
  Check
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { showNotification } from '../redux/slices/uiSlice';
import { fetchCategories } from "../redux/slices/produitSlice";
import { fetchGroupedTarifs, addGroupedTarif, editGroupedTarif, updateGroupedTarifStatus, deleteGroupedTarif } from "../redux/slices/tarificationSlice";
import Addtarifgroupe from '../components/widget/Addtarifgroupe';
import Modal from '../components/common/Modal';
import DeleteModal from '../components/common/DeleteModal';

const GroupedRates = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tarifToEdit, setTarifToEdit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeType, setActiveType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tarifToDelete, setTarifToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  const { groupedTarifs, isLoading, error, groupedHasLoaded } = useSelector(
    (state) => state.tarification
  );
  const { categories, hasLoadedCategories } = useSelector(state => state.produits);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchGroupedTarifs({ silent: true })).unwrap(),
        dispatch(fetchCategories({ silent: true })).unwrap()
      ]);
      dispatch(showNotification({ type: 'success', message: 'Tarifs et catégories mis à jour.' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
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
          dispatch(showNotification({ type: 'success', message: 'Tarif mis à jour avec succès!' }));
          closeModal();
          dispatch(fetchGroupedTarifs({ silent: true }));
        }
      } else {
        const result = await dispatch(addGroupedTarif(data)).unwrap();
        if (result) {
          dispatch(showNotification({ type: 'success', message: 'Nouveau tarif ajouté avec succès!' }));
          closeModal();
          dispatch(fetchGroupedTarifs({ silent: true }));
        }
      }
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: error.message || "Une erreur est survenue." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (tarifId) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [tarifId]: true }));
      await dispatch(updateGroupedTarifStatus(tarifId)).unwrap();
      // dispatch(showNotification({ type: 'success', message: 'Statut mis à jour.' }));
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors de la mise à jour du statut.' }));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [tarifId]: false }));
    }
  };

  const handleDelete = async () => {
    if (!tarifToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteGroupedTarif(tarifToDelete.id)).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Tarif supprimé avec succès!' }));
      setTarifToDelete(null);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors de la suppression.' }));
    } finally {
      setIsDeleting(false);
    }
  };


  const getTypeLabel = (type) => {
    switch (type?.toUpperCase()) {
      case 'GROUPAGE_DHD_AERIEN': return 'DHD Aérien';
      case 'GROUPAGE_DHD_MARITIME': return 'DHD Maritime';
      case 'GROUPAGE_AFRIQUE': return 'Afrique';
      case 'GROUPAGE_CA': return 'Colis Accompagnés';
      default: return type || 'N/A';
    }
  };

  // 1. Filtrer d'abord par recherche et type (pour les compteurs)
  const filteredBySearchAndType = useMemo(() => {
    return (groupedTarifs || []).filter(tarif => {
      const matchesSearch =
        (tarif.category?.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tarif.pays || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = activeType === "all" || tarif.type_expedition?.toUpperCase() === activeType.toUpperCase();
      return matchesSearch && matchesType;
    });
  }, [groupedTarifs, searchTerm, activeType]);

  // 2. Filtrer par statut pour l'affichage
  const filteredTarifs = useMemo(() => {
    return filteredBySearchAndType.filter(tarif => {
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && tarif.actif) ||
        (filterStatus === 'inactive' && !tarif.actif);
      return matchesStatus;
    });
  }, [filteredBySearchAndType, filterStatus]);

  // 3. Compteurs basés sur la recherche et type uniquement
  const counts = useMemo(() => ({
    all: filteredBySearchAndType.length,
    active: filteredBySearchAndType.filter(t => t.actif).length,
    inactive: filteredBySearchAndType.filter(t => !t.actif).length
  }), [filteredBySearchAndType]);

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">

      {/* HEADER - Mobile Optimized */}
      <header className="space-y-3 md:space-y-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Tarifs Groupages
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Gérez les tarifs par type de groupage
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

      {/* SEARCH & FILTERS - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par pays ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
          />
        </div>
        <div className="relative" ref={typeDropdownRef}>
          <button
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all text-sm font-medium text-slate-700"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Filter className={`h-4 w-4 transition-colors ${isTypeDropdownOpen ? 'text-slate-900' : 'text-slate-400'}`} />
              <span className="truncate pl-1 pr-2">
                {activeType === 'all' ? 'Tous les types d\'expedition' : getTypeLabel(activeType)}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isTypeDropdownOpen && (
            <div className="absolute w-full top-full left-0 right-0 mt-2 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setActiveType('all');
                    setIsTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${activeType === 'all' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>Tous les types d'expedition</span>
                  {activeType === 'all' && <Check className="h-4 w-4 text-slate-900" />}
                </button>

                <div className="h-px bg-slate-100 my-1 mx-2" />

                {[
                  { id: 'GROUPAGE_DHD_AERIEN', label: 'Groupage DHD Aérien' },
                  { id: 'GROUPAGE_DHD_MARITIME', label: 'Groupage DHD Maritime' },
                  { id: 'GROUPAGE_AFRIQUE', label: 'Groupage Afrique' },
                  { id: 'GROUPAGE_CA', label: 'Groupage Colis Accompagnés' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setActiveType(mode.id);
                      setIsTypeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${activeType === mode.id ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="truncate">{mode.label}</span>
                    {activeType === mode.id && <Check className="h-4 w-4 text-slate-900" />}
                  </button>
                ))}
              </div>
            </div>
          )}
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
              Toutes ({counts.all})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'active'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Actives ({counts.active})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'inactive'
                ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Inactives ({counts.inactive})
            </button>
          </div>
        </div>

        {/* Body Content */}
        {isLoading && (groupedTarifs || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <Loader2 className="h-10 w-10 text-slate-900 animate-spin mb-3" />
            <p className="text-slate-500 text-sm font-medium">Chargement des tarifs...</p>
          </div>
        ) : filteredTarifs.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Tag className="text-slate-400" size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Aucun tarif trouvé</h3>
            <p className="text-slate-500 text-sm mt-2">Ajustez votre recherche ou ajoutez un nouveau tarif.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Type / Catégorie</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Itinéraire / Pays</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Montant Base</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Prestation</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Total</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Statut</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTarifs.map((tarif) => {
                    const base = parseFloat(tarif.tarif_minimum || tarif.montant_base) || 0;
                    const prest = parseFloat(tarif.pourcentage_prestation) || 0;
                    const mp = parseFloat(tarif.montant_prestation) || base * prest / 100;
                    const exp = parseFloat(tarif.montant_expedition) || base + mp;

                    return (
                      <tr key={tarif.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex flex-col">
                            <span className={`text-sm font-semibold px-2 py-2 rounded uppercase ${tarif.type_expedition?.includes('aerien') ? 'bg-blue-100 text-blue-700' :
                              tarif.type_expedition?.includes('maritime') ? 'bg-indigo-100 text-indigo-700' :
                                tarif.type_expedition?.includes('afrique') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                              {getTypeLabel(tarif.type_expedition)}
                            </span>
                            {tarif.category && <div className="flex items-center gap-1 mt-1.5">
                              <span className="font-semibold text-sm text-slate-900 tracking-tight">
                                → {tarif.category?.nom}
                              </span>
                            </div>}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            {tarif.ligne ? (
                              <Package size={14} className="text-slate-400" />
                            ) : (
                              <Globe size={14} className="text-slate-400" />
                            )}
                            <p className="font-semibold uppercase text-slate-700">
                              {tarif.ligne ? tarif.ligne.replace('-', ' → ') : (tarif.pays || 'N/A')}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-medium text-slate-700">{(base).toLocaleString()} <span className="text-[10px]">FCFA</span></p>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-row gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 font-bold w-fit">
                              {prest}%
                            </span>
                            <span className="text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                              ({mp.toLocaleString()} <span className="text-[10px]">FCFA</span>)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-bold text-slate-900">{exp.toLocaleString()} <span className="text-[10px]">FCFA</span></p>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => handleStatusToggle(tarif.id)}
                            disabled={updatingStatus[tarif.id]}
                            className="group relative flex items-center gap-3 transition-all active:scale-95 mx-auto disabled:opacity-50"
                            title={`Cliquez pour ${tarif.actif ? 'désactiver' : 'activer'}`}
                          >
                            <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${tarif.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                              <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${tarif.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-3">
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards - Native App Style */}
            <div className="md:hidden divide-y divide-slate-200">
              {filteredTarifs.map((tarif) => {
                const base = parseFloat(tarif.tarif_minimum || tarif.montant_base) || 0;
                const prest = parseFloat(tarif.pourcentage_prestation) || 0;
                const mp = parseFloat(tarif.montant_prestation) || 0;
                const exp = parseFloat(tarif.montant_expedition) || 0;

                return (
                  <div key={tarif.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* <div className={`p-2 rounded-lg shrink-0 ${tarif.type_expedition?.includes('AERIEN') ? 'bg-blue-100 text-blue-600' :
                          tarif.type_expedition?.includes('MARITIME') ? 'bg-indigo-100 text-indigo-600' :
                            tarif.type_expedition?.includes('AFRIQUE') ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                          {getTypeIcon(tarif.type_expedition)}
                        </div> */}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate uppercase tracking-tight">
                            {/* {tarif.category?.nom || 'SANS CATÉGORIE'} */}
                            {getTypeLabel(tarif.type_expedition)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-slate-500 font-bold uppercase shrink-0">
                              {exp.toLocaleString()} FCFA
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs uppercase text-slate-400 font-medium truncate">
                              {tarif.ligne ? tarif.ligne.replace('-', ' → ') : tarif.pays}
                            </span>
                          </div>
                          {tarif.category && (
                            <span className="text-sm font-semibold text-blue-600 truncate">
                              Catégorie : {tarif.category?.nom}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStatusToggle(tarif.id)}
                        disabled={updatingStatus[tarif.id]}
                        className="flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${tarif.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-200 ${tarif.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold">Montant Base</span>
                        <span className="text-xs font-semibold text-slate-700">{base.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold">Prestation</span>
                        <div className="flex flex-row items-center gap-2">
                          <span className="text-xs font-semibold text-orange-600">{prest}%</span>
                          <span className="text-xs text-slate-400 font-medium">({mp.toLocaleString()} F)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(tarif)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                      >
                        <Edit3 size={13} />
                        Modifier
                      </button>
                      <button
                        onClick={() => setTarifToDelete(tarif)}
                        className="inline-flex items-center justify-center p-2 text-red-500 active:bg-red-50 border border-red-100 rounded-lg transition-all active:scale-95"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={tarifToEdit ? 'Modifier Tarif Groupage' : 'Nouveau Tarif Groupage'}
        subtitle="Configurez les prix pour les expéditions de type groupage"
        size="xl"
      >
        <Addtarifgroupe
          onClose={closeModal}
          onSubmit={onSubmit}
          tarifToEdit={tarifToEdit}
          categories={categories}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <DeleteModal
        isOpen={!!tarifToDelete}
        onClose={() => setTarifToDelete(null)}
        onConfirm={handleDelete}
        itemName={`${tarifToDelete?.category?.nom} (${tarifToDelete?.pays || tarifToDelete?.ligne})`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default GroupedRates;
