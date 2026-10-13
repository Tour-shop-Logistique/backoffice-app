import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, EyeOff, Loader2, MapPin, Package, Phone, RefreshCw } from 'lucide-react';
import {
  clearSelectedAnnonce,
  fetchMarketplaceAnnonce,
  fetchMarketplaceAnnonces,
  masquerAnnonceMarketplace,
} from '../../redux/slices/marketplaceModerationSlice';
import { showNotification } from '../../redux/slices/uiSlice';
import { getCurrencyLabel } from '../../utils/format';
import useHasPermission from '../../hooks/useHasPermission';
import Modal from '../common/Modal';

const STATUT_LABELS = {
  brouillon: { label: 'Brouillon', className: 'bg-slate-100 text-slate-600' },
  publiee: { label: 'Publiée', className: 'bg-emerald-50 text-emerald-700' },
  depubliee: { label: 'Dépubliée', className: 'bg-slate-100 text-slate-500' },
  vendue: { label: 'Vendue', className: 'bg-blue-50 text-blue-700' },
  masquee: { label: 'Masquée', className: 'bg-red-50 text-red-700' },
};

const AnnoncesMarketplaceTab = () => {
  const dispatch = useDispatch();
  const canEdit = useHasPermission('marketplace.edit');
  const { annonces, selectedAnnonce, isLoadingAnnonces, isLoadingAnnonce, isSaving, annoncesHasLoaded } = useSelector((state) => state.marketplaceModeration);

  const [statutFiltre, setStatutFiltre] = useState('');
  const [toMasquer, setToMasquer] = useState(null);
  const [toView, setToView] = useState(null);
  const isFirstRun = useRef(true);

  const refresh = () => dispatch(fetchMarketplaceAnnonces({ statut: statutFiltre || undefined }));

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (!annoncesHasLoaded) refresh();
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statutFiltre]);

  const handleView = (annonce) => {
    setToView(annonce);
    dispatch(fetchMarketplaceAnnonce(annonce.id));
  };

  const closeView = () => {
    setToView(null);
    dispatch(clearSelectedAnnonce());
  };

  const handleMasquer = async () => {
    if (!toMasquer) return;
    try {
      await dispatch(masquerAnnonceMarketplace(toMasquer.id)).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Annonce masquée.' }));
      setToMasquer(null);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || 'Erreur lors du masquage.' }));
    }
  };

  const items = annonces.data || [];

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
          disabled={isLoadingAnnonces}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoadingAnnonces ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoadingAnnonces && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <Package className="text-slate-300 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-sm text-slate-600 font-medium">Aucune annonce trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-widest">
                  <th className="px-6 py-4">Annonce</th>
                  <th className="px-6 py-4">Vendeur</th>
                  <th className="px-6 py-4 text-right">Prix</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4">Publiée le</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((a) => {
                  const statut = STATUT_LABELS[a.statut] || { label: a.statut, className: 'bg-slate-100 text-slate-600' };
                  const photo = a.photos?.[0];
                  return (
                    <tr key={a.id} onClick={() => handleView(a)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {photo?.url ? (
                            <img src={photo.url} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Package size={18} className="text-slate-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{a.titre}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{a.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {a.vendeur ? `${a.vendeur.prenoms || ''} ${a.vendeur.nom || ''}`.trim() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                        {(a.prix || 0).toLocaleString()} {a.devise || getCurrencyLabel()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${statut.className}`}>
                          {statut.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {a.publiee_le ? format(new Date(a.publiee_le), 'dd MMM yyyy', { locale: fr }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleView(a); }}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Voir le détail"
                          >
                            <Eye size={16} />
                          </button>
                          {canEdit && a.statut !== 'masquee' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setToMasquer(a); }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Masquer cette annonce"
                            >
                              <EyeOff size={16} />
                            </button>
                          )}
                        </div>
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
        isOpen={!!toView}
        onClose={closeView}
        title={toView?.titre || 'Détail de l\'annonce'}
        subtitle="Fiche produit"
        size="md"
        showCloseButton
      >
        {isLoadingAnnonce && !selectedAnnonce ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-slate-900" size={32} strokeWidth={1.5} />
          </div>
        ) : selectedAnnonce ? (
          <div className="space-y-5">
            {selectedAnnonce.photos?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedAnnonce.photos.map((p) => (
                  <img key={p.id} src={p.url} alt="" className="w-24 h-24 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                ))}
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedAnnonce.description || '—'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Prix</p>
                <p className="text-lg font-bold text-slate-900">
                  {(selectedAnnonce.prix || 0).toLocaleString()} {selectedAnnonce.devise || getCurrencyLabel()}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Statut</p>
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${(STATUT_LABELS[selectedAnnonce.statut] || {}).className || 'bg-slate-100 text-slate-600'}`}>
                  {(STATUT_LABELS[selectedAnnonce.statut] || {}).label || selectedAnnonce.statut}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Vendeur</p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {selectedAnnonce.vendeur ? `${selectedAnnonce.vendeur.prenoms || ''} ${selectedAnnonce.vendeur.nom || ''}`.trim() : '—'}
                </p>
                {selectedAnnonce.vendeur?.telephone && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone size={12} /> {selectedAnnonce.vendeur.telephone}
                  </p>
                )}
                {selectedAnnonce.vendeur?.email && (
                  <p className="text-xs text-slate-600">{selectedAnnonce.vendeur.email}</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Adresse de retrait</p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <p className="text-sm font-semibold text-slate-900">{selectedAnnonce.retrait_nom || '—'}</p>
                {selectedAnnonce.retrait_telephone && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone size={12} /> {selectedAnnonce.retrait_telephone}
                  </p>
                )}
                {(selectedAnnonce.retrait_adresse || selectedAnnonce.retrait_ville) && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin size={12} />
                    {[selectedAnnonce.retrait_adresse, selectedAnnonce.retrait_quartier, selectedAnnonce.retrait_ville].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Publiée le {selectedAnnonce.publiee_le ? format(new Date(selectedAnnonce.publiee_le), 'dd MMMM yyyy', { locale: fr }) : '—'}
              {selectedAnnonce.vendue_le && ` · Vendue le ${format(new Date(selectedAnnonce.vendue_le), 'dd MMMM yyyy', { locale: fr })}`}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!toMasquer}
        onClose={() => setToMasquer(null)}
        title="Masquer l'annonce"
        subtitle="Modération"
        size="sm"
        onConfirm={handleMasquer}
        isLoading={isSaving}
        confirmLabel="Masquer"
        confirmVariant="danger"
      >
        <p className="text-sm text-slate-600">
          L'annonce « {toMasquer?.titre} » ne sera plus visible dans le catalogue acheteur.
        </p>
      </Modal>
    </div>
  );
};

export default AnnoncesMarketplaceTab;
