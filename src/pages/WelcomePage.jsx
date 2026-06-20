import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import {
  ArrowRight,
  LayoutDashboard,
  Building2,
  Lock,
  ChevronRight,
  ShieldCheck,
  Globe
} from "lucide-react";
import Modal from "../components/common/Modal";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

import logo from "../assets/logo_transparent.png";
import background from "../assets/background1.jpg";

const WelcomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [activeView, setActiveView] = useState('login'); // 'login' | 'register' | 'forgot'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row p-4 md:p-6 gap-6 md:gap-10 font-sans selection:bg-slate-900/10">

      {/* ─── LEFT COLUMN: INSET ROUNDED IMAGE (Desktop only) ─── */}
      <div className="hidden md:flex relative md:w-1/2 lg:w-3/5 rounded-[2rem] overflow-hidden flex-col justify-between p-8 md:p-12 text-white">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src={background}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/40"></div>
        </div>

        {/* Top Section: Logo */}
        <div className="relative z-10">
          <img src={logo} alt="Tour Shop Logo" className="w-auto h-12 object-contain brightness-0 invert" />
        </div>

        {/* Center Section: Main Message */}
        <div className="relative z-10 max-w-lg w-full flex flex-col justify-center items-start text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest">
            Backoffice Tourshop
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            Pilotez vos <br />
            <span className="bg-blue-600 px-3 py-1 rounded-lg text-white inline-block mt-2">Opérations.</span>
          </h1>
          <p className="text-sm text-slate-200 font-medium leading-relaxed">
            Le centre de commande local pour la gestion des expéditions de votre pays, la supervision de votre réseau d'agences et l'optimisation des flux régionaux.
          </p>
        </div>

        {/* Bottom Section: Badges */}
        <div className="relative z-10 flex items-center gap-6 opacity-80">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-100">Sécurisé</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-100">Global Sync</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: DYNAMIC AUTH FORMS ─── */}
      <div className="w-full md:w-1/2 flex flex-col justify-between py-6 px-4 md:px-8 text-slate-900">
        <div className="w-full space-y-6 max-w-xl mx-auto my-auto">

          {/* Logo visible only on mobile/tablet (hidden on desktop) */}
          <div className="md:hidden flex justify-center mb-6">
            <img src={logo} alt="Tour Shop Logo" className="h-14 object-contain" />
          </div>

          {/* Pill Switcher Tab (hidden on forgot password step) */}
          {activeView !== 'forgot' && (
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 border border-slate-200/50">
              <button
                onClick={() => setActiveView('login')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeView === 'login'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/10'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => setActiveView('register')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeView === 'register'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/10'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Créer un compte
              </button>
            </div>
          )}

          {/* Form Header */}
          <div className="space-y-1.5 mb-6 text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight flex items-center justify-center md:justify-start gap-2">
              {activeView === 'login' && (
                <>
                  Bon retour ! <span className="animate-bounce">👋</span>
                </>
              )}
              {activeView === 'register' && 'Créer un Compte'}
              {activeView === 'forgot' && 'Mot de passe oublié'}
            </h2>
            <p className="text-base text-slate-500 font-medium">
              {activeView === 'login' && 'Heureux de vous revoir. Veuillez vous connecter.'}
              {activeView === 'register' && 'Rejoignez le réseau et configurez votre agence.'}
              {activeView === 'forgot' && 'Entrez votre adresse email pour réinitialiser.'}
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white">
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
                switchToLogin={() => setActiveView('login')}
              />
            )}
            {activeView === 'forgot' && (
              <ForgotPasswordForm
                onClose={() => setActiveView('login')}
              />
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest mt-6 max-w-xl mx-auto w-full">
          <span>&copy; {new Date().getFullYear()} Tour Shop</span>
          {activeView !== 'login' && (
            <button
              onClick={() => setActiveView('login')}
              className="hover:text-slate-900 text-blue-600 transition-colors uppercase font-bold"
            >
              Retour
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default WelcomePage;

