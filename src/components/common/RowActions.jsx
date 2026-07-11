import { SquarePen, Trash2 } from 'lucide-react';

/**
 * Actions Modifier/Supprimer d'une ligne : deux boutons ronds séparés,
 * fond clair (pas de pilule sombre).
 */
const RowActions = ({ onEdit, onDelete, size = 15, className = '' }) => (
  <div className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
    {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        title="Modifier"
      >
        <SquarePen size={size} />
      </button>
    )}
    {onDelete && (
      <button
        type="button"
        onClick={onDelete}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
        title="Supprimer"
      >
        <Trash2 size={size} />
      </button>
    )}
  </div>
);

export default RowActions;
