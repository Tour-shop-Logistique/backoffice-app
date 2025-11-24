import React, { useState, useEffect } from "react";
import api from "../services/api";

const AgencePartenaire = () => {
  const [agences, setAgences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAgence, setSelectedAgence] = useState(null);

  useEffect(() => {
    const fetchAgences = async () => {
      try {
        const response = await api.get("/agence/list");
        if (response.data?.success) {
          setAgences(response.data.agences);
        } else {
          throw new Error("Impossible de charger les agences");
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgences();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Agences Partenaires</h1>

      {isLoading && <p className="text-gray-500">Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-200 text-gray-700 text-sm uppercase sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left">Nom</th>
                <th className="px-6 py-3 text-left">Ville</th>
                <th className="px-6 py-3 text-left">Adresse</th>
                <th className="px-6 py-3 text-left">Téléphone</th>
                <th className="px-6 py-3 text-left">Statut</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>

            <tbody>
              {agences.map((agence) => (
                <tr
                  key={agence.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">{agence.nom_agence}</td>
                  <td className="px-6 py-4">{agence.ville}</td>
                  <td className="px-6 py-4">{agence.adresse}</td>
                  <td className="px-6 py-4">{agence.telephone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        agence.actif
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {agence.actif ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedAgence(agence)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Voir détails →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {selectedAgence && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
            <button
              onClick={() => setSelectedAgence(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedAgence.nom_agence}
            </h2>
            <p className="text-gray-600 mb-4">{selectedAgence.description}</p>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Adresse :</strong> {selectedAgence.adresse}
              </p>
              <p>
                <strong>Ville :</strong> {selectedAgence.ville} ({selectedAgence.commune})
              </p>
              <p>
                <strong>Téléphone :</strong> {selectedAgence.telephone}
              </p>
              <p>
                <strong>Pays :</strong> {selectedAgence.pays}
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-md font-semibold text-gray-800 mb-2">Horaires</h3>
              <ul className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                {selectedAgence.horaires.map((h, index) => (
                  <li key={index} className="text-gray-700 text-sm">
                    <span className="font-medium capitalize">{h.jour}</span> :{" "}
                    {h.ferme ? "Fermé" : `${h.ouverture} - ${h.fermeture}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencePartenaire;
