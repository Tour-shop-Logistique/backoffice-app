import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchZones } from '../../redux/slices/zoneSlice';

const SimpleTarifForm = ({ onSubmit, onCancel, isLoading, initialData }) => {
  const dispatch = useDispatch();
  const { zones } = useSelector(state => state.zones);

  const [formData, setFormData] = useState({
    indice: '',
    prix_zones: [
      { zone_destination_id: '', montant_base: '', pourcentage_prestation: '', montant_prestation: '0.00', montant_expedition: '0.00' },
    ],
  });

  useEffect(() => {
    dispatch(fetchZones());

   if (initialData) {
  setFormData({
    ...initialData,
    prix_zones: initialData.prix_zones.map(pz => {
      const mb = parseFloat(pz.montant_base) || 0;
      const pp = parseFloat(pz.pourcentage_prestation) || 0;
      const mp = mb * (pp / 100);
      const me = mb + mp;
      return {
        ...pz,
        montant_base: mb,
        pourcentage_prestation: pp,
        montant_prestation: mp.toFixed(2),
        montant_expedition: me.toFixed(2)
      };
    })
  });
}

  }, [dispatch, initialData]);

  const handlePrixZoneChange = (index, field, value) => {
    const newPrixZones = [...formData.prix_zones];
    newPrixZones[index][field] = value;

    // recalcul automatique
const mb = parseFloat(newPrixZones[index].montant_base) || 0;
const pp = parseFloat(newPrixZones[index].pourcentage_prestation) || 0;
newPrixZones[index].montant_prestation = (mb * (pp / 100)).toString();
newPrixZones[index].montant_expedition = (mb + mb * (pp / 100)).toString();


    setFormData({ ...formData, prix_zones: newPrixZones });
  };

  const handleAddPrixZone = () => {
    setFormData({
      ...formData,
      prix_zones: [
        ...formData.prix_zones,
        { zone_destination_id: '', montant_base: '', pourcentage_prestation: '', montant_prestation: '0.00', montant_expedition: '0.00' },
      ],
    });
  };

  const handleRemovePrixZone = (index) => {
    const newPrixZones = formData.prix_zones.filter((_, i) => i !== index);
    setFormData({ ...formData, prix_zones: newPrixZones });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      indice: Number(formData.indice),
      mode_expedition: 'simple',
      prix_zones: formData.prix_zones.map(pz => ({
        zone_destination_id: pz.zone_destination_id,
        montant_base: Number(pz.montant_base),
        pourcentage_prestation: Number(pz.pourcentage_prestation),
      })),
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Indice</label>
      <input
  type="number"
  value={formData.indice}
  onChange={e => setFormData({ ...formData, indice: e.target.value })}
  step="0.5"           // autorise les demi-pas
  min="0"
  className="w-full px-3 py-2 mt-1 border rounded-md"
  required
/>
      </div>

      <h3 className="text-lg font-medium text-gray-800">Prix par Zone</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant Base</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">% Prestation</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant Prestation</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant Expédition</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {formData.prix_zones.map((pz, index) => (
              <tr key={index}>
                <td className="px-4 py-2">
                  <select
                    value={pz.zone_destination_id}
                    onChange={e => handlePrixZoneChange(index, 'zone_destination_id', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {zones.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.nom}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                 <input
  type="number"
  value={pz.montant_base}
  onChange={e => handlePrixZoneChange(index, 'montant_base', e.target.value)}
  placeholder="0.00"
  min="0"
  className="w-full px-3 py-2 border rounded-md"
/>
                </td>
                <td className="px-4 py-2">
                  <input
  type="number"
  value={pz.pourcentage_prestation}
  onChange={e => handlePrixZoneChange(index, 'pourcentage_prestation', e.target.value)}
  placeholder="0"
  min="0"
  className="w-full px-3 py-2 border rounded-md"
/>
                </td>
                <td className="px-4 py-2">
                  <input type="text" value={pz.montant_prestation} readOnly className="w-full px-3 py-2 bg-gray-100 border rounded-md" />
                </td>
                <td className="px-4 py-2">
                  <input type="text" value={pz.montant_expedition} readOnly className="w-full px-3 py-2 bg-gray-100 border rounded-md" />
                </td>
                <td className="px-4 py-2">
                  {formData.prix_zones.length > 1 && (
                    <button type="button" onClick={() => handleRemovePrixZone(index)} className="text-red-500">-</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={handleAddPrixZone} className="text-indigo-600">+ Ajouter une zone de prix</button>

      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50" disabled={isLoading}>
          {isLoading ? (initialData ? 'Modification...' : 'Ajout...') : (initialData ? 'Modifier' : 'Ajouter')}
        </button>
      </div>
    </form>
  );
};

export default SimpleTarifForm;
