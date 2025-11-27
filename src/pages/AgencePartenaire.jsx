import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
  MapPin, 
  Phone, 
  Clock, 
  Building2, 
  X, 
  CheckCircle2, 
  XCircle,
  Search,
  Filter,
  Loader2
} from "lucide-react";

const AgencePartenaire = () => {
  const [agences, setAgences] = useState([]);
  const [filteredAgences, setFilteredAgences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAgence, setSelectedAgence] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchAgences = async () => {
      try {
        const response = await api.get("/agence/list");
        if (response.data?.success) {
          setAgences(response.data.agences);
          setFilteredAgences(response.data.agences);
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

  useEffect(() => {
    let result = agences;

    // Filtrer par recherche
    if (searchTerm) {
      result = result.filter(
        (agence) =>
          agence.nom_agence.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agence.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agence.adresse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par statut
    if (filterStatus !== "all") {
      result = result.filter((agence) =>
        filterStatus === "active" ? agence.actif : !agence.actif
      );
    }

    setFilteredAgences(result);
  }, [searchTerm, filterStatus, agences]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Agences Partenaires
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gérez et consultez vos agences partenaires
            </p>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, ville ou adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filtre statut */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-8 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-800">{agences.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Actives</p>
              <p className="text-2xl font-bold text-green-600">
                {agences.filter((a) => a.actif).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Inactives</p>
              <p className="text-2xl font-bold text-red-600">
                {agences.filter((a) => !a.actif).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500">Chargement des agences...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAgences.map((agence) => (
            <div
              key={agence.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden group cursor-pointer"
              onClick={() => setSelectedAgence(agence)}
            >
              {/* Header de la carte */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {agence.nom_agence}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center space-x-1 ${
                      agence.actif
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {agence.actif ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    <span>{agence.actif ? "Active" : "Inactive"}</span>
                  </span>
                </div>
                {agence.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {agence.description}
                  </p>
                )}
              </div>

              {/* Contenu de la carte */}
              <div className="p-5 space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 font-medium">
                      {agence.ville}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {agence.adresse}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{agence.telephone}</p>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <button className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    Voir les détails →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && filteredAgences.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Aucune agence trouvée
          </h3>
          <p className="text-gray-500">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      )}

      {/* MODAL */}
      {selectedAgence && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header du modal */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white relative">
              <button
                onClick={() => setSelectedAgence(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold mb-1">
                    {selectedAgence.nom_agence}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedAgence.actif
                          ? "bg-green-400/30 text-white"
                          : "bg-red-400/30 text-white"
                      }`}
                    >
                      {selectedAgence.actif ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {selectedAgence.description && (
                <p className="mt-4 text-white/90 text-sm">
                  {selectedAgence.description}
                </p>
              )}
            </div>

            {/* Contenu du modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Informations */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Adresse</p>
                    <p className="text-gray-800 font-medium">
                      {selectedAgence.adresse}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedAgence.ville} • {selectedAgence.commune}
                    </p>
                    <p className="text-sm text-gray-500">{selectedAgence.pays}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                    <p className="text-gray-800 font-medium">
                      {selectedAgence.telephone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Horaires */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Horaires d'ouverture
                  </h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {selectedAgence.horaires.map((h, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                    >
                      <span className="text-sm font-medium text-gray-700 capitalize min-w-[100px]">
                        {h.jour}
                      </span>
                      <span
                        className={`text-sm ${
                          h.ferme
                            ? "text-red-600 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {h.ferme ? "Fermé" : `${h.ouverture} - ${h.fermeture}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencePartenaire;