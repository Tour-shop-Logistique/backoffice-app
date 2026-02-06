import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';



const Addtarifgroupe = ({
  tarifToEdit,
  closeModal,
  categories = [],
  onSubmit: handleFormSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    type_expedition: 'GROUPAGE_DHD_AERIEN',
    category_id: '',
    pays: '',
    mode: 'avion',
    ville_depart: '',
    ville_arrivee: '',
    montant_base: '',
    pourcentage_prestation: ''
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

      let ville_depart = '';
      let ville_arrivee = '';
      if (tarifToEdit.ligne && tarifToEdit.ligne.includes('-')) {
        [ville_depart, ville_arrivee] = tarifToEdit.ligne.split('-');
      }

      setFormData({
        type_expedition: type,
        category_id: tarifToEdit.category_id || '',
        pays: tarifToEdit.pays || '',
        mode: tarifToEdit.mode || getModeForType(type),
        ville_depart: ville_depart,
        ville_arrivee: ville_arrivee,
        montant_base: tarifToEdit.montant_base || '',
        pourcentage_prestation: tarifToEdit.pourcentage_prestation || ''
      });
    }
  }, [tarifToEdit]);

  const getModeForType = (type) => {
    switch (type) {
      case 'GROUPAGE_DHD_AERIEN': return 'avion';
      case 'GROUPAGE_DHD_MARITIME': return 'bateau';
      case 'GROUPAGE_CA': return 'colis';
      case 'GROUPAGE_AFRIQUE': return 'afrique';
      default: return 'avion';
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const newMode = getModeForType(newType);

    setFormData(prev => ({
      ...prev,
      type_expedition: newType,
      mode: newMode,
      category_id: '',
      pays: '',
      ville_depart: '',
      ville_arrivee: '',
      montant_base: '',
      pourcentage_prestation: ''
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

  const validateForm = () => {
    const newErrors = {};
    const { type_expedition } = formData;

    if (type_expedition === 'GROUPAGE_DHD_AERIEN' || type_expedition === 'GROUPAGE_DHD_MARITIME') {
      if (!formData.category_id) newErrors.category_id = 'Catégorie requise';
      if (!formData.ville_depart) newErrors.ville_depart = 'Ville de départ requise';
      if (!formData.ville_arrivee) newErrors.ville_arrivee = 'Ville d\'arrivée requise';
    }

    if (type_expedition === 'GROUPAGE_AFRIQUE') {
      if (!formData.pays) newErrors.pays = 'Pays requis';
    }

    if (!formData.montant_base) newErrors.montant_base = 'Montant base requis';
    if (formData.pourcentage_prestation === '' || formData.pourcentage_prestation === null) {
      newErrors.pourcentage_prestation = 'Pourcentage requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { type_expedition } = formData;
    let dataToSubmit = {
      type_expedition: type_expedition.toLowerCase(),
      mode: formData.mode,
      montant_base: parseFloat(formData.montant_base),
      pourcentage_prestation: parseFloat(formData.pourcentage_prestation)
    };

    if (type_expedition === 'GROUPAGE_DHD_AERIEN' || type_expedition === 'GROUPAGE_DHD_MARITIME') {
      dataToSubmit.category_id = formData.category_id;
      dataToSubmit.ligne = `${formData.ville_depart}-${formData.ville_arrivee}`;
    } else if (type_expedition === 'GROUPAGE_AFRIQUE') {
      dataToSubmit.pays = formData.pays;
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

  const calculateTotal = () => {
    const base = parseFloat(formData.montant_base) || 0;
    const pourcentage = parseFloat(formData.pourcentage_prestation) || 0;
    return base + (base * pourcentage / 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* STEP 1: Type Selection */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
            1
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Type d'expédition</h3>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-xl p-2 shadow-sm">
          {/* <label className="block text-sm font-semibold text-slate-700 mb-2">
            Mode d'expédition <span className="text-red-500">*</span>
          </label> */}
          <SearchableDropdown
            value={formData.type_expedition}
            onChange={(value) => handleTypeChange({ target: { value } })}
            options={[
              { value: 'GROUPAGE_DHD_AERIEN', label: '✈️ DHD Aérien' },
              { value: 'GROUPAGE_DHD_MARITIME', label: '🚢 DHD Maritime' },
              { value: 'GROUPAGE_AFRIQUE', label: '🌍 Afrique' },
              { value: 'GROUPAGE_CA', label: '📦 Colis Accompagnés' }
            ]}
            placeholder="Sélectionner le type..."
            themeColor="blue"
          />
        </div>
      </div>

      {/* STEP 2: Route/Destination Configuration */}
      {(formData.type_expedition === 'GROUPAGE_DHD_AERIEN' || formData.type_expedition === 'GROUPAGE_DHD_MARITIME') && (
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
              2
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Itinéraire & Catégorie</h3>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  Catégorie <span className="text-red-500">*</span>
                </span>
              </label>

              <SearchableDropdown
                value={categories.find(c => c.id.toString() === formData.category_id)?.nom || ''}
                onChange={(categoryName) => {
                  const category = categories.find(c => c.nom === categoryName);
                  handleInputChange('category_id', category ? category.id.toString() : '');
                }}
                options={categories.map(c => c.nom)}
                placeholder="Sélectionner..."
                error={errors.category_id}
                themeColor="emerald"
              />

              {errors.category_id && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {errors.category_id}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Departure City */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  Ville de départ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ville_depart}
                  onChange={(e) => handleInputChange('ville_depart', e.target.value)}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition duration-150 ${errors.ville_depart ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  placeholder="ex: Abidjan"
                />
                {errors.ville_depart && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.ville_depart}
                  </p>
                )}
              </div>

              {/* Arrival City */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  Ville d'arrivée <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ville_arrivee}
                  onChange={(e) => handleInputChange('ville_arrivee', e.target.value)}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition duration-150 ${errors.ville_arrivee ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  placeholder="ex: Paris"
                />
                {errors.ville_arrivee && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.ville_arrivee}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Africa Destination */}
      {formData.type_expedition === 'GROUPAGE_AFRIQUE' && (
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
              2
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Destination Afrique</h3>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-orange-200 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="inline-flex items-center gap-2">
                Pays et capitale <span className="text-red-500">*</span>
              </span>
            </label>

            <SearchableDropdown
              value={formData.pays}
              onChange={(value) => handleInputChange('pays', value)}
              options={paysAfrique}
              placeholder="Rechercher un pays..."
              error={errors.pays}
            />

            {errors.pays && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <span>⚠️</span> {errors.pays}
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Pricing */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
            {(formData.type_expedition === 'GROUPAGE_DHD_AERIEN' || formData.type_expedition === 'GROUPAGE_DHD_MARITIME' || formData.type_expedition === 'GROUPAGE_AFRIQUE') ? '3' : '2'}
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Tarification</h3>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-200">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base Amount */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Montant base (FCFA) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.montant_base}
                  onChange={(e) => handleInputChange('montant_base', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800 ${errors.montant_base ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  placeholder="1000"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  FCFA
                </div>
              </div>
              {errors.montant_base && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.montant_base}
                </p>
              )}
            </div>

            {/* Percentage */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Prestation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.pourcentage_prestation}
                  onChange={(e) => handleInputChange('pourcentage_prestation', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800 ${errors.pourcentage_prestation ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  placeholder="10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-violet-600">
                  %
                </div>
              </div>
              {errors.pourcentage_prestation && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.pourcentage_prestation}
                </p>
              )}
            </div>
          </div>

          {/* Calculation Preview */}
          {formData.montant_base && formData.pourcentage_prestation && (
            <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Base:</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(formData.montant_base) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prestation ({formData.pourcentage_prestation}%):</span>
                  <span className="font-semibold text-violet-600">
                    +{formatCurrency((parseFloat(formData.montant_base) || 0) * (parseFloat(formData.pourcentage_prestation) || 0) / 100)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-1 mt-1"></div>
                <div className="flex justify-between font-bold text-sm">
                  <span>Total:</span>
                  <span className="text-emerald-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER BUTTONS */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={closeModal}
          className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-slate-700 bg-white hover:bg-gray-50 transition-all duration-150 font-semibold hover:border-gray-400 hover:shadow-md"
          disabled={isSubmitting}
        >
          Annuler
        </button>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-lg shadow-lg text-white font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-150 disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>{tarifToEdit ? "En cours..." : "En cours..."}</span>
            </div>
          ) : (
            <span className="flex items-center gap-2">
              {tarifToEdit ? "Mettre à jour" : "Enregistrer"}
            </span>
          )}
        </button>
      </div>

    </form>
  );
};

export default Addtarifgroupe;
