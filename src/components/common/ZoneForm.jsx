import React, { useState, useEffect } from 'react';

const ZoneForm = ({ onSubmit, onCancel, isLoading, initialData }) => {
  const [formData, setFormData] = useState({
    id: '',
    nom: '',
    pays: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        nom: initialData.nom || '',
        pays: Array.isArray(initialData.pays) ? initialData.pays.join(', ') : '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const paysArray = formData.pays.split(',').map(p => p.trim());
    onSubmit({ ...formData, pays: paysArray });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="id" className="block text-sm font-medium text-gray-700">ID de la Zone</label>
        <input
          id="id"
          name="id"
          type="text"
          value={formData.id}
          onChange={handleChange}
          className="w-full px-3 py-2 mt-1 border rounded-md"
          required
        />
      </div>
      <div>
        <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom de la Zone</label>
        <input
          id="nom"
          name="nom"
          type="text"
          value={formData.nom}
          onChange={handleChange}
          className="w-full px-3 py-2 mt-1 border rounded-md"
          required
        />
      </div>
      <div>
        <label htmlFor="pays" className="block text-sm font-medium text-gray-700">Pays (séparés par des virgules)</label>
        <input
          id="pays"
          name="pays"
          type="text"
          value={formData.pays}
          onChange={handleChange}
          className="w-full px-3 py-2 mt-1 border rounded-md"
          required
        />
      </div>
      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
          Annuler
        </button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50" disabled={isLoading}>
          {isLoading ? (initialData ? 'Modification...' : 'Ajout...') : (initialData ? 'Modifier' : 'Ajouter')}
        </button>
      </div>
    </form>
  );
};

export default ZoneForm;
