// import React, { useState, useEffect } from "react";
// import api from '../services/api';
// import { Loader2, Edit3, Save, XCircle } from "lucide-react";

// const Settings = () => {
//   const [settings, setSettings] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isEditing, setIsEditing] = useState(false);
//   const [formData, setFormData] = useState({});
//   const [message, setMessage] = useState(null);
//   const [error, setError] = useState(null);

//   // Charger les infos du backoffice
//   useEffect(() => {
//     const fetchSettings = async () => {
//       try {
//         const res = await api.get("/backoffice/show");
//         setSettings(res.data.backoffice);
//         setFormData(res.data.backoffice || {});
//       } catch (err) {
//         setError("Impossible de charger les informations du back-office.");
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchSettings();
//   }, []);

//   // Gérer la modification des champs
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // Sauvegarder ou créer la configuration
//   const handleSave = async () => {
//     try {
//       setMessage(null);
//       setError(null);
//       const endpoint = settings ? "/backoffice/setup" : "/backoffice/setup";
//       await api.post(endpoint, formData);
//       setMessage("Paramètres enregistrés avec succès ✅");
//       setSettings(formData);
//       setIsEditing(false);
//     } catch (err) {
//       setError("Erreur lors de la sauvegarde des paramètres.");
//     }
//   };

//   if (isLoading)
//     return (
//       <div className="flex items-center justify-center h-64 text-gray-500">
//         <Loader2 className="animate-spin mr-2" /> Chargement des informations...
//       </div>
//     );

//   return (
//     <div className="bg-white shadow-xl rounded-2xl p-8 max-w-3xl mx-auto mt-10 border border-gray-100">
//       <div className="flex items-center justify-between border-b pb-4 mb-6">
//         <h1 className="text-2xl font-bold text-gray-800">Paramètres du Backoffice</h1>
//         {!isEditing ? (
//           <button
//             onClick={() => setIsEditing(true)}
//             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
//           >
//             <Edit3 size={18} /> Modifier
//           </button>
//         ) : (
//           <button
//             onClick={() => setIsEditing(false)}
//             className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
//           >
//             <XCircle size={18} /> Annuler
//           </button>
//         )}
//       </div>

//       {error && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
//           {error}
//         </div>
//       )}
//       {message && (
//         <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
//           {message}
//         </div>
//       )}

//       {/* Formulaire d’affichage ou d’édition */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {[
//           "nom_organisation",
//           "telephone",
//           "email_contact",
//           "adresse",
//           "ville",
//           "commune",
//           "pays",
//           "site_web",
//           "localisation",
//         ].map((key) => (
//           <div key={key} className="flex flex-col">
//             <label className="text-sm font-medium text-gray-600 capitalize mb-1">
//               {key.replace(/_/g, " ")}
//             </label>
//             {isEditing ? (
//               <input
//                 type="text"
//                 name={key}
//                 value={formData[key] || ""}
//                 onChange={handleChange}
//                 className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
//               />
//             ) : (
//               <p className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-800">
//                 {settings?.[key] || "—"}
//               </p>
//             )}
//           </div>
//         ))}
//       </div>

//       {isEditing && (
//         <div className="flex justify-end mt-6">
//           <button
//             onClick={handleSave}
//             className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
//           >
//             <Save size={18} /> Enregistrer
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Settings;
