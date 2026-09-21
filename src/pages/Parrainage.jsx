import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTauxParrainage, updateTauxParrainage, fetchParrainageClients, fetchRetraitsParrainage, createRetraitParrainage } from '../redux/slices/parrainageSlice';
import { showNotification } from '../redux/slices/uiSlice';
import useHasPermission from '../hooks/useHasPermission';
import ExportButton from '../components/common/ExportButton';
import Modal from '../components/common/Modal';
import { getCurrencyLabel } from '../utils/format';
import {
  Gift,
  Percent,
  Pencil,
  Loader2,
  Users,
  Search,
  RefreshCw,
  Wallet,
  History,
  Banknote,
} from 'lucide-react';

const formatFCFA = (amount) => `${new Intl.NumberFormat('fr-FR').format(amount || 0)} ${getCurrencyLabel()}`;

const TAUX_FIELDS = [
  { key: 'taux_international', label: 'Expéditions internationales' },
  { key: 'taux_national', label: 'Expéditions nationales (Interville)' },
  { key: 'taux_enlevement', label: 'Enlèvement / Livraison à domicile' },
  { key: 'taux_marketplace', label: 'Marketplace', badge: 'Bientôt actif' },
];

const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/**
 * Configuration des 4 taux de bonus de parrainage du backoffice (un seul
 * enregistrement, pattern calqué sur BackofficeSetup.jsx) + liste des
 * clients du pays avec leur code de parrainage, nombre de filleuls et solde.
 *
 * Les taux sont affichés en lecture simple (pas de champs de formulaire à
 * l'écran) : seul un clic sur "Modifier" ouvre un modal avec le vrai
 * formulaire d'édition, cohérent avec le pattern déjà utilisé ailleurs dans
 * le backoffice pour les réglages peu modifiés (voir Modal.jsx).
 */
