import React from 'react';
import {
    CheckCircle2,
    Clock,
    ArrowLeft,
    ChevronRight,
    MapPin,
    Smartphone,
    Box,
    AlertCircle,
    Truck,
    Wallet,
    TrendingUp,
    Package
} from 'lucide-react';
import Modal from '../common/Modal';

const ExpeditionDetailModal = ({ isOpen, onClose, selectedExpedition }) => {
    if (!selectedExpedition) return null;

    const getTypeLabel = (type) => {
        if (!type) return 'N/A';
        switch (type.toUpperCase()) {
            case 'SIMPLE': return 'Simple';
            case 'GROUPAGE_DHD_AERIEN': return 'DHD Aérien';
            case 'GROUPAGE_DHD_MARITIME': return 'DHD Maritime';
            case 'GROUPAGE_AFRIQUE': return 'Afrique';
            case 'GROUPAGE_CA': return 'Colis Accompagné';
            default: return type.replace('groupage_', '').replace('_', ' ');
        }
    };

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'pending':
            case 'en_attente': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'rejected':
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'accepted': return 'Acceptée';
            case 'pending':
            case 'en_attente': return 'En attente';
            case 'rejected': return 'Rejetée';
            case 'cancelled': return 'Annulée';
            default: return status || 'N/A';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Expédition ${selectedExpedition.reference}`}
            subtitle="Détails complets de l'expédition"
            size="2xl"
        >
            <div className="space-y-6 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-300">
                    <div className="flex items-center gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Statut Expédition</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusStyles(selectedExpedition.statut_expedition)}`}>
                                {selectedExpedition.statut_expedition === 'accepted' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                {getStatusLabel(selectedExpedition.statut_expedition)}
                            </span>
                        </div>
                        <div className="w-px h-10 bg-slate-300 mx-2 hidden sm:block" />
                    </div>
                    <div className="flex flex-col text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type d'expédition</p>
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">{getTypeLabel(selectedExpedition.type_expedition)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                                <ArrowLeft className="rotate-180" size={16} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expéditeur</h4>
                                <p className="text-xs font-bold text-slate-900">{selectedExpedition.expediteur?.nom_prenom}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Smartphone size={12} className="text-slate-400" />
                                <span className="text-xs font-semibold">{selectedExpedition.expediteur?.telephone}</span>
                            </div>
                            <div className="flex items-start gap-2 text-slate-600">
                                <MapPin size={12} className="text-slate-400 mt-0.5" />
                                <span className="text-xs font-semibold leading-relaxed">
                                    {selectedExpedition.expediteur?.adresse}, {selectedExpedition.expediteur?.ville}<br />
                                    <span className="text-slate-400 uppercase text-[9px] font-bold">{selectedExpedition.pays_depart}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4 border-slate-100">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                                <ChevronRight size={16} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destinataire</h4>
                                <p className="text-xs font-bold text-slate-900">{selectedExpedition.destinataire?.nom_prenom}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Smartphone size={12} className="text-slate-400" />
                                <span className="text-xs font-semibold">{selectedExpedition.destinataire?.telephone}</span>
                            </div>
                            <div className="flex items-start gap-2 text-slate-600">
                                <MapPin size={12} className="text-slate-400 mt-0.5" />
                                <span className="text-xs font-semibold leading-relaxed">
                                    {selectedExpedition.destinataire?.adresse}, {selectedExpedition.destinataire?.ville}<br />
                                    <span className="text-slate-400 uppercase text-[9px] font-bold">{selectedExpedition.pays_destination}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Récapitulatif Financier Simple */}
                <div className="flex items-center justify-between p-5 bg-slate-50/80 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Total payé par le client</p>
                            <h4 className="text-sm font-bold text-slate-900 tracking-tight">Montant Global</h4>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-slate-950 tracking-tighter">
                            {selectedExpedition.accounting_details?.total_client_due?.toLocaleString()} 
                            <span className="text-xs font-semibold text-slate-400 ml-2 tracking-normal">CFA</span>
                        </p>
                    </div>
                </div>

                {/* Détail des Commissions */}
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Détail des Commissions</p>
                    <div className="grid grid-cols-1 gap-3">
                        {selectedExpedition.commission_details && Object.entries(selectedExpedition.commission_details).map(([key, value]) => {
                            if (key === 'total_global_commissions' || value.total === 0 || !value.total) return null;

                            let Icon = Box;
                            let iconColor = "text-slate-400";
                            if (key.includes('enlevement')) { Icon = MapPin; iconColor = "text-blue-500"; }
                            if (key.includes('livraison')) { Icon = Truck; iconColor = "text-emerald-500"; }
                            if (key.includes('emballage')) { Icon = Package; iconColor = "text-amber-500"; }
                            if (key.includes('retard')) { Icon = AlertCircle; iconColor = "text-red-500"; }

                            return (
                                <div key={key} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-4 hover:border-slate-300 transition-colors">
                                    <div className={`h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center ${iconColor} border border-slate-100`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-xs font-bold text-slate-800 capitalize leading-tight mb-0.5">{key.replace('_', ' ')}</h5>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{value.total.toLocaleString()} <span className="text-[9px] text-slate-500 font-medium tracking-normal">CFA</span></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">Agence</p>
                                            <p className="text-sm font-bold text-slate-900">{value.agence.toLocaleString()} <span className="text-[9px] text-slate-500 font-medium tracking-normal">CFA</span></p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-100" />
                                        <div className="text-right min-w-[90px]">
                                            {value.livreur > 0 ? (
                                                <>
                                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight">Livreur</p>
                                                    <p className="text-sm font-bold text-slate-900">{value.livreur.toLocaleString()} <span className="text-[9px] text-slate-500 font-medium tracking-normal">CFA</span></p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Backoffice</p>
                                                    <p className="text-sm font-bold text-slate-900">{value.backoffice?.toLocaleString() || 0} <span className="text-[9px] text-slate-500 font-medium tracking-normal">CFA</span></p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Bloc Expédition (Core) */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-4 hover:border-slate-300 transition-colors">
                            <div className="h-11 w-11 rounded-xl bg-indigo-50/50 flex items-center justify-center text-indigo-500 border border-indigo-100/50">
                                <TrendingUp size={18} />
                            </div>
                            <div className="flex-1">
                                <h5 className="text-xs font-bold text-slate-800 capitalize leading-tight mb-0.5">Expédition</h5>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                        {(Number(selectedExpedition.montant_base) + Number(selectedExpedition.montant_prestation)).toLocaleString()} 
                                        <span className="text-[9px] text-slate-500 font-medium tracking-normal ml-0.5">CFA</span>
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-5">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">Agence</p>
                                    <p className="text-sm font-bold text-slate-900">{Number(selectedExpedition.montant_prestation).toLocaleString()} <span className="text-[9px] text-slate-500 font-medium tracking-normal">CFA</span></p>
                                </div>
                                <div className="h-8 w-px bg-slate-100" />
                                <div className="text-right min-w-[90px]">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Backoffice</p>
                                    <p className="text-sm font-bold text-slate-900">{Number(selectedExpedition.montant_base).toLocaleString()} <span className="text-[9px] text-slate-500 font-medium tracking-normal">CFA</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Bloc Frais Annexes */}
                        {Number(selectedExpedition.frais_annexes) > 0 && (
                            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-4 hover:border-slate-300 transition-colors">
                                <div className="h-11 w-11 rounded-xl bg-orange-50/50 flex items-center justify-center text-orange-500 border border-orange-100/50">
                                    <TrendingUp size={18} className="rotate-45" />
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-xs font-bold text-slate-800 capitalize leading-tight mb-0.5">Frais Annexes</h5>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                            {Number(selectedExpedition.frais_annexes).toLocaleString()} 
                                            <span className="text-[9px] text-slate-500 font-medium tracking-normal ml-0.5">CFA</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Agence</p>
                                        <p className="text-sm font-bold text-slate-300">0 <span className="text-[9px] text-slate-300 font-medium tracking-normal">CFA</span></p>
                                    </div>
                                    <div className="h-8 w-px bg-slate-100" />
                                    <div className="text-right min-w-[90px]">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Backoffice</p>
                                        <p className="text-sm font-bold text-slate-900">{Number(selectedExpedition.frais_annexes).toLocaleString()} <span className="text-[9px] text-slate-500 font-medium tracking-normal">CFA</span></p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                 {/* Répartition des Gains */}
                {selectedExpedition.accounting_details && (
                    <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Répartition des Gains</span>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                            <div className="text-center sm:text-left">
                                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Part Agence</p>
                                <p className="text-lg font-bold text-slate-700">{selectedExpedition.accounting_details.agence?.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium italic">CFA</span></p>
                            </div>
                            <div className="text-center sm:text-left sm:pl-6">
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Part Livreur</p>
                                <p className="text-lg font-bold text-slate-700">{selectedExpedition.accounting_details.livreur?.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium italic">CFA</span></p>
                            </div>
                            <div className="text-center sm:text-left sm:pl-6">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Part Backoffice</p>
                                <p className="text-lg font-bold text-slate-700">{selectedExpedition.accounting_details.backoffice?.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium italic">CFA</span></p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Modal>
    );
};

export default ExpeditionDetailModal;
