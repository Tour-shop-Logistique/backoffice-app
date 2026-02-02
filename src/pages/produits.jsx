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

import { PlusCircle, Loader2, X, Trash2, AlertTriangle, Edit2, Save } from 'lucide-react';
import NotificationPortal from '../components/widget/notification';

export default function Produits() {
  const dispatch = useDispatch();
  const { listProduits, isLoading, categories } = useSelector(state => state.produits);
  console.log(listProduits, "listProduits");
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

  useEffect(() => {
    if (listProduits.length === 0) {
      dispatch(fetchProduits());
    }
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch]);

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
        // Rafraîchir la liste silencieusement
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
        // Rafraîchir sans recharger
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
        // Rafraîchir la liste silencieusement
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
      // Rafraîchir les catégories silencieusement
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

  // Uniquement au premier chargement
  if (isLoading && listProduits.length === 0 && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-gray-500 font-medium text-lg">Chargement de vos produits...</p>
      </div>
    );
  }

  return (
    <div>



      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8 sm:mr-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          {/* Titre avec sous-titre */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Gestion des produits
            </h1>
            <p className="text-sm text-gray-600">
              Gérez vos produits et catégories en toute simplicité
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all duration-200 font-medium"
            >
              <PlusCircle size={20} strokeWidth={2.5} />
              <span>Ajouter un produit</span>
            </button>

            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2 bg-white text-indigo-600 px-5 py-2.5 rounded-lg border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-md active:scale-95 transition-all duration-200 font-medium"
            >
              <PlusCircle size={20} strokeWidth={2.5} />
              <span>Catégories</span>
            </button>
          </div>

        </div>
      </div>

      {/* NOTIFICATION */}
      <div className="relative z-50">
        <NotificationPortal
          notification={notification}
          onClose={() => setNotification(null)}
        />
      </div>

      {/* -------------------- MODAL CATEGORIES -------------------- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-3 sm:p-5 relative max-h-[95vh] overflow-y-auto">

            {/* Close Button */}
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition"
            >
              <X size={22} />
            </button>

            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              Gestion des catégories
            </h2>

            {/* Formulaire d'ajout / modification */}
            <div className="mb-4 border p-3 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-700 mb-3">
                {editingCategory ? "Modifier la catégorie" : "Ajouter une catégorie"}
              </h3>

              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Nom de la catégorie (ex: Denrée alimentaire)"
                  value={categoryForm.nom || ""}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, nom: e.target.value })
                  }
                  disabled={!!editingCategory || isSubmitting}
                  className={`border p-2 rounded w-full ${editingCategory ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Prix ligne Paris (Fcfa/kg)</label>
                    <input
                      type="number"
                      placeholder="Prix Paris"
                      value={categoryForm.prix_kg_paris || ""}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, prix_kg_paris: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Prix autres lignes (Fcfa/kg)</label>
                    <input
                      type="number"
                      placeholder="Prix Autres"
                      value={categoryForm.prix_kg_autres || ""}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, prix_kg_autres: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAddCategory}
                  disabled={isSubmitting}
                  className={`mt-1 ${editingCategory ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-1.5 rounded flex-1 flex items-center gap-2 justify-center transition-all disabled:opacity-50`}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingCategory ? <Save size={18} /> : <PlusCircle size={18} />)}
                  {editingCategory ? "Mettre à jour" : "Ajouter la catégorie"}
                </button>
                {editingCategory && (
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ nom: "", prix_kg_paris: "", prix_kg_autres: "" });
                    }}
                    className="mt-1 bg-gray-200 text-gray-700 px-4 py-1.5 rounded hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {/* LISTE DES CATÉGORIES */}
            <h3 className="font-medium text-gray-700 mb-3">Liste des catégories</h3>

            <div className="max-h-64 overflow-y-auto border rounded-xl overflow-x-auto">
              {categories.length === 0 ? (
                <p className="p-4 text-gray-500">Aucune catégorie trouvée</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-2">Nom</th>
                      <th className="p-2">Prix Paris</th>
                      <th className="p-2">Prix Autres</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const parisPrice = Array.isArray(cat.prix_kg) ? cat.prix_kg.find(p => p.ligne === 'paris')?.prix : cat.prix_kg;
                      const autresPrice = Array.isArray(cat.prix_kg) ? cat.prix_kg.find(p => p.ligne === 'autres')?.prix : '-';

                      return (
                        <tr key={cat.id} className="border-b">
                          <td className="p-2 font-medium">{cat.nom}</td>
                          <td className="p-2">{parisPrice} Fcfa</td>
                          <td className="p-2">{autresPrice} {autresPrice !== '-' && 'Fcfa'}</td>
                          <td className="p-2">
                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setCategoryForm({
                                    nom: cat.nom,
                                    prix_kg_paris: parisPrice || "",
                                    prix_kg_autres: autresPrice !== '-' ? autresPrice : ""
                                  });
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Modifier les prix"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                disabled={isSubmitting}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Supprimer la catégorie"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleCategoryStatus(cat)}
                                disabled={isSubmitting}
                                className={`font-semibold px-2 py-0.5 rounded-full text-[10px] transition-all ${cat.actif
                                  ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                  : 'bg-red-50 text-red-500 hover:bg-red-100'
                                  }`}
                                title={cat.actif ? "Désactiver" : "Activer"}
                              >
                                {cat.actif ? 'Actif' : 'Inactif'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      )
      }

      {/* -------------------- MODAL AJOUT PRODUIT -------------------- */}
      {
        isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl relative animate-fadeIn">

              {/* Header du modal */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <PlusCircle size={24} />
                    Ajouter un produit
                  </h2>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setProduitForm({ category_id: "", designation: "", reference: "" });
                    }}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* Corps du modal */}
              <div className="p-6 space-y-5">

                {/* Champ Catégorie */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={produitForm.category_id || ""}
                    onChange={(e) => setProduitForm({ ...produitForm, category_id: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {categories.map((cat) => {
                      const parisPrice = Array.isArray(cat.prix_kg) ? cat.prix_kg.find(p => p.ligne === 'paris')?.prix : cat.prix_kg;
                      const autresPrice = Array.isArray(cat.prix_kg) ? cat.prix_kg.find(p => p.ligne === 'autres')?.prix : null;
                      const priceLabel = autresPrice ? `${parisPrice}/${autresPrice}` : parisPrice;

                      return (
                        <option key={cat.id} value={cat.id}>
                          {cat.nom} ({priceLabel} Fcfa/kg)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Champ Désignation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Désignation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Vêtement"
                    value={produitForm.designation || ""}
                    onChange={(e) => setProduitForm({ ...produitForm, designation: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Champ Référence */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Référence <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: VETM"
                    value={produitForm.reference || ""}
                    onChange={(e) => setProduitForm({ ...produitForm, reference: e.target.value.toUpperCase() })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La référence sera automatiquement en majuscules
                  </p>
                </div>

              </div>

              {/* Footer du modal */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setProduitForm({ category_id: "", designation: "", reference: "" });
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddProduit}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                  Enregistrer
                </button>
              </div>

            </div>
          </div>
        )
      }

      {/* CONTENU PRINCIPAL - LISTE DES PRODUITS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sm:mr-6">

        {/* En-tête de la liste */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Liste des produits</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {listProduits?.length ?? 0} produit{(listProduits?.length ?? 0) > 1 ? 's' : ''}
                enregistré{(listProduits?.length ?? 0) > 1 ? 's' : ''}
              </p>
            </div>

            {/* Filtre rapide */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Corps de la liste - Table visible sur Desktop */}
        <div className="hidden md:block overflow-x-auto">
          {listProduits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun produit trouvé</h3>
              <p className="text-sm text-gray-500 text-center max-w-md">
                Commencez par ajouter votre premier produit en cliquant sur le bouton "Ajouter un produit"
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Désignation</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date de création</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {listProduits.map((produit) => {
                  const category = categories.find(cat => cat.id === produit.category_id);
                  return (
                    <tr key={produit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-bold text-sm">{produit.reference?.substring(0, 2) || 'PR'}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{produit.reference}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{produit.designation}</div>
                      </td>
                      <td className="px-6 py-4">
                        {category ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">{category.nom}</span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Non définie</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {produit.actif ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{new Date(produit.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingProduit(produit)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={20} /></button>
                          <button onClick={() => setProduitToDelete(produit)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Cards - Visible sur mobile uniquement */}
        <div className="md:hidden">
          {listProduits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <AlertTriangle size={32} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun produit trouvé</h3>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {listProduits.map((produit) => {
                const category = categories.find(cat => cat.id === produit.category_id);
                return (
                  <div key={produit.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs">{produit.reference?.substring(0, 2) || 'PR'}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600">{produit.reference}</p>
                          <h4 className="font-semibold text-gray-900">{produit.designation}</h4>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingProduit(produit)} className="p-2 text-blue-600 bg-blue-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setProduitToDelete(produit)} className="p-2 text-red-600 bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        {category ? (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium border border-indigo-100">
                            {category.nom}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[10px]">Sans catégorie</span>
                        )}
                        {produit.actif ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <div className="w-1 h-1 bg-green-500 rounded-full" /> Actif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <div className="w-1 h-1 bg-red-500 rounded-full" /> Inactif
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(produit.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>




        {/* -------------------- MODAL MODIFICATION PRODUIT -------------------- */}
        {editingProduit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl relative animate-fadeIn">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit2 size={24} />
                    Modifier le produit
                  </h2>
                  <button
                    onClick={() => setEditingProduit(null)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingProduit?.category_id || ""}
                    onChange={(e) => setEditingProduit({ ...editingProduit, category_id: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {categories.map((cat) => {
                      const parisPrice = Array.isArray(cat.prix_kg) ? cat.prix_kg.find(p => p.ligne === 'paris')?.prix : cat.prix_kg;
                      const autresPrice = Array.isArray(cat.prix_kg) ? cat.prix_kg.find(p => p.ligne === 'autres')?.prix : null;
                      const priceLabel = autresPrice ? `${parisPrice}/${autresPrice}` : parisPrice;

                      return (
                        <option key={cat.id} value={cat.id}>
                          {cat.nom} ({priceLabel} Fcfa/kg)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Désignation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Vêtement"
                    value={editingProduit?.designation || ""}
                    onChange={(e) => setEditingProduit({ ...editingProduit, designation: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Référence <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: VETM"
                    value={editingProduit?.reference || ""}
                    onChange={(e) => setEditingProduit({ ...editingProduit, reference: e.target.value.toUpperCase() })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all uppercase"
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
                <button
                  onClick={() => setEditingProduit(null)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleEditProduit}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- MODAL CONFIRMATION SUPPRESSION -------------------- */}
        {produitToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl relative animate-fadeIn">
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Confirmer la suppression
                </h2>

                <p className="text-gray-600 text-center mb-6">
                  Êtes-vous sûr de vouloir supprimer le produit <br />
                  <span className="font-semibold text-gray-900">"{produitToDelete.designation}"</span> ?
                  <br />
                  <span className="text-sm text-red-600">Cette action est irréversible.</span>
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setProduitToDelete(null)}
                    className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteProduit}
                    className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 size={18} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Pagination (optionnelle) */}
        {listProduits.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Affichage de <span className="font-medium">1</span> à <span className="font-medium">{listProduits.length}</span> sur <span className="font-medium">{listProduits.length}</span> résultats
              </div>

              <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  Précédent
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div >
  );
}