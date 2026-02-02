import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import tarificationService from '../services/tarificationService';
import { Pencil, Trash, ToggleLeft, ToggleRight, Plus, X, Search, Filter, Globe, Plane, Ship, Package, MoreVertical, LayoutGrid, List } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../redux/slices/produitSlice";
import { fetchGroupedTarifs, addGroupedTarif, editGroupedTarif } from "../redux/slices/tarificationSlice";
import toast from 'react-hot-toast';
import Addtarifgroupe from '../components/widget/Addtarifgroupe';

// Schéma de validation avec Yup
const validationSchema = yup.object().shape({
  id: yup.string().optional(), // Pour l'édition
  category_id: yup.string().required('La catégorie est requise'),
  tarif_minimum: yup.number().required('Le tarif minimum est requis').positive('Le tarif doit être positif'),
  prix_modes: yup.array().of(
    yup.object().shape({
      mode: yup.string().required('Le mode est requis'),
      montant_base: yup.number().required('Le montant de base est requis').positive('Le montant doit être positif'),
      montant_expedition: yup.number().required("Le montant d'expédition est requis").positive('Le montant doit être positif'),
      pourcentage_prestation: yup.number().required('Le pourcentage est requis').min(0, 'Le pourcentage doit être positif ou zéro') // Ajout de min(0)
    })
  )
});

