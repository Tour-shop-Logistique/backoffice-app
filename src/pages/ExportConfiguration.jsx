import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download, ShieldCheck, CheckCircle2, CircleDashed, Loader2, FileSpreadsheet } from 'lucide-react';
import { fetchTarifs, fetchGroupedTarifs, fetchIntervilleTarifs, fetchEnlevementTranchesKm, fetchFormatsColis } from '../redux/slices/tarificationSlice';
import { fetchCommunes } from '../redux/slices/communeSlice';
import { fetchZones } from '../redux/slices/zoneSlice';
import { fetchLivreurs } from '../redux/slices/livreurSlice';
import { fetchAgents } from '../redux/slices/agentSlice';
import { fetchRoles } from '../redux/slices/roleSlice';
import { fetchTauxParrainage, fetchParrainageClients } from '../redux/slices/parrainageSlice';
import { getCurrencyLabel } from '../utils/format';
import { fetchAgences } from '../redux/slices/agenceSlice';
import { fetchProduits, fetchCategories } from '../redux/slices/produitSlice';
import { showNotification } from '../redux/slices/uiSlice';
import { exportMultiSheetExcel } from '../utils/excelHelper';
import { getCountryName } from '../utils/countries';
import { getStore } from '../redux/storeAccessor';
import { sortFormatsColisParTaille } from '../utils/formatColisSort';

/**
 * Page "Tout exporter" : filet de sécurité anti-incident (voir contexte de
 * l'incident du 2026-09-08 - perte de données de production sans sauvegarde
 * disponible à l'époque). Complète la sauvegarde automatique quotidienne
 * côté serveur : permet à tout admin de backoffice de garder, hors base de
 * données, une copie de sa configuration qu'il peut régénérer à la demande.
 *
 * Charge (si besoin) puis exporte en un seul classeur Excel multi-onglets
 * les mêmes données que les boutons d'export individuels de chaque page de
 * configuration - un onglet par config.
 */

const CONFIG_ITEMS = [
  { key: 'tarifsSimples', label: 'Tarifs simples' },
  { key: 'tarifsGroupes', label: 'Tarifs groupés' },
  { key: 'tarifsInterville', label: 'Tarifs interville' },
  { key: 'tarifsEnlevement', label: 'Tarifs enlèvement & livraison à domicile' },
  { key: 'formatsColis', label: 'Formats de colis' },
  { key: 'communes', label: 'Communes' },
  { key: 'zones', label: 'Zones géographiques' },
  { key: 'livreurs', label: 'Livreurs' },
  { key: 'agents', label: 'Agents' },
  { key: 'roles', label: 'Rôles & permissions' },
  { key: 'parrainage', label: 'Parrainage (taux + clients)' },
  { key: 'agences', label: 'Agences partenaires' },
  { key: 'produits', label: 'Produits' },
  { key: 'categories', label: 'Catégories de produits' },
];

