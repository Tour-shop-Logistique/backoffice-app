import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../redux/slices/authSlice';
import { Loader2 } from 'lucide-react';

const RegisterForm = ({ onSuccess, switchToLogin }) => {
    const dispatch = useDispatch();
    const { isLoading, error } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        nom: '',
        prenoms: '',
        telephone: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirmation) {
            alert('Les mots de passe ne correspondent pas.');
            return;
        }

        dispatch(register(formData)).then((result) => {
            if (register.fulfilled.match(result)) {
                alert('Inscription réussie ! Connectez-vous.');
                if (onSuccess) onSuccess(); // Ferme la modale ou switch vers Login
                if (switchToLogin) switchToLogin();
            }
        });
    };

    const inputBase = "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm font-medium text-slate-700";
    const labelBase = "block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1";

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <p className="text-sm text-slate-500 font-medium">Rejoignez notre réseau. Complétez les informations pour configurer votre agence.</p>
            </div>

            {error && (
                <div className="p-4 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
                    {error.message || 'Une erreur est survenue lors de la création du compte.'}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-0.5">
                        <label className={labelBase}>Nom</label>
                        <input
                            name="nom"
                            type="text"
                            required
                            value={formData.nom}
                            onChange={handleChange}
                            className={inputBase}
                            placeholder="Ex: Tounkara"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <label className={labelBase}>Prénoms</label>
                        <input
                            name="prenoms"
                            type="text"
                            required
                            value={formData.prenoms}
                            onChange={handleChange}
                            className={inputBase}
                            placeholder="Ex: Amadou"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-0.5">
                        <label className={labelBase}>Téléphone</label>
                        <input
                            name="telephone"
                            type="text"
                            required
                            value={formData.telephone}
                            onChange={handleChange}
                            className={inputBase}
                            placeholder="6XX XX XX XX"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <label className={labelBase}>Email Professionnel</label>
                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className={inputBase}
                            placeholder="agence@exemple.com"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                    <div className="space-y-0.5">
                        <label className={labelBase}>Mot de passe</label>
                        <input
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className={inputBase}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <label className={labelBase}>Confirmation</label>
                        <input
                            name="password_confirmation"
                            type="password"
                            required
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            className={inputBase}
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest mt-4"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Traitement en cours...</span>
                        </>
                    ) : (
                        'Créer le compte agence'
                    )}
                </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs font-medium text-slate-500">
                    Déjà membre du réseau ?{' '}
                    <button
                        onClick={switchToLogin}
                        className="text-slate-900 font-bold hover:underline focus:outline-none"
                    >
                        Se connecter au portail
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;
