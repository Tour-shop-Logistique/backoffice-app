import { Eye } from 'lucide-react';

/**
 * Bouton "Voir détails" : cercle plein, fond bleu visible (pas transparent
 * tant qu'on ne survole pas), même gabarit que RowActions.
 */
const ViewDetailsButton = ({ onClick, size = 17, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-900 transition-colors shrink-0 ${className}`}
    title="Voir détails"
  >
    <Eye size={size} />
  </button>
);

export default ViewDetailsButton;
