import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";

/**
 * UI de configuration des permissions granulaires d'un rôle : une section
 * accordéon par ressource, chacune listant ses actions propres sous forme
 * de cases à cocher (pas une table matrice large — les ressources n'ont
 * pas le même nombre d'actions, une grille aurait beaucoup de cellules
 * vides et deviendrait illisible avec ~14 ressources).
 *
 * @param {Array<{key, label, actions: Array<{key, label}>}>} resources
 * @param {string[]} value - clés "resource.action" actuellement cochées
 * @param {(next: string[]) => void} onChange
 */
const PermissionMatrix = ({ resources, value, onChange }) => {
  const [expanded, setExpanded] = useState(() => new Set());

  const toggleExpanded = (resourceKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(resourceKey)) next.delete(resourceKey);
      else next.add(resourceKey);
      return next;
    });
  };

  const toggleAction = (permissionKey) => {
    if (value.includes(permissionKey)) {
      onChange(value.filter((k) => k !== permissionKey));
    } else {
      onChange([...value, permissionKey]);
    }
  };

  const toggleAllForResource = (resource) => {
    const keys = resource.actions.map((a) => `${resource.key}.${a.key}`);
    const allSelected = keys.every((k) => value.includes(k));
    if (allSelected) {
      onChange(value.filter((k) => !keys.includes(k)));
    } else {
      onChange([...new Set([...value, ...keys])]);
    }
  };

  if (!resources || resources.length === 0) {
    return <p className="text-sm text-slate-500 italic">Chargement des permissions disponibles...</p>;
  }

  return (
    <div className="space-y-2">
      {resources.map((resource) => {
        const keys = resource.actions.map((a) => `${resource.key}.${a.key}`);
        const selectedCount = keys.filter((k) => value.includes(k)).length;
        const isOpen = expanded.has(resource.key);

        return (
          <div key={resource.key} className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleExpanded(resource.key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-sm font-medium text-slate-900">{resource.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${selectedCount > 0 ? "text-slate-900" : "text-slate-400"}`}>
                  {selectedCount}/{keys.length}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAllForResource(resource);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      toggleAllForResource(resource);
                    }
                  }}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  {selectedCount === keys.length ? "Tout retirer" : "Tout sélectionner"}
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-white">
                {resource.actions.map((action) => {
                  const permissionKey = `${resource.key}.${action.key}`;
                  const checked = value.includes(permissionKey);
                  return (
                    <label
                      key={permissionKey}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                        checked ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAction(permissionKey)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-white border-white" : "border-slate-300"}`}>
                        {checked && <CheckCircle2 size={12} className="text-slate-900" />}
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PermissionMatrix;
