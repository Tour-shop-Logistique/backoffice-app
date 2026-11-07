import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import EmailVerificationForm from '../components/auth/EmailVerificationForm';

const viewCopy = {
  login: {
    title: 'Connexion',
    subtitle: 'Accédez à votre espace backoffice.',
  },
  forgot: {
    title: 'Mot de passe oublié',
    subtitle: 'Recevez un code pour réinitialiser votre mot de passe.',
  },
  'verify-email': {
    title: 'Vérification e-mail',
    subtitle: 'Saisissez le code reçu par email pour activer votre compte.',
  },
};

const WelcomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [activeView, setActiveView] = useState('login');
  const [verificationEmail, setVerificationEmail] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

  const aside = (
    <>
      <h1 className="text-4xl font-bold leading-tight">
        Pilotez vos<br />
        <span className="text-emerald-400">opérations.</span>
      </h1>
      <p className="mt-4 max-w-sm text-white/70">
        Expéditions du pays, réseau d'agences et flux régionaux, depuis un seul centre de commande.
      </p>
    </>
  );

  return (
    <AuthLayout aside={aside}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900">{viewCopy[activeView].title}</h2>
        <p className="mt-1 mb-6 text-sm text-slate-500">{viewCopy[activeView].subtitle}</p>

        <div className="[&_button[type='submit']]:bg-emerald-600 [&_button[type='submit']:hover]:bg-emerald-700">
          {activeView === 'login' && (
            <LoginForm
              onSuccess={() => { }}
              switchToRegister={() => navigate('/inscription')}
              switchToForgotPassword={() => setActiveView('forgot')}
              onVerificationRequired={(email) => {
                setVerificationEmail(email);
                setActiveView('verify-email');
              }}
            />
          )}

          {activeView === 'forgot' && (
            <ForgotPasswordForm onClose={() => setActiveView('login')} />
          )}

          {activeView === 'verify-email' && (
            <EmailVerificationForm
              email={verificationEmail}
              onSuccess={() => setActiveView('login')}
              onBack={() => setActiveView('login')}
            />
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        {activeView === 'login' ? (
          <>
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="font-medium text-emerald-700 hover:text-emerald-800">
              Créer un backoffice
            </Link>
          </>
        ) : (
          <button type="button" onClick={() => setActiveView('login')} className="font-medium text-emerald-700 hover:text-emerald-800">
            Retour à la connexion
          </button>
        )}
      </p>
    </AuthLayout>
  );
};

export default WelcomePage;
