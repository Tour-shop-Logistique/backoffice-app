import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check } from 'lucide-react';
import api from '../services/api';
import { login } from '../redux/slices/authSlice';
import AuthLayout from '../components/auth/AuthLayout';
import EmailVerificationForm from '../components/auth/EmailVerificationForm';
import PhoneInput from '../components/common/PhoneInput';
import SearchableDropdown from '../components/common/SearchableDropdown';
import { COUNTRY_OPTIONS } from '../utils/countries';
import { joinPhoneNumber } from '../utils/phoneCountries';

const INPUT = 'block w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors';
const LABEL = 'block text-sm font-medium text-slate-700 mb-1.5';

const ETAPES = [
    { titre: 'Votre compte', detail: "Vos accès d'administrateur" },
    { titre: 'Votre backoffice', detail: 'Le pays que vous pilotez' },
    { titre: 'Vérification', detail: 'Code reçu par email' },
];

// Champs de l'étape 1 : une erreur serveur sur l'un d'eux y ramène.
const CHAMPS_ADMIN = ['nom', 'prenoms', 'telephone', 'indicatif_telephone', 'whatsapp_number', 'email', 'password'];

const SuiviEtapes = ({ etape }) => (
    <ol>
        {ETAPES.map((e, i) => {
            const n = i + 1;
            const fait = etape > n;
            const actif = etape === n;
            return (
                <li key={e.titre} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <span className={`w-8 h-8 rounded-full grid place-items-center text-sm font-semibold transition-colors ${
                            fait ? 'bg-emerald-500 text-white' : actif ? 'bg-white text-slate-900' : 'border border-white/30 text-white/50'
                        }`}>
                            {fait ? <Check className="w-4 h-4" /> : n}
                        </span>
                        {n < ETAPES.length && <span className="w-px h-10 border-l-2 border-dotted border-white/25" />}
                    </div>
                    <div className="pt-1">
                        <p className={`text-sm font-semibold ${actif || fait ? 'text-white' : 'text-white/50'}`}>{e.titre}</p>
                        <p className="text-xs text-white/50">{e.detail}</p>
                    </div>
                </li>
            );
        })}
    </ol>
);

