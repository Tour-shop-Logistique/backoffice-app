import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../redux/slices/authSlice';
import { Loader2, Eye, EyeOff, Phone, Lock } from 'lucide-react';
import { ROUTES } from '../../routes';

const LoginForm = ({ onSuccess, switchToRegister, switchToForgotPassword }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        telephone: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    // Redirection automatique si authentifié
    useEffect(() => {
        if (isAuthenticated) {
            if (onSuccess) onSuccess(); // Fermer la modale
            navigate(ROUTES.DASHBOARD);
        }
    }, [isAuthenticated, navigate, onSuccess]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(login(formData));
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
                    {error.message || 'Identifiants invalides ou erreur serveur.'}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">
                        Numéro de téléphone
                    </label>
                    <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Phone className="w-5 h-5" />
                        </span>
                        <input
                            name="telephone"
                            type="text"
                            required
                            value={formData.telephone}
                            onChange={handleChange}
                            className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 text-base font-medium text-slate-700"
                            placeholder="Ex: 0102030405"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                            Mot de passe
                        </label>
                        <button
                            id="login-forgot-password-btn"
                            type="button"
                            onClick={switchToForgotPassword}
                            className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                        >
                            Oublié ?
                        </button>
                    </div>
                    <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock className="w-5 h-5" />
                        </span>
                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full pl-14 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 text-base font-medium text-slate-700"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Authentification...</span>
                        </>
                    ) : (
                        'Ouvrir la session'
                    )}
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
