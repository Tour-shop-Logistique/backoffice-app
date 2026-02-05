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

import { PlusCircle, Loader2, X, Trash2, AlertTriangle, Edit2, Save, XCircle, RefreshCw, CheckCircle2, Search } from 'lucide-react';
import NotificationPortal from '../components/widget/notification';

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
    prix_kg_paris: "",
    prix_kg_autres: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchProduits({ silent: true })).unwrap(),
        dispatch(fetchCategories({ silent: true })).unwrap()
      ]);
      showNotification('success', 'Produits et catégories mis à jour.');
    } catch (error) {
      showNotification('error', 'Erreur lors du rafraîchissement.');
    } finally {
      setIsRefreshing(false);
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
    if (!categoryForm.nom || !categoryForm.prix_kg_paris || !categoryForm.prix_kg_autres) {
      return showNotification("error", "Veuillez remplir tous les champs !");
    }

    const payload = {
      nom: categoryForm.nom,
      prix_kg: [
        { ligne: "paris", prix: Number(categoryForm.prix_kg_paris) },
        { ligne: "autres", prix: Number(categoryForm.prix_kg_autres) }
      ]
    };

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await dispatch(editCategory({
          categoryId: editingCategory.id,
          categoryData: { prix_kg: payload.prix_kg }
        })).unwrap();
        showNotification("success", "Catégorie modifiée avec succès !");
      } else {
        await dispatch(addCategory(payload)).unwrap();
        showNotification("success", "Catégorie ajoutée avec succès !");
      }

      setCategoryForm({ nom: "", prix_kg_paris: "", prix_kg_autres: "" });
      setEditingCategory(null);
      dispatch(fetchCategories());
    } catch (error) {
      showNotification("error", editingCategory ? "Erreur lors de la modification !" : "Erreur lors de l'ajout !");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 sm:mr-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Gestion des produits
          </h1>
          <p className="text-sm text-gray-500 font-medium">Gérez vos références et catégories de marchandises.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-900/10"
          >
            <PlusCircle size={20} />
            <span>NOUVEAU PRODUIT</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-2.5 rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-all font-bold"
          >
            <PlusCircle size={20} />
            <span>CATÉGORIES</span>
          </button>
        </div>
      </div>

      {/* Barre unifiée Stats + Recherche */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center mb-8 sm:mr-6">
        <div className="grid grid-cols-2 gap-4 lg:flex lg:gap-4 shrink-0">
          {/* Actives */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
            className={`flex-1 lg:w-64 rounded-xl px-4 py-3 shadow-sm border transition-all cursor-pointer hover:shadow-md ${filterStatus === 'active'
              ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500/10'
              : 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${filterStatus === 'active' ? 'text-emerald-800' : 'text-emerald-600/70'}`}>Produits Actifs</p>
                <p className={`text-2xl font-black ${filterStatus === 'active' ? 'text-emerald-900' : 'text-emerald-700'}`}>
                  {listProduits.filter(p => p.actif).length}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${filterStatus === 'active' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-emerald-500 border-emerald-100'
                }`}>
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Inactives */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'inactive' ? 'all' : 'inactive')}
            className={`flex-1 lg:w-64 rounded-xl px-4 py-3 shadow-sm border transition-all cursor-pointer hover:shadow-md ${filterStatus === 'inactive'
              ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-500/10'
              : 'bg-rose-50/50 border-rose-100 hover:border-rose-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${filterStatus === 'inactive' ? 'text-rose-800' : 'text-rose-600/70'}`}>Produits Inactifs</p>
                <p className={`text-2xl font-black ${filterStatus === 'inactive' ? 'text-rose-900' : 'text-rose-700'}`}>
                  {listProduits.filter(p => !p.actif).length}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${filterStatus === 'inactive' ? 'bg-rose-500 text-white border-rose-400' : 'bg-white text-rose-500 border-rose-100'
                }`}>
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par référence ou désignation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-full min-h-[72px] pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm font-bold placeholder:text-slate-300 placeholder:font-medium"
          />
        </div>
      </div>

      <NotificationPortal notification={notification} onClose={() => setNotification(null)} />

      {/* MODAL CATEGORIES */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-5 relative max-h-[95vh] overflow-y-auto">
            <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-6 text-gray-800">Gestion des catégories</h2>

            <div className="mb-8 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4">{editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nom de la catégorie"
                  value={categoryForm.nom || ""}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nom: e.target.value })}
                  disabled={!!editingCategory || isSubmitting}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Prix Paris"
                    value={categoryForm.prix_kg_paris || ""}
                    onChange={(e) => setCategoryForm({ ...categoryForm, prix_kg_paris: e.target.value })}
                    className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Prix Autres"
                    value={categoryForm.prix_kg_autres || ""}
                    onChange={(e) => setCategoryForm({ ...categoryForm, prix_kg_autres: e.target.value })}
                    className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAddCategory} disabled={isSubmitting} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {editingCategory ? "Mettre à jour" : "Ajouter"}
                  </button>
                  {editingCategory && (
                    <button onClick={() => { setEditingCategory(null); setCategoryForm({ nom: "", prix_kg_paris: "", prix_kg_autres: "" }); }} className="bg-gray-200 px-6 rounded-lg font-bold">Annuler</button>
                  )}
                </div>
              </div>
            </div>

            <h3 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">Catégories enregistrées</h3>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-left">Nom</th>
                    <th className="p-3 text-center">Paris</th>
                    <th className="p-3 text-center">Lignes</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((cat) => {
                    const parisPrice = Array.isArray(cat.prix_kg) ? cat.prix_kg.find(p => p.ligne === 'paris')?.prix : cat.prix_kg;
                    const autresPrice = Array.isArray(cat.prix_kg) ? cat.prix_kg.find(p => p.ligne === 'autres')?.prix : '-';
                    return (
                      <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium">{cat.nom}</td>
                        <td className="p-3 text-center">{parisPrice}</td>
                        <td className="p-3 text-center">{autresPrice}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingCategory(cat); setCategoryForm({ nom: cat.nom, prix_kg_paris: parisPrice || "", prix_kg_autres: autresPrice !== '-' ? autresPrice : "" }); }} className="text-blue-600 p-1.5 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 p-1.5 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                            <button onClick={() => handleToggleCategoryStatus(cat)} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cat.actif ? 'OUI' : 'NON'}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT PRODUIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold flex items-center gap-2"><PlusCircle size={24} /> Ajouter un produit</h2>
              <button onClick={() => { setIsModalOpen(false); setProduitForm({ category_id: "", designation: "", reference: "" }); }} className="hover:bg-blue-500 p-1 rounded-lg"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
                  <select value={produitForm.category_id} onChange={(e) => setProduitForm({ ...produitForm, category_id: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Choisir une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Désignation</label>
                  <input type="text" placeholder="Désignation" value={produitForm.designation} onChange={(e) => setProduitForm({ ...produitForm, designation: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Référence</label>
                  <input type="text" placeholder="REF-001" value={produitForm.reference} onChange={(e) => setProduitForm({ ...produitForm, reference: e.target.value.toUpperCase() })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
                <button onClick={handleAddProduit} disabled={isSubmitting} className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTE DES PRODUITS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sm:mr-6">
        <div className="bg-slate-50 p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Liste des produits</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Données synchronisées</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase">{listProduits.length} références</span>
          </div>
        </div>

        {isLoading && listProduits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-slate-500 font-bold text-xs tracking-[0.2em] uppercase">Initialisation des stocks...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {listProduits.length === 0 ? (
              <div className="py-20 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="text-gray-400" /></div>
                <h3 className="font-bold text-gray-900">Aucun produit</h3>
                <p className="text-gray-500 text-sm">Cliquez sur Ajouter un produit pour commencer.</p>
              </div>
            ) : (
              <>
                <table className="w-full hidden md:table border-collapse">
                  <thead className="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b">
                    <tr>
                      <th className="px-6 py-4 text-left">Référence</th>
                      <th className="px-6 py-4 text-left">Désignation</th>
                      <th className="px-6 py-4 text-left">Catégorie</th>
                      <th className="px-6 py-4 text-center">Statut</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listProduits
                      .filter(p => {
                        const matchesSearch = p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.designation.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesStatus = filterStatus === 'all' ||
                          (filterStatus === 'active' && p.actif) ||
                          (filterStatus === 'inactive' && !p.actif);
                        return matchesSearch && matchesStatus;
                      })
                      .map((produit) => {
                        const category = categories.find(cat => cat.id === produit.category_id);
                        return (
                          <tr key={produit.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-4 font-bold text-blue-600 text-sm">{produit.reference}</td>
                            <td className="px-6 py-4 font-semibold text-gray-800">{produit.designation}</td>
                            <td className="px-6 py-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100">{category?.nom || '---'}</span></td>
                            <td className="px-6 py-4 text-center">
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter ${produit.actif ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${produit.actif ? 'bg-green-500' : 'bg-red-500'}`} />
                                {produit.actif ? 'ACTIF' : 'INACTIF'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingProduit(produit)} className="p-2 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-blue-100 text-blue-600"><Edit2 size={18} /></button>
                                <button onClick={() => setProduitToDelete(produit)} className="p-2 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-red-100 text-red-500"><Trash2 size={18} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                <div className="md:hidden divide-y">
                  {listProduits.map(produit => (
                    <div key={produit.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="font-black text-blue-600">{produit.reference}</div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingProduit(produit)} className="text-blue-600 p-2 bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                          <button onClick={() => setProduitToDelete(produit)} className="text-red-500 p-2 bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                      </div>
                      <div className="font-bold text-gray-800">{produit.designation}</div>
                      <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${produit.actif ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{produit.actif ? 'ACTIF' : 'INACTIF'}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {editingProduit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-zoomIn">
            <div className="p-6 bg-amber-500 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><Edit2 size={24} /> Modifier le produit</h2>
              <button onClick={() => setEditingProduit(null)} className="p-1 hover:bg-amber-400 rounded-lg"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <select value={editingProduit.category_id} onChange={(e) => setEditingProduit({ ...editingProduit, category_id: e.target.value })} className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nom}</option>)}
                </select>
                <input type="text" value={editingProduit.designation} onChange={(e) => setEditingProduit({ ...editingProduit, designation: e.target.value })} className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                <input type="text" value={editingProduit.reference} onChange={(e) => setEditingProduit({ ...editingProduit, reference: e.target.value.toUpperCase() })} className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingProduit(null)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">Annuler</button>
                <button onClick={handleEditProduit} disabled={isSubmitting} className="flex-1 py-4 font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {produitToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-shake">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100"><Trash2 size={40} /></div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">SUPRESSION DÉFINITIVE</h2>
            <p className="text-gray-500 mb-8 font-medium italic">Confirmez-vous la suppression de <span className="text-red-600 not-italic font-bold">"{produitToDelete.designation}"</span> ?</p>
            <div className="flex gap-4">
              <button onClick={() => setProduitToDelete(null)} className="flex-1 py-4 font-bold text-gray-400 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">ANNULER</button>
              <button onClick={handleDeleteProduit} disabled={isSubmitting} className="flex-1 py-4 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-xl shadow-red-600/20 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "OUI, SUPPRIMER"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}