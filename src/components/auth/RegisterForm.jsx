import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../redux/slices/authSlice';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const RegisterForm = ({ onSuccess, onVerificationRequired, switchToLogin }) => {
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                if (onSuccess) onSuccess();
                if (onVerificationRequired) {
                    onVerificationRequired(formData.email);
                } else if (switchToLogin) {
                    switchToLogin();
                }
            }
        });
    };

    const inputBase = "w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 text-base font-medium text-slate-700";
    const labelBase = "block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1";

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
                    {error.message || 'Une erreur est survenue lors de la création du compte.'}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-0.5">
                    <label className={labelBase}>Nom Complet</label>
                    <input
                        name="nom"
                        type="text"
                        required
                        value={formData.nom}
                        onChange={handleChange}
                        className={inputBase}
                        placeholder="Ex: Amadou Tounkara"
                    />
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
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className={`${inputBase} pr-10`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <label className={labelBase}>Confirmation</label>
                        <div className="relative">
                            <input
                                name="password_confirmation"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                className={`${inputBase} pr-10`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest mt-4"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Traitement en cours...</span>
                        </>
                    ) : (
                        'Créer le compte agence'
                    )}
                </button>
            </form>
        </div>
    );
};

export default RegisterForm;
