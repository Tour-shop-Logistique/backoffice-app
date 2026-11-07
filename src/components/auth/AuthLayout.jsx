import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo_transparent.png';
import background from '../../assets/background1.jpg';

/**
 * Mise en page plein écran des pages d'auth (connexion, inscription) :
 * panneau de marque à gauche sur desktop (photo + `aside`), formulaire à
 * droite. Sur mobile, seul le formulaire s'affiche, sous un bandeau logo.
 */
const AuthLayout = ({ aside, children }) => (
    <div className="min-h-screen flex bg-slate-50">
        <aside className="hidden lg:flex lg:w-[42%] xl:w-[38%] relative flex-col justify-between p-10 text-white overflow-hidden">
            <img src={background} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/90" />
            <Link to="/" className="relative">
                <img src={logo} alt="Tour Shop" className="h-12 w-auto" />
            </Link>
            <div className="relative">{aside}</div>
            <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Tour Shop</p>
        </aside>

        <main className="flex-1 flex flex-col">
            <header className="lg:hidden bg-slate-900 px-4 py-3">
                <Link to="/">
                    <img src={logo} alt="Tour Shop" className="h-8 w-auto" />
                </Link>
            </header>
            <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:py-12">
                <div className="w-full max-w-md">{children}</div>
            </div>
        </main>
    </div>
);

export default AuthLayout;
