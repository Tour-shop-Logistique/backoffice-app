import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertOctagon, Loader2, Package, CheckCircle2, User } from 'lucide-react';
import { showNotification } from '../redux/slices/uiSlice';
import { fetchLitiges, resolveLitige } from '../redux/slices/litigeSlice';
import { ROUTES } from '../routes';
import Modal from '../components/common/Modal';

const Litiges = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isLoading, hasLoaded } = useSelector((state) => state.litiges);

  const [filterStatut, setFilterStatut] = useState('ouvert');
  const [toResolve, setToResolve] = useState(null);
  const [noteResolution, setNoteResolution] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      dispatch(fetchLitiges());
    }
  }, [dispatch, hasLoaded, isLoading]);

  const filteredItems = items.filter((l) => filterStatut === 'all' || l.statut === filterStatut);

  const handleResolve = async () => {
    if (!toResolve) return;
    setIsResolving(true);
    try {
      await dispatch(resolveLitige({ litigeId: toResolve.id, note_resolution: noteResolution.trim() || null })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Litige résolu.' }));
      setToResolve(null);
      setNoteResolution('');
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || 'Erreur lors de la résolution' }));
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12 font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Litiges</h1>
          <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
            Colis endommagés, contestés ou à retourner
          </p>
        </div>
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
          {[
            { key: 'ouvert', label: 'Ouverts' },
            { key: 'resolu', label: 'Résolus' },
            { key: 'all', label: 'Tous' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatut(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterStatut === f.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
            <p className="text-sm text-slate-600 font-medium">Chargement des litiges...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <AlertOctagon className="text-slate-300 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-sm text-slate-600 font-medium">Aucun litige {filterStatut === 'ouvert' ? 'ouvert' : filterStatut === 'resolu' ? 'résolu' : ''}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((l) => (
              <div key={l.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(ROUTES.PARCEL_CONTROL.replace(':code', l.colis?.code_colis))}
                      className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:underline"
                    >
                      <Package size={14} />
                      {l.colis?.code_colis}
                    </button>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                      l.statut === 'ouvert' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {l.statut === 'ouvert' ? 'Ouvert' : 'Résolu'}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1.5">{l.motif}</p>
                  {l.description && <p className="text-sm text-slate-600 mt-1">{l.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      Ouvert par {l.ouvert_par?.nom} {l.ouvert_par?.prenoms}
                    </span>
                    <span>{format(new Date(l.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
                  </div>
                  {l.statut === 'resolu' && l.note_resolution && (
                    <div className="mt-2 pl-3 border-l-2 border-emerald-200">
                      <p className="text-xs text-emerald-700 italic">{l.note_resolution}</p>
                    </div>
                  )}
                </div>
                {l.statut === 'ouvert' && (
                  <button
                    onClick={() => setToResolve(l)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shrink-0"
                  >
                    <CheckCircle2 size={14} />
                    Résoudre
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!toResolve}
        onClose={() => setToResolve(null)}
        title="Résoudre le litige"
        subtitle={toResolve?.colis?.code_colis}
        size="sm"
        onConfirm={handleResolve}
        isLoading={isResolving}
        confirmLabel="Résoudre"
      >
        <textarea
          value={noteResolution}
          onChange={(e) => setNoteResolution(e.target.value)}
          placeholder="Note de résolution (optionnel)"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all min-h-[100px] resize-none"
        />
      </Modal>
    </div>
  );
};

export default Litiges;
