import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';

const LivreurForm = ({ id = "livreur-form", onSubmit, initialData }) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    nom: '',
    prenoms: '',
    telephone: '',
    email: '',
    password: '',
    password_confirmation: '',
    permis_de_conduire: '',
    type_vehicule: 'moto',
    numero_vehicule: '',
    zone_de_livraison_km: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        nom: initialData.user?.nom || '',
        prenoms: initialData.user?.prenoms || '',
        telephone: initialData.user?.telephone || '',
        email: initialData.user?.email || '',
        password: '',
        password_confirmation: '',
        permis_de_conduire: initialData.permis_de_conduire || '',
        type_vehicule: initialData.type_vehicule || 'moto',
        numero_vehicule: initialData.numero_vehicule || '',
        zone_de_livraison_km: initialData.zone_de_livraison_km ?? '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (passwordError) setPasswordError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // La création d'un livreur crée aussi son compte User (voir
    // LivreurController::add() côté backend) - le mot de passe n'est donc
    // requis/modifiable qu'à la création, jamais en édition (le profil
    // véhicule seul est éditable ensuite).
    if (!isEditing) {
      if (!formData.password) {
        setPasswordError('Le mot de passe est requis pour un nouveau livreur.');
        return;
      }
      if (formData.password !== formData.password_confirmation) {
        setPasswordError('Les mots de passe ne correspondent pas.');
        return;
      }
    }

    if (isEditing) {
      onSubmit({
        permis_de_conduire: formData.permis_de_conduire || null,
        type_vehicule: formData.type_vehicule,
        numero_vehicule: formData.numero_vehicule || null,
        zone_de_livraison_km: formData.zone_de_livraison_km === '' ? null : parseFloat(formData.zone_de_livraison_km),
      });
    } else {
      onSubmit({
        nom: formData.nom,
        prenoms: formData.prenoms,
        telephone: formData.telephone,
        email: formData.email || null,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        permis_de_conduire: formData.permis_de_conduire || null,
        type_vehicule: formData.type_vehicule,
        numero_vehicule: formData.numero_vehicule || null,
        zone_de_livraison_km: formData.zone_de_livraison_km === '' ? null : parseFloat(formData.zone_de_livraison_km),
      });
    }
  };

  const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Nom</label>
              <input
                type="text" name="nom" value={formData.nom} onChange={handleChange}
                placeholder="Kouassi" className={inputClasses} required
              />
            </div>
            <div>
              <label className={labelClasses}>Prénoms</label>
              <input
                type="text" name="prenoms" value={formData.prenoms} onChange={handleChange}
                placeholder="Jean" className={inputClasses} required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Téléphone</label>
              <input
                type="tel" name="telephone" value={formData.telephone} onChange={handleChange}
                placeholder="0700000000" className={inputClasses} required
              />
            </div>
            <div>
              <label className={labelClasses}>Email (optionnel)</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="livreur@exemple.com" className={inputClasses}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClasses}>Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} name="password" value={formData.password}
                  onChange={handleChange} placeholder="••••••••" className={`${inputClasses} pr-10`} required
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Confirmation</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"} name="password_confirmation" value={formData.password_confirmation}
                  onChange={handleChange} placeholder="••••••••" className={`${inputClasses} pr-10`} required
                />
                <button
                  type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          {passwordError && (
            <p className="text-xs font-semibold text-red-600 ml-1">{passwordError}</p>
          )}
        </>
      )}

      {isEditing && (
        <div className="px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg flex gap-2.5 items-center text-blue-700 text-xs font-medium">
          <Shield size={14} className="shrink-0 text-blue-500" />
          <p>Nom, téléphone et mot de passe ne sont pas modifiables ici — seul le profil véhicule l'est.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Type de véhicule</label>
          <select
            name="type_vehicule" value={formData.type_vehicule} onChange={handleChange}
            className={inputClasses} required
          >
            <option value="moto">Moto</option>
            <option value="voiture">Voiture</option>
          </select>
        </div>
        <div>
          <label className={labelClasses}>Numéro du véhicule (optionnel)</label>
          <input
            type="text" name="numero_vehicule" value={formData.numero_vehicule} onChange={handleChange}
            placeholder="Ex: 1234-AB-01" className={inputClasses}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Permis de conduire (optionnel)</label>
          <input
            type="text" name="permis_de_conduire" value={formData.permis_de_conduire} onChange={handleChange}
            placeholder="Numéro de permis" className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Zone de livraison (km, optionnel)</label>
          <input
            type="number" min="0" name="zone_de_livraison_km" value={formData.zone_de_livraison_km} onChange={handleChange}
            placeholder="Ex: 10" className={inputClasses}
          />
        </div>
      </div>
    </form>
  );
};

export default LivreurForm;
