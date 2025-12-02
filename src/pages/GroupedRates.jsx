import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import tarificationService from '../services/tarificationService';
import { Pencil, Trash, ToggleLeft, ToggleRight, Plus, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../redux/slices/produitSlice";
import { fetchGroupedTarifs } from "../redux/slices/tarificationSlice";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tarifToEdit, setTarifToEdit] = useState(null); // Pour stocker le tarif à éditer
  const [showModal, setShowModal] = useState(false);

  const dispatch = useDispatch();
  const { groupedTarifs, isLoading, error } = useSelector(
  (state) => state.tarification
);
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

  const groupedByType = groupedTarifs.reduce((acc, tarif) => {
    const type = tarif.type_expedition || "non_defini";
    if (!acc[type]) acc[type] = [];
    acc[type].push(tarif);
    return acc;
}, {});

  // Chargement des catégories et des tarifs au montage
  useEffect(() => {
    if(categories.length === 0){
      dispatch(fetchCategories());
    }
   if(groupedTarifs.length === 0){
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
    setShowModal(false);
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
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error && groupedTarifs.length === 0) {
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
         onClick={() => setShowModal(true)} 
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
              
             {Object.entries(groupedByType).map(([type, tarifs]) => (
  <React.Fragment key={type}>

    {/* Ligne séparation */}
    <tr className="bg-blue-200">
      <td colSpan="6" className="px-6 py-3 font-bold text-blue-900 uppercase">
        {type.replace('_', ' ')}
      </td>
    </tr>

    {tarifs.map(tarif => (
      <tr key={tarif.id} className="hover:bg-blue-50 transition duration-150">
        {/* ——— Ton code existant ——— */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
            {tarif.category?.nom || 'N/A'}
          </div>
        </td>

        <td className="px-6 py-4">{tarif.pays}</td>

        <td className="px-6 py-4 font-bold text-blue-600">
          {formatCurrency(tarif.prix_unitaire)}
        </td>

        <td className="px-6 py-4">
          {tarif.prix_modes?.map((m) => (
            <div key={m.mode}>
              {m.mode}: {formatCurrency(m.montant_expedition)}
            </div>
          ))}
        </td>

        <td className="px-6 py-4 text-center">
          <span
            onClick={() => handleStatusToggle(tarif.id, tarif.actif)}
            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer
              ${tarif.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {tarif.actif ? 'Actif' : 'Inactif'}
          </span>
        </td>

        <td className="px-6 py-4 text-right">
          <button onClick={() => openModal(tarif)} className="mr-2 text-blue-600 hover:text-blue-800">
            <Pencil className="h-5 w-5" />
          </button>
          <button onClick={() => handleDelete(tarif.id)} className="text-red-600 hover:text-red-800">
            <Trash className="h-5 w-5" />
          </button>
        </td>
      </tr>
    ))}
  </React.Fragment>
))}

            </tbody>
          </table>
        </div>

        {groupedTarifs.length === 0 && !isLoading && (
          <div className="text-center py-10 text-gray-500 bg-gray-50">
            <p className="text-lg">😕 Aucun tarif groupé trouvé. Cliquez sur "Ajouter un tarif" pour commencer.</p>
          </div>
        )}
      </div>

      {/* --- Modal d'ajout/édition --- */}
   <Addtarifgroupe
      tarifToEdit={null}
      closeModal={() => setShowModal(false)}
      categories={categories}
      onSubmit={handleSubmit}
      isSubmitting={false}
    />

    </div>
  );
};

export default GroupedRates;