const Inscription = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [etape, setEtape] = useState(1);
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const [voirMdp, setVoirMdp] = useState(false);

    const [admin, setAdmin] = useState({
        nom: '', prenoms: '', email: '', password: '',
        dialCode: '', phone: '', waIdentique: true, waDialCode: '', waPhone: '',
    });
    const [backoffice, setBackoffice] = useState({ nom_organisation: '', code_pays: '', ville: '', adresse: '' });

    const majAdmin = (champ, valeur) => setAdmin((p) => ({ ...p, [champ]: valeur }));
    const majBackoffice = (champ, valeur) => setBackoffice((p) => ({ ...p, [champ]: valeur }));

    const validerEtape1 = (e) => {
        e.preventDefault();
        setErreur('');
        if (!admin.dialCode || !admin.phone) return setErreur("Renseignez votre numéro de téléphone avec l'indicatif.");
        if (!admin.waIdentique && (!admin.waDialCode || !admin.waPhone)) return setErreur('Renseignez votre numéro WhatsApp.');
        if (admin.password.length < 8) return setErreur('Le mot de passe doit contenir au moins 8 caractères.');
        setEtape(2);
    };

    const creerCompte = async (e) => {
        e.preventDefault();
        setErreur('');
        if (!backoffice.code_pays) return setErreur('Choisissez le pays du backoffice.');

        const telephone = joinPhoneNumber(admin.dialCode, admin.phone);
        const whatsapp = admin.waIdentique ? telephone : joinPhoneNumber(admin.waDialCode, admin.waPhone);

        setEnvoi(true);
        try {
            await api.post('/register-backoffice', {
                nom: admin.nom,
                prenoms: admin.prenoms,
                email: admin.email,
                password: admin.password,
                password_confirmation: admin.password,
                indicatif_telephone: admin.dialCode,
                telephone: admin.phone,
                whatsapp_number: whatsapp,
                // Contacts du backoffice = ceux de l'admin ; devise déduite du
                // pays côté serveur. Tout reste modifiable dans les paramètres.
                entite: { ...backoffice, telephone, whatsapp, email: admin.email },
            });
            setEtape(3);
        } catch (error) {
            const data = error.response?.data || {};
            setErreur(data.message || "Une erreur est survenue lors de l'inscription.");
            if (Object.keys(data.errors || {}).some((k) => CHAMPS_ADMIN.includes(k))) setEtape(1);
        } finally {
            setEnvoi(false);
        }
    };

    // Email vérifié : connexion directe avec les identifiants déjà saisis.
    const apresVerification = async () => {
        const action = await dispatch(login({ email: admin.email, password: admin.password }));
        navigate(action.type === login.fulfilled.type ? '/dashboard' : '/', { replace: true });
    };

    const aside = (
        <>
            <h1 className="text-3xl font-bold leading-tight mb-3">Ouvrez le backoffice de votre pays</h1>
            <p className="text-white/70 mb-10 max-w-sm">
                Deux étapes, quelques minutes. Logo, tarifs et zones se configurent ensuite depuis les paramètres.
            </p>
            <SuiviEtapes etape={etape} />
        </>
    );

    return (
        <AuthLayout aside={aside}>
            <div className="lg:hidden flex gap-1.5 mb-6">
                {ETAPES.map((e, i) => (
                    <span key={e.titre} className={`h-1 flex-1 rounded-full ${etape > i ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                Étape {etape} sur {ETAPES.length}
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {etape === 1 ? 'Créez votre compte' : etape === 2 ? 'Présentez votre backoffice' : 'Vérifiez votre email'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
                {etape === 1 && 'Ce compte administre le backoffice et ses agents.'}
                {etape === 2 && 'Un seul backoffice par pays.'}
                {etape === 3 && `Saisissez le code envoyé à ${admin.email}.`}
            </p>

            {erreur && etape !== 3 && (
                <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
                    {erreur}
                </div>
            )}

            {etape === 1 && (
                <form onSubmit={validerEtape1} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nom" className={LABEL}>Nom</label>
                            <input id="nom" required autoComplete="family-name" value={admin.nom} onChange={(e) => majAdmin('nom', e.target.value)} className={INPUT} />
                        </div>
                        <div>
                            <label htmlFor="prenoms" className={LABEL}>Prénom</label>
                            <input id="prenoms" required autoComplete="given-name" value={admin.prenoms} onChange={(e) => majAdmin('prenoms', e.target.value)} className={INPUT} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className={LABEL}>Email</label>
                        <input id="email" type="email" required autoComplete="email" value={admin.email} onChange={(e) => majAdmin('email', e.target.value)} className={INPUT} placeholder="vous@exemple.com" />
                    </div>
                    <div>
                        <label className={LABEL}>Téléphone</label>
                        <PhoneInput
                            dialCode={admin.dialCode}
                            localNumber={admin.phone}
                            onDialCodeChange={(v) => majAdmin('dialCode', v)}
                            onLocalNumberChange={(v) => majAdmin('phone', v)}
                            inputClassName={INPUT}
                        />
                        <label className="mt-2 flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                            <input type="checkbox" checked={admin.waIdentique} onChange={(e) => majAdmin('waIdentique', e.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                            Ce numéro est aussi mon WhatsApp
                        </label>
                    </div>
                    {!admin.waIdentique && (
                        <div>
                            <label className={LABEL}>WhatsApp</label>
                            <PhoneInput
                                dialCode={admin.waDialCode}
                                localNumber={admin.waPhone}
                                onDialCodeChange={(v) => majAdmin('waDialCode', v)}
                                onLocalNumberChange={(v) => majAdmin('waPhone', v)}
                                inputClassName={INPUT}
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="password" className={LABEL}>Mot de passe</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={voirMdp ? 'text' : 'password'}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                value={admin.password}
                                onChange={(e) => majAdmin('password', e.target.value)}
                                className={`${INPUT} pr-11`}
                                placeholder="8 caractères minimum"
                            />
                            <button type="button" onClick={() => setVoirMdp((v) => !v)} aria-label={voirMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600">
                                {voirMdp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">
                        Continuer
                    </button>
                </form>
            )}

            {etape === 2 && (
                <form onSubmit={creerCompte} className="space-y-4">
                    <div>
                        <label htmlFor="nom_organisation" className={LABEL}>Nom de l'organisation</label>
                        <input id="nom_organisation" required value={backoffice.nom_organisation} onChange={(e) => majBackoffice('nom_organisation', e.target.value)} className={INPUT} placeholder="Ex : Tour Shop Côte d'Ivoire" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Pays</label>
                            <SearchableDropdown
                                value={backoffice.code_pays}
                                onChange={(code) => majBackoffice('code_pays', code)}
                                options={COUNTRY_OPTIONS.map((c) => ({ label: c.label, value: c.id }))}
                                placeholder="Choisir"
                            />
                        </div>
                        <div>
                            <label htmlFor="ville" className={LABEL}>Ville</label>
                            <input id="ville" required value={backoffice.ville} onChange={(e) => majBackoffice('ville', e.target.value)} className={INPUT} placeholder="Ex : Abidjan" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="adresse" className={LABEL}>
                            Adresse <span className="font-normal text-slate-400">(facultatif)</span>
                        </label>
                        <input id="adresse" value={backoffice.adresse} onChange={(e) => majBackoffice('adresse', e.target.value)} className={INPUT} placeholder="Rue, quartier" />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={() => { setErreur(''); setEtape(1); }} className="px-5 py-3 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100">
                            Retour
                        </button>
                        <button type="submit" disabled={envoi} className="flex-1 py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                            {envoi ? 'Création…' : 'Créer mon backoffice'}
                        </button>
                    </div>
                </form>
            )}

            {etape === 3 && (
                <EmailVerificationForm email={admin.email} onSuccess={apresVerification} onBack={() => navigate('/')} />
            )}

            {etape !== 3 && (
                <p className="mt-6 text-center text-sm text-slate-500">
                    Déjà inscrit ?{' '}
                    <Link to="/" className="font-medium text-emerald-700 hover:text-emerald-800">Se connecter</Link>
                </p>
            )}
        </AuthLayout>
    );
};

export default Inscription;
