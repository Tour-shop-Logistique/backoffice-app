import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Loader2, RefreshCw, ShoppingBag } from 'lucide-react';
import { fetchMarketplaceCommandes } from '../../redux/slices/marketplaceModerationSlice';
import { getCurrencyLabel } from '../../utils/format';
import Modal from '../common/Modal';

const STATUT_LABELS = {
  en_attente_paiement: { label: 'En attente de paiement', className: 'bg-slate-100 text-slate-600' },
  paiement_a_confirmer: { label: 'Paiement à confirmer', className: 'bg-amber-50 text-amber-700' },
  payee: { label: 'Payée', className: 'bg-emerald-50 text-emerald-700' },
  livraison_en_attente: { label: 'Livraison en attente', className: 'bg-blue-50 text-blue-700' },
  livraison_assignee: { label: 'Livraison assignée', className: 'bg-blue-50 text-blue-700' },
  livree: { label: 'Livrée', className: 'bg-emerald-100 text-emerald-800' },
  annulee: { label: 'Annulée', className: 'bg-red-50 text-red-700' },
  litige: { label: 'Litige', className: 'bg-red-100 text-red-800' },
};

const CommandesMarketplaceTab = () => {
  const dispatch = useDispatch();
  const { commandes, isLoadingCommandes, commandesHasLoaded } = useSelector((state) => state.marketplaceModeration);

  const [statutFiltre, setStatutFiltre] = useState('');
  const [selected, setSelected] = useState(null);
  const isFirstRun = useRef(true);

  const refresh = () => dispatch(fetchMarketplaceCommandes({ statut: statutFiltre || undefined }));

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (!commandesHasLoaded) refresh();
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statutFiltre]);

  const items = commandes.data || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <select
          value={statutFiltre}
          onChange={(e) => setStatutFiltre(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          onClick={refresh}
          disabled={isLoadingCommandes}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoadingCommandes ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoadingCommandes && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <ShoppingBag className="text-slate-300 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-sm text-slate-600 font-medium">Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-widest">
                  <th className="px-6 py-4">Vendeur</th>
                  <th className="px-6 py-4">Acheteur</th>
                  <th className="px-6 py-4 text-right">Montant</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4">Créée le</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => {
                  const statut = STATUT_LABELS[c.statut] || { label: c.statut, className: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {c.vendeur ? `${c.vendeur.prenoms || ''} ${c.vendeur.nom || ''}`.trim() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {c.acheteur ? `${c.acheteur.prenoms || ''} ${c.acheteur.nom || ''}`.trim() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                        {(c.montant_articles || 0).toLocaleString()} {getCurrencyLabel()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${statut.className}`}>
                          {statut.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {c.created_at ? format(new Date(c.created_at), 'dd MMM yyyy', { locale: fr }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelected(c)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Détail de la commande"
        size="md"
        position="right"
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Articles</p>
              <div className="space-y-2">
                {(selected.items || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                    <span className="text-sm font-semibold text-slate-800">{item.titre_snapshot}</span>
                    <span className="text-sm font-bold text-slate-900">{(item.prix_unitaire || 0).toLocaleString()} {getCurrencyLabel()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vendeur</p>
                <p className="text-sm font-bold text-slate-900">{selected.vendeur ? `${selected.vendeur.prenoms || ''} ${selected.vendeur.nom || ''}`.trim() : '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Acheteur</p>
                <p className="text-sm font-bold text-slate-900">{selected.acheteur ? `${selected.acheteur.prenoms || ''} ${selected.acheteur.nom || ''}`.trim() : '—'}</p>
              </div>
            </div>

            {selected.preuve_paiement_url && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Preuve de paiement</p>
                <img src={selected.preuve_paiement_url} alt="Preuve de paiement" className="w-full rounded-xl border border-slate-200" />
              </div>
            )}

            {selected.livraison_marketplace && (
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Livraison</p>
                <p className="text-sm text-slate-700">
                  Mode : {selected.livraison_marketplace.mode} · Statut : {selected.livraison_marketplace.statut}
                  {selected.livraison_marketplace.montant_final != null && ` · ${selected.livraison_marketplace.montant_final.toLocaleString()} ${getCurrencyLabel()}`}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CommandesMarketplaceTab;
