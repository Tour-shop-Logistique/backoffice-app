import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../redux/slices/authSlice';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '../../routes';

const LoginForm = ({ onSuccess, switchToRegister }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        telephone: '',
        password: '',
    });

    // Redirection automatique si authentifié
    useEffect(() => {
        if (isAuthenticated) {
            if (onSuccess) onSuccess(); // Fermer la modale
            navigate(ROUTES.APP + '/' + ROUTES.DASHBOARD);
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
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                    {error.message || 'Erreur de connexion'}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                    </label>
                    <input
                        name="telephone"
                        type="text"
                        required
                        value={formData.telephone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: 0102030405"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe
                    </label>
                    <input
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Connexion...</span>
                        </>
                    ) : (
                        'Se connecter'
                    )}
                </button>
            </form>

            <div className="text-center text-sm text-gray-500">
                Pas encore de compte ?{' '}
                <button
                    onClick={switchToRegister}
                    className="text-blue-600 font-medium hover:underline focus:outline-none"
                >
                    Créer un compte
                </button>
            </div>
        </div>
    );
};

export default LoginForm;
