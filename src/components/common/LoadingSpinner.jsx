import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ fullScreen = false }) => {
    if (fullScreen) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-4" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chargement...</p>
        </div>
    );
};

export default LoadingSpinner;