const Parrainage = () => {
  const dispatch = useDispatch();
  const canEdit = useHasPermission('parrainage.edit');

  const { taux, clients, retraits, isLoadingTaux, isLoadingClients, isLoadingRetraits, isSaving, isSavingRetrait, tauxHasLoaded, clientsHasLoaded } = useSelector((state) => state.parrainage);

  const [formData, setFormData] = useState({
    taux_international: '',
    taux_national: '',
    taux_enlevement: '',
    taux_marketplace: '',
    seuil_retrait: '',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Retrait manuel : le paiement se fait hors application (le parrain
  // contacte le backoffice), cet écran ne fait que tracer la preuve du
  // paiement déjà effectué - remplace un cahier/Excel.
  const [retraitClient, setRetraitClient] = useState(null);
  const [retraitMontant, setRetraitMontant] = useState('');
  const [retraitNotes, setRetraitNotes] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (!tauxHasLoaded && !isLoadingTaux) {
      dispatch(fetchTauxParrainage());
    }
  }, [dispatch, tauxHasLoaded, isLoadingTaux]);

  useEffect(() => {
    if (!clientsHasLoaded && !isLoadingClients) {
      dispatch(fetchParrainageClients());
    }
  }, [dispatch, clientsHasLoaded, isLoadingClients]);

  useEffect(() => {
    if (taux) {
      setFormData({
        taux_international: (taux.taux_international ?? 0).toString(),
        taux_national: (taux.taux_national ?? 0).toString(),
        taux_enlevement: (taux.taux_enlevement ?? 0).toString(),
        taux_marketplace: (taux.taux_marketplace ?? 0).toString(),
        seuil_retrait: (taux.seuil_retrait ?? 1000).toString(),
      });
    }
  }, [taux]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateTauxParrainage({
        taux_international: parseFloat(formData.taux_international) || 0,
        taux_national: parseFloat(formData.taux_national) || 0,
        taux_enlevement: parseFloat(formData.taux_enlevement) || 0,
        taux_marketplace: parseFloat(formData.taux_marketplace) || 0,
        seuil_retrait: parseFloat(formData.seuil_retrait) || 0,
      })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Taux de parrainage mis à jour.' }));
      setIsEditModalOpen(false);
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: error?.message || 'Erreur lors de la mise à jour.' }));
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    // Revenir aux valeurs enregistrées si l'utilisateur ferme sans valider.
    if (taux) {
      setFormData({
        taux_international: (taux.taux_international ?? 0).toString(),
        taux_national: (taux.taux_national ?? 0).toString(),
        taux_enlevement: (taux.taux_enlevement ?? 0).toString(),
        taux_marketplace: (taux.taux_marketplace ?? 0).toString(),
        seuil_retrait: (taux.seuil_retrait ?? 1000).toString(),
      });
    }
  };

  const seuilRetrait = taux?.seuil_retrait ?? 1000;

  const openRetraitModal = (client) => {
    setRetraitClient(client);
    setRetraitMontant('');
    setRetraitNotes('');
  };

  const closeRetraitModal = () => setRetraitClient(null);

  const handleRetraitSubmit = async (e) => {
    e.preventDefault();
    const montant = parseFloat(retraitMontant) || 0;
    if (montant < seuilRetrait) {
      dispatch(showNotification({ type: 'error', message: `Le montant minimum de retrait est de ${formatFCFA(seuilRetrait)}.` }));
      return;
    }
    if (montant > (parseFloat(retraitClient?.solde_parrainage) || 0)) {
      dispatch(showNotification({ type: 'error', message: 'Le montant dépasse le solde disponible.' }));
      return;
    }
    try {
      await dispatch(createRetraitParrainage({
        parrain_id: retraitClient.id,
        montant,
        notes: retraitNotes || undefined,
      })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Retrait enregistré avec succès.' }));
      setRetraitClient(null);
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: error?.message || "Erreur lors de l'enregistrement du retrait." }));
    }
  };

  const openHistory = () => {
    setIsHistoryOpen(true);
    dispatch(fetchRetraitsParrainage());
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchTauxParrainage({ silent: true })).unwrap(),
        dispatch(fetchParrainageClients({ silent: true })).unwrap(),
      ]);
      dispatch(showNotification({ type: 'success', message: 'Données mises à jour.' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredClients = (clients || []).filter((c) => {
    const term = searchTerm.toLowerCase();
    const nomComplet = `${c.nom || ''} ${c.prenoms || ''}`.toLowerCase();
    return nomComplet.includes(term) || (c.code_parrainage || '').toLowerCase().includes(term) || (c.telephone || '').includes(term);
  });

  // Les 4 taux sont inclus en tête d'export (une ligne "récapitulatif"),
  // suivis de la liste des clients - un seul export couvrant toute la page.
  const exportColumns = [
    { header: 'Client', key: 'client' },
    { header: 'Téléphone', key: 'telephone' },
    { header: 'Code parrainage', key: 'code_parrainage' },
    { header: 'Filleuls', key: 'filleuls' },
    { header: `Solde bonus (${getCurrencyLabel()})`, key: 'solde' },
  ];

  const exportRows = [
    {
      client: `Taux : international ${formData.taux_international}%, national ${formData.taux_national}%, enlèvement ${formData.taux_enlevement}%, marketplace ${formData.taux_marketplace}%`,
      telephone: '', code_parrainage: '', filleuls: '', solde: '',
    },
    ...filteredClients.map((c) => ({
      client: `${c.nom || ''} ${c.prenoms || ''}`.trim(),
      telephone: c.telephone || '',
      code_parrainage: c.code_parrainage || '',
      filleuls: c.filleuls_count ?? 0,
      solde: parseFloat(c.solde_parrainage) || 0,
    })),
  ];

  const inputBase = "w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors placeholder:text-slate-400 text-sm font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
  const labelBase = "text-sm font-semibold text-slate-700 flex items-center gap-1.5";

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Parrainage</h1>
            <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
              Taux de bonus et clients de votre pays
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openHistory}
              className="inline-flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              title="Historique des retraits"
            >
              <History className="h-4 w-4" />
              <span className="hidden md:inline">Retraits</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline md:ml-2">Rafraîchir</span>
            </button>

            <ExportButton
              columns={exportColumns}
              rows={exportRows}
              filename="parrainage"
              title="Parrainage"
            />
          </div>
        </header>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 md:gap-6 items-start">
        {/* Clients & parrainages */}
        <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden order-2 lg:order-1">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">Clients & parrainages</h2>
              <p className="text-xs text-slate-500">Clients inscrits dans votre pays, avec leur code et leur solde de bonus</p>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 border-b border-slate-100">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher (nom, code, téléphone)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400 text-black font-medium"
              />
            </div>
          </div>

          {isLoadingClients && clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <Loader2 className="h-8 w-8 text-slate-900 animate-spin mb-3" />
              <p className="text-slate-500 text-sm font-medium">Chargement...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="bg-slate-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <Users className="text-slate-400" size={24} />
              </div>
              <h3 className="font-bold text-slate-900">Aucun client trouvé</h3>
              <p className="text-slate-500 text-sm mt-1">Ajustez votre recherche.</p>
            </div>
          ) : (
            <>
              {/* Vue desktop : tableau dense, inchangé */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Client</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Code parrainage</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Filleuls</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Solde bonus</th>
                      <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredClients.map((client) => {
                      const solde = parseFloat(client.solde_parrainage) || 0;
                      const peutRetirer = canEdit && solde >= seuilRetrait;
                      return (
                      <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="font-semibold text-slate-900">{`${client.nom || ''} ${client.prenoms || ''}`.trim() || '—'}</div>
                          <div className="text-xs text-slate-500">{client.telephone || '—'}</div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-xs">
                            {client.code_parrainage || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-600 font-medium">{client.filleuls_count ?? 0}</td>
                        <td className="px-6 py-3 font-bold text-slate-900">{formatFCFA(client.solde_parrainage)}</td>
                        <td className="px-6 py-3 text-right">
                          {canEdit && (
                            <button
                              onClick={() => openRetraitModal(client)}
                              disabled={solde < seuilRetrait}
                              title={solde < seuilRetrait ? `Solde inférieur au seuil minimum (${formatFCFA(seuilRetrait)})` : 'Enregistrer un retrait'}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Banknote size={13} /> Retirer
                            </button>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vue mobile : cartes façon app, solde mis en avant comme
                  élément principal plutôt qu'une ligne de liste dense. */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const solde = parseFloat(client.solde_parrainage) || 0;
                  return (
                  <div key={client.id} className="p-4 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {(client.nom || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {`${client.nom || ''} ${client.prenoms || ''}`.trim() || '—'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px]">
                            {client.code_parrainage || '—'}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">{client.filleuls_count ?? 0} filleul{(client.filleuls_count ?? 0) > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-900 shrink-0 text-right">{formatFCFA(client.solde_parrainage)}</p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => openRetraitModal(client)}
                        disabled={solde < seuilRetrait}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Banknote size={13} /> Enregistrer un retrait
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Taux de bonus — affichage en lecture simple, édition via modal */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden order-1 lg:order-2 lg:sticky lg:top-24">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Gift size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900 text-sm">Taux de bonus</h2>
                <p className="text-xs text-slate-500">Sur la commission de l'agence de départ</p>
              </div>
            </div>
            {canEdit && !isLoadingTaux && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shrink-0"
              >
                <Pencil size={13} /> Modifier
              </button>
            )}
          </div>

          {isLoadingTaux ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <Loader2 className="h-8 w-8 text-slate-900 animate-spin mb-3" />
              <p className="text-slate-500 text-sm font-medium">Chargement...</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {TAUX_FIELDS.map((field) => (
                <div key={field.key} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-600 flex items-center gap-2 min-w-0">
                    <span className="truncate">{field.label}</span>
                    {field.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                        {field.badge}
                      </span>
                    )}
                  </span>
                  <span className="text-lg font-bold text-slate-900 shrink-0">
                    {formData[field.key] || 0}<span className="text-sm font-semibold text-slate-400">%</span>
                  </span>
                </div>
              ))}
              <div className="px-5 py-3.5 flex items-center justify-between gap-3 bg-slate-50/60">
                <span className="text-sm font-medium text-slate-600 min-w-0 truncate">Seuil minimum de retrait</span>
                <span className="text-lg font-bold text-slate-900 shrink-0">{formatFCFA(formData.seuil_retrait)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'édition des 4 taux */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Modifier les taux de bonus"
        subtitle="Parrainage"
        confirmFormId="taux-parrainage-form"
        confirmLabel="Enregistrer"
        isLoading={isSaving}
        size="md"
      >
        <form id="taux-parrainage-form" onSubmit={handleSubmit} className="space-y-4">
          {TAUX_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className={labelBase}>
                {field.label}
                {field.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    {field.badge}
                  </span>
                )}
              </label>
              <div className="relative">
                <Percent className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name={field.key}
                  type="number" min="0" max="100" step="0.1"
                  value={formData[field.key]}
                  onChange={handleChange}
                  placeholder="Ex: 10"
                  className={inputBase}
                />
              </div>
            </div>
          ))}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className={labelBase}>Seuil minimum de retrait ({getCurrencyLabel()})</label>
            <div className="relative">
              <Wallet className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="seuil_retrait"
                type="number" min="0" step="1"
                value={formData.seuil_retrait}
                onChange={handleChange}
                placeholder="Ex: 1000"
                className={inputBase}
              />
            </div>
            <p className="text-xs text-slate-500">Montant en dessous duquel un client ne peut pas encore demander de retrait.</p>
          </div>
        </form>
      </Modal>

      {/* Modal d'enregistrement d'un retrait manuel */}
      <Modal
        isOpen={!!retraitClient}
        onClose={closeRetraitModal}
        title="Enregistrer un retrait"
        subtitle={retraitClient ? `${retraitClient.nom || ''} ${retraitClient.prenoms || ''}`.trim() : ''}
        confirmFormId="retrait-parrainage-form"
        confirmLabel="Enregistrer"
        isLoading={isSavingRetrait}
        size="md"
      >
        {retraitClient && (
          <form id="retrait-parrainage-form" onSubmit={handleRetraitSubmit} className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Solde disponible</span>
              <span className="text-lg font-bold text-slate-900">{formatFCFA(retraitClient.solde_parrainage)}</span>
            </div>
            <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 text-amber-700 rounded-lg px-3 py-2">
              Le paiement se fait hors application (le client a été payé en agence ou directement par le backoffice) : ce formulaire ne fait qu'en tracer la preuve.
            </p>
            <div className="space-y-1.5">
              <label className={labelBase}>Montant retiré ({getCurrencyLabel()})</label>
              <div className="relative">
                <Banknote className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number" min={seuilRetrait} max={retraitClient.solde_parrainage} step="1"
                  value={retraitMontant}
                  onChange={(e) => setRetraitMontant(e.target.value)}
                  placeholder={`Min. ${seuilRetrait}`}
                  className={inputBase}
                  required
                />
              </div>
              <p className="text-xs text-slate-500">Minimum {formatFCFA(seuilRetrait)}, retrait partiel autorisé.</p>
            </div>
            <div className="space-y-1.5">
              <label className={labelBase}>Notes (optionnel)</label>
              <textarea
                value={retraitNotes}
                onChange={(e) => setRetraitNotes(e.target.value)}
                placeholder="Ex : payé en espèces au guichet, référence..."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors placeholder:text-slate-400 text-sm font-medium text-slate-900 resize-none"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Modal historique des retraits */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Historique des retraits"
        subtitle="Parrainage"
        size="lg"
      >
        {isLoadingRetraits ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-slate-900 animate-spin mb-3" />
            <p className="text-slate-500 text-sm font-medium">Chargement...</p>
          </div>
        ) : (retraits || []).length === 0 ? (
          <div className="py-12 text-center">
            <div className="bg-slate-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
              <History className="text-slate-400" size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Aucun retrait enregistré</h3>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 -mx-6">
            {retraits.map((r) => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {`${r.parrain?.nom || ''} ${r.parrain?.prenoms || ''}`.trim() || '—'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {formatDateTime(r.created_at)} · par {`${r.enregistre_par?.nom || ''} ${r.enregistre_par?.prenoms || ''}`.trim() || '—'}
                  </p>
                  {r.notes && <p className="text-xs text-slate-400 italic mt-0.5 truncate">{r.notes}</p>}
                </div>
                <span className="font-bold text-slate-900 shrink-0">{formatFCFA(r.montant)}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Parrainage;
