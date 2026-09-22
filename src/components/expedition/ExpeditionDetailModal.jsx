import React from 'react';
import {
    CheckCircle2,
    Clock,
    ArrowLeft,
    ChevronRight,
    MapPin,
    Smartphone,
    Wallet,
} from 'lucide-react';
import Modal from '../common/Modal';
import { getExpeditionStatusLabel, getStatusStyles } from '../../utils/statusTranslations';
import { getCurrencyLabel } from '../../utils/format';
import ConvertedAmount from '../common/ConvertedAmount';

const ExpeditionDetailModal = ({ isOpen, onClose, selectedExpedition }) => {
    if (!selectedExpedition) return null;

    // Tous les montants de cette expédition sont exprimés dans sa propre
    // devise d'origine (celle du pays de départ), pas celle du backoffice
    // qui consulte - voir Expedition::devise_origine côté backend.
    const deviseLabel = getCurrencyLabel(selectedExpedition.devise_origine);

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

    // Ce que touchent les acteurs sur cette expédition, avec le détail des
    // lignes qui composent chaque part. Le total retenu est celui de l'API
    // si présent, sinon la somme des lignes visibles (évite un total à 0 à
    // côté d'un détail non-nul). Regroupé par Départ / Arrivée pour montrer
    // toute la chaîne de chaque côté. Seul le backoffice qui correspond à
    // notre rôle réel sur l'expédition est mis en évidence (fond noir).
    const buildActeur = (actor) => {
        const lines = actor.lines.filter((l) => Number(l.value) > 0);
        const total = Number(actor.apiTotal) > 0 ? Number(actor.apiTotal) : sum(lines.map((l) => l.value));
        return { ...actor, lines, total };
    };

    // Interville : le backoffice centralise le montant de base comme pour
    // l'international et reverse ensuite leur commission aux agences - il a
    // donc bien une part ici (voir Expedition::getAccountingDetailsAttribute).
    const isInterville = selectedExpedition.type_expedition === 'interville';

    const groupesActeurs = [
        {
            key: 'depart',
            title: 'Départ',
            acteurs: [
                {
                    key: 'backoffice_depart',
                    // Un seul backoffice sur toute la course en Interville
                    // (départ = arrivée, même pays), pas de bloc "Backoffice
                    // (Arrivée)" séparé comme en International - et pas de
                    // frais de retard du tout en Interville (pas de délai de
                    // passage par le backoffice, retrait direct à l'agence).
                    label: isInterville ? 'Backoffice' : 'Backoffice (Départ)',
                    highlight: isDepart || isArrivee,
                    apiTotal: acc.backoffice_depart,
                    lines: [
                        { label: 'Montant expédition (base)', value: selectedExpedition.montant_base },
                        { label: "Frais d'emballage (part)", value: com.emballage?.backoffice },
                        { label: 'Frais annexes', value: selectedExpedition.frais_annexes },
                    ],
                },
                {
                    key: 'agence_depart',
                    label: 'Agence de départ',
                    sub: selectedExpedition.agence?.nom_agence,
                    apiTotal: acc.agence_depart,
                    lines: isInterville ? [
                        { label: 'Trajet interville (part)', value: com.trajet_interville?.agence_depart },
                        { label: "Frais d'emballage (part)", value: com.emballage?.agence },
                    ] : [
                        { label: 'Montant expédition (com.)', value: selectedExpedition.montant_prestation },
                        { label: "Frais d'enlèvement (part)", value: com.enlevement?.agence },
                        { label: "Frais d'emballage (part)", value: com.emballage?.agence },
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
            ].map(buildActeur),
        },
        {
            key: 'arrivee',
            title: 'Arrivée',
            acteurs: [
                ...(isInterville ? [] : [{
                    key: 'backoffice_arrivee',
                    label: 'Backoffice (Arrivée)',
                    highlight: isArrivee,
                    apiTotal: acc.backoffice_arrivee,
                    lines: [
                        { label: 'Frais de retard (part)', value: com.retard?.tourshop },
                    ],
                }]),
                {
                    key: 'agence_arrivee',
                    label: "Agence d'arrivée",
                    apiTotal: acc.agence_arrivee,
                    lines: isInterville ? [
                        { label: 'Trajet interville (part)', value: com.trajet_interville?.agence_arrivee },
                    ] : [
                        { label: 'Frais de livraison (part)', value: com.livraison?.agence },
                        { label: 'Frais de retard (part)', value: com.retard?.agence },
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
            ].map(buildActeur),
        },
    ];

    // Composition du montant total facturé au client, avant répartition par
    // acteur — répond à "d'où vient ce total ?" (base + prestation + frais
    // annexes/emballage/enlèvement/livraison/retard selon ce qui s'applique).
    const totalLines = [
        { label: 'Montant de base', value: selectedExpedition.montant_base },
        { label: 'Prestation', value: selectedExpedition.montant_prestation },
        { label: "Frais d'emballage", value: selectedExpedition.frais_emballage },
        { label: "Frais d'enlèvement à domicile", value: selectedExpedition.frais_enlevement_domicile },
        { label: 'Frais de livraison à domicile', value: selectedExpedition.frais_livraison_domicile },
        { label: 'Frais de retard de retrait', value: selectedExpedition.frais_retard_retrait },
        { label: 'Frais annexes', value: selectedExpedition.frais_annexes },
    ].filter((l) => Number(l.value) > 0);

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
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-base font-bold border ${getStatusStyles(selectedExpedition.statut_expedition)}`}>
                        {selectedExpedition.statut_expedition === 'accepted' || selectedExpedition.statut_expedition === 'termined' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                        {getExpeditionStatusLabel(selectedExpedition.statut_expedition)}
                    </span>
                    <span className="text-base font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                        {getTypeLabel(selectedExpedition.type_expedition)}
                    </span>
                    {roleLabel && (
                        <span className="text-base font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                            Notre rôle : {roleLabel}
                        </span>
                    )}
                </div>

                {/* Montant total payé par le client, avec sa composition */}
                <div className="bg-rose-50/60 rounded-lg border border-rose-100 overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 shrink-0">
                                <Wallet size={19} />
                            </div>
                            <p className="text-base font-bold text-rose-900">Total payé par le client</p>
                        </div>
                        <p className="text-xl font-bold text-rose-700">
                            <ConvertedAmount amount={acc.total_client_due} sourceCurrency={selectedExpedition.devise_origine} />
                        </p>
                    </div>
                    {totalLines.length > 0 && (
                        <div className="px-4 pb-4 pt-3 border-t border-rose-100 space-y-1.5">
                            {totalLines.map((line, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm text-rose-700/70">{line.label}</span>
                                    <span className="text-sm font-semibold text-rose-800">{fmt(line.value)} {deviseLabel}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Détail des parts de chaque acteur, groupé par Départ / Arrivée */}
                <div className="space-y-4">
                    {groupesActeurs.map((groupe) => (
                        <div key={groupe.key}>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide px-1 mb-2">
                                Répartition — {groupe.title}
                            </p>
                            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                                {groupe.acteurs.map((actor) => (
                                    <div key={actor.key} className={`px-4 py-3 ${actor.highlight ? 'bg-slate-900' : ''}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <p className={`text-base font-bold truncate ${actor.highlight ? 'text-white' : 'text-slate-800'}`}>
                                                {actor.label}
                                                {actor.sub && <span className="font-medium text-slate-400"> · {actor.sub}</span>}
                                            </p>
                                            <span className={`text-base font-bold shrink-0 ${actor.highlight ? 'text-white' : 'text-slate-900'}`}>
                                                {fmt(actor.total)} {deviseLabel}
                                            </span>
                                        </div>
                                        {actor.lines.length > 0 ? (
                                            <div className="mt-1.5 space-y-1">
                                                {actor.lines.map((line, i) => (
                                                    <div key={i} className="flex items-center justify-between pl-3">
                                                        <span className={`text-sm ${actor.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{line.label}</span>
                                                        <span className={`text-sm font-semibold ${actor.highlight ? 'text-slate-200' : 'text-slate-600'}`}>{fmt(line.value)} {deviseLabel}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={`mt-1 pl-3 text-sm italic ${actor.highlight ? 'text-slate-500' : 'text-slate-400'}`}>Aucun gain sur cette expédition</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Expéditeur / Destinataire */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0">
                                <ArrowLeft className="rotate-180" size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Expéditeur</p>
                                <p className="text-base font-bold text-slate-900 truncate">{selectedExpedition.expediteur?.nom_prenom}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-base text-slate-600">
                            <div className="flex items-center gap-2">
                                <Smartphone size={16} className="text-slate-400 shrink-0" />
                                {selectedExpedition.expediteur?.telephone}
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
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
                            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
                                <ChevronRight size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Destinataire</p>
                                <p className="text-base font-bold text-slate-900 truncate">{selectedExpedition.destinataire?.nom_prenom}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-base text-slate-600">
                            <div className="flex items-center gap-2">
                                <Smartphone size={16} className="text-slate-400 shrink-0" />
                                {selectedExpedition.destinataire?.telephone}
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
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
