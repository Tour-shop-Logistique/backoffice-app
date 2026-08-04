import React, { useState, useEffect } from 'react';
import SearchableDropdown from '../common/SearchableDropdown';

const AddMinimumTarif = ({
  id,
  tarifToEdit,
  onSubmit: handleFormSubmit,
}) => {
  const [formData, setFormData] = useState({
    type_expedition: 'groupage_dhd_aerien',
    ville_depart: '',
    ville_arrivee: '',
    montant_base: '',
    pourcentage_prestation: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (tarifToEdit) {
      let ville_depart = '';
      let ville_arrivee = '';
      if (tarifToEdit.ligne && tarifToEdit.ligne.includes('-')) {
        [ville_depart, ville_arrivee] = tarifToEdit.ligne.split('-').map((v) => v.trim());
      }

      setFormData({
        type_expedition: tarifToEdit.type_expedition || 'groupage_dhd_aerien',
        ville_depart,
        ville_arrivee,
        montant_base: tarifToEdit.montant_base ?? '',
        pourcentage_prestation: tarifToEdit.pourcentage_prestation ?? '',
      });
    }
  }, [tarifToEdit]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.ville_depart.trim()) newErrors.ville_depart = 'Ville de départ requise';
    if (!formData.ville_arrivee.trim()) newErrors.ville_arrivee = 'Ville d\'arrivée requise';
    if (formData.montant_base === '' || isNaN(parseFloat(formData.montant_base)) || parseFloat(formData.montant_base) < 0) {
      newErrors.montant_base = 'Montant base requis';
    }
    if (formData.pourcentage_prestation === '' || isNaN(parseFloat(formData.pourcentage_prestation))) {
      newErrors.pourcentage_prestation = 'Pourcentage requis';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    handleFormSubmit({
      type_expedition: formData.type_expedition,
      ligne: `${formData.ville_depart.trim().toLowerCase()}-${formData.ville_arrivee.trim().toLowerCase()}`,
      montant_base: parseFloat(formData.montant_base),
      pourcentage_prestation: parseFloat(formData.pourcentage_prestation),
    });
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(value || 0);

  const calculateTotal = () => {
    const base = parseFloat(formData.montant_base) || 0;
    const pourcentage = parseFloat(formData.pourcentage_prestation) || 0;
    return base + (base * pourcentage) / 100;
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
            1
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Mode d'expédition</h3>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-xl p-2 shadow-sm">
          <SearchableDropdown
            value={formData.type_expedition}
            onChange={(value) => handleInputChange('type_expedition', value)}
            options={[
              { value: 'groupage_dhd_aerien', label: '✈️ DHD Aérien' },
              { value: 'groupage_dhd_maritime', label: '🚢 DHD Maritime' },
            ]}
            placeholder="Sélectionner le mode..."
            themeColor="blue"
          />
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
            2
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Ligne</h3>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ville de départ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.ville_depart}
              onChange={(e) => handleInputChange('ville_depart', e.target.value)}
              className={`w-full px-4 py-2.5 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition duration-150 ${errors.ville_depart ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              placeholder="ex: Abidjan"
            />
            {errors.ville_depart && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><span>⚠️</span> {errors.ville_depart}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ville d'arrivée <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.ville_arrivee}
              onChange={(e) => handleInputChange('ville_arrivee', e.target.value)}
              className={`w-full px-4 py-2.5 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition duration-150 ${errors.ville_arrivee ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              placeholder="ex: Paris"
            />
            {errors.ville_arrivee && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><span>⚠️</span> {errors.ville_arrivee}</p>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
            3
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Tarif minimum</h3>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Montant base (FCFA) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.montant_base}
                  onChange={(e) => handleInputChange('montant_base', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800 ${errors.montant_base ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="13500"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">FCFA</div>
              </div>
              {errors.montant_base && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><span>⚠️</span> {errors.montant_base}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Prestation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.pourcentage_prestation}
                  onChange={(e) => handleInputChange('pourcentage_prestation', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800 ${errors.pourcentage_prestation ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-violet-600">%</div>
              </div>
              {errors.pourcentage_prestation && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><span>⚠️</span> {errors.pourcentage_prestation}</p>
              )}
            </div>
          </div>

          {formData.montant_base !== '' && formData.pourcentage_prestation !== '' && (
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
                  <span>Tarif minimum:</span>
                  <span className="text-emerald-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default AddMinimumTarif;
