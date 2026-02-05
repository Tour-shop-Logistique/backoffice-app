import { useEffect, useState, useRef, useCallback } from "react";
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

import { PlusCircle, Loader2, X, Trash2, AlertTriangle, Edit2, Save, XCircle, RefreshCw, CheckCircle2, Search, Package, Tag, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import NotificationPortal from '../components/widget/notification';
import Modal from '../components/common/Modal';

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

  const [categoryForm, setCategoryForm] = useState({
    nom: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isRefreshingProduits, setIsRefreshingProduits] = useState(false);
  const [isRefreshingCategories, setIsRefreshingCategories] = useState(false);

  const handleRefreshProduits = async () => {
    setIsRefreshingProduits(true);
    try {
      console.log("Refreshing produits...");
      await dispatch(fetchProduits({ silent: true })).unwrap();
      showNotification('success', 'Produits mis à jour.');
    } catch (error) {
      showNotification('error', 'Erreur lors du rafraîchissement des produits.');
    } finally {
      setIsRefreshingProduits(false);
    }
  };

  const handleRefreshCategories = async () => {
    setIsRefreshingCategories(true);
    try {
      await dispatch(fetchCategories({ silent: true })).unwrap();
      showNotification('success', 'Catégories mises à jour.');
    } catch (error) {
      showNotification('error', 'Erreur lors du rafraîchissement des catégories.');
    } finally {
      setIsRefreshingCategories(false);
    }
  };

  const showNotification = useCallback((type, message) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({ type, message });

    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

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
        dispatch(fetchProduits());
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
        showNotification("success", "Produit supprimé avec succès !");
        setProduitToDelete(null);
        dispatch(fetchProduits());
      } else {
        showNotification("error", "Erreur lors de la suppression !");
      }
    } catch (error) {
      showNotification("error", error.message || "Erreur lors de la suppression !");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------
  // ✏️ MODIFIER UN PRODUIT
  // -------------------------------
  const handleEditProduit = async () => {
    if (!editingProduit.category_id || !editingProduit.designation || !editingProduit.reference) {
      return showNotification("error", "Veuillez remplir tous les champs !");
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
        showNotification("success", "Produit modifié avec succès !");
        setEditingProduit(null);
        dispatch(fetchProduits());
      } else {
        showNotification("error", "Erreur lors de la modification !");
      }
    } catch (error) {
      showNotification("error", error.message || "Erreur lors de la modification !");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------
  // 🚀 AJOUTER UNE CATÉGORIE
  // -------------------------------
  const handleAddCategory = async () => {
    if (!categoryForm.nom) {
      return showNotification("error", "Le nom de la catégorie est requis !");
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
        showNotification("success", "Catégorie modifiée avec succès !");
      } else {
        await dispatch(addCategory(payload)).unwrap();
        showNotification("success", "Catégorie ajoutée avec succès !");
      }

      setCategoryForm({ nom: "" });
      setEditingCategory(null);
      dispatch(fetchCategories());
    } catch (error) {
      showNotification("error", editingCategory ? "Erreur lors de la modification !" : "Erreur lors de l'ajout !");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------
  // 🚀 SUPPRIMER UNE CATÉGORIE
  // -------------------------------
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ? Cela pourrait impacter les produits associés.")) return;

    setIsSubmitting(true);
    try {
      const response = await dispatch(deleteCategory(id)).unwrap();
      if (response.success) {
        showNotification("success", "Catégorie supprimée avec succès !");
        dispatch(fetchCategories());
      } else {
        showNotification("error", "Erreur lors de la suppression !");
      }
    } catch (error) {
      showNotification("error", error.message || "Erreur lors de la suppression !");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------
  // 🚀 CHANGER LE STATUT D'UNE CATÉGORIE
  // -------------------------------
  const handleToggleCategoryStatus = async (cat) => {
    setIsSubmitting(true);
    try {
      const newStatus = cat.actif ? 0 : 1;
      await dispatch(updateCategoryStatus({ categoryId: cat.id, status: newStatus })).unwrap();
      showNotification("success", `Catégorie ${cat.actif ? 'désactivée' : 'activée'} !`);
    } catch (error) {
      showNotification("error", "Erreur lors du changement de statut");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------
  // 🚀 CHANGER LE STATUT D'UN PRODUIT
  // -------------------------------
  const handleToggleProduitStatus = async (produit) => {
    setIsSubmitting(true);
    try {
      const newStatus = produit.actif ? 0 : 1;
      await dispatch(updateProduitStatus({ produitId: produit.id, status: newStatus })).unwrap();
      showNotification("success", `Produit ${produit.actif ? 'désactivé' : 'activé'} !`);
      dispatch(fetchProduits());
    } catch (error) {
      showNotification("error", "Erreur lors du changement de statut");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProduits = listProduits.filter(p => {
    const matchesSearch = p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && p.actif) ||
      (filterStatus === 'inactive' && !p.actif);
    const matchesCategory = filterCategory === 'all' || String(p.category_id) === String(filterCategory);
    return matchesSearch && matchesStatus && matchesCategory;
  });


  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <NotificationPortal notification={notification} onClose={() => setNotification(null)} />

      {/* HEADER - Mobile Optimized */}
      <header className="space-y-3 md:space-y-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Gestion des produits
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Gérez vos produits et catégories en toute simplicité
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshProduits}
              disabled={isRefreshingProduits}
              className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshingProduits ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline md:ml-2">Rafraîchir</span>
            </button>

            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              title="Catégories"
            >
              <Tag className="h-4 w-4" />
              <span className="hidden md:inline md:ml-2">Catégories</span>
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

        <div className="relative sm:w-64">
          <Tag className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABS + TABLE - Mobile Optimized */}
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
              Tous ({listProduits.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'active'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Actifs ({listProduits.filter(p => p.actif).length})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'inactive'
                ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Inactifs ({listProduits.filter(p => !p.actif).length})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading && listProduits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-slate-500 font-medium text-sm">Chargement des produits...</p>
          </div>
        ) : filteredProduits.length === 0 ? (
          <div className="py-20 text-center">
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
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProduits.map((produit) => {
                    const category = categories.find(cat => cat.id === produit.category_id);
                    return (
                      <tr key={produit.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-slate-400" />
                            <span className="font-bold text-slate-900">{produit.reference}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{produit.designation}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                            <Tag className="h-3 w-3" />
                            {category?.nom || 'Sans catégorie'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleProduitStatus(produit)}
                            disabled={isSubmitting}
                            className="group relative inline-flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            title={`Cliquez pour ${produit.actif ? 'désactiver' : 'activer'}`}
                          >
                            <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${produit.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                              <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${produit.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <span className={`text-[10px] font-medium uppercase tracking-wider ${produit.actif ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {produit.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-4">
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
            <div className="md:hidden divide-y divide-slate-100">
              {filteredProduits.map((produit) => {
                const category = categories.find(cat => cat.id === produit.category_id);
                return (
                  <div key={produit.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Package className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-bold text-slate-900 text-sm truncate">{produit.reference}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{produit.designation}</p>
                      </div>
                      <button
                        onClick={() => handleToggleProduitStatus(produit)}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 active:scale-95 transition-all"
                      >
                        <div className={`relative w-8 h-4 rounded-full transition-colors ${produit.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transform transition-transform ${produit.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <span className={`text-[9px] font-black tracking-tighter ${produit.actif ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {produit.actif ? 'ACTIF' : 'INACTIF'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 py-1">
                      <Tag className="h-3 w-3 text-slate-400" />
                      <span className="text-[11px] text-slate-600">{category?.nom || 'Sans catégorie'}</span>
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
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest"
            >
              Annuler
            </button>
            <button
              onClick={handleAddProduit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Enregistrer
            </button>
          </>
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
          <>
            <button
              onClick={() => setEditingProduit(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest"
            >
              Annuler
            </button>
            <button
              onClick={handleEditProduit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Mettre à jour
            </button>
          </>
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

      {/* MODAL SUPPRESSION PRODUIT */}
      <Modal
        isOpen={!!produitToDelete}
        onClose={() => setProduitToDelete(null)}
        title="Supprimer le produit ?"
        size="md"
        footer={(
          <>
            <button
              onClick={() => setProduitToDelete(null)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteProduit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-600/10"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
              Supprimer
            </button>
          </>
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <p className="text-sm text-slate-500">
            Êtes-vous sûr de vouloir supprimer <span className="font-bold text-slate-900">"{produitToDelete?.designation}"</span> ? Cette action est irréversible.
          </p>
        </div>
      </Modal>

      {/* MODAL GESTION DES CATÉGORIES */}
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
        <div className="space-y-6">
          {/* Formulaire ajout/édition */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
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
                className="w-full border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none bg-white"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAddCategory}
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {editingCategory ? "Mettre à jour" : "Ajouter"}
                </button>
                {editingCategory && (
                  <button
                    onClick={() => { setEditingCategory(null); setCategoryForm({ nom: "" }); }}
                    className="bg-slate-200 px-6 rounded-lg font-bold hover:bg-slate-300 transition-all"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Liste des catégories */}
          <div>
            <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">Catégories enregistrées</h3>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nom de la catégorie</th>
                    <th className="p-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium">{cat.nom}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2 text-center">
                          <button
                            onClick={() => { setEditingCategory(cat); setCategoryForm({ nom: cat.nom }); }}
                            className="text-slate-600 p-1.5 hover:bg-slate-100 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-red-500 p-1.5 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleCategoryStatus(cat)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
                          >
                            {cat.actif ? 'ACTIF' : 'INACTIF'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}