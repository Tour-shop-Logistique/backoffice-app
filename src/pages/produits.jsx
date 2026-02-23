import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProduits,
  fetchCategories,
  addCategory,
  editCategory,
  deleteCategory,
  updateCategoryStatus,
  addProduit,
  editProduit,
  deleteProduit,
  updateProduitStatus,
} from "../redux/slices/produitSlice"

import { PlusCircle, Loader2, X, Trash2, AlertTriangle, Edit2, Save, XCircle, RefreshCw, CheckCircle2, Search, Package, Tag, Edit3, ChevronLeft, ChevronRight, Filter, ChevronDown, Check } from 'lucide-react';
import { showNotification } from "../redux/slices/uiSlice"
import Modal from '../components/common/Modal';
import DeleteModal from '../components/common/DeleteModal';

export default function Produits() {
  const dispatch = useDispatch();
  const { listProduits, isLoading, categories, hasLoadedProduits, hasLoadedCategories } = useSelector(state => state.produits);

  // PRODUITS
  const [editingProduit, setEditingProduit] = useState(null);
  const [produitToDelete, setProduitToDelete] = useState(null);

  const [produitForm, setProduitForm] = useState({
    category_id: "",
    designation: "",
    reference: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // CATEGORIES
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [categoryForm, setCategoryForm] = useState({
    nom: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isRefreshingProduits, setIsRefreshingProduits] = useState(false);
  const [isRefreshingCategories, setIsRefreshingCategories] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefreshGlobal = async () => {
    setIsRefreshingProduits(true);
    setIsRefreshingCategories(true);
    try {
      await Promise.all([
        dispatch(fetchProduits({ silent: true })).unwrap(),
        dispatch(fetchCategories({ silent: true })).unwrap()
      ]);
      dispatch(showNotification({ type: 'success', message: 'Données mises à jour avec succès.' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors de la mise à jour des données.' }));
    } finally {
      setIsRefreshingProduits(false);
      setIsRefreshingCategories(false);
    }
  };

  const handleRefreshProduits = async () => {
    setIsRefreshingProduits(true);
    try {
      console.log("Refreshing produits...");
      await dispatch(fetchProduits({ silent: true })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Produits mis à jour.' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement des produits.' }));
    } finally {
      setIsRefreshingProduits(false);
    }
  };

  const handleRefreshCategories = async () => {
    setIsRefreshingCategories(true);
    try {
      await dispatch(fetchCategories({ silent: true })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Catégories mises à jour.' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement des catégories.' }));
    } finally {
      setIsRefreshingCategories(false);
    }
  };

  useEffect(() => {
    if (!hasLoadedProduits) {
      dispatch(fetchProduits());
    }
    if (!hasLoadedCategories) {
      dispatch(fetchCategories());
    }
  }, [dispatch, hasLoadedProduits, hasLoadedCategories]);

  // -------------------------------
  // 🚀 AJOUTER UN PRODUIT
  // -------------------------------
  const handleAddProduit = async () => {
    if (!produitForm.category_id || !produitForm.designation || !produitForm.reference) {
      return showNotification("error", "Veuillez remplir tous les champs !");
    }

    setIsSubmitting(true);
    try {
      const response = await dispatch(addProduit(produitForm)).unwrap();

      if (response.success) {
        showNotification("success", "Produit ajouté avec succès !");
        setProduitForm({ category_id: "", designation: "", reference: "" });
        setIsModalOpen(false);
        dispatch(fetchProduits({ silent: true }));
      } else {
        showNotification("error", "Erreur lors de l'ajout du produit !");
      }
    } catch (error) {
      showNotification("error", error.message || "Erreur lors de l'ajout !");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------
  // 🗑️ SUPPRIMER UN PRODUIT
  // -------------------------------
  const handleDeleteProduit = async () => {
    if (!produitToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await dispatch(deleteProduit(produitToDelete.id)).unwrap();

      if (response.success) {
        dispatch(showNotification({ type: "success", message: "Produit supprimé avec succès !" }));
        setProduitToDelete(null);
        dispatch(fetchProduits({ silent: true }));
      } else {
        dispatch(showNotification({ type: "error", message: "Erreur lors de la suppression !" }));
      }
    } catch (error) {
      dispatch(showNotification({ type: "error", message: error.message || "Erreur lors de la suppression !" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------
  // ✏️ MODIFIER UN PRODUIT
  // -------------------------------
  const handleEditProduit = async () => {
    if (!editingProduit.category_id || !editingProduit.designation || !editingProduit.reference) {
      return dispatch(showNotification({ type: "error", message: "Veuillez remplir tous les champs !" }));
    }

    setIsSubmitting(true);
    try {
      const response = await dispatch(editProduit({
        produitId: editingProduit.id,
        produitData: {
          category_id: editingProduit.category_id,
          designation: editingProduit.designation,
          reference: editingProduit.reference
        }
      })).unwrap();

      if (response.success) {
        dispatch(showNotification({ type: "success", message: "Produit modifié avec succès !" }));
        setEditingProduit(null);
        dispatch(fetchProduits({ silent: true }));
      } else {
        dispatch(showNotification({ type: "error", message: "Erreur lors de la modification !" }));
      }
    } catch (error) {
      dispatch(showNotification({ type: "error", message: error.message || "Erreur lors de la modification !" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------
  // 🚀 AJOUTER UNE CATÉGORIE
  // -------------------------------
  const handleAddCategory = async () => {
    if (!categoryForm.nom) {
      return dispatch(showNotification({ type: "error", message: "Le nom de la catégorie est requis !" }));
    }

    const payload = {
      nom: categoryForm.nom,
    };

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await dispatch(editCategory({
          categoryId: editingCategory.id,
          categoryData: { nom: payload.nom }
        })).unwrap();
        dispatch(showNotification({ type: "success", message: "Catégorie modifiée avec succès !" }));
        dispatch(fetchCategories({ silent: true }));
      } else {
        await dispatch(addCategory(payload)).unwrap();
        dispatch(showNotification({ type: "success", message: "Catégorie ajoutée avec succès !" }));
        dispatch(fetchCategories({ silent: true }));
      }

      setCategoryForm({ nom: "" });
      setEditingCategory(null);
    } catch (error) {
      dispatch(showNotification({ type: "error", message: editingCategory ? "Erreur lors de la modification !" : "Erreur lors de l'ajout !" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚀 SUPPRIMER UNE CATÉGORIE
  // -------------------------------
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await dispatch(deleteCategory(categoryToDelete.id)).unwrap();
      if (response.success) {
        dispatch(showNotification({ type: "success", message: "Catégorie supprimée avec succès !" }));
        setCategoryToDelete(null);
        dispatch(fetchCategories({ silent: true }));
      } else {
        dispatch(showNotification({ type: "error", message: "Erreur lors de la suppression !" }));
      }
    } catch (error) {
      dispatch(showNotification({ type: "error", message: error.message || "Erreur lors de la suppression !" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------
  // 🚀 CHANGER LE STATUT D'UNE CATÉGORIE
  // -------------------------------
  const handleToggleCategoryStatus = async (cat) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [`cat-${cat.id}`]: true }));
      const newStatus = cat.actif ? 0 : 1;
      await dispatch(updateCategoryStatus({ categoryId: cat.id, status: newStatus })).unwrap();
      // dispatch(showNotification({ type: "success", message: `Catégorie ${cat.actif ? 'désactivée' : 'activée'} !` }));
    } catch (error) {
      dispatch(showNotification({ type: "error", message: "Erreur lors du changement de statut" }));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [`cat-${cat.id}`]: false }));
    }
  };

  // -------------------------------
  // 🚀 CHANGER LE STATUT D'UN PRODUIT
  // -------------------------------
  const handleToggleProduitStatus = async (produit) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [`prod-${produit.id}`]: true }));
      const newStatus = produit.actif ? 0 : 1;
      await dispatch(updateProduitStatus({ produitId: produit.id, status: newStatus })).unwrap();
      // dispatch(showNotification({ type: "success", message: `Produit ${produit.actif ? 'désactivé' : 'activé'} !` }));
    } catch (error) {
      dispatch(showNotification({ type: "error", message: "Erreur lors du changement de statut" }));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [`prod-${produit.id}`]: false }));
    }
  };

  // 1. Filtrer d'abord par recherche et catégorie (pour les compteurs)
  const filteredBySearchAndCategory = useMemo(() => {
    return (listProduits || []).filter(p => {
      const matchesSearch = p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.designation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || String(p.category_id) === String(filterCategory);
      return matchesSearch && matchesCategory;
    });
  }, [listProduits, searchTerm, filterCategory]);

  // 2. Filtrer par statut pour l'affichage
  const filteredProduits = useMemo(() => {
    return filteredBySearchAndCategory.filter(p => {
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && p.actif) ||
        (filterStatus === 'inactive' && !p.actif);
      return matchesStatus;
    });
  }, [filteredBySearchAndCategory, filterStatus]);

  // 3. Compteurs basés sur la recherche et catégorie uniquement
  const counts = useMemo(() => ({
    all: filteredBySearchAndCategory.length,
    active: filteredBySearchAndCategory.filter(p => p.actif).length,
    inactive: filteredBySearchAndCategory.filter(p => !p.actif).length
  }), [filteredBySearchAndCategory]);



  // -------------------------------
  // 🔄 GESTION DU SCROLL INDÉPENDANT
  // -------------------------------
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      const originalOverflow = mainElement.style.overflow;
      const originalPadding = mainElement.style.padding;

      // On desktop, we want to control the main area's scroll and spacing
      if (window.innerWidth >= 1024) {
        mainElement.style.overflow = 'hidden';
        mainElement.style.padding = '0';
      }

      return () => {
        mainElement.style.overflow = originalOverflow;
        mainElement.style.padding = originalPadding;
      };
    }
  }, []);

  // -------------------------------
  // 🎨 UI CATEGORIES (Shared between Modal & Sidebar)
  // -------------------------------
  const categoriesUI = (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-700">{editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}</h3>
          <button
            onClick={handleRefreshCategories}
            disabled={isRefreshingCategories}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50"
            title="Rafraîchir les données"
          >
            <RefreshCw size={18} className={isRefreshingCategories ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nom de la catégorie"
            value={categoryForm.nom || ""}
            onChange={(e) => setCategoryForm({ ...categoryForm, nom: e.target.value })}
            disabled={isSubmitting}
            className="w-full border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none bg-white font-medium"
          />
          <div className="flex gap-3">
            <button
              onClick={handleAddCategory}
              disabled={isSubmitting}
              className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-sm"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {editingCategory ? "Mettre à jour" : "Ajouter"}
            </button>
            {editingCategory && (
              <button
                onClick={() => { setEditingCategory(null); setCategoryForm({ nom: "" }); }}
                className="bg-slate-200 px-6 rounded-lg font-bold hover:bg-slate-300 transition-all text-sm"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 border-b pb-2">
          <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">Catégories enregistrées</h3>
          {(isRefreshingCategories || isLoading) && categories.length > 0 && (
            <Loader2 className="animate-spin text-indigo-500" size={14} />
          )}
        </div>
        <div className={`border border-slate-200 rounded-xl overflow-hidden bg-white transition-opacity ${(isRefreshingCategories || isLoading) ? 'opacity-50' : 'opacity-100'}`}>
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Nom</th>
                <th className="p-3 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(isRefreshingCategories || isLoading) && categories.length === 0 ? (
                <tr>
                  <td colSpan="2" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-indigo-500" size={32} />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chargement...</p>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="2" className="p-8 text-center text-slate-400 text-xs font-medium italic">
                    Aucune catégorie enregistrée
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors relative group">
                    <td className="p-3 font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${cat.actif ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {cat.nom}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditingCategory(cat); setCategoryForm({ nom: cat.nom }); }}
                          className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleCategoryStatus(cat)}
                          className={`p-1.5 rounded-lg transition-all ${cat.actif ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-50'}`}
                          title={cat.actif ? 'Désactiver' : 'Activer'}
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(cat)}
                          className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-full lg:h-[calc(100vh-64px)] w-full overflow-x-hidden">
      {/* LEFT SIDE: PRODUCTS LIST */}
      <div className="flex-1 flex flex-col min-h-0 md:m-8">
        <div className="flex-1 lg:overflow-y-auto space-y-4 pb-6 md:space-y-6 md:pb-12">

          {/* HEADER - Mobile Optimized */}
          <header className="space-y-3 md:space-y-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Gestion des Produits
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">
                  Gérez vos produits et catégories en toute simplicité
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshGlobal}
                  disabled={isRefreshingProduits}
                  className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                  title="Rafraîchir"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingProduits ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline md:ml-2">Rafraîchir</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg hover:shadow-lg transition-colors"
                  title="Ajouter"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden md:inline md:ml-2">Ajouter</span>
                </button>
              </div>
            </div>
          </header>

          {/* SEARCH BAR + CATEGORY FILTER - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par référence ou désignation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 items-center gap-3">
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all text-sm font-medium text-slate-700"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Filter className={`h-4 w-4 transition-colors ${isCategoryDropdownOpen ? 'text-slate-900' : 'text-slate-400'}`} />
                    <span className="truncate pl-1 pr-2">
                      {filterCategory === 'all'
                        ? 'Toutes les catégories'
                        : categories.find(c => String(c.id) === String(filterCategory))?.nom || 'Sélectionner'
                      }
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute w-48 top-full left-0 right-0 mt-2 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                      <button
                        onClick={() => {
                          setFilterCategory('all');
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${filterCategory === 'all' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span>Toutes les catégories</span>
                        {filterCategory === 'all' && <Check className="h-4 w-4 text-slate-900" />}
                      </button>

                      <div className="h-px bg-slate-100 my-1 mx-2" />

                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setFilterCategory(cat.id);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${String(filterCategory) === String(cat.id) ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          <span className="truncate">{cat.nom}</span>
                          {String(filterCategory) === String(cat.id) && <Check className="h-4 w-4 text-slate-900" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="lg:hidden inline-flex items-center justify-center p-3 rounded-lg border border-slate-200 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 transition-all disabled:opacity-50"
                title="Catégories"
              >
                <Tag className="h-4 w-4" />
                <span className="inline md:inline ml-2">Catégories</span>
              </button>
            </div>
          </div>

          {/* TABS + TABLE - Mobile Optimized */}
          <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-slate-200 bg-slate-50/50">
              <div className="flex overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'all'
                    ? 'text-slate-900 border-b-2 border-slate-900 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Tous ({counts.all})
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'active'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Actifs ({counts.active})
                </button>
                <button
                  onClick={() => setFilterStatus('inactive')}
                  className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'inactive'
                    ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Inactifs ({counts.inactive})
                </button>
              </div>
            </div>

            {/* Table Content */}
            {isLoading && listProduits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
                <p className="text-slate-500 font-medium text-sm">Chargement des produits...</p>
              </div>
            ) : filteredProduits.length === 0 ? (
              <div className="py-20 text-center px-6">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="text-slate-400" size={32} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Aucun produit trouvé</h3>
                <p className="text-slate-500 text-sm mt-2">Ajustez vos filtres ou ajoutez un nouveau produit.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Référence</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Désignation</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredProduits.map((produit) => {
                        return (
                          <tr key={produit.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3">
                              <span className="font-semibold text-slate-900">{produit.reference}</span>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-600">{produit.designation}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                                <Tag className="h-3 w-3" />
                                {produit.category?.nom || 'Sans catégorie'}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <button
                                onClick={() => handleToggleProduitStatus(produit)}
                                disabled={updatingStatus[`prod-${produit.id}`]}
                                className="group relative inline-flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                                title={`Cliquez pour ${produit.actif ? 'désactiver' : 'activer'}`}
                              >
                                <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${produit.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                  <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${produit.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                              </button>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingProduit(produit)}
                                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                  title="Modifier"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => setProduitToDelete(produit)}
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
                  {filteredProduits.map((produit) => {
                    return (
                      <div key={produit.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Package className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <span className="font-semibold text-slate-900 text-sm truncate">{produit.designation}</span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">Ref : {produit.reference}</p>
                          </div>
                          <button
                            onClick={() => handleToggleProduitStatus(produit)}
                            disabled={updatingStatus[`prod-${produit.id}`]}
                            className="flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                          >
                            <div className={`relative w-8 h-4 rounded-full transition-colors ${produit.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                              <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transform transition-transform ${produit.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                          </button>
                        </div>

                        <div className="flex items-center">
                          <span className="text-sm text-blue-600 font-semibold">Catégorie : {produit.category?.nom || 'Sans catégorie'}</span>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setEditingProduit(produit)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                          >
                            <Edit2 size={13} />
                            Modifier
                          </button>
                          <button
                            onClick={() => setProduitToDelete(produit)}
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
        </div>
      </div>

      {/* RIGHT SIDE: CATEGORIES SIDEBAR (Desktop View) */}
      <aside className="hidden lg:block w-[350px] bg-white border-l border-slate-200 h-full overflow-y-auto shadow-xl z-20">
        <div className="px-4 py-8 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Tag className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Catégories
              </h2>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Ajoutez et gérez les catégories de produits pour mieux organiser votre catalogue.
            </p>
          </div>

          {categoriesUI}
        </div>
      </aside>

      {/* MODAL AJOUT PRODUIT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProduitForm({ category_id: "", designation: "", reference: "" });
        }}
        title="Nouveau produit"
        subtitle="Ajoutez une nouvelle référence à votre catalogue"
        footer={(
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest"
            >
              Annuler
            </button>
            <button
              onClick={handleAddProduit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Catégorie <span className="text-red-500">*</span></label>
            <select
              value={produitForm.category_id}
              onChange={(e) => setProduitForm({ ...produitForm, category_id: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all bg-slate-50"
            >
              <option value="">Choisir une catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Désignation <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Ex: Carton standard 60x40x40"
              value={produitForm.designation}
              onChange={(e) => setProduitForm({ ...produitForm, designation: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all bg-slate-50 placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Référence <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="REF-001"
              value={produitForm.reference}
              onChange={(e) => setProduitForm({ ...produitForm, reference: e.target.value.toUpperCase() })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all bg-slate-50 uppercase placeholder:text-slate-300"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL ÉDITION PRODUIT */}
      <Modal
        isOpen={!!editingProduit}
        onClose={() => setEditingProduit(null)}
        title="Modifier le produit"
        subtitle="Mettez à jour les informations du produit"
        footer={(
          <div className="flex gap-3">
            <button
              onClick={() => setEditingProduit(null)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest"
            >
              Annuler
            </button>
            <button
              onClick={handleEditProduit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Mettre à jour
            </button>
          </div>
        )}
      >
        {editingProduit && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Catégorie <span className="text-red-500">*</span></label>
              <select
                value={editingProduit.category_id}
                onChange={(e) => setEditingProduit({ ...editingProduit, category_id: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all bg-slate-50"
              >
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nom}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Désignation <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editingProduit.designation}
                onChange={(e) => setEditingProduit({ ...editingProduit, designation: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Référence <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editingProduit.reference}
                onChange={(e) => setEditingProduit({ ...editingProduit, reference: e.target.value.toUpperCase() })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all bg-slate-50 uppercase"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL GESTION DES CATÉGORIES (Mobile View Only) */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setCategoryForm({ nom: "" });
        }}
        title="Gestion des catégories"
        size="xl"
      >
        {categoriesUI}
      </Modal>

      {/* COMMON DELETE MODALS */}
      <DeleteModal
        isOpen={!!produitToDelete}
        onClose={() => setProduitToDelete(null)}
        onConfirm={handleDeleteProduit}
        itemName={produitToDelete?.designation}
        isLoading={isSubmitting}
      />

      <DeleteModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        itemName={categoryToDelete?.nom}
        message={categoryToDelete ? `Êtes-vous sûr de vouloir supprimer la catégorie "${categoryToDelete.nom}" car cela pourrait impacter les produits associés ?` : ""}
        isLoading={isSubmitting}
      />
    </div >
  );
}
