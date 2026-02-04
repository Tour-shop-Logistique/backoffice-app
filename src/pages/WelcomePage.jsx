import React, { useState } from 'react';
import { Truck, ShieldCheck, BarChart3, ArrowRight, LayoutDashboard } from "lucide-react";
import Modal from "../components/common/Modal";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

const WelcomePage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      {/* Background Texture - Minimalist */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left Side: Professional Branding & Trust */}
        <div className="space-y-8 py-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Tous Shop <span className="text-slate-500 font-medium">Logistique</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Système de Gestion Backoffice</p>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">
              L'excellence opérationnelle pour votre logistique.
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              Une plateforme centralisée pour piloter vos flux, gérer vos agents et optimiser vos tarifs en temps réel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <ShieldCheck className="w-5 h-5 text-slate-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sécurisé</h3>
                <p className="text-xs text-slate-500">Contrôle d'accès granulaire par rôle.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <BarChart3 className="w-5 h-5 text-slate-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Analytique</h3>
                <p className="text-xs text-slate-500">Suivi des performances agence.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Action Card */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-200 p-10 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <LayoutDashboard className="w-3 h-3" />
                Accès Restreint
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Portail Opérationnel</h3>
              <p className="text-sm text-slate-500">Identifiez-vous pour accéder à vos outils de gestion.</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={openLogin}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98]"
              >
                <span>Accéder au Backoffice</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-slate-100 flex-1"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ou</span>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>

              <button
                onClick={openRegister}
                className="w-full bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 font-bold py-3.5 px-8 rounded-xl transition-all text-sm"
              >
                Créer un nouveau compte agence
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400 font-medium">
              Besoin d'assistance ? <a href="#" className="underline hover:text-slate-600 transition-colors">Contactez le support technique</a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Minimalist */}
      <footer className="absolute bottom-6 left-0 w-full text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pointer-events-none">
        &copy; {new Date().getFullYear()} Tous Shop Logistique &bull; Système d'Information Propriétaire
      </footer>

      {/* Modales */}
      <Modal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        title="Connexion Sécurisée"
        size="md"
      >
        <LoginForm
          onSuccess={() => setIsLoginOpen(false)}
          switchToRegister={openRegister}
        />
      </Modal>

      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Enregistrement Agence"
        size="lg"
      >
        <RegisterForm
          onSuccess={() => setIsRegisterOpen(false)}
          switchToLogin={openLogin}
        />
      </Modal>
    </div>
  );
};

export default WelcomePage;
