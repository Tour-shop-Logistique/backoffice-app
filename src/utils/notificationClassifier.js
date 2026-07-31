/**
 * Construit une entrée de notification interne à partir d'un événement
 * WebSocket (model.updated) déjà diffusé par le backend. Retourne null si
 * (model, action) n'est pas un événement géré par le centre de notifications.
 */
export function classifyNotification(model, action, data, ctx = {}) {
  const items = Array.isArray(data) ? data : [data].filter(Boolean);
  const first = items[0] || {};

  const base = {
    id: `${model}-${action}-${first.id ?? Date.now()}`,
    model,
    action,
    read: false,
    createdAt: new Date().toISOString(),
  };

  if (model === 'Expedition' && action === 'payment_confirmed') {
    return {
      ...base,
      title: 'Paiement enregistré',
      message: `Un paiement a été enregistré pour l'expédition ${first.reference || ''}.`,
      link: '/comptabilite',
    };
  }

  if (model === 'Expedition' && action === 'frais_decision_agence') {
    const paye = first.decision === 'paye_maintenant';
    return {
      ...base,
      title: paye ? 'Frais annexes payés' : 'Frais annexes à percevoir à l\'arrivée',
      message: paye
        ? `L'agence a enregistré le paiement des frais annexes pour l'expédition ${first.reference || ''}.`
        : `L'agence a indiqué que les frais annexes de l'expédition ${first.reference || ''} seront perçus à l'arrivée.`,
      link: '/parcels',
    };
  }

  return null;
}
