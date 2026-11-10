import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../redux/slices/authSlice';
import { Loader2, Eye, EyeOff, User, Lock } from 'lucide-react';
import { ROUTES } from '../../routes';

const INPUT = 'w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors';
const LABEL = 'block text-sm font-medium text-slate-700 mb-1.5';

const LoginForm = ({ onSuccess, switchToRegister, switchToForgotPassword, onVerificationRequired }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            if (onSuccess) onSuccess();
            navigate(ROUTES.DASHBOARD);
        }
    }, [isAuthenticated, navigate, onSuccess]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        const identifier = formData.identifier.trim();
        const credentials = identifier.includes('@')
            ? { email: identifier, password: formData.password }
            : { telephone: identifier, password: formData.password };

        dispatch(login(credentials)).then((action) => {
            if (action.type === login.rejected.type && action.payload?.code === 'EMAIL_NOT_VERIFIED' && onVerificationRequired) {
                onVerificationRequired(action.payload.email);
            }
        });
    };

    return (
        <div className="space-y-5">
            {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                    {error.message || 'Identifiants invalides ou erreur serveur.'}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={LABEL}>Email ou numéro de téléphone</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <User className="w-4 h-4" />
                        </span>
                        <input
                            name="identifier"
                            type="text"
                            required
                            value={formData.identifier}
                            onChange={handleChange}
                            className={INPUT}
                            placeholder="Email ou téléphone"
                        />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Téléphone sans indicatif, ex : 0575081162</p>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                        <button
                            type="button"
                            onClick={switchToForgotPassword}
                            className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                        >
                            Oublié ?
                        </button>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock className="w-4 h-4" />
                        </span>
                        <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className={`${INPUT} pr-11`}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Masquer' : 'Afficher'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Connexion…</span></> : 'Ouvrir la session'}
                </button>
            </form>

        </div>
    );
};

export default LoginForm;
