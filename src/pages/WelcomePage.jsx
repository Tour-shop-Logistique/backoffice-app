import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import EmailVerificationForm from '../components/auth/EmailVerificationForm';

import logo from '../assets/logo_transparent.png';
import background from '../assets/background1.png';

const viewCopy = {
  login: {
    title: 'Connexion',
    subtitle: 'Accédez à votre espace backoffice.',
  },
  register: {
    title: 'Créer un compte',
    subtitle: 'Configurez votre accès backoffice.',
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <img
        src={background}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-950/50 to-slate-900/50" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_760px]">
        <section className="flex min-h-[38vh] flex-col justify-between px-6 py-8 sm:px-10 lg:min-h-screen lg:px-16 lg:py-12">
          <img
            src={logo}
            alt="Tour Shop"
            className="h-16 w-fit hidden lg:block object-contain drop-shadow-lg"
          />

          <div className="max-w-2xl pb-6 lg:pb-20">
            <h1 className="max-w-3xl text-5xl font-bold tracking-normal leading-[3.5rem] text-white drop-shadow-2xl sm:text-6xl xl:text-7xl">
              Pilotez vos<br />
              <span className="text-blue-400">Opérations.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-xl font-medium leading-8 text-white">
              Le centre de commande local pour la gestion des expéditions de votre pays, la supervision de votre réseau d'agences et l'optimisation des flux régionaux.
            </p>
          </div>

          <p className="hidden text-sm font-medium text-white/80 lg:block">
            &copy; {new Date().getFullYear()} Tour Shop. Tous droits réservés.
          </p>
        </section>

        <section className="flex items-center justify-start px-5 pb-8 pt-0 lg:min-h-screen lg:py-10 lg:pl-4 lg:pr-16">
          <div className="w-full max-w-[640px] rounded-[1.35rem] border border-white/35 bg-white/70 px-8 py-8 text-slate-950 shadow-2xl shadow-black/30 backdrop-blur-md sm:px-10">
            <div className="mb-7 lg:hidden flex justify-center">
              <img
                src={logo}
                alt="Tour Shop"
                className="h-14 w-auto object-contain"
              />
            </div>

            <div className="mb-7 text-center">
              <h2 className="text-xl font-bold uppercase tracking-wide text-slate-950">
                {viewCopy[activeView].title}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {viewCopy[activeView].subtitle}
              </p>
            </div>

            <div className="relative mb-4 flex items-center gap-4 text-xs font-medium text-slate-500">
              <div className="h-px flex-1 bg-slate-400/60" />
            </div>

            <div className="pr-1 [&_label]:text-slate-700 [&_label]:font-medium [&_label]:tracking-normal [&_label]:normal-case [&_input]:rounded-md [&_input]:border-white/80 [&_input]:bg-white/95 [&_input]:shadow-sm [&_button[type='submit']]:rounded-md [&_button[type='submit']]:bg-emerald-600 [&_button[type='submit']]:font-medium [&_button[type='submit']]:shadow-none [&_button[type='submit']:hover]:bg-emerald-700">
              {activeView === 'login' && (
                <LoginForm
                  onSuccess={() => { }}
                  switchToRegister={() => setActiveView('register')}
                  switchToForgotPassword={() => setActiveView('forgot')}
                />
              )}

              {activeView === 'register' && (
                <RegisterForm
                  onSuccess={() => { }}
                  onVerificationRequired={(email) => {
                    setVerificationEmail(email);
                    setActiveView('verify-email');
                  }}
                  switchToLogin={() => setActiveView('login')}
                />
              )}

              {activeView === 'forgot' && (
                <ForgotPasswordForm onClose={() => setActiveView('login')} />
              )}

              {activeView === 'verify-email' && (
                <EmailVerificationForm
                  email={verificationEmail}
                  onSuccess={() => setActiveView('login')}
                  onBack={() => setActiveView('register')}
                />
              )}
            </div>

            <div className="mt-5 flex flex-col items-center justify-center gap-1 text-center text-sm font-normal text-slate-700 sm:flex-row sm:gap-2">
              {activeView === 'login' && (
                <>
                  <span>Pas encore de compte ?</span>
                  <button
                    type="button"
                    onClick={() => setActiveView('register')}
                    className="font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Créer un compte
                  </button>
                </>
              )}

              {activeView !== 'login' && (
                <button
                  type="button"
                  onClick={() => setActiveView('login')}
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Retour à la connexion
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default WelcomePage;
