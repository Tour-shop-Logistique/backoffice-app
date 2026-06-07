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
import { getExpeditionStatusLabel, getStatusStyles } from '../../utils/statusTranslations';

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

    const isDepart = selectedExpedition.pays_depart === 'France'; // Simplified logic, should ideally be based on active backoffice country or agency role
    
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
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Statut Expédition</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusStyles(selectedExpedition.statut_expedition)}`}>
                                {selectedExpedition.statut_expedition === 'accepted' || selectedExpedition.statut_expedition === 'termined' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                {getExpeditionStatusLabel(selectedExpedition.statut_expedition)}
                            </span>
                        </div>
                        <div className="w-px h-10 bg-slate-300 mx-2 hidden sm:block" />
                    </div>
                    <div className="flex flex-col text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type d'expédition</p>
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
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expéditeur</h4>
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
                                    <span className="text-slate-400 uppercase text-xs font-bold">{selectedExpedition.pays_depart}</span>
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
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Destinataire</h4>
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
                                    <span className="text-slate-400 uppercase text-xs font-bold">{selectedExpedition.pays_destination}</span>
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
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Total payé par le client</p>
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

                {/* Détail des Commissions par Acteur */}
                <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase px-1 tracking-widest">Répartition détaillée des gains</p>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {/* 1. Agence de Départ */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Agence de Départ ({selectedExpedition.agence?.nom_agence || 'N/A'})</span>
                                <span className="text-xs font-bold text-slate-900">{selectedExpedition.accounting_details?.agence_depart?.toLocaleString()} CFA</span>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Montant Expédition (Com.)</span>
                                    <span className="font-semibold">{Number(selectedExpedition.montant_prestation).toLocaleString()} CFA</span>
                                </div>
                                {selectedExpedition.commission_details?.enlevement?.agence > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Frais d'Enlèvement (Part)</span>
                                        <span className="font-semibold">{selectedExpedition.commission_details.enlevement.agence.toLocaleString()} CFA</span>
                                    </div>
                                )}
                                {selectedExpedition.commission_details?.emballage?.agence > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Frais d'Emballage (Part)</span>
                                        <span className="font-semibold">{selectedExpedition.commission_details.emballage.agence.toLocaleString()} CFA</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Agence d'Arrivée */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Agence d'Arrivée</span>
                                <span className="text-xs font-bold text-slate-900">{selectedExpedition.accounting_details?.agence_arrivee?.toLocaleString()} CFA</span>
                            </div>
                            <div className="p-4 space-y-2">
                                {selectedExpedition.commission_details?.livraison?.agence > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Frais de Livraison (Part)</span>
                                        <span className="font-semibold">{selectedExpedition.commission_details.livraison.agence.toLocaleString()} CFA</span>
                                    </div>
                                )}
                                {selectedExpedition.commission_details?.retard?.agence > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Frais de Retard (Part)</span>
                                        <span className="font-semibold">{selectedExpedition.commission_details.retard.agence.toLocaleString()} CFA</span>
                                    </div>
                                )}
                                {!selectedExpedition.commission_details?.livraison?.agence && !selectedExpedition.commission_details?.retard?.agence && (
                                    <p className="text-xs text-slate-400 italic">Aucun gain sur cette expédition</p>
                                )}
                            </div>
                        </div>

                        {/* 3. Backoffice */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Backoffice (Central)</span>
                                <span className="text-xs font-bold text-white">{(selectedExpedition.accounting_details?.backoffice_depart + selectedExpedition.accounting_details?.backoffice_arrivee)?.toLocaleString()} CFA</span>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Montant Expédition (Base)</span>
                                    <span className="font-semibold text-white">{Number(selectedExpedition.montant_base).toLocaleString()} CFA</span>
                                </div>
                                {selectedExpedition.commission_details?.emballage?.backoffice > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Frais d'Emballage (Part)</span>
                                        <span className="font-semibold text-white">{selectedExpedition.commission_details.emballage.backoffice.toLocaleString()} CFA</span>
                                    </div>
                                )}
                                {Number(selectedExpedition.frais_annexes) > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Frais Annexes</span>
                                        <span className="font-semibold text-white">{Number(selectedExpedition.frais_annexes).toLocaleString()} CFA</span>
                                    </div>
                                )}
                                {selectedExpedition.commission_details?.retard?.tourshop > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Frais de Retard (Part)</span>
                                        <span className="font-semibold text-white">{selectedExpedition.commission_details.retard.tourshop.toLocaleString()} CFA</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. Livreurs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Livreur Départ</span>
                                    <span className="text-xs font-bold text-slate-900">{selectedExpedition.accounting_details?.livreur_depart?.toLocaleString()} CFA</span>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Enlèvement</span>
                                        <span className="font-semibold">{selectedExpedition.commission_details?.enlevement?.livreur?.toLocaleString() || 0} CFA</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Livreur Arrivée</span>
                                    <span className="text-xs font-bold text-slate-900">{selectedExpedition.accounting_details?.livreur_arrivee?.toLocaleString()} CFA</span>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Livraison</span>
                                        <span className="font-semibold">{selectedExpedition.commission_details?.livraison?.livreur?.toLocaleString() || 0} CFA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ExpeditionDetailModal;
