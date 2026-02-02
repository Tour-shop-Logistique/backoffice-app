import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const Addtarifgroupe = ({ 
  tarifToEdit, 
  closeModal, 
  categories = [],
  onSubmit: handleFormSubmit,
  isSubmitting = false 
}) => {
  const [typeExpedition, setTypeExpedition] = useState('GROUPAGE_DHD_AERIEN');
  const [formData, setFormData] = useState({
    category_id: '',
    tarif_minimum: '',
    type_expedition: 'GROUPAGE_DHD_AERIEN',
    prix_unitaire: '',
    pays: '',
    ville_depart: '',
    ville_arrivee: '',
    prix_modes: [
      { mode: 'avion', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }
    ]
  });
  const [errors, setErrors] = useState({});

  const paysAfrique = [
    "AFRIQUE DU SUD PRETORIA",
    "ALGERIE ALGER",
    "ANGOLA LUANDA",
    "BENIN COTONOU",
    "BOTSWANA GABORONE",
    "BURKINA FASO OUAGADOUGOU",
    "BURUNDI GITEGA",
    "CAMEROUN YAOUNDE",
    "CAP-VERT PRAIA",
    "COMORES MORONI",
    "COTE D'IVOIRE YAMOUSSOUKRO",
    "DJIBOUTI DJIBOUTI",
    "EGYPTE LE CAIRE",
    "ERYTHREE ASMARA",
    "ESWATINI MBABANE",
    "ETHIOPIE ADDIS-ABEBA",
    "GABON LIBREVILLE",
    "GAMBIE BANJUL",
    "GHANA ACCRA",
    "GUINEE CONAKRY",
    "GUINEE-BISSAU BISSAU",
    "GUINEE EQUATORIALE MALABO",
    "KENYA NAIROBI",
    "LESOTHO MASERU",
    "LIBERIA MONROVIA",
    "LIBYE TRIPOLI",
    "MADAGASCAR ANTANANARIVO",
    "MALAWI LILONGWE",
    "MALI BAMAKO",
    "MAROC RABAT",
    "MAURICE PORT-LOUIS",
    "MAURITANIE NOUAKCHOTT",
    "MOZAMBIQUE MAPUTO",
    "NAMIBIE WINDHOEK",
    "NIGER NIAMEY",
    "NIGERIA ABUJA",
    "OUGANDA KAMPALA",
    "RD CONGO KINSHASA",
    "REPUBLIQUE DU CONGO BRAZZAVILLE",
    "RWANDA KIGALI",
    "SAO TOME-ET-PRINCIPE SAO TOME",
    "SENEGAL DAKAR",
    "SEYCHELLES VICTORIA",
    "SIERRA LEONE FREETOWN",
    "SOMALIE MOGADISCIO",
    "SOUDAN KHARTOUM",
    "SOUDAN DU SUD Djouba",
    "TANZANIE DODOMA",
    "TCHAD N'DJAMENA",
    "TOGO LOME",
    "TUNISIE TUNIS",
    "ZAMBIE LUSAKA",
    "ZIMBABWE HARARE"
  ];

  useEffect(() => {
    if (tarifToEdit) {
      const type = tarifToEdit.type_expedition ? tarifToEdit.type_expedition.toUpperCase() : 'GROUPAGE_DHD_AERIEN';
      setTypeExpedition(type);

      let initialModes = [];
      if (type === 'GROUPAGE_DHD_AERIEN') {
        initialModes = [{ mode: 'avion', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }];
      } else if (type === 'GROUPAGE_DHD_MARITIME') {
        initialModes = [{ mode: 'bateau', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }];
      } else if (type === 'GROUPAGE_CA') {
        initialModes = [{ mode: 'colis', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }];
      } else if (type === 'GROUPAGE_AFRIQUE') {
        initialModes = [{ mode: 'afrique', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }];
      } else if (type === 'GROUPAGE_DHD') { // Path for legacy data
        initialModes = [
          { mode: 'avion', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 },
          { mode: 'bateau', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }
        ];
      }

      // Fusionner avec les données existantes
      const mergedModes = initialModes.map(initMode => {
        const found = tarifToEdit.prix_modes?.find(m => m.mode === initMode.mode);
        if (found) {
          return {
            ...initMode,
            montant_base: found.montant_base,
            pourcentage_prestation: found.pourcentage_prestation,
            montant_expedition: found.montant_expedition
          };
        }
        // If flat structure (newly requested types)
        if ((type === 'GROUPAGE_DHD_AERIEN' || type === 'GROUPAGE_DHD_MARITIME') && tarifToEdit.mode === initMode.mode) {
          return {
            ...initMode,
            montant_base: tarifToEdit.montant_base,
            pourcentage_prestation: tarifToEdit.pourcentage_prestation,
            montant_expedition: (tarifToEdit.montant_base * (1 + tarifToEdit.pourcentage_prestation / 100))
          };
        }
        return initMode;
      });

      let ville_depart = '';
      let ville_arrivee = '';
      if (tarifToEdit.ligne && tarifToEdit.ligne.includes('-')) {
        [ville_depart, ville_arrivee] = tarifToEdit.ligne.split('-');
      }

      setFormData({
        category_id: tarifToEdit.category_id || '',
        tarif_minimum: tarifToEdit.tarif_minimum || '',
        type_expedition: type,
        prix_unitaire: tarifToEdit.prix_unitaire || '',
        pays: tarifToEdit.pays || '',
        ville_depart: ville_depart,
        ville_arrivee: ville_arrivee,
        prix_modes: mergedModes
      });
    }
  }, [tarifToEdit]);

  useEffect(() => {
    const updatedModes = formData.prix_modes.map(mode => {
      const base = parseFloat(mode.montant_base) || 0;
      const pourcentage = parseFloat(mode.pourcentage_prestation) || 0;
      const montant_expedition = base + (base * pourcentage / 100);
      return { ...mode, montant_expedition };
    });
    
    const currentString = JSON.stringify(formData.prix_modes);
    const newString = JSON.stringify(updatedModes);
    if (currentString !== newString) {
      setFormData(prev => ({ ...prev, prix_modes: updatedModes }));
    }
  }, [formData.prix_modes, typeExpedition]);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setTypeExpedition(newType);
    
    let initialModes = [];
    if (newType === 'GROUPAGE_DHD_AERIEN') {
      initialModes = [{ mode: 'avion', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }];
    } else if (newType === 'GROUPAGE_DHD_MARITIME') {
      initialModes = [{ mode: 'bateau', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }];
    } else if (newType === 'GROUPAGE_CA') {
      initialModes = [{ mode: 'colis', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }];
    } else if (newType === 'GROUPAGE_AFRIQUE') {
      initialModes = [{ mode: 'afrique', montant_base: '', pourcentage_prestation: '', montant_expedition: 0 }];
    }

    setFormData(prev => ({
      ...prev,
      type_expedition: newType,
      prix_unitaire: '',
      pays: '',
      ville_depart: '',
      ville_arrivee: '',
      prix_modes: initialModes
    }));
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'category_id') {
        const selectedCategory = categories.find(c => c.id.toString() === value.toString());
        if (selectedCategory && selectedCategory.prix_kg) {
          newData.tarif_minimum = selectedCategory.prix_kg;
        }
      }
      return newData;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleModeChange = (index, field, value) => {
    const updatedModes = [...formData.prix_modes];
    updatedModes[index] = { ...updatedModes[index], [field]: value };
    setFormData(prev => ({ ...prev, prix_modes: updatedModes }));
    
    const errorKey = `mode_${index}_${field === 'pourcentage_prestation' ? 'pourcentage' : 'base'}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (typeExpedition === 'GROUPAGE_DHD_AERIEN' || typeExpedition === 'GROUPAGE_DHD_MARITIME') {
      if (!formData.category_id) newErrors.category_id = 'Catégorie requise';
      if (!formData.ville_depart) newErrors.ville_depart = 'Ville de départ requise';
      if (!formData.ville_arrivee) newErrors.ville_arrivee = 'Ville d\'arrivée requise';
    }
    
    if (typeExpedition === 'GROUPAGE_AFRIQUE') {
      if (!formData.pays) newErrors.pays = 'Pays requis';
    }

    formData.prix_modes.forEach((mode, i) => {
      if (!mode.montant_base) newErrors[`mode_${i}_base`] = 'Montant base requis';
      if (mode.pourcentage_prestation === '' || mode.pourcentage_prestation === null) newErrors[`mode_${i}_pourcentage`] = 'Pourcentage requis';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    let dataToSubmit;

    if (typeExpedition === 'GROUPAGE_DHD_AERIEN' || typeExpedition === 'GROUPAGE_DHD_MARITIME') {
      const modeData = formData.prix_modes[0];
      dataToSubmit = {
        type_expedition: typeExpedition.toLowerCase(),
        category_id: formData.category_id,
        mode: modeData.mode,
        ligne: `${formData.ville_depart}-${formData.ville_arrivee}`,
        montant_base: parseFloat(modeData.montant_base),
        pourcentage_prestation: parseFloat(modeData.pourcentage_prestation)
      };
    } else if (typeExpedition === 'GROUPAGE_AFRIQUE') {
      const modeData = formData.prix_modes[0];
      dataToSubmit = {
        type_expedition: typeExpedition.toLowerCase(),
        pays: formData.pays,
        mode: 'afrique',
        montant_base: parseFloat(modeData.montant_base),
        pourcentage_prestation: parseFloat(modeData.pourcentage_prestation)
        // montant_expedition n'est pas envoyé pour Afrique
      };
    } else if (typeExpedition === 'GROUPAGE_CA') {
      const modeData = formData.prix_modes[0];
      dataToSubmit = {
        type_expedition: typeExpedition.toLowerCase(),
        mode: 'colis',
        montant_base: parseFloat(modeData.montant_base),
        pourcentage_prestation: parseFloat(modeData.pourcentage_prestation)
        // montant_expedition et category_id ne sont pas envoyés pour CA
      };
    } else {
      // Cas par défaut (si d'autres types existent encore avec prix_modes)
      dataToSubmit = {
        category_id: formData.category_id,
        tarif_minimum: parseFloat(formData.tarif_minimum),
        type_expedition: typeExpedition.toLowerCase(),
        pays: formData.pays,
        prix_modes: formData.prix_modes.map(mode => ({
          mode: mode.mode,
          montant_base: parseFloat(mode.montant_base),
          pourcentage_prestation: parseFloat(mode.pourcentage_prestation),
          montant_expedition: parseFloat(mode.montant_expedition)
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
        <div className="sticky top-0 z-10 p-3 border-b bg-white rounded-t-xl border-gray-100">
          <div className="flex justify-between items-center text-surface-900">
            <h2 className="text-2xl font-black tracking-tight">
              {tarifToEdit ? `Modifier le tarif` : "Nouveau tarif groupée"}
            </h2>
            <button
              onClick={closeModal}
              className="text-surface-400 hover:text-red-500 transition-all p-2 rounded-xl hover:bg-red-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          
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
              <option value="GROUPAGE_DHD_AERIEN">Groupage DHD Aérien</option>
              <option value="GROUPAGE_DHD_MARITIME">Groupage DHD Maritime</option>
              <option value="GROUPAGE_CA">Groupage CA</option>
              <option value="GROUPAGE_AFRIQUE">Groupage Afrique</option>
            </select>
          </div>

          {/* DHD Ligne Configuration */}
          {(typeExpedition === 'GROUPAGE_DHD_AERIEN' || typeExpedition === 'GROUPAGE_DHD_MARITIME') && (
            <div className='pt-4 border-t border-gray-200'>
              <h3 className="text-lg font-extrabold text-blue-700 mb-4 font-display">Itinéraire & Catégorie</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    <p className="text-xs text-red-600 mt-1">{errors.category_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ville de départ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ville_depart}
                    onChange={(e) => handleInputChange('ville_depart', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-xl shadow-inner focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition duration-150 ${
                      errors.ville_depart ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ex: Abidjan"
                  />
                  {errors.ville_depart && (
                    <p className="text-xs text-red-600 mt-1">{errors.ville_depart}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ville d'arrivée <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ville_arrivee}
                    onChange={(e) => handleInputChange('ville_arrivee', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-xl shadow-inner focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition duration-150 ${
                      errors.ville_arrivee ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ex: Paris"
                  />
                  {errors.ville_arrivee && (
                    <p className="text-xs text-red-600 mt-1">{errors.ville_arrivee}</p>
                  )}
                </div>
              </div>

              {/* Pricing for DHD */}
              <div className="space-y-6">
                {formData.prix_modes.map((mode, index) => (
                  <div key={mode.mode || index} className="p-4 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                       {mode.mode === 'avion' ? '✈️' : '🚢'}
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg text-sm">Tarification</span>
                      Mode {mode.mode === 'avion' ? 'Aérien' : 'Maritime'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">
                          Montant base (FCFA) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={mode.montant_base}
                          onChange={(e) => handleModeChange(index, 'montant_base', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                            errors[`mode_${index}_base`] ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
                          }`}
                          placeholder="900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">
                          % Prestation <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={mode.pourcentage_prestation}
                            onChange={(e) => handleModeChange(index, 'pourcentage_prestation', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10 ${
                              errors[`mode_${index}_pourcentage`] ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
                            }`}
                            placeholder="8"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">
                          Total Expédition
                        </label>
                        <div className="px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-lg shadow-inner flex items-center justify-center">
                          {formatCurrency(mode.montant_expedition)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUPAGE AFRIQUE */}
          {typeExpedition === 'GROUPAGE_AFRIQUE' && (
            <div className='pt-4 border-t border-gray-200'>
              <h3 className="text-lg font-extrabold text-blue-700 mb-4">Paramètres Groupage Afrique</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
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
                </div>
              </div>

               <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-md">
                 <h4 className="text-lg font-bold text-gray-800 mb-4 capitalize italic">
                   🌍 Mode: Afrique
                 </h4>
                 
                 {formData.prix_modes.map((mode, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montant base (FCFA) *
                        </label>
                        <input
                          type="number"
                          value={mode.montant_base}
                          onChange={(e) => handleModeChange(index, 'montant_base', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-white border-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          % Prestation *
                        </label>
                        <input
                          type="number"
                          value={mode.pourcentage_prestation}
                          onChange={(e) => handleModeChange(index, 'pourcentage_prestation', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-white border-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montant expédition
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(mode.montant_expedition)}
                          readOnly
                          className="w-full px-3 py-2 border rounded-lg bg-blue-50 text-blue-800 font-semibold"
                        />
                      </div>
                    </div>
                 ))}
               </div>
            </div>
          )}

          {/* GROUPAGE CA (Classic Render) */}
          {typeExpedition === 'GROUPAGE_CA' && (
            <div className='pt-4 border-t border-gray-200'>
              <h3 className="text-xl font-extrabold text-blue-700 mb-6">Paramètres d'expédition CA</h3>

              <div className="space-y-8">
                {formData.prix_modes.map((mode, index) => (
                  <div key={mode.mode || index} className="p-6 rounded-xl bg-white border border-gray-200 shadow-md">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 capitalize border-b pb-2">
                      📦 Mode: {mode.mode}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montant base (FCFA) *
                        </label>
                        <input
                          type="number"
                          value={mode.montant_base}
                          onChange={(e) => handleModeChange(index, 'montant_base', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-white border-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          % Prestation *
                        </label>
                        <input
                          type="number"
                          value={mode.pourcentage_prestation}
                          onChange={(e) => handleModeChange(index, 'pourcentage_prestation', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-white border-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montant expédition
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(mode.montant_expedition)}
                          readOnly
                          className="w-full px-3 py-2 border rounded-lg bg-blue-50 text-blue-800 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER BUTTONS */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm pt-4 pb-2 px-6 border-t border-gray-100 -mx-8 -mb-8 rounded-b-xl flex justify-end space-x-4">
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