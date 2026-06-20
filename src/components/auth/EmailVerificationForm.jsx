import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, KeyRound, Loader2, Mail } from 'lucide-react';
import authService from '../../services/authService';

const EmailVerificationForm = ({ email, onSuccess, onBack }) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const parseError = (err, fallback = 'Une erreur est survenue.') => {
        const errors = err.response?.data?.errors;
        if (errors) {
            return Object.values(errors)[0]?.[0] || fallback;
        }

        return err.response?.data?.message || fallback;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            await authService.verifyEmail({ email, code });
            setMessage('Adresse email verifiee avec succes.');
            onSuccess();
        } catch (err) {
            setError(parseError(err, 'Code invalide ou expire.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setMessage('');
        setIsResending(true);

        try {
            const response = await authService.resendEmailVerification(email);
            setMessage(response.message || 'Un nouveau code a ete envoye.');
        } catch (err) {
            setError(parseError(err));
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <Mail className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-base text-emerald-700 font-medium">
                    Un code de verification a ete envoye a <strong>{email}</strong>.
                </p>
            </div>

            {error && (
                <div className="p-4 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                    {error}
                </div>
            )}

            {message && (
                <div className="p-4 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">
                        Code de verification
                    </label>
                    <input
                        id="email-verification-code"
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
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                    {isLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /><span>Verification...</span></>
                    ) : (
                        <><KeyRound className="w-5 h-5" /><span>Verifier l'email</span></>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full py-3 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest disabled:opacity-50"
                >
                    {isResending ? 'Envoi...' : 'Renvoyer le code'}
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour a l'inscription
                </button>
            </form>
        </div>
    );
};

export default EmailVerificationForm;
