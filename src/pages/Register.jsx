import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../redux/slices/authSlice';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }
    dispatch(register(formData)).then((result) => {
      if (register.fulfilled.match(result)) {
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        navigate('/login');
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 py-12">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Inscription</h2>
        {error && <div className="text-red-500 text-center">{error.message || 'Une erreur est survenue'}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nom" className="text-sm font-medium text-gray-700">Nom</label>
              <input id="nom" name="nom" type="text" value={formData.nom} onChange={handleChange} required className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
            <div>
              <label htmlFor="prenoms" className="text-sm font-medium text-gray-700">Prénoms</label>
              <input id="prenoms" name="prenoms" type="text" value={formData.prenoms} onChange={handleChange} required className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
            <div>
              <label htmlFor="telephone" className="text-sm font-medium text-gray-700">Téléphone</label>
              <input id="telephone" name="telephone" type="text" value={formData.telephone} onChange={handleChange} required className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">Confirmation du mot de passe</label>
              <div className="relative mt-1">
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <button type="submit" className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md disabled:opacity-50" disabled={isLoading}>
            {isLoading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
