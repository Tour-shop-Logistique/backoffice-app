import React from 'react';
import {
    CheckCircle2,
    Clock,
    ArrowLeft,
    ChevronRight,
    MapPin,
    Smartphone,
    Wallet,
    TrendingUp,
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

    const acc = selectedExpedition.accounting_details || {};
    const com = selectedExpedition.commission_details || {};
    const fmt = (n) => (Number(n) || 0).toLocaleString();
    const sum = (arr) => arr.reduce((s, v) => s + (Number(v) || 0), 0);

    const roles = Array.isArray(selectedExpedition.backoffice_role) ? selectedExpedition.backoffice_role : [];
    const isDepart = roles.includes('depart');
    const isArrivee = roles.includes('arrivee');
    const roleLabel = isDepart && isArrivee ? 'Départ & Arrivée' : isDepart ? 'Départ' : isArrivee ? 'Arrivée' : null;

    // Détail des lignes qui composent notre gain (backoffice_gain), selon
    // notre rôle sur cette expédition — départ, arrivée, ou les deux.
    const gainLines = [];
    if (isDepart) {
        gainLines.push(
            { label: 'Montant expédition (base)', value: selectedExpedition.montant_base },
            { label: "Frais d'emballage (part)", value: com.emballage?.backoffice },
            { label: 'Frais annexes', value: selectedExpedition.frais_annexes },
        );
    }
    if (isArrivee) {
        gainLines.push(
            { label: 'Frais de retard (part)', value: com.retard?.tourshop },
        );
    }
    const visibleGainLines = gainLines.filter((l) => Number(l.value) > 0);
    const notreGain = Number(selectedExpedition.backoffice_gain) || sum(visibleGainLines.map((l) => l.value));

    // Ce que touchent les autres acteurs, avec le détail des lignes qui
    // composent chaque part. Le total retenu est celui de l'API si présent,
    // sinon la somme des lignes visibles (évite un total à 0 à côté d'un
    // détail non-nul).
    const autresActeurs = [
        {
            key: 'agence_depart',
            label: 'Agence de départ',
            sub: selectedExpedition.agence?.nom_agence,
            apiTotal: acc.agence_depart,
            lines: [
                { label: 'Montant expédition (com.)', value: selectedExpedition.montant_prestation },
                { label: "Frais d'enlèvement (part)", value: com.enlevement?.agence },
                { label: "Frais d'emballage (part)", value: com.emballage?.agence },
            ],
        },
        {
            key: 'agence_arrivee',
            label: "Agence d'arrivée",
            apiTotal: acc.agence_arrivee,
            lines: [
                { label: 'Frais de livraison (part)', value: com.livraison?.agence },
                { label: 'Frais de retard (part)', value: com.retard?.agence },
            ],
        },
        {
            key: 'livreur_depart',
            label: 'Livreur départ',
            apiTotal: acc.livreur_depart,
            lines: [
                { label: 'Enlèvement', value: com.enlevement?.livreur },
            ],
        },
        {
            key: 'livreur_arrivee',
            label: 'Livreur arrivée',
            apiTotal: acc.livreur_arrivee,
            lines: [
                { label: 'Livraison', value: com.livraison?.livreur },
            ],
        },
    ].map((actor) => {
        const lines = actor.lines.filter((l) => Number(l.value) > 0);
        const total = Number(actor.apiTotal) > 0 ? Number(actor.apiTotal) : sum(lines.map((l) => l.value));
        return { ...actor, lines, total };
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={selectedExpedition.reference}
            subtitle="Détails de l'expédition"
            size="2xl"
            position="right"
        >
            <div className="space-y-5 pb-6 bg-slate-100 -m-6 p-6">
                {/* Statut + type + rôle */}
                <div className="flex items-center flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${getStatusStyles(selectedExpedition.statut_expedition)}`}>
                        {selectedExpedition.statut_expedition === 'accepted' || selectedExpedition.statut_expedition === 'termined' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        {getExpeditionStatusLabel(selectedExpedition.statut_expedition)}
                    </span>
                    <span className="text-sm font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                        {getTypeLabel(selectedExpedition.type_expedition)}
                    </span>
                    {roleLabel && (
                        <span className="text-sm font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                            Notre rôle : {roleLabel}
                        </span>
                    )}
                </div>

                {/* Notre gain — la seule chose qui compte vraiment pour nous */}
                <div className="p-5 bg-slate-900 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0">
                                <TrendingUp size={19} />
                            </div>
                            <p className="text-sm font-bold text-slate-300">Notre gain sur cette expédition</p>
                        </div>
                        <p className="text-2xl font-bold text-white shrink-0">
                            {fmt(notreGain)}
                            <span className="text-sm font-bold text-slate-400 ml-1.5">CFA</span>
                        </p>
                    </div>
                    {visibleGainLines.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                            {visibleGainLines.map((line, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">{line.label}</span>
                                    <span className="text-sm font-semibold text-slate-200">{fmt(line.value)} CFA</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Montant total payé par le client */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                            <Wallet size={17} />
                        </div>
                        <p className="text-sm font-bold text-slate-600">Total payé par le client</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                        {fmt(acc.total_client_due)}
                        <span className="text-xs font-bold text-slate-400 ml-1">CFA</span>
                    </p>
                </div>

                {/* Détail des autres acteurs sur cette expédition */}
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1 mb-2">
                        Autres parts sur cette expédition
                    </p>
                    <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                        {autresActeurs.map((actor) => (
                            <div key={actor.key} className="px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-slate-800 truncate">
                                        {actor.label}
                                        {actor.sub && <span className="font-medium text-slate-400"> · {actor.sub}</span>}
                                    </p>
                                    <span className="text-sm font-bold text-slate-900 shrink-0">
                                        {fmt(actor.total)} CFA
                                    </span>
                                </div>
                                {actor.lines.length > 0 ? (
                                    <div className="mt-1.5 space-y-1">
                                        {actor.lines.map((line, i) => (
                                            <div key={i} className="flex items-center justify-between pl-3">
                                                <span className="text-xs text-slate-500">{line.label}</span>
                                                <span className="text-xs font-semibold text-slate-600">{fmt(line.value)} CFA</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 pl-3 text-xs italic text-slate-400">Aucun gain sur cette expédition</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expéditeur / Destinataire */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0">
                                <ArrowLeft className="rotate-180" size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expéditeur</p>
                                <p className="text-sm font-bold text-slate-900 truncate">{selectedExpedition.expediteur?.nom_prenom}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Smartphone size={14} className="text-slate-400 shrink-0" />
                                {selectedExpedition.expediteur?.telephone}
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>
                                    {selectedExpedition.expediteur?.adresse}, {selectedExpedition.expediteur?.ville}
                                    <br />
                                    <span className="text-slate-400 font-medium">{selectedExpedition.pays_depart}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
                                <ChevronRight size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Destinataire</p>
                                <p className="text-sm font-bold text-slate-900 truncate">{selectedExpedition.destinataire?.nom_prenom}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Smartphone size={14} className="text-slate-400 shrink-0" />
                                {selectedExpedition.destinataire?.telephone}
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>
                                    {selectedExpedition.destinataire?.adresse}, {selectedExpedition.destinataire?.ville}
                                    <br />
                                    <span className="text-slate-400 font-medium">{selectedExpedition.pays_destination}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ExpeditionDetailModal;
