import React from 'react';
import { Package, MapPin as MapPinIcon } from 'lucide-react';

const AgencyTariffTable = ({ tariffs, type, getTypeLabel }) => {
    if (tariffs.length === 0) return null;

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            {type === 'tarifs_groupage' ? (
                                <>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type / Catégorie</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Itinéraire / Pays</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Indice</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</th>
                                </>
                            )}
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Montant Base</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Prestation</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tariffs.map((tarif) => (
                            <tr key={tarif.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    {type === 'tarifs_groupage' ? (
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase w-fit ${tarif.type_expedition?.includes('aerien') ? 'bg-blue-100 text-blue-700' :
                                                tarif.type_expedition?.includes('maritime') ? 'bg-indigo-100 text-indigo-700' :
                                                    tarif.type_expedition?.includes('afrique') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {getTypeLabel(tarif.type_expedition)}
                                            </span>
                                            {tarif.category && <span className="text-slate-900 font-semibold text-sm mt-1">
                                                →  {tarif.category?.nom}
                                            </span>}
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center justify-center px-3 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                                            {tarif.indice || 'N/A'}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {type === 'tarifs_groupage' && tarif.ligne ? (
                                            <Package size={14} className="text-slate-400" />
                                        ) : (
                                            <MapPinIcon size={14} className="text-slate-400" />
                                        )}
                                        <span className="font-semibold text-slate-700 uppercase text-xs">
                                            {type === 'tarifs_groupage'
                                                ? (tarif.ligne ? tarif.ligne.replace('-', ' → ') : (tarif.pays || 'N/A'))
                                                : (tarif.zone?.nom || tarif.pays || 'Non définie')
                                            }
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-slate-600 text-sm">
                                        {Number(tarif.montant_base).toLocaleString()} <span className="text-[10px] text-slate-400 uppercase">CFA</span>
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 font-bold text-xs">
                                            {tarif.pourcentage_prestation}%
                                        </span>
                                        <span className="text-slate-400 text-xs font-semibold">
                                            ({Number(tarif.montant_prestation).toLocaleString()} <span className="text-[10px]">CFA</span>)
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-green-600 font-bold text-base tracking-tight">
                                            {Number(tarif.montant_expedition).toLocaleString()} <span className="text-[10px] text-slate-400 uppercase font-semibold">CFA</span>
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
                {tariffs.map((tarif) => {
                    const mb = parseFloat(tarif.montant_base) || 0;
                    const pp = parseFloat(tarif.pourcentage_prestation) || 0;
                    const mp = mb * (pp / 100);
                    const total = mb + mp;

                    if (type === 'tarifs_simple') {
                        return (
                            <div key={tarif.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="px-2 py-1 rounded bg-blue-100 text-slate-700 font-bold text-xs border border-slate-200 shrink-0">
                                            {tarif.indice}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                {tarif.zone?.nom || tarif.pays || 'Destination'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 shrink-0">
                                        {Number(total).toLocaleString()} <span className="text-[10px]">CFA</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium px-1">
                                    <span>Base: {Number(mb).toLocaleString()}</span>
                                    <span>Presta: {pp}% ({Number(mp).toLocaleString()})</span>
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <div key={tarif.id} className="p-4 space-y-3 active:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1 min-w-0">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${tarif.type_expedition?.includes('aerien') ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {getTypeLabel(tarif.type_expedition)}
                                        </span>
                                        <p className="text-xs font-bold text-slate-900 truncate uppercase mt-1">
                                            {tarif.ligne || tarif.pays || 'Itinéraire'}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-emerald-600">{Number(total).toLocaleString()} <span className="text-[10px]">CFA</span></p>
                                        <p className="text-[10px] text-slate-400 font-medium">Prix Final</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                                    <div>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold">Montant Base</p>
                                        <p className="text-xs font-semibold text-slate-700">{Number(mb).toLocaleString()} CFA</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-400 uppercase font-bold">Prestation</p>
                                        <p className="text-xs font-semibold text-orange-600">{pp}% ({Number(mp).toLocaleString()} CFA)</p>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
        </>
    );
};

export default AgencyTariffTable;
