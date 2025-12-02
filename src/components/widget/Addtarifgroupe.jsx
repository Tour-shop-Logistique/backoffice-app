import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const Addtarifgroupe = ({ 
  tarifToEdit, 
  closeModal, 
  categories = [],
  onSubmit: handleFormSubmit,
  isSubmitting = false 
}) => {
  const [typeExpedition, setTypeExpedition] = useState('GROUPAGE_PA');
  const [formData, setFormData] = useState({
    category_id: '',
    tarif_minimum: '',
    type_expedition: 'GROUPAGE_PA',
    prix_unitaire: '',
    pays: '',
    prix_modes: [
      { mode: 'avion', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 },
      { mode: 'bateau', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 },
      { mode: 'colis accompagné', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }
    ]
  });
  const [errors, setErrors] = useState({});

  const paysAfrique = [
    "MALI BAMAKO",
    "SENEGAL DAKAR",
    "BURKINA FASO OUAGADOUGOU",
    "NIGER NIAMEY",
    "GUINEE CONAKRY",
    "BENIN COTONOU",
    "TOGO LOME",
    "GHANA ACCRA",
    "NIGERIA LAGOS",
    "CAMEROUN YAOUNDE"
  ];
  const colisMode = formData.prix_modes.find(m => m.mode === 'colis accompagné') || {};

  useEffect(() => {
    if (typeExpedition === 'GROUPAGE_CA' || typeExpedition === 'GROUPAGE_PA') {
      const updatedModes = formData.prix_modes.map(mode => {
        const base = parseFloat(mode.montant_base) || 0;
        const pourcentage = parseFloat(mode.pourcentage_prestation) || 0;
        const montant_expedition = base + (base * pourcentage / 100);
        return { ...mode, montant_expedition };
      });
      setFormData(prev => ({ ...prev, prix_modes: updatedModes }));
    }
  }, [formData.prix_modes.map(m => `${m.montant_base}-${m.pourcentage_prestation}`).join(','), typeExpedition]);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setTypeExpedition(newType);
    setFormData(prev => ({
      ...prev,
      type_expedition: newType,
      prix_unitaire: '',
      pays: '',
      prix_modes: newType === 'GROUPAGE_AFRIQUE' ? [] : [
        { mode: 'avion', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 },
        { mode: 'bateau', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 },
        // { mode: 'colis accompagné', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }
      ]
    }));
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleModeChange = (index, field, value) => {
    const updatedModes = [...formData.prix_modes];
    updatedModes[index] = { ...updatedModes[index], [field]: value };
    setFormData(prev => ({ ...prev, prix_modes: updatedModes }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.category_id) newErrors.category_id = 'Catégorie requise';
    if (!formData.tarif_minimum) newErrors.tarif_minimum = 'Tarif minimum requis';

    if (typeExpedition === 'GROUPAGE_AFRIQUE') {
      if (!formData.prix_unitaire) newErrors.prix_unitaire = 'Prix unitaire requis';
      if (!formData.pays) newErrors.pays = 'Pays requis';
    } else if (typeExpedition === 'GROUPAGE_CA') {
      const colisMode = formData.prix_modes.find(m => m.mode === 'colis accompagné');
      if (!colisMode.montant_base) newErrors.colis_montant = 'Montant base requis';
      if (!colisMode.pourcentage_prestation) newErrors.colis_pourcentage = 'Pourcentage requis';
    } else {
      formData.prix_modes.forEach((mode, i) => {
        if (!mode.montant_base) newErrors[`mode_${i}_base`] = 'Montant base requis';
        if (!mode.pourcentage_prestation) newErrors[`mode_${i}_pourcentage`] = 'Pourcentage requis';
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    let dataToSubmit = {
      category_id: formData.category_id,
      tarif_minimum: parseFloat(formData.tarif_minimum),
      type_expedition: typeExpedition.toLowerCase()
    };

    if (typeExpedition === 'GROUPAGE_AFRIQUE') {
      dataToSubmit = {
        ...dataToSubmit,
        prix_unitaire: parseFloat(formData.prix_unitaire),
        pays: formData.pays
      };
    } else if (typeExpedition === 'GROUPAGE_CA') {
      const colisMode = formData.prix_modes.find(m => m.mode === 'colis accompagné');
      dataToSubmit = {
        ...dataToSubmit,
        prix_modes: [{
          mode: colisMode.mode,
          montant_base: parseFloat(colisMode.montant_base),
          pourcentage_prestation: parseFloat(colisMode.pourcentage_prestation)
        }]
      };
    } else {
      dataToSubmit = {
        ...dataToSubmit,
        prix_modes: formData.prix_modes.map(mode => ({
          mode: mode.mode,
          montant_base: parseFloat(mode.montant_base),
          pourcentage_prestation: parseFloat(mode.pourcentage_prestation)
        }))
      };
    }

    handleFormSubmit(dataToSubmit);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="sticky top-0 z-10 p-5 border-b bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-xl shadow-md">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {tarifToEdit ? `Modifier le tarif` : "Nouveau tarif groupé"}
            </h2>
            <button
              onClick={closeModal}
              className="text-white hover:text-red-200 transition p-1 rounded-full hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
          {/* TYPE D'EXPEDITION */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type d'expédition <span className="text-red-500">*</span>
            </label>
            <select
              value={typeExpedition}
              onChange={handleTypeChange}
              className="w-full px-4 py-2 border rounded-xl shadow-inner focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition duration-150 border-gray-300"
            >
              <option value="GROUPAGE_PA">Groupage PA</option>
              <option value="GROUPAGE_CA">Groupage CA</option>
              <option value="GROUPAGE_AFRIQUE">Groupage Afrique</option>
            </select>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* SELECT CATEGORIE */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
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
                <p className="text-sm text-red-600 mt-1 font-medium">{errors.category_id}</p>
              )}
            </div>

            {/* TARIF MIN */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tarif minimum (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tarif_minimum}
                onChange={(e) => handleInputChange('tarif_minimum', e.target.value)}
                className={`w-full px-4 py-2 border rounded-xl shadow-inner focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition duration-150 ${
                  errors.tarif_minimum ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="5000"
              />
              {errors.tarif_minimum && (
                <p className="text-sm text-red-600 mt-1 font-medium">{errors.tarif_minimum}</p>
              )}
            </div>
          </div>

          {/* GROUPAGE AFRIQUE */}
          {typeExpedition === 'GROUPAGE_AFRIQUE' && (
            <div className='pt-4 border-t border-gray-200'>
              <h3 className="text-xl font-extrabold text-blue-700 mb-6">Paramètres Groupage Afrique</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prix unitaire (FCFA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prix_unitaire}
                    onChange={(e) => handleInputChange('prix_unitaire', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-xl shadow-inner focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition duration-150 ${
                      errors.prix_unitaire ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="2500"
                  />
                  {errors.prix_unitaire && (
                    <p className="text-sm text-red-600 mt-1 font-medium">{errors.prix_unitaire}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pays et capitale <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.pays}
                    onChange={(e) => handleInputChange('pays', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-xl shadow-inner focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition duration-150 ${
                      errors.pays ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner un pays</option>
                    {paysAfrique.map((pays) => (
                      <option key={pays} value={pays}>
                        {pays}
                      </option>
                    ))}
                  </select>
                  {errors.pays && (
                    <p className="text-sm text-red-600 mt-1 font-medium">{errors.pays}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* GROUPAGE CA */}
          {typeExpedition === 'GROUPAGE_CA' && (
            <div className='pt-4 border-t border-gray-200'>
              <h3 className="text-xl font-extrabold text-blue-700 mb-6">Paramètres Groupage CA</h3>
              
              <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-md">
                <h4 className="text-lg font-bold text-gray-800 mb-4">✈️ Mode: Colis accompagné</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant base (FCFA) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      
                      value={colisMode.montant_base}
                      onChange={(e) => handleModeChange(1, 'montant_base', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500 ${
                        errors.colis_montant ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="1000"
                    />
                    {errors.colis_montant && (
                      <p className="text-xs text-red-600 mt-1">{errors.colis_montant}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      % Prestation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={colisMode.pourcentage_prestation}
                      onChange={(e) => handleModeChange(2, 'pourcentage_prestation', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500 ${
                        errors.colis_pourcentage ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="10"
                    />
                    {errors.colis_pourcentage && (
                      <p className="text-xs text-red-600 mt-1">{errors.colis_pourcentage}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant expédition <span className="text-blue-500">(Calculé)</span>
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(formData.prix_modes[1].montant_expedition)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-blue-50 text-blue-800 font-semibold shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GROUPAGE PA */}
          {typeExpedition === 'GROUPAGE_PA' && (
            <div className='pt-4 border-t border-gray-200'>
              <h3 className="text-xl font-extrabold text-blue-700 mb-6">Paramètres des modes d'expédition</h3>

              <div className="space-y-8">
                {formData.prix_modes.map((modeObj, index) => (
                  <div key={modeObj.mode} className="p-6 rounded-xl bg-white border border-gray-200 shadow-md hover:shadow-lg transition duration-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 capitalize border-b pb-2">
                      ✈️ Mode: {modeObj.mode}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montant base (FCFA) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.prix_modes[index].montant_base}
                          onChange={(e) => handleModeChange(index, 'montant_base', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`mode_${index}_base`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="0"
                        />
                        {errors[`mode_${index}_base`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`mode_${index}_base`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          % Prestation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.prix_modes[index].pourcentage_prestation}
                          onChange={(e) => handleModeChange(index, 'pourcentage_prestation', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`mode_${index}_pourcentage`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="0"
                        />
                        {errors[`mode_${index}_pourcentage`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`mode_${index}_pourcentage`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montant expédition <span className="text-blue-500">(Calculé)</span>
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(formData.prix_modes[index].montant_expedition)}
                          readOnly
                          className="w-full px-3 py-2 border rounded-lg bg-blue-50 text-blue-800 font-semibold shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-xl shadow-inner">
            <button
              onClick={closeModal}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition duration-150 font-medium"
              disabled={isSubmitting}
            >
              Annuler
            </button>

            <button
              onClick={handleSubmit}
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

        </div>
      </div>
    </div>
  );
};

export default Addtarifgroupe;

// export default function App() {
//   const [showModal, setShowModal] = useState(true);
  
//   const mockCategories = [
//     { id: 1, nom: "Électronique" },
//     { id: 2, nom: "Vêtements" },
//     { id: 3, nom: "Alimentaire" }
//   ];

//   const handleSubmit = (data) => {
//     console.log("Données soumises:", JSON.stringify(data, null, 2));
//     alert("Données soumises! Vérifiez la console.");
//     setShowModal(false);
//   };

//   if (!showModal) return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//       <button 
//         onClick={() => setShowModal(true)}
//         className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//       >
//         Ouvrir la modale
//       </button>
//     </div>
//   );

//   return (
//     <Addtarifgroupe
//       tarifToEdit={null}
//       closeModal={() => setShowModal(false)}
//       categories={mockCategories}
//       onSubmit={handleSubmit}
//       isSubmitting={false}
//     />
//   );
// }