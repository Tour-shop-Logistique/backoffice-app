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
    <div className="animate-fade-in space-y-6 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tarifs de Groupage
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            Configurez les grilles tarifaires pour les expéditions groupées. Ces tarifs sont appliqués en fonction de la catégorie de marchandise et de la ligne logistique choisie.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Nouveau Tarif</span>
        </button>
      </div>

      {/* Barre de recherche et filtres - Slate Design */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par catégorie, pays ou ligne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            className="flex-1 md:flex-none py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 outline-none transition-all font-medium text-slate-700"
          >
            <option value="all">Toutes les catégories</option>
            <option value="GROUPAGE_DHD_AERIEN">DHD Aérien</option>
            <option value="GROUPAGE_DHD_MARITIME">DHD Maritime</option>
            <option value="GROUPAGE_CA">Colis Accompagné</option>
            <option value="GROUPAGE_AFRIQUE">Afrique</option>
          </select>

          <div className="hidden md:flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 transition-colors ${viewMode === "table" ? "bg-slate-100 text-slate-900" : "bg-white text-slate-400 hover:text-slate-600"}`}
              title="Vue Table"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-slate-100 text-slate-900" : "bg-white text-slate-400 hover:text-slate-600"}`}
              title="Vue Grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vue Table (Desktop) */}
      <div className={`hidden ${viewMode === "table" ? "md:block" : ""} bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Marchandise / Catégorie</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination / Ligne</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Min.</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modes Actifs</th>
                <th className="px-6 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.entries(groupedByType).map(([type, tarifs], groupIndex) => (
                <React.Fragment key={`${type}-${groupIndex}`}>
                  <tr className="bg-slate-50/50">
                    <td colSpan="6" className="px-6 py-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        {getTypeIcon(type)}
                        <span className="font-bold text-[10px] uppercase tracking-widest">
                          {type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {tarifs.map(tarif => (
                    <tr key={tarif.id} className="group hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {tarif.category?.nom || (tarif.type_expedition === 'groupage_ca' ? 'Colis Accompagné' : 'Tarif Général')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">ID: {tarif.id.substring(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                          {tarif.type_expedition?.includes('dhd') ? (
                            <span className="font-bold text-slate-900">{tarif.ligne || 'Ligne'}</span>
                          ) : (
                            <span className="truncate max-w-[200px]">{tarif.pays || 'Toutes destinations'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900 underline underline-offset-4 decoration-slate-200">
                          {formatCurrency(tarif.tarif_minimum || tarif.montant_base || tarif.prix_unitaire)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {tarif.prix_modes ? (
                            <>
                              <div className="flex -space-x-1">
                                {tarif.prix_modes.map((m, idx) => (
                                  <div key={idx} className="p-1 bg-white border border-slate-200 rounded text-slate-500" title={m.mode}>
                                    {getModeIcon(m.mode)}
                                  </div>
                                ))}
                              </div>
                              <span className="text-xs font-medium text-slate-500">
                                {tarif.prix_modes.length} mode{tarif.prix_modes.length > 1 ? 's' : ''}
                              </span>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-white border border-slate-200 rounded text-slate-500">
                                {getModeIcon(tarif.mode || '')}
                              </div>
                              <span className="text-xs font-medium text-slate-500 uppercase">{tarif.mode}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleStatusToggle(tarif.id, tarif.actif)}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold transition-all
                            ${tarif.actif ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tarif.actif ? 'bg-green-500' : 'bg-slate-400'}`} />
                          {tarif.actif ? 'ACTIF' : 'INACTIF'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openModal(tarif)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-md transition-all"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Menu vertical pour les actions secondaires */}
                          <div className="relative group/menu">
                            <button className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-white border border-slate-200 rounded-lg shadow-xl z-10 w-40 overflow-hidden">
                              <button
                                onClick={() => handleStatusToggle(tarif.id, tarif.actif)}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                {tarif.actif ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                                {tarif.actif ? 'Désactiver' : 'Activer'}
                              </button>
                              <button
                                onClick={() => handleDelete(tarif.id)}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <Trash size={14} />
                                Supprimer
                              </button>
                            </div>
                          </div>
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

      {/* Vue Mobile / Grid - Simplifiée */}
      <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "md:hidden"}`}>
        {filteredTarifs.map((tarif) => (
          <div key={tarif.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 hover:border-slate-300 transition-all shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {tarif.category?.nom || (tarif.type_expedition === 'groupage_ca' ? 'Colis Accompagné' : 'Tarif Général')}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium lowercase">
                  <Globe className="h-3 w-3" />
                  {tarif.type_expedition?.includes('dhd') ? tarif.ligne : (tarif.pays || 'tous pays')}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${tarif.actif ? "bg-green-500" : "bg-slate-300"}`} />
            </div>

            <div className="flex items-baseline justify-between py-2 border-y border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Tarif Min.</span>
              <span className="text-base font-bold text-slate-900">
                {formatCurrency(tarif.tarif_minimum || tarif.montant_base || tarif.prix_unitaire)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="text-[10px] font-medium text-slate-400">
                {tarif.prix_modes ? `${tarif.prix_modes.length} modes actifs` : '1 mode'}
              </div>
              <button
                onClick={() => openModal(tarif)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all"
              >
                <Pencil className="h-3 w-3" />
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTarifs.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <Search className="h-8 w-8 text-slate-200 mb-4" />
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Aucun résultat</h3>
          <p className="text-xs text-slate-400 mt-1">Ajustez vos filtres ou effectuez une nouvelle recherche.</p>
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

