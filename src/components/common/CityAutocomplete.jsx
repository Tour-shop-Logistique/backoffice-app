import React, { useState, useEffect, useRef } from 'react';
import SearchableDropdown from './SearchableDropdown';
import { fetchCitiesForCountry } from '../../services/citiesApi';

/**
 * Saisie de ville assistée par l'API countries.dev, filtrée par pays
 * (countryCode). Bascule automatiquement en champ texte libre si l'API ne
 * répond pas ou ne renvoie aucun résultat - jamais bloquant pour l'utilisateur.
 */
const CityAutocomplete = ({ countryCode, value, onChange, error, placeholder = 'ex: Madrid' }) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!countryCode) {
      setCities([]);
      setApiFailed(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setApiFailed(false);

    fetchCitiesForCountry(countryCode).then((result) => {
      // Ignore une réponse tardive si le pays a changé entre-temps.
      if (requestIdRef.current !== requestId) return;
      setLoading(false);
      setCities(result);
      setApiFailed(result.length === 0);
    });
  }, [countryCode]);

  if (!countryCode || apiFailed) {
    return (
      <div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition duration-150 ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
        />
        {apiFailed && (
          <p className="text-[10px] text-slate-400 mt-1">Suggestions indisponibles, saisie libre</p>
        )}
      </div>
    );
  }

  return (
    <SearchableDropdown
      value={value}
      onChange={onChange}
      options={cities}
      placeholder={loading ? 'Chargement des villes...' : placeholder}
      error={error}
      themeColor="emerald"
    />
  );
};

export default CityAutocomplete;