const GroupedRates = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tarifToEdit, setTarifToEdit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'

  const dispatch = useDispatch();
  const { groupedTarifs, isLoading, error } = useSelector(
    (state) => state.tarification
  );
  const { categories } = useSelector(state => state.produits);

  const filteredTarifs = (groupedTarifs || []).filter(tarif => {
    const matchesSearch =
      (tarif.category?.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tarif.pays || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = activeType === "all" || tarif.type_expedition?.toUpperCase() === activeType.toUpperCase();

    return matchesSearch && matchesType;
  });

  const groupedByType = filteredTarifs.reduce((acc, tarif) => {
    const type = tarif.type_expedition || "non_defini";
    if (!acc[type]) acc[type] = [];
    acc[type].push(tarif);
    return acc;
  }, {});

  // Chargement des catégories et des tarifs au montage
  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
    if (!groupedTarifs || groupedTarifs.length === 0) {
      dispatch(fetchGroupedTarifs());
    }
  }, []);

  // --- LOGIQUE DE CHARGEMENT ---
  // const loadGroupedTarifs = async () => {
  //   try {
  //     setLoading(true);
  //     dispatch(fetchGroupedTarifs());
  //     setError(null);
  //   } catch (err) {
  //     console.error('Erreur lors du chargement des tarifs groupés:', err);
  //     setError('Erreur lors du chargement des tarifs groupés');
  //     toast.error('Erreur lors du chargement des tarifs.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const openModal = (tarif = null) => {
    if (tarif) {
      setTarifToEdit(tarif);
    } else {
      setTarifToEdit(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTarifToEdit(null);
  };

  // --- SOUMISSION DU FORMULAIRE (Ajout ou Édition) ---
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      console.log("Données reçues du formulaire:", data);

      // Les types DHD aérien/maritime sont déjà formatés par Addtarifgroupe
      // Mais on s'assure que la structure est correcte
      let formattedData = data;
      console.log("Données formatées prêtes à l'envoi:", formattedData);

      const loadingToast = toast.loading(tarifToEdit ? 'Modification en cours...' : 'Enregistrement en cours...');

      if (tarifToEdit) {
        // Mode Édition
        console.log(`Tentative de modification du tarif ${tarifToEdit.id}`);
        const result = await dispatch(editGroupedTarif({ tarifId: tarifToEdit.id, tarifData: formattedData }));
        if (editGroupedTarif.fulfilled.match(result)) {
          toast.success('Tarif mis à jour avec succès!', { id: loadingToast });
          dispatch(fetchGroupedTarifs());
          closeModal();
        } else {
          console.error("Erreur dispatch editGroupedTarif:", result.error);
          toast.error('Erreur lors de la modification', { id: loadingToast });
        }
      } else {
        // Mode Ajout
        console.log("Tentative d'ajout d'un nouveau tarif");
        const result = await dispatch(addGroupedTarif(formattedData));
        if (addGroupedTarif.fulfilled.match(result)) {
          toast.success('Nouveau tarif ajouté avec succès!', { id: loadingToast });
          dispatch(fetchGroupedTarifs());
          closeModal();
        } else {
          console.error("Erreur dispatch addGroupedTarif:", result.error);
          toast.error("Erreur lors de l'ajout", { id: loadingToast });
        }
      }

    } catch (error) {
      console.error('Erreur lors de la soumission du tarif:', error);
      toast.error(`Erreur: ${error.message || "Une erreur est survenue."}`);
      setError('Erreur lors de la soumission du tarif');
    } finally {
      setIsSubmitting(false);
    }
  };


  // --- GESTION DES ACTIONS (Statut/Suppression) ---
  const handleStatusToggle = async (tarifId, currentStatus) => {
    try {
      await tarificationService.updateGroupedTarifStatus(tarifId);
      toast.success(`Statut du tarif mis à jour à ${currentStatus ? 'Inactif' : 'Actif'}!`);
      dispatch(fetchGroupedTarifs());
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      toast.error('Erreur lors de la mise à jour du statut.');
    }
  };

  const handleDelete = async (tarifId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce tarif ? Cette action est irréversible.')) {
      try {
        await tarificationService.deleteGroupedTarif(tarifId);
        toast.success('Tarif supprimé avec succès!');
        dispatch(fetchGroupedTarifs());
      } catch (err) {
        console.error('Erreur lors de la suppression du tarif:', err);
        toast.error('Erreur lors de la suppression du tarif.');
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type.toUpperCase()) {
      case 'GROUPAGE_DHD':
      case 'GROUPAGE_DHD_AERIEN': return <Plane className="h-4 w-4" />;
      case 'GROUPAGE_DHD_MARITIME': return <Ship className="h-4 w-4" />;
      case 'GROUPAGE_AFRIQUE': return <Globe className="h-4 w-4" />;
      case 'GROUPAGE_CA': return <Package className="h-4 w-4" />;
      default: return <Ship className="h-4 w-4" />;
    }
  };

  const getModeIcon = (mode) => {
    switch (mode.toLowerCase()) {
      case 'avion': return <Plane className="h-3 w-3" />;
      case 'bateau': return <Ship className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  // --- UTILITAIRE DE FORMATAGE ---
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0 FCFA';
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numberValue).replace('XOF', 'FCFA');
  };

  if (isLoading && (groupedTarifs || []).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div>
        <p className="text-surface-500 font-medium animate-pulse">Chargement des tarifs...</p>
      </div>
    );
  }

  if (error && (groupedTarifs || []).length === 0) {
    return (
      <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4 animate-shake">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
          <X className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-red-900">Erreur de chargement</h3>
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => dispatch(fetchGroupedTarifs())} className="mt-2 text-red-600 font-bold text-xs uppercase hover:underline">Réessayer</button>
        </div>
      </div>
    );
  }

  // --- COMPOSANT PRINCIPAL ---
  return (
    <div className="animate-fade-in space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1" >
          <h1 className="text-3xl md:text-4xl font-extrabold text-surface-900 tracking-tight bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Tarification Groupée
          </h1>
          <p className="text-surface-500 font-medium">Gérez vos tarifs d'expédition par catégorie et destination.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          <span>Nouveau Tarif</span>
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
          <input
            type="text"
            placeholder="Rechercher par catégorie ou pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-5 w-5 text-surface-400 shrink-0" />
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            className="flex-1 md:flex-none py-2.5 px-4 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-surface-700"
          >
            <option value="all">Tous les types</option>
            <option value="GROUPAGE_DHD_AERIEN">DHD Aérien</option>
            <option value="GROUPAGE_DHD_MARITIME">DHD Maritime</option>
            <option value="GROUPAGE_CA">Colis Accompagné</option>
            <option value="GROUPAGE_AFRIQUE">Afrique</option>
          </select>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-surface-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-primary-600 shadow-sm" : "text-surface-500 hover:text-surface-700"}`}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-primary-600 shadow-sm" : "text-surface-500 hover:text-surface-700"}`}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Vue Table (Desktop) */}
      <div className={`hidden ${viewMode === "table" ? "md:block" : ""} bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-200">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">Catégorie</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">Destination</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">Tarif Min.</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">Modes & Tarifs</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-surface-500 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-surface-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-surface-100">
              {Object.entries(groupedByType).map(([type, tarifs], groupIndex) => (
                <React.Fragment key={`${type}-${groupIndex}`}>
                  <tr className="bg-primary-50/30">
                    <td colSpan="6" className="px-6 py-3">
                      <div className="flex items-center gap-2 text-primary-700">
                        {getTypeIcon(type)}
                        <span className="font-bold text-xs uppercase tracking-widest">
                          {type.replace(/_/g, ' ')}
                        </span>
                        <div className="h-px flex-1 bg-primary-100 ml-4"></div>
                      </div>
                    </td>
                  </tr>

                  {tarifs.map(tarif => (
                    <tr key={tarif.id} className="group hover:bg-surface-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-surface-900 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${tarif.category ? 'bg-primary-500' : 'bg-surface-300'}`}></div>
                          {tarif.category?.nom || (tarif.type_expedition === 'groupage_ca' ? 'Colis Accompagné' : 'Tarif Général')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-surface-600 font-medium">
                          <Globe className="h-4 w-4 text-surface-400" />
                          {tarif.type_expedition?.includes('dhd') ? (
                            <span className="text-primary-600 font-bold">{tarif.ligne || 'Ligne non définie'}</span>
                          ) : (
                            <span className="truncate max-w-[150px]">{tarif.pays || (tarif.type_expedition === 'groupage_ca' ? 'Toutes destinations' : '-')}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-extrabold text-primary-600 px-2.5 py-1 rounded-lg bg-primary-50 border border-primary-100">
                          {formatCurrency(tarif.tarif_minimum || tarif.montant_base || tarif.prix_unitaire)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {tarif.prix_modes ? tarif.prix_modes.map((m, idx) => (
                            <div key={`${m.mode || 'mode'}-${idx}`} className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-surface-200 shadow-sm hover:border-primary-200 transition-all">
                              <div className="p-1 bg-surface-50 rounded-md text-surface-500">
                                {getModeIcon(m.mode)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-surface-400 leading-none">{m.mode}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-extrabold text-surface-700">{formatCurrency(m.montant_expedition)}</span>
                                  <span className="text-[9px] font-bold text-primary-600 bg-primary-50 px-1 rounded">+{m.pourcentage_prestation}%</span>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-surface-200 shadow-sm hover:border-primary-200 transition-all">
                              <div className="p-1 bg-surface-50 rounded-md text-surface-500">
                                {getModeIcon(tarif.mode || '')}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-surface-400 leading-none">{tarif.mode}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-extrabold text-surface-700">{formatCurrency(tarif.montant_expedition || (tarif.montant_base * (1 + tarif.pourcentage_prestation / 100)))}</span>
                                  <span className="text-[9px] font-bold text-primary-600 bg-primary-50 px-1 rounded">+{tarif.pourcentage_prestation}%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleStatusToggle(tarif.id, tarif.actif)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all duration-200
                            ${tarif.actif
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-red-100 text-red-700 border border-red-200'}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tarif.actif ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                          {tarif.actif ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openModal(tarif)}
                            className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tarif.id)}
                            className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Supprimer"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vue Mobile / Grid */}
      <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "md:hidden"}`}>
        {filteredTarifs.map((tarif) => (
          <div key={tarif.id} className="card relative p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-xl text-primary-600 shadow-sm border border-primary-100">
                  {getTypeIcon(tarif.type_expedition || "")}
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 leading-tight">
                    {tarif.category?.nom || (tarif.type_expedition === 'groupage_ca' ? 'Colis Accompagné' : 'Tarif Général')}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-surface-500 font-medium">
                    <Globe className="h-3 w-3" />
                    {tarif.type_expedition?.includes('dhd') ? tarif.ligne : (tarif.pays || 'Toutes destinations')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleStatusToggle(tarif.id, tarif.actif)}
                className={`w-2.5 h-2.5 rounded-full shadow-sm ${tarif.actif ? "bg-green-500" : "bg-red-500"}`}
              />
            </div>

            <div className="flex items-baseline justify-between py-2 border-y border-surface-100 border-dashed">
              <span className="text-xs font-semibold text-surface-400">Tarif Base / Min.</span>
              <span className="text-lg font-black text-primary-600">
                {formatCurrency(tarif.tarif_minimum || tarif.montant_base || tarif.prix_unitaire)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {tarif.prix_modes ? tarif.prix_modes.map((m, idx) => (
                <div key={`${m.mode || 'mode'}-${idx}`} className="p-2 bg-surface-50 rounded-xl border border-surface-100 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] font-black text-surface-400 uppercase tracking-tighter">
                    {m.mode}
                    {getModeIcon(m.mode)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black text-surface-800">{formatCurrency(m.montant_expedition)}</div>
                    <div className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">+{m.pourcentage_prestation}%</div>
                  </div>
                </div>
              )) : (
                <div className="p-2 bg-surface-50 rounded-xl border border-surface-100 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] font-black text-surface-400 uppercase tracking-tighter">
                    {tarif.mode}
                    {getModeIcon(tarif.mode || '')}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black text-surface-800">
                      {formatCurrency(tarif.montant_expedition || (tarif.montant_base * (1 + tarif.pourcentage_prestation / 100)))}
                    </div>
                    <div className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">+{tarif.pourcentage_prestation}%</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => openModal(tarif)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-50 hover:bg-primary-50 border border-surface-200 hover:border-primary-200 text-surface-600 hover:text-primary-600 rounded-xl font-bold text-xs transition-all"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
              <button
                onClick={() => handleDelete(tarif.id)}
                className="flex items-center justify-center p-2.5 bg-surface-50 hover:bg-red-50 border border-surface-200 hover:border-red-200 text-surface-400 hover:text-red-500 rounded-xl transition-all"
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTarifs.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-surface-300">
          <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-bold text-surface-900">Aucun tarif trouvé</h3>
          <p className="text-surface-500">Essayez de modifier vos critères de recherche.</p>
          <button
            onClick={() => { setSearchTerm(""); setActiveType("all"); }}
            className="mt-4 text-primary-600 font-bold hover:underline"
          >
            Effacer tous les filtres
          </button>
        </div>
      )}

      {/* --- Modal d'ajout/édition --- */}
      {showModal && <Addtarifgroupe
        tarifToEdit={tarifToEdit}
        closeModal={closeModal}
        categories={categories}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />}
    </div>
  );
};
export default GroupedRates;

