import React, { useState } from 'react';
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import authService from '../../services/authService';

const errorMessage = (err, fallback = 'Une erreur est survenue.') => {
    const errors = err.response?.data?.errors;
    if (errors) {
        return Object.values(errors)[0]?.[0] || fallback;
    }

    return err.response?.data?.message || fallback;
};

const Alert = ({ children }) => (
    <div className="p-4 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
        {children}
    </div>
);

const StepEmail = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authService.forgotPassword(email);
            if (response.success === false) {
                setError(response.message || 'Une erreur est survenue.');
            } else {
                onSuccess(email);
            }
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-base text-blue-700 font-medium">
                    Saisissez l'adresse e-mail associee a votre compte backoffice. Nous vous enverrons un code a 6 chiffres.
                </p>
            </div>

            {error && <Alert>{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">
                        Adresse e-mail
                    </label>
                    <input
                        id="forgot-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 text-base font-medium text-slate-700"
                        placeholder="exemple@tourshop.com"
                    />
                </div>

                <button
                    id="forgot-submit-email"
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                    {isLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /><span>Envoi en cours...</span></>
                    ) : (
                        'Envoyer le code'
                    )}
                </button>
            </form>
        </div>
    );
};

const StepCode = ({ email, onSuccess, onBack }) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.verifyResetCode({ email, code });
            onSuccess(code);
        } catch (err) {
            setError(errorMessage(err, 'Code invalide ou expire.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <KeyRound className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-base text-emerald-700 font-medium">
                    Un code a ete envoye a <strong>{email}</strong>. Saisissez-le pour continuer.
                </p>
            </div>

            {error && <Alert>{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">
                        Code de verification
                    </label>
                    <input
                        id="reset-code"
                        name="code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 text-base font-medium text-slate-700 tracking-[0.4em] text-center font-mono"
                        placeholder="000000"
                    />
                </div>

                <button
                    id="verify-code-submit"
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                    {isLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /><span>Verification...</span></>
                    ) : (
                        <><KeyRound className="w-5 h-5" /><span>Valider le code</span></>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Changer d'adresse e-mail
                </button>
            </form>
        </div>
    );
};

const StepNewPassword = ({ email, code, onSuccess, onBack }) => {
    const [formData, setFormData] = useState({
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password_confirmation) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword({ email, code, ...formData });
            onSuccess();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <Lock className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-base text-emerald-700 font-medium">
                    Code valide. Definissez maintenant votre nouveau mot de passe.
                </p>
            </div>

            {error && <Alert>{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">
                        Nouveau mot de passe
                    </label>
                    <div className="relative">
                        <input
                            id="reset-password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 text-base font-medium text-slate-700 pr-10"
                            placeholder="8 caracteres minimum"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">
                        Confirmer le mot de passe
                    </label>
                    <div className="relative">
                        <input
                            id="reset-password-confirm"
                            name="password_confirmation"
                            type={showConfirm ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 text-base font-medium text-slate-700 pr-10"
                            placeholder="Repetez le mot de passe"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <button
                    id="reset-submit"
                    type="submit"
                    disabled={isLoading || !formData.password || !formData.password_confirmation}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                    {isLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /><span>Reinitialisation...</span></>
                    ) : (
                        <><Lock className="w-5 h-5" /><span>Reinitialiser le mot de passe</span></>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Modifier le code
                </button>
            </form>
        </div>
    );
};

const StepSuccess = ({ onClose }) => (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800">Mot de passe reinitialise !</h3>
            <p className="text-base text-slate-500 max-w-xs">
                Votre mot de passe a ete mis a jour avec succes. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
        </div>
        <button
            id="forgot-success-close"
            onClick={onClose}
            className="mt-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-all uppercase tracking-widest"
        >
            Se connecter
        </button>
    </div>
);

const ForgotPasswordForm = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    const steps = [
        { id: 1, label: 'E-mail' },
        { id: 2, label: 'Code' },
        { id: 3, label: 'Mot de passe' },
    ];

    return (
        <div>
            {step < 4 && (
                <div className="flex items-center gap-2 mb-6">
                    {steps.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <div className={`flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide transition-colors ${step >= item.id ? 'text-slate-900' : 'text-slate-400'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > item.id ? 'bg-emerald-500 text-white' : step === item.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                    {step > item.id ? '✓' : item.id}
                                </div>
                                <span className="hidden sm:block">{item.label}</span>
                            </div>
                            {index < steps.length - 1 && <div className={`flex-1 h-px transition-colors ${step > item.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {step === 1 && (
                <StepEmail onSuccess={(confirmedEmail) => { setEmail(confirmedEmail); setStep(2); }} />
            )}
            {step === 2 && (
                <StepCode email={email} onSuccess={(confirmedCode) => { setCode(confirmedCode); setStep(3); }} onBack={() => setStep(1)} />
            )}
            {step === 3 && (
                <StepNewPassword email={email} code={code} onSuccess={() => setStep(4)} onBack={() => setStep(2)} />
            )}
            {step === 4 && (
                <StepSuccess onClose={onClose} />
            )}
        </div>
    );
};

export default ForgotPasswordForm;
