import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import CityAutocomplete from '../common/CityAutocomplete';
import { AFRICAN_COUNTRY_OPTIONS, NON_AFRICAN_COUNTRY_OPTIONS } from '../../utils/countries';
import { fetchCommunes } from '../../redux/slices/communeSlice';



const Addtarifgroupe = ({
  id,
  tarifToEdit,
  closeModal,
  categories = [],
  onSubmit: handleFormSubmit,
  isSubmitting = false
}) => {
  const dispatch = useDispatch();
  const { communes, hasLoaded: hasLoadedCommunes, isLoading: isLoadingCommunes } = useSelector((state) => state.communes);

  useEffect(() => {
    if (!hasLoadedCommunes && !isLoadingCommunes) {
      dispatch(fetchCommunes());
    }
  }, [dispatch, hasLoadedCommunes, isLoadingCommunes]);

  const [formData, setFormData] = useState({
    type_expedition: 'GROUPAGE_DHD_AERIEN',
    category_id: '',
    code_pays: '',
    mode: 'avion',
    commune_depart_id: '',
    ville_depart: '',
    ville_arrivee: '',
    montant_base: '',
    pourcentage_prestation: '',
    montant_minimum: '',
    pourcentage_prestation_minimum: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (tarifToEdit) {
      const type = tarifToEdit.type_expedition ? tarifToEdit.type_expedition.toUpperCase() : 'GROUPAGE_DHD_AERIEN';

      let ville_depart = '';
      let ville_arrivee = '';
      if (tarifToEdit.ligne && tarifToEdit.ligne.includes('-')) {
        [ville_depart, ville_arrivee] = tarifToEdit.ligne.split('-').map(v => v.trim());
      }

      setFormData({
        type_expedition: type,
        category_id: tarifToEdit.category_id || '',
        code_pays: tarifToEdit.code_pays || '',
        mode: tarifToEdit.mode || getModeForType(type),
        commune_depart_id: tarifToEdit.commune_depart_id || '',
        ville_depart: ville_depart,
        ville_arrivee: ville_arrivee,
        montant_base: tarifToEdit.montant_base || '',
        pourcentage_prestation: tarifToEdit.pourcentage_prestation || '',
        montant_minimum: tarifToEdit.montant_minimum ?? '',
        pourcentage_prestation_minimum: tarifToEdit.pourcentage_prestation_minimum ?? ''
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
      code_pays: '',
      commune_depart_id: '',
      ville_depart: '',
      ville_arrivee: '',
      montant_base: '',
      pourcentage_prestation: '',
      montant_minimum: '',
      pourcentage_prestation_minimum: ''
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
      if (!formData.commune_depart_id) newErrors.commune_depart_id = 'Commune de départ requise';
      if (!formData.ville_arrivee) newErrors.ville_arrivee = 'Ville d\'arrivée requise';
    }

    // code_pays est desormais requis pour les 4 types geo-dependants
    // (GROUPAGE_AFRIQUE -> pays africain uniquement ; GROUPAGE_CA et DHD ->
    // tous pays hors Afrique), meme regle que cote backend (TypeExpeditionGeoRule).
    if (type_expedition === 'GROUPAGE_AFRIQUE' || type_expedition === 'GROUPAGE_CA' || type_expedition === 'GROUPAGE_DHD_AERIEN' || type_expedition === 'GROUPAGE_DHD_MARITIME') {
      if (!formData.code_pays) newErrors.code_pays = 'Pays requis';
    }

    if (!formData.montant_base) newErrors.montant_base = 'Montant base requis';
    if (formData.pourcentage_prestation === '' || formData.pourcentage_prestation === null) {
      newErrors.pourcentage_prestation = 'Pourcentage requis';
    }

    // Le tarif minimum est optionnel, mais si l'un des deux champs est
    // renseigné, l'autre devient requis (les deux vont toujours de pair).
    const hasMontantMinimum = formData.montant_minimum !== '' && formData.montant_minimum !== null;
    const hasPourcentageMinimum = formData.pourcentage_prestation_minimum !== '' && formData.pourcentage_prestation_minimum !== null;
    if (hasMontantMinimum && !hasPourcentageMinimum) {
      newErrors.pourcentage_prestation_minimum = 'Pourcentage du minimum requis';
    }
    if (hasPourcentageMinimum && !hasMontantMinimum) {
      newErrors.montant_minimum = 'Montant du minimum requis';
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
      dataToSubmit.commune_depart_id = formData.commune_depart_id;
      // La ville de depart (texte) vient du nom de la commune choisie, pas
      // d'une saisie libre - garantit une ligne toujours coherente avec
      // commune_depart_id (voir ExpeditionTarificationService::resoudreTarifGroupageDHD).
      const communeDepart = communes.find(c => String(c.id) === String(formData.commune_depart_id));
      const villeDepart = (communeDepart?.nom || formData.ville_depart || '').trim().toLowerCase();
      dataToSubmit.ligne = `${villeDepart}-${formData.ville_arrivee.trim().toLowerCase()}`;
      if (formData.montant_minimum !== '' && formData.pourcentage_prestation_minimum !== '') {
        dataToSubmit.montant_minimum = parseFloat(formData.montant_minimum);
        dataToSubmit.pourcentage_prestation_minimum = parseFloat(formData.pourcentage_prestation_minimum);
      }
    }

    // code_pays s'ajoute pour les 4 types geo-dependants (le bloc DHD
    // ci-dessus reste separe : ligne/category_id/plancher lui sont propres).
    if (type_expedition === 'GROUPAGE_AFRIQUE' || type_expedition === 'GROUPAGE_CA' || type_expedition === 'GROUPAGE_DHD_AERIEN' || type_expedition === 'GROUPAGE_DHD_MARITIME') {
      dataToSubmit.code_pays = formData.code_pays;
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
    <form id={id} onSubmit={handleSubmit} className="space-y-6">

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

            {/* Pays de destination (hors Afrique - DHD ne va jamais vers l'Afrique) */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  Pays de destination <span className="text-red-500">*</span>
                </span>
              </label>
              <SearchableDropdown
                value={formData.code_pays}
                onChange={(code) => handleInputChange('code_pays', code)}
                options={NON_AFRICAN_COUNTRY_OPTIONS.map((c) => ({ label: c.label, value: c.id }))}
                placeholder="Rechercher un pays..."
                error={errors.code_pays}
                themeColor="emerald"
              />
              {errors.code_pays && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {errors.code_pays}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Departure Commune - choisie dans le referentiel du backoffice,
                  partage avec Interville (voir menu Communes) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  Commune de départ <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  value={formData.commune_depart_id}
                  onChange={(v) => handleInputChange('commune_depart_id', v)}
                  options={communes.map((c) => ({ label: c.nom, value: c.id }))}
                  placeholder={isLoadingCommunes ? 'Chargement...' : 'Sélectionner une commune...'}
                  error={errors.commune_depart_id}
                  themeColor="blue"
                />
                {errors.commune_depart_id && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.commune_depart_id}
                  </p>
                )}
                {!isLoadingCommunes && communes.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">Aucune commune configurée. Rendez-vous dans le menu "Communes".</p>
                )}
              </div>

              {/* Arrival City - assistée par countries.dev selon le pays choisi */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  Ville d'arrivée <span className="text-red-500">*</span>
                </label>
                <CityAutocomplete
                  countryCode={formData.code_pays}
                  value={formData.ville_arrivee}
                  onChange={(v) => handleInputChange('ville_arrivee', v)}
                  error={errors.ville_arrivee}
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

      {/* STEP 2: Destination (Afrique uniquement, ou CA hors Afrique) */}
      {(formData.type_expedition === 'GROUPAGE_AFRIQUE' || formData.type_expedition === 'GROUPAGE_CA') && (
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
              2
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              {formData.type_expedition === 'GROUPAGE_AFRIQUE' ? 'Destination Afrique' : 'Pays de destination (hors Afrique)'}
            </h3>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-orange-200 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="inline-flex items-center gap-2">
                Pays <span className="text-red-500">*</span>
              </span>
            </label>

            <SearchableDropdown
              value={formData.code_pays}
              onChange={(code) => handleInputChange('code_pays', code)}
              options={(formData.type_expedition === 'GROUPAGE_AFRIQUE' ? AFRICAN_COUNTRY_OPTIONS : NON_AFRICAN_COUNTRY_OPTIONS).map((c) => ({ label: c.label, value: c.id }))}
              placeholder="Rechercher un pays..."
              error={errors.code_pays}
            />

            {errors.code_pays && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <span>⚠️</span> {errors.code_pays}
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Pricing */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
            {(formData.type_expedition === 'GROUPAGE_DHD_AERIEN' || formData.type_expedition === 'GROUPAGE_DHD_MARITIME' || formData.type_expedition === 'GROUPAGE_AFRIQUE' || formData.type_expedition === 'GROUPAGE_CA') ? '3' : '2'}
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
                  min="0"
                  className={`w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800 ${errors.montant_base ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  placeholder="1000"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
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
                  min="0"
                  max="100"
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

      {/* STEP 4: Minimum Tariff (DHD only) */}
      {(formData.type_expedition === 'GROUPAGE_DHD_AERIEN' || formData.type_expedition === 'GROUPAGE_DHD_MARITIME') && (
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
              4
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Tarif minimum (optionnel)</h3>
              <p className="text-xs text-slate-500">Plancher appliqué si le tarif calculé pour cette ligne tombe en dessous</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-orange-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Montant minimum (FCFA)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.montant_minimum}
                    onChange={(e) => handleInputChange('montant_minimum', e.target.value)}
                    min="0"
                    className={`w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all font-medium text-slate-800 ${errors.montant_minimum ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder="13500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">FCFA</div>
                </div>
                {errors.montant_minimum && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><span>⚠️</span> {errors.montant_minimum}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Prestation agence (minimum)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.pourcentage_prestation_minimum}
                    onChange={(e) => handleInputChange('pourcentage_prestation_minimum', e.target.value)}
                    min="0"
                    max="100"
                    className={`w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all font-medium text-slate-800 ${errors.pourcentage_prestation_minimum ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder="10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-orange-600">%</div>
                </div>
                {errors.pourcentage_prestation_minimum && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><span>⚠️</span> {errors.pourcentage_prestation_minimum}</p>
                )}
              </div>
            </div>

            {formData.montant_minimum !== '' && formData.pourcentage_prestation_minimum !== '' && (
              <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Base:</span>
                    <span className="font-semibold">{formatCurrency(parseFloat(formData.montant_minimum) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prestation ({formData.pourcentage_prestation_minimum}%):</span>
                    <span className="font-semibold text-orange-600">
                      +{formatCurrency((parseFloat(formData.montant_minimum) || 0) * (parseFloat(formData.pourcentage_prestation_minimum) || 0) / 100)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-1 mt-1"></div>
                  <div className="flex justify-between font-bold text-sm">
                    <span>Total:</span>
                    <span className="text-emerald-600">
                      {formatCurrency(
                        (parseFloat(formData.montant_minimum) || 0) +
                        ((parseFloat(formData.montant_minimum) || 0) * (parseFloat(formData.pourcentage_prestation_minimum) || 0)) / 100
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </form>
  );
};

export default Addtarifgroupe;
