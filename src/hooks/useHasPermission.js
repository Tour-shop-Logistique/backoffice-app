import { useSelector } from 'react-redux';
import { hasPermission } from '../utils/permissions';

/**
 * Hook de gating au niveau action (ex: "colis.block") — complète le
 * filtrage page-level existant (Sidebar/ProtectedRoute) pour cacher/désactiver
 * des boutons précis selon le rôle de l'agent connecté.
 */
export default function useHasPermission(permissionKey) {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'is_backoffice_admin';
  return hasPermission(user, isAdmin, permissionKey);
}
