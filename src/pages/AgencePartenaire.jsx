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
        console.log("Chargement des agences...");
      const response = await api.get("/agence/list");
      console.log("Reponse : ", response);
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
    <div className=" bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Agences Partenaires
      </h1>

      {isLoading && <p className="text-gray-500">Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agences.map((agence) => (
            <div
              key={agence.id}
              onClick={() => setSelectedAgence(agence)}
              className="cursor-pointer bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {agence.nom_agence}
              </h2>
              <p className="text-sm text-gray-600">{agence.ville}</p>
              <p className="text-xs text-gray-500">{agence.adresse}</p>
              <div className="mt-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    agence.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {agence.actif ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {selectedAgence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setSelectedAgence(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {selectedAgence.nom_agence}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedAgence.description}
            </p>

            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <strong>Adresse :</strong> {selectedAgence.adresse}
              </p>
              <p>
                <strong>Ville :</strong> {selectedAgence.ville} (
                {selectedAgence.commune})
              </p>
              <p>
                <strong>Téléphone :</strong> {selectedAgence.telephone}
              </p>
              <p>
                <strong>Pays :</strong> {selectedAgence.pays}
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-md font-semibold text-gray-800 mb-1">
                Horaires :
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                {selectedAgence.horaires.map((h, index) => (
                  <li key={index}>
                    <span className="font-medium capitalize">{h.jour}</span> :{" "}
                    {h.ferme
                      ? "Fermé"
                      : `${h.ouverture} - ${h.fermeture}`}
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
