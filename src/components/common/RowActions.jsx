import { SquarePen, Trash2 } from 'lucide-react';

/**
 * Actions Modifier/Supprimer d'une ligne : deux boutons ronds séparés,
 * fond clair (pas de pilule sombre).
 */
const RowActions = ({ onEdit, onDelete, size = 17, className = '' }) => (
  <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
    {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-900 transition-colors"
        title="Modifier"
      >
        <SquarePen size={size} />
      </button>
    )}
    {onDelete && (
      <button
        type="button"
        onClick={onDelete}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 hover:text-rose-800 transition-colors"
        title="Supprimer"
      >
        <Trash2 size={size} />
      </button>
    )}
  </div>
);

export default RowActions;
