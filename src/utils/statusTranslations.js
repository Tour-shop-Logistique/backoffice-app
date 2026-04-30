export const getExpeditionStatusLabel = (status) => {
  if (!status) return 'N/A';
  
  const statusMap = {
    'en_attente': 'En attente de validation',
    'pending': 'En attente de validation',
    'accepted': 'Validé par l\'agence',
    'refused': 'Refusé par l\'agence',
    'cancelled': 'Annulée par le client',
    'en_cours_enlevement': 'Enlèvement en cours',
    'en_cours_depot': 'En cours de depot',
    'recu_agence_depart': 'Reçu à l\'agence depart',
    'en_transit_entrepot': 'En transit vers l\'entrepôt',
    'depart_expedition_succes': 'Depart expedition avec succes',
    'arrivee_expedition_succes': 'Arrivée expedition avec succes',
    'recu_agence_destination': 'Reçu agence destination',
    'en_cours_livraison': 'En cours de livraison',
    'termined': 'Terminé',
    'paye': 'Payé',
    'non_paye': 'Non payé'
  };

  return statusMap[status.toLowerCase()] || status;
};

export const getStatusStyles = (status) => {
  const s = status?.toLowerCase();
  if (s === 'accepted' || s === 'termined' || s === 'depart_expedition_succes' || s === 'arrivee_expedition_succes') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
  if (s === 'en_attente' || s === 'pending' || s?.includes('en_cours')) {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  if (s === 'refused' || s === 'cancelled') {
    return 'bg-rose-50 text-rose-700 border-rose-100';
  }
  return 'bg-slate-50 text-slate-700 border-slate-100';
};
