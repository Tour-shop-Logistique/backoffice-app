import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchZones } from '../../redux/slices/zoneSlice';

const SimpleTarifForm = ({ onSubmit, onCancel, isLoading, initialData }) => {
  const dispatch = useDispatch();
  const { zones } = useSelector((state) => state.zones);
  const [formData, setFormData] = useState({
    indice: '',
    prix_zones: [{ zone_destination_id: '', montant_base: '', pourcentage_prestation: '', montant_prestation: 0, montant_expedition: 0 }],
  });

  useEffect(() => {
    dispatch(fetchZones());
    if (initialData) {
      setFormData({
        ...initialData,
        prix_zones: initialData.prix_zones.map(pz => ({
          ...pz,
          montant_prestation: (pz.montant_base * (pz.pourcentage_prestation / 100)).toFixed(2),
          montant_expedition: (pz.montant_base * (1 + pz.pourcentage_prestation / 100)).toFixed(2),
        }))
      });
    }
  }, [dispatch, initialData]);

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    if (name.includes('zone_destination_id')) {
        const newPrixZones = [...formData.prix_zones];
        newPrixZones[index].zone_destination_id = value;
        setFormData({ ...formData, prix_zones: newPrixZones });
    } else if (name.includes('montant_base') || name.includes('pourcentage_prestation')) {
        const newPrixZones = [...formData.prix_zones];
        const field = name.split('.')[2];
        newPrixZones[index][field] = value;

        const mb = parseFloat(newPrixZones[index].montant_base) || 0;
        const pp = parseFloat(newPrixZones[index].pourcentage_prestation) || 0;
        const mp = mb * (pp / 100);
        const me = mb + mp;

        newPrixZones[index].montant_prestation = mp.toFixed(2);
        newPrixZones[index].montant_expedition = me.toFixed(2);

        setFormData({ ...formData, prix_zones: newPrixZones });
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddPrixZone = () => {
    setFormData({
      ...formData,
      prix_zones: [...formData.prix_zones, { zone_destination_id: '', montant_base: '', pourcentage_prestation: '', montant_prestation: 0, montant_expedition: 0 }],
    });
  };

  const handleRemovePrixZone = (index) => {
    const prixZones = [...formData.prix_zones];
    prixZones.splice(index, 1);
    setFormData({ ...formData, prix_zones: prixZones });
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
      }))
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="indice" className="block text-sm font-medium text-gray-700">Indice</label>
        <input id="indice" name="indice" type="number" value={formData.indice} onChange={handleChange} className="w-full px-3 py-2 mt-1 border rounded-md" required />
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
                  <select name={`prix_zones[${index}].zone_destination_id`} value={pz.zone_destination_id} onChange={(e) => handleChange(e, index)} className="w-full px-3 py-2 border rounded-md" required>
                    <option value="">Sélectionner</option>
                    {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.nom}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2"><input name={`prix_zones[${index}].montant_base`} type="number" placeholder="0.00" value={pz.montant_base} onChange={(e) => handleChange(e, index)} className="w-full px-3 py-2 border rounded-md" required /></td>
                <td className="px-4 py-2"><input name={`prix_zones[${index}].pourcentage_prestation`} type="number" placeholder="0" value={pz.pourcentage_prestation} onChange={(e) => handleChange(e, index)} className="w-full px-3 py-2 border rounded-md" required /></td>
                <td className="px-4 py-2"><input type="text" value={pz.montant_prestation} className="w-full px-3 py-2 bg-gray-100 border rounded-md" readOnly /></td>
                <td className="px-4 py-2"><input type="text" value={pz.montant_expedition} className="w-full px-3 py-2 bg-gray-100 border rounded-md" readOnly /></td>
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

      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50" disabled={isLoading}>
          {isLoading ? (initialData ? 'Modification...' : 'Ajout...') : (initialData ? 'Modifier' : 'Ajouter')}
        </button>
      </div>
    </form>
  );
};

export default SimpleTarifForm;
