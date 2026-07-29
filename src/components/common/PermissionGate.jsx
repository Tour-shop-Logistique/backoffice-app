import useHasPermission from '../../hooks/useHasPermission';

/**
 * Masque son contenu si l'agent connecté n'a pas la permission requise.
 * Cohérent avec le comportement de la Sidebar (élément absent, pas grisé).
 */
const PermissionGate = ({ permission, children, fallback = null }) => {
  const allowed = useHasPermission(permission);
  return allowed ? children : fallback;
};

export default PermissionGate;
