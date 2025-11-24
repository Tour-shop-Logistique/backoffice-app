import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import tarificationService from '../services/tarificationService';
import { Pencil, Trash, ToggleLeft, ToggleRight, Plus, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../redux/slices/produitSlice";
import toast from 'react-hot-toast'; 

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
  const [tarifs, setTarifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tarifToEdit, setTarifToEdit] = useState(null); // Pour stocker le tarif à éditer

  const dispatch = useDispatch();
  const { categories } = useSelector(state => state.produits);

  // Valeurs par défaut du formulaire
  const defaultFormValues = {
    id: '',
    category_id: '',
    tarif_minimum: 0,
    prix_modes: [
      { mode: 'avion', montant_base: 0, montant_expedition: 0, pourcentage_prestation: 0 },
      { mode: 'bateau', montant_base: 0, montant_expedition: 0, pourcentage_prestation: 0 },
      { mode: 'colis accompagné', montant_base: 0, montant_expedition: 0, pourcentage_prestation: 0 }
    ]
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: defaultFormValues
  });

  // Chargement des catégories et des tarifs au montage
  useEffect(() => {
    dispatch(fetchCategories());
    loadGroupedTarifs();
  }, []);

  // --- LOGIQUE DE CHARGEMENT ---
  const loadGroupedTarifs = async () => {
    try {
      setLoading(true);
      const data = await tarificationService.getGroupedTarifs();
      setTarifs(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des tarifs groupés:', err);
      setError('Erreur lors du chargement des tarifs groupés');
      toast.error('Erreur lors du chargement des tarifs.');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE DE CALCUL AUTOMATIQUE ---
  useEffect(() => {
    const subscription = watch((values) => {
      const updatedModes = values.prix_modes.map((mode) => {
        // S'assurer que les valeurs sont des nombres valides
        const base = parseFloat(mode.montant_base) || 0;
        const pourcentage = parseFloat(mode.pourcentage_prestation) || 0;

        // Calcul: Montant Base + (Montant Base * Pourcentage Prestation)
        const montantExpedition = base + (base * pourcentage / 100);

        return {
          ...mode,
          montant_expedition: montantExpedition.toFixed(0), // Arrondi à l'entier
        };
      });

      // Mettre à jour les champs "montant_expedition" dans le formulaire
      updatedModes.forEach((m, index) => {
        // Empêcher la boucle infinie en vérifiant si la valeur a changé
        if (watch(`prix_modes.${index}.montant_expedition`) !== m.montant_expedition) {
            setValue(`prix_modes.${index}.montant_expedition`, m.montant_expedition, { shouldValidate: true });
        }
      });
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // --- GESTION DU MODAL ---
  const openModal = (tarif = null) => {
    if (tarif) {
      setTarifToEdit(tarif);
      // Préparer les données pour le formulaire en mode édition
      const prix_modes_sorted = defaultFormValues.prix_modes.map(defaultMode => {
        const foundMode = tarif.prix_modes.find(pm => pm.mode === defaultMode.mode) || defaultMode;
        return {
          ...foundMode,
          // S'assurer que les valeurs sont des nombres pour l'affichage du formulaire
          montant_base: parseFloat(foundMode.montant_base) || 0,
          montant_expedition: parseFloat(foundMode.montant_expedition) || 0,
          pourcentage_prestation: parseFloat(foundMode.pourcentage_prestation) || 0,
        };
      });

      reset({
        id: tarif.id,
        category_id: tarif.category_id || '',
        tarif_minimum: parseFloat(tarif.tarif_minimum) || 0,
        prix_modes: prix_modes_sorted,
      });

    } else {
      setTarifToEdit(null);
      reset(defaultFormValues);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTarifToEdit(null);
    reset(defaultFormValues);
  };

  // --- SOUMISSION DU FORMULAIRE (Ajout ou Édition) ---
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Formater les données pour l'API
      const formattedData = {
        ...data,
        mode_expedition: 'groupage',
        tarif_minimum: parseFloat(data.tarif_minimum),
        prix_modes: data.prix_modes.map(mode => ({
          ...mode,
          montant_base: parseFloat(mode.montant_base),
          montant_expedition: parseFloat(mode.montant_expedition),
          pourcentage_prestation: parseFloat(mode.pourcentage_prestation)
        }))
      };

      if (tarifToEdit) {
        // Mode Édition
        await tarificationService.editGroupedTarif(tarifToEdit.id, formattedData);
        toast.success('Tarif mis à jour avec succès!');
      } else {
        // Mode Ajout
        await tarificationService.addGroupedTarif(formattedData);
        toast.success('Nouveau tarif ajouté avec succès!');
      }

      closeModal();
      loadGroupedTarifs();

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
      loadGroupedTarifs();
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
        loadGroupedTarifs();
      } catch (err) {
        console.error('Erreur lors de la suppression du tarif:', err);
        toast.error('Erreur lors de la suppression du tarif.');
      }
    }
  };

  // --- UTILITAIRE DE FORMATAGE ---
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0 FCFA';
    // Assurer que la valeur est un nombre avant de formater
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numberValue).replace('XOF', 'FCFA');
  };

  // --- RENDERING D'ÉTAT ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error && tarifs.length === 0) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erreur ! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  // --- COMPOSANT PRINCIPAL ---
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 flex items-center space-x-2">
            📦 Tarification Groupée
        </h1>
        <button
          onClick={() => openModal()} // Appel sans argument pour l'ajout
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter un tarif</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {/* Tableau pour la liste des tarifs */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pays
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tarif Minimum
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Modes d'expédition (Prix final)
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tarifs.map((tarif) => (
                <tr key={tarif.id} className="hover:bg-blue-50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tarif.category?.nom || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{tarif.pays || 'Global'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-blue-600">{formatCurrency(tarif.tarif_minimum)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {tarif.prix_modes?.map((mode) => (
                        <div key={mode.mode} className="text-sm text-gray-800 flex justify-between">
                          <span className="font-medium capitalize">{mode.mode}:</span>
                          <span className="text-sm text-green-700 font-semibold">{formatCurrency(mode.montant_expedition)}</span>
                          <span className="text-xs text-gray-500 ml-2">({(parseFloat(mode.pourcentage_prestation) || 0).toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full cursor-pointer transition duration-150 ${
                        tarif.actif
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      onClick={() => handleStatusToggle(tarif.id, tarif.actif)}
                      title={tarif.actif ? 'Désactiver le tarif' : 'Activer le tarif'}
                    >
                      {tarif.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition"
                        title="Modifier"
                        onClick={() => openModal(tarif)} // Ouvrir le modal en mode édition
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition"
                        title="Supprimer"
                        onClick={() => handleDelete(tarif.id)}
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tarifs.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-500 bg-gray-50">
            <p className="text-lg">😕 Aucun tarif groupé trouvé. Cliquez sur "Ajouter un tarif" pour commencer.</p>
          </div>
        )}
      </div>

      {/* --- Modal d'ajout/édition --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
            
            {/* HEADER */}
            <div className="sticky top-0 z-10 p-5 border-b bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-xl shadow-md">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {tarifToEdit ? `Modifier le tarif de: ${tarifToEdit.category?.nom || 'N/A'}` : "Nouveau tarif groupé"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-red-200 transition p-1 rounded-full hover:bg-white/10"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
              {/* Champ ID caché pour l'édition */}
              {tarifToEdit && <input type="hidden" {...register('id')} />}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* SELECT CATEGORIE */}
                <div>
                  <label htmlFor='category_id' className="block text-sm font-semibold text-gray-700 mb-2">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    id='category_id'
                    {...register('category_id')}
                    className={`w-full px-4 py-2 border rounded-xl shadow-inner focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition duration-150 ${
                      errors.category_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nom}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="text-sm text-red-600 mt-1 font-medium">{errors.category_id.message}</p>
                  )}
                </div>

                {/* TARIF MIN */}
                <div>
                  <label htmlFor='tarif_minimum' className="block text-sm font-semibold text-gray-700 mb-2">
                    Tarif minimum (FCFA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id='tarif_minimum'
                    type="number"
                    step="0.01"
                    {...register('tarif_minimum')}
                    className={`w-full px-4 py-2 border rounded-xl shadow-inner focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition duration-150 ${
                      errors.tarif_minimum ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="5000"
                  />
                  {errors.tarif_minimum && (
                    <p className="text-sm text-red-600 mt-1 font-medium">{errors.tarif_minimum.message}</p>
                  )}
                </div>
              </div>

              {/* PRIX MODES */}
              <div className='pt-4 border-t border-gray-200'>
                <h3 className="text-xl font-extrabold text-blue-700 mb-6">Paramètres des modes d'expédition</h3>

                <div className="space-y-8">
                  {['avion', 'bateau', 'colis accompagné'].map((mode, index) => (
                    <div key={mode} className="p-6 rounded-xl bg-white border border-gray-200 shadow-md hover:shadow-lg transition duration-200">
                      
                      <h4 className="text-lg font-bold text-gray-800 mb-4 capitalize border-b pb-2">
                        ✈️ Mode: {mode}
                      </h4>

                      <input type="hidden" {...register(`prix_modes.${index}.mode`)} value={mode} />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* MONTANT BASE */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Montant base (FCFA)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`prix_modes.${index}.montant_base`)}
                            className={`w-full px-3 py-2 border rounded-lg shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500 ${
                              errors.prix_modes?.[index]?.montant_base ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0"
                          />
                           {errors.prix_modes?.[index]?.montant_base && (
                            <p className="text-xs text-red-600 mt-1">{errors.prix_modes[index].montant_base.message}</p>
                          )}
                        </div>

                        {/* POURCENTAGE */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            % Prestation (Taxe/Marge)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`prix_modes.${index}.pourcentage_prestation`)}
                            className={`w-full px-3 py-2 border rounded-lg shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500 ${
                              errors.prix_modes?.[index]?.pourcentage_prestation
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                            placeholder="0"
                          />
                          {errors.prix_modes?.[index]?.pourcentage_prestation && (
                            <p className="text-xs text-red-600 mt-1">{errors.prix_modes[index].pourcentage_prestation.message}</p>
                          )}
                        </div>

                        {/* AUTO CALCUL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Montant expédition <span className="text-blue-500">(Calculé)</span>
                          </label>
                          <input
                            type="text" // Utiliser text pour afficher le résultat exact sans problèmes de formatage
                            value={formatCurrency(watch(`prix_modes.${index}.montant_expedition`))}
                            readOnly
                            className="w-full px-3 py-2 border rounded-lg bg-blue-50 text-blue-800 font-semibold shadow-inner"
                          />
                           {errors.prix_modes?.[index]?.montant_expedition && (
                            <p className="text-xs text-red-600 mt-1">{errors.prix_modes[index].montant_expedition.message}</p>
                          )}
                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* FOOTER BUTTONS */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-xl shadow-inner">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition duration-150 font-medium"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg shadow-lg text-white font-semibold bg-green-600 hover:bg-green-700 transition duration-150 disabled:bg-gray-400 disabled:shadow-none"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>{tarifToEdit ? "Mise à jour..." : "Enregistrement..."}</span>
                    </div>
                  ) : (
                    <span>{tarifToEdit ? "Mettre à jour" : "Enregistrer"}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GroupedRates;