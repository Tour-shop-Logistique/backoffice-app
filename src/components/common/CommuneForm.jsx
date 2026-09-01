import React, { useState, useEffect } from 'react';

const CommuneForm = ({ id = "commune-form", onSubmit, initialData }) => {
  const [nom, setNom] = useState('');

  useEffect(() => {
    if (initialData) {
      setNom(initialData.nom || '');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ nom });
  };

  const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClasses}>Nom de la commune</label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex: Abidjan, Plateau ou Bouaké"
          className={inputClasses}
          required
        />
      </div>
    </form>
  );
};

export default CommuneForm;