export default function ExportConfiguration() {
  const dispatch = useDispatch();
  const [isExporting, setIsExporting] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');

  const tarification = useSelector((state) => state.tarification);
  const { communes, hasLoaded: communesHasLoaded } = useSelector((state) => state.communes);
  const { zones, hasLoaded: zonesHasLoaded } = useSelector((state) => state.zones);
  const { livreurs, hasLoaded: livreursHasLoaded } = useSelector((state) => state.livreurs);
  const { agents, hasLoaded: agentsHasLoaded } = useSelector((state) => state.agents);
  const { roles, hasLoaded: rolesHasLoaded } = useSelector((state) => state.roles);
  const { taux, clients, tauxHasLoaded, clientsHasLoaded } = useSelector((state) => state.parrainage);
  const { agences, hasLoaded: agencesHasLoaded } = useSelector((state) => state.agences);
  const { listProduits, categories, hasLoadedProduits, hasLoadedCategories } = useSelector((state) => state.produits);

  const loadedStatus = useMemo(() => ({
    tarifsSimples: tarification.hasLoaded,
    tarifsGroupes: tarification.groupedHasLoaded,
    tarifsInterville: tarification.intervilleHasLoaded,
    tarifsEnlevement: tarification.enlevementTranchesKmHasLoaded,
    formatsColis: tarification.formatsColisHasLoaded,
    communes: communesHasLoaded,
    zones: zonesHasLoaded,
    livreurs: livreursHasLoaded,
    agents: agentsHasLoaded,
    roles: rolesHasLoaded,
    parrainage: tauxHasLoaded && clientsHasLoaded,
    agences: agencesHasLoaded,
    produits: hasLoadedProduits,
    categories: hasLoadedCategories,
  }), [
    tarification.hasLoaded, tarification.groupedHasLoaded, tarification.intervilleHasLoaded,
    tarification.enlevementTranchesKmHasLoaded, tarification.formatsColisHasLoaded,
    communesHasLoaded, zonesHasLoaded, livreursHasLoaded, agentsHasLoaded, rolesHasLoaded,
    tauxHasLoaded, clientsHasLoaded, agencesHasLoaded, hasLoadedProduits, hasLoadedCategories,
  ]);

  const allLoaded = CONFIG_ITEMS.every((item) => loadedStatus[item.key]);

  const getTypeLabel = (type) => ({
    groupage: 'Groupage',
    dhd_aerien: 'DHD Aérien',
    dhd_maritime: 'DHD Maritime',
  }[type] || type || '');

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      setProgressLabel('Chargement des configurations manquantes...');
      // Charge en parallèle uniquement ce qui n'est pas déjà en mémoire, en
      // relisant l'état Redux à jour à chaque unwrap (chaque thunk alimente
      // son propre slice, aucune dépendance entre eux).
      const tasks = [];
      if (!tarification.hasLoaded) tasks.push(dispatch(fetchTarifs()).unwrap());
      if (!tarification.groupedHasLoaded) tasks.push(dispatch(fetchGroupedTarifs()).unwrap());
      if (!tarification.intervilleHasLoaded) tasks.push(dispatch(fetchIntervilleTarifs()).unwrap());
      if (!tarification.enlevementTranchesKmHasLoaded) tasks.push(dispatch(fetchEnlevementTranchesKm()).unwrap());
      if (!tarification.formatsColisHasLoaded) tasks.push(dispatch(fetchFormatsColis()).unwrap());
      if (!communesHasLoaded) tasks.push(dispatch(fetchCommunes()).unwrap());
      if (!zonesHasLoaded) tasks.push(dispatch(fetchZones()).unwrap());
      if (!livreursHasLoaded) tasks.push(dispatch(fetchLivreurs()).unwrap());
      if (!agentsHasLoaded) tasks.push(dispatch(fetchAgents()).unwrap());
      if (!rolesHasLoaded) tasks.push(dispatch(fetchRoles()).unwrap());
      if (!tauxHasLoaded) tasks.push(dispatch(fetchTauxParrainage()).unwrap());
      if (!clientsHasLoaded) tasks.push(dispatch(fetchParrainageClients()).unwrap());
      if (!agencesHasLoaded) tasks.push(dispatch(fetchAgences()).unwrap());
      if (!hasLoadedProduits) tasks.push(dispatch(fetchProduits()).unwrap());
      if (!hasLoadedCategories) tasks.push(dispatch(fetchCategories()).unwrap());

      await Promise.all(tasks);

      setProgressLabel('Génération du fichier Excel...');

      // Relit le state Redux à jour après chargement : les variables issues
      // de useSelector plus haut peuvent être obsolètes ici (pas de re-render
      // entre le Promise.all et ce point), donc on repasse par le store
      // directement (voir storeAccessor.js).
      const state = getStore().getState();
      const t = state.tarification;

      const sheets = [
        {
          name: 'Tarifs simples',
          columns: [
            { header: 'Indice', key: 'indice' },
            { header: 'Destination', key: 'destination' },
            { header: `Montant Base (${getCurrencyLabel()})`, key: 'montant_base' },
            { header: '% Prestation', key: 'pourcentage_prestation' },
            { header: `Montant Prestation (${getCurrencyLabel()})`, key: 'montant_prestation' },
            { header: `Total (${getCurrencyLabel()})`, key: 'total' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (t.tarifs || []).map((tarif) => {
            const mb = parseFloat(tarif.montant_base) || 0;
            const pp = parseFloat(tarif.pourcentage_prestation) || 0;
            const mp = mb * (pp / 100);
            return {
              indice: tarif.indice,
              destination: tarif.zone?.nom || tarif.pays || '',
              montant_base: mb,
              pourcentage_prestation: pp,
              montant_prestation: mp,
              total: mb + mp,
              actif: tarif.actif ? 'Oui' : 'Non',
            };
          }),
        },
        {
          name: 'Tarifs groupés',
          columns: [
            { header: 'Type', key: 'type' },
            { header: 'Catégorie', key: 'categorie' },
            { header: 'Itinéraire / Pays', key: 'itineraire' },
            { header: `Montant Base (${getCurrencyLabel()})`, key: 'montant_base' },
            { header: '% Prestation', key: 'pourcentage_prestation' },
            { header: `Montant Prestation (${getCurrencyLabel()})`, key: 'montant_prestation' },
            { header: `Total (${getCurrencyLabel()})`, key: 'total' },
            { header: `Total Minimum (${getCurrencyLabel()})`, key: 'total_minimum' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (t.groupedTarifs || []).map((tarif) => {
            const base = parseFloat(tarif.tarif_minimum || tarif.montant_base) || 0;
            const prest = parseFloat(tarif.pourcentage_prestation) || 0;
            const mp = parseFloat(tarif.montant_prestation) || base * prest / 100;
            const exp = parseFloat(tarif.montant_expedition) || base + mp;
            return {
              type: getTypeLabel(tarif.type_expedition),
              categorie: tarif.categorie?.nom || tarif.categorie_nom || '',
              itineraire: tarif.zone?.nom || tarif.pays || tarif.itineraire || '',
              montant_base: base,
              pourcentage_prestation: prest,
              montant_prestation: mp,
              total: exp,
              total_minimum: parseFloat(tarif.tarif_minimum) || base,
              actif: tarif.actif ? 'Oui' : 'Non',
            };
          }),
        },
        {
          name: 'Tarifs interville',
          columns: [
            { header: 'Commune A', key: 'commune_a' },
            { header: 'Commune B', key: 'commune_b' },
            { header: 'Format', key: 'format' },
            { header: `Montant Base (${getCurrencyLabel()})`, key: 'montant_base' },
            { header: '% Commission départ', key: 'pourcentage_commission_depart' },
            { header: '% Commission arrivée', key: 'pourcentage_commission_arrivee' },
            { header: `Total (${getCurrencyLabel()})`, key: 'total' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (t.intervilleTarifs || []).map((tarif) => {
            const mb = parseFloat(tarif.montant_base) || 0;
            const mDepart = parseFloat(tarif.montant_commission_depart) || 0;
            const mArrivee = parseFloat(tarif.montant_commission_arrivee) || 0;
            return {
              commune_a: tarif.commune_a?.nom || '',
              commune_b: tarif.commune_b?.nom || '',
              format: tarif.format_colis?.nom || '',
              montant_base: mb,
              pourcentage_commission_depart: parseFloat(tarif.pourcentage_commission_depart) || 0,
              pourcentage_commission_arrivee: parseFloat(tarif.pourcentage_commission_arrivee) || 0,
              total: parseFloat(tarif.montant_expedition) || (mb + mDepart + mArrivee),
              actif: tarif.actif ? 'Oui' : 'Non',
            };
          }),
        },
        {
          name: 'Enlevement-Livraison dom.',
          columns: [
            { header: 'Commune', key: 'commune' },
            { header: 'Véhicule', key: 'vehicule' },
            { header: 'Km min', key: 'km_min' },
            { header: 'Km max', key: 'km_max' },
            { header: `Montant (${getCurrencyLabel()})`, key: 'montant' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (t.enlevementTranchesKm || []).map((tr) => ({
            commune: state.communes.communes.find(c => String(c.id) === String(tr.commune_id || tr.commune?.id))?.nom || tr.commune?.nom || '',
            vehicule: tr.type_vehicule || 'moto',
            km_min: parseFloat(tr.km_min) || 0,
            km_max: tr.km_max == null ? 'Illimité' : parseFloat(tr.km_max),
            montant: parseFloat(tr.montant) || 0,
            actif: tr.actif ? 'Oui' : 'Non',
          })),
        },
        {
          name: 'Formats de colis',
          columns: [
            { header: 'Rang', key: 'rang' },
            { header: 'Nom', key: 'nom' },
            { header: 'Poids max (kg)', key: 'poids_max' },
            { header: 'Longueur max (cm)', key: 'longueur_max' },
            { header: 'Largeur max (cm)', key: 'largeur_max' },
            { header: 'Hauteur max (cm)', key: 'hauteur_max' },
            { header: 'Par défaut', key: 'is_default' },
          ],
          rows: sortFormatsColisParTaille(t.formatsColis).map((f, i) => ({
            rang: i + 1,
            nom: f.nom,
            poids_max: f.poids_max == null ? 'Illimité' : Number(f.poids_max),
            longueur_max: f.longueur_max == null ? 'Illimité' : Number(f.longueur_max),
            largeur_max: f.largeur_max == null ? 'Illimité' : Number(f.largeur_max),
            hauteur_max: f.hauteur_max == null ? 'Illimité' : Number(f.hauteur_max),
            is_default: f.is_default ? 'Oui' : 'Non',
          })),
        },
        {
          name: 'Communes',
          columns: [
            { header: 'Commune', key: 'nom' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (state.communes.communes || []).map((c) => ({
            nom: c.nom,
            actif: c.actif ? 'Oui' : 'Non',
          })),
        },
        {
          name: 'Zones geographiques',
          columns: [
            { header: 'Zone', key: 'nom' },
            { header: 'Pays', key: 'pays' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (state.zones.zones || []).map((zone) => {
            const codes = Array.isArray(zone.pays_codes) ? zone.pays_codes : [];
            const paysNoms = codes.length > 0 ? codes.map(getCountryName) : (Array.isArray(zone.pays) ? zone.pays : []);
            return {
              nom: zone.nom,
              pays: paysNoms.join(', '),
              actif: zone.actif ? 'Oui' : 'Non',
            };
          }),
        },
        {
          name: 'Livreurs',
          columns: [
            { header: 'Nom', key: 'nom' },
            { header: 'Prénoms', key: 'prenoms' },
            { header: 'Téléphone', key: 'telephone' },
            { header: 'Véhicule', key: 'vehicule' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (state.livreurs.livreurs || []).map((livreur) => ({
            nom: livreur.user?.nom || '',
            prenoms: livreur.user?.prenoms || '',
            telephone: livreur.user?.telephone || '',
            vehicule: livreur.type_vehicule || '',
            actif: livreur.user?.actif ? 'Oui' : 'Non',
          })),
        },
        {
          name: 'Agents',
          columns: [
            { header: 'Nom', key: 'nom' },
            { header: 'Prénoms', key: 'prenoms' },
            { header: 'Téléphone', key: 'telephone' },
            { header: 'Email', key: 'email' },
            { header: 'Rôle', key: 'role' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (state.agents.agents || []).map((agent) => ({
            nom: agent.nom || '',
            prenoms: agent.prenoms || '',
            telephone: agent.telephone || '',
            email: agent.email || '',
            role: agent.custom_role?.nom || (agent.role === 'is_backoffice_admin' ? 'Administrateur' : ''),
            actif: agent.actif ? 'Oui' : 'Non',
          })),
        },
        {
          name: 'Roles et permissions',
          columns: [
            { header: 'Nom', key: 'nom' },
            { header: 'Description', key: 'description' },
            { header: 'Permissions', key: 'permissions' },
          ],
          rows: (state.roles.roles || []).map((role) => ({
            nom: role.nom || '',
            description: role.description || '',
            permissions: (role.permissions || []).join(', '),
          })),
        },
        {
          name: 'Parrainage',
          columns: [
            { header: 'Client', key: 'client' },
            { header: 'Téléphone', key: 'telephone' },
            { header: 'Code parrainage', key: 'code_parrainage' },
            { header: 'Filleuls', key: 'filleuls' },
            { header: `Solde bonus (${getCurrencyLabel()})`, key: 'solde' },
          ],
          rows: [
            {
              client: `Taux : international ${state.parrainage.taux?.taux_international ?? ''}%, national ${state.parrainage.taux?.taux_national ?? ''}%, enlèvement ${state.parrainage.taux?.taux_enlevement ?? ''}%, marketplace ${state.parrainage.taux?.taux_marketplace ?? ''}%`,
              telephone: '', code_parrainage: '', filleuls: '', solde: '',
            },
            ...(state.parrainage.clients || []).map((c) => ({
              client: `${c.nom || ''} ${c.prenoms || ''}`.trim(),
              telephone: c.telephone || '',
              code_parrainage: c.code_parrainage || '',
              filleuls: c.filleuls_count ?? 0,
              solde: parseFloat(c.solde_parrainage) || 0,
            })),
          ],
        },
        {
          name: 'Agences partenaires',
          columns: [
            { header: 'Code', key: 'code' },
            { header: 'Nom agence', key: 'nom' },
            { header: 'Commune', key: 'commune' },
            { header: 'Adresse', key: 'adresse' },
            { header: 'Téléphone', key: 'telephone' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (state.agences.agences || []).map((agence) => ({
            code: agence.code_agence || '',
            nom: agence.nom_agence || '',
            commune: agence.commune || '',
            adresse: agence.adresse || '',
            telephone: agence.telephone || '',
            actif: agence.actif ? 'Oui' : 'Non',
          })),
        },
        {
          name: 'Produits',
          columns: [
            { header: 'Référence', key: 'reference' },
            { header: 'Désignation', key: 'designation' },
            { header: 'Catégorie', key: 'categorie' },
            { header: 'Éligible LD', key: 'eligible_ld' },
            { header: 'Éligible Groupage Afrique', key: 'eligible_afrique' },
            { header: 'Éligible DHD Aérien', key: 'eligible_dhd_aerien' },
            { header: 'Éligible DHD Maritime', key: 'eligible_dhd_maritime' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (state.produits.listProduits || []).map((p) => ({
            reference: p.reference,
            designation: p.designation,
            categorie: state.produits.categories?.find(c => String(c.id) === String(p.category_id))?.nom || '',
            eligible_ld: p.eligible_ld === false ? 'Non' : 'Oui',
            eligible_afrique: p.eligible_afrique === false ? 'Non' : 'Oui',
            eligible_dhd_aerien: p.eligible_dhd_aerien === false ? 'Non' : 'Oui',
            eligible_dhd_maritime: p.eligible_dhd_maritime === false ? 'Non' : 'Oui',
            actif: p.actif ? 'Oui' : 'Non',
          })),
        },
        {
          name: 'Categories de produits',
          columns: [
            { header: 'Nom', key: 'nom' },
            { header: 'Actif', key: 'actif' },
          ],
          rows: (state.produits.categories || []).map((c) => ({
            nom: c.nom,
            actif: c.actif ? 'Oui' : 'Non',
          })),
        },
      ];

      setProgressLabel('Téléchargement...');
      exportMultiSheetExcel(sheets, 'configuration-complete');
      dispatch(showNotification({ type: 'success', message: 'Export terminé.' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: "Erreur lors de l'export global." }));
    } finally {
      setIsExporting(false);
      setProgressLabel('');
    }
  };

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <header className="space-y-1">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Sauvegarde des configurations
        </h1>
        <p className="text-sm md:text-base text-slate-500 font-medium">
          Exportez en un clic toute votre configuration dans un seul fichier Excel, pour pouvoir la reconstituer manuellement en cas d'incident.
        </p>
      </header>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Ces exports vous permettent de reconstituer manuellement votre configuration en cas d'incident.
          Pensez à les régénérer régulièrement, surtout après des changements importants de tarification.
        </p>
      </div>

      <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-slate-900">Configurations incluses</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {allLoaded ? 'Toutes déjà chargées en mémoire.' : 'Les configs non encore chargées seront récupérées avant l\'export.'}
            </p>
          </div>
          <button
            onClick={handleExportAll}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? (progressLabel || 'Export en cours...') : 'Tout exporter (Excel)'}
          </button>
        </div>

        <ul className="divide-y divide-slate-100">
          {CONFIG_ITEMS.map((item) => (
            <li key={item.key} className="px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-700">{item.label}</span>
              {loadedStatus[item.key] ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Chargé
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <CircleDashed className="h-4 w-4" /> Sera chargé à l'export
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <FileSpreadsheet className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          Le fichier généré contient un onglet par configuration listée ci-dessus, au même format que les exports disponibles sur chacune des pages de configuration correspondantes.
        </p>
      </div>
    </div>
  );
}
