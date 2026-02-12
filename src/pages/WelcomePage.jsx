import React, { useState } from 'react';
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

import logo from "../assets/logo_transparent.png";
import background from "../assets/background1.jpg";

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
    <div className="h-screen w-full bg-slate-900 flex flex-col font-sans overflow-hidden text-white selection:bg-blue-500/30">

      {/* ─── BACKGROUND LAYER ─── */}
      <div className="absolute inset-0 z-0">
        <img
          src={background}
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/70 to-slate-900/90 md:bg-gradient-to-r md:from-slate-900/80 md:to-transparent"></div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="relative z-20 flex-1 flex flex-col md:flex-row items-center justify-center md:justify-between px-6 md:px-20 max-w-7xl mx-auto w-full gap-12 md:gap-24">

        {/* Left Side: Branding & Visuals (Desktop Focus) */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-8 md:space-y-12 max-w-xl">
          <div>
            <img src={logo} alt="Tour Shop Logo" className="w-full h-16 md:h-20 object-contain" />
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
              Backoffice Tourshop
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                Pilotez vos <br />
                <span className="text-blue-400">Opérations.</span>
              </h1>
            </div>
            <p className="text-sm md:text-lg text-slate-200 font-medium max-w-md hidden sm:block leading-relaxed">
              Le centre de commande local pour la gestion des expéditions de votre pays, la supervision de votre réseau d'agences et l'optimisation des flux régionaux.
            </p>
          </div>

          {/* Desktop Trust Badges */}
          <div className="hidden md:flex items-center gap-8 opacity-60">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-widest">Sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-widest">Global Sync</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Actions Card */}
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="space-y-2 border-l-2 border-blue-500 pl-4">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Accès Portail</h3>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Console Admin v3.0</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={openLogin}
              className="w-full group bg-white text-slate-950 h-14 rounded-lg flex items-center px-6 justify-between transition-all hover:bg-blue-50 active:scale-[0.98] shadow-lg shadow-white/5"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-900" />
                <span className="text-sm font-bold uppercase tracking-wide">Se Connecter</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* <button
              onClick={openRegister}
              className="w-full bg-slate-900/40 border border-white/10 h-14 rounded-lg flex items-center px-6 justify-between transition-all hover:bg-slate-800 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold uppercase tracking-wide">Créer un Compte</span>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20" />
            </button> */}
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <span>&copy; {new Date().getFullYear()} Tour Shop</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-blue-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Mobile (Only visible on small screens to avoid scroll) */}
      <footer className="md:hidden relative z-20 pb-8 px-6 text-center text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
        Tour Shop Logistique
      </footer>

      {/* Modals */}
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
