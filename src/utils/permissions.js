/**
 * Miroir client de app/Support/Permissions/PageResourceMap.php (contexte
 * backoffice) — correspondance entre les anciennes clés de page (utilisées
 * par Sidebar/ProtectedRoute pour le filtrage menu/route) et les ressources
 * granulaires qu'elles recouvrent.
 */
export const PAGE_RESOURCE_MAP = {
  dashboard: ["dashboard"],
  parcels: ["colis", "expeditions"],
  incoming_parcels: ["colis", "expeditions"],
  historique: ["historique"],
  agence_partenaire: ["agence_partenaire"],
  comptabilite: ["comptabilite"],
  communication: ["communication", "announcements"],
  tarification: ["tarification_simple", "tarification_groupage"],
  zone_configuration: ["zones"],
  produits: ["produits", "product_categories"],
  agents: ["agents"],
};

/**
 * Check fin : l'utilisateur possède-t-il la permission "resource.action" ?
 * Admin de backoffice = toujours vrai. Agent sans rôle assigné = toujours
 * vrai (même sémantique que le backend, User::hasPermission()).
 */
export function hasPermission(user, isAdmin, permissionKey) {
  if (isAdmin || !user?.role_id) return true;
  const permissions = user?.role_details?.permissions || [];
  return permissions.includes(permissionKey);
}

/**
 * Check large : l'utilisateur a-t-il au moins une permission sur une
 * ressource mappée à cette page ? Dérivé de hasPermission(), pour le
 * filtrage menu/route (Sidebar, ProtectedRoute).
 */
export function canAccessPage(user, isAdmin, pageKey) {
  if (isAdmin || !pageKey) return true;
  if (!user?.role_id) return true;

  const permissions = user?.role_details?.permissions || [];
  const resources = PAGE_RESOURCE_MAP[pageKey] || [];

  return permissions.some((key) => {
    const resource = key.split(".")[0];
    return resources.includes(resource);
  });
}
