import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import EmailVerificationForm from '../components/auth/EmailVerificationForm';

import logo from '../assets/logo_transparent.png';
import background from '../assets/background1.jpg';

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

  const showAuthTabs = !['forgot', 'verify-email'].includes(activeView);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <img
        src={background}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/25 to-slate-950/35" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_520px]">
        <section className="flex min-h-[38vh] flex-col justify-between px-6 py-8 sm:px-10 lg:min-h-screen lg:px-16 lg:py-12">
          <img
            src={logo}
            alt="Tour Shop"
            className="h-12 w-fit object-contain brightness-0 invert drop-shadow-lg"
          />

          <div className="max-w-2xl pb-6 lg:pb-20">
            <p className="mb-7 text-sm font-extrabold uppercase tracking-[0.22em] text-white/85">
              TourShop Backoffice
            </p>
            <h1 className="text-5xl font-black uppercase leading-[1.15] tracking-[0.08em] text-white drop-shadow-2xl sm:text-6xl xl:text-7xl">
              Pilotez<br />
              vos opérations<br />
              avec TourShop
            </h1>
          </div>

          <p className="hidden text-sm font-semibold text-white/80 lg:block">
            &copy; {new Date().getFullYear()} Tour Shop. Tous droits réservés.
          </p>
        </section>

        <section className="flex items-center justify-center px-5 pb-8 pt-0 lg:min-h-screen lg:px-12 lg:py-10">
          <div className="w-full max-w-[420px] rounded-[1.35rem] border border-white/35 bg-white/70 px-7 py-7 text-slate-950 shadow-2xl shadow-black/30 backdrop-blur-md sm:px-9">
            <div className="mb-6 flex justify-center">
              <img
                src={logo}
                alt="Tour Shop"
                className="h-14 w-auto object-contain"
              />
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-xl font-black uppercase tracking-wide text-slate-950">
                {viewCopy[activeView].title}
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {viewCopy[activeView].subtitle}
              </p>
            </div>

            {showAuthTabs && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('login')}
                  className={`rounded-md px-4 py-3 text-sm font-black transition ${
                    activeView === 'login'
                      ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
                      : 'bg-white/75 text-slate-700 hover:bg-white'
                  }`}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('register')}
                  className={`rounded-md px-4 py-3 text-sm font-black transition ${
                    activeView === 'register'
                      ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
                      : 'bg-white/75 text-slate-700 hover:bg-white'
                  }`}
                >
                  Inscription
                </button>
              </div>
            )}

            <div className="relative mb-6 flex items-center gap-4 text-xs font-semibold text-slate-500">
              <div className="h-px flex-1 bg-slate-400/60" />
              <span>TourShop</span>
              <div className="h-px flex-1 bg-slate-400/60" />
            </div>

            <div className="max-h-[56vh] overflow-y-auto pr-1 [&_label]:text-slate-700 [&_label]:tracking-normal [&_label]:normal-case [&_input]:rounded-md [&_input]:border-white/80 [&_input]:bg-white/95 [&_input]:shadow-sm [&_button[type='submit']]:rounded-md [&_button[type='submit']]:bg-emerald-600 [&_button[type='submit']]:shadow-none [&_button[type='submit']:hover]:bg-emerald-700">
              {activeView === 'login' && (
                <LoginForm
                  onSuccess={() => {}}
                  switchToRegister={() => setActiveView('register')}
                  switchToForgotPassword={() => setActiveView('forgot')}
                />
              )}

              {activeView === 'register' && (
                <RegisterForm
                  onSuccess={() => {}}
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

            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
              {activeView === 'login' && (
                <>
                  <span>Pas encore de compte ?</span>
                  <button
                    type="button"
                    onClick={() => setActiveView('register')}
                    className="font-black text-emerald-700 hover:text-emerald-800"
                  >
                    Créer un compte
                  </button>
                </>
              )}

              {activeView !== 'login' && (
                <button
                  type="button"
                  onClick={() => setActiveView('login')}
                  className="font-black text-emerald-700 hover:text-emerald-800"
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
