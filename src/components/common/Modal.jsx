import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Loader2 } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  footer,
  onConfirm,
  confirmLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  isLoading = false,
  confirmVariant = 'primary',
  confirmFormId,
  showCloseButton = true,
  confirmDisabled = false,
  // 'center' (par défaut) = dialogue centré classique.
  // 'right' = tiroir plein hauteur collé au bord droit (desktop uniquement,
  // repasse en dialogue centré sur mobile pour rester utilisable).
  position = 'center'
}) => {
  // Verrouille le scroll de la page de fond tant que le modal est ouvert.
  // `overflow: hidden` seul ne suffit pas ici : la page a son propre scroll
  // interne (le <main> du Layout, pas <body>), qui peut continuer de
  // défiler/grandir sous le modal fixe. On fige le body en `position: fixed`
  // à sa position de scroll actuelle (technique de "scroll lock" standard),
  // ce qui bloque tout défilement de la page quel que soit l'élément
  // scrollable concerné, puis on restaure exactement la position au ferme.
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Rendu directement sur document.body (au lieu de #modal-root) : garantit
  // que le portail est un enfant direct de <body>, sans dépendre de la
  // position de #modal-root dans le DOM ni d'un éventuel ancêtre qui
  // casserait le containing block de `position: fixed`.
  const portalRoot = document.body;

  // Couleur d'en-tête unique pour tous les modals du backoffice (convention
  // globale, pas un choix par modal) : accent indigo léger au lieu du blanc
  // plat historique.
  const headerTheme = {
    bg: 'bg-indigo-50/70', border: 'border-indigo-100', title: 'text-indigo-950', subtitle: 'text-indigo-500', close: 'text-indigo-300 hover:text-indigo-900 hover:bg-indigo-100'
  };

  const sizeClasses = {
    'xs': 'max-w-xs',
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    'full': 'max-w-[95vw]'
  };

  const renderFooter = () => {
    if (footer) return footer;

    if (onConfirm || confirmFormId) {
      return (
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            {...(confirmFormId ? { form: confirmFormId, type: 'submit' } : { type: 'button', onClick: onConfirm })}
            disabled={isLoading || confirmDisabled}
            className={`px-6 py-2.5 ${confirmVariant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'} text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg disabled:opacity-50`}
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : confirmLabel}
          </button>
        </>
      );
    }
    return null;
  };

  const finalFooter = renderFooter();
  const isRight = position === 'right';

  const modalContent = (
    <div
      className={`flex p-4 ${isRight ? 'md:p-0 md:items-stretch md:justify-end' : 'items-center justify-center'}`}
      // Styles inline (pas de classe Tailwind) pour le positionnement racine :
      // garantit `position: fixed` par rapport au vrai viewport quel que soit
      // l'état de purge CSS ou un ancêtre qui casserait le containing block.
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card / Drawer */}
      <div
        className={
          isRight
            ? `relative w-full ${sizeClasses[size] || sizeClasses['lg']} bg-white shadow-xl border border-slate-200 overflow-hidden max-h-[95vh] rounded-xl animate-in zoom-in-95 fade-in duration-300 md:max-h-[100dvh] md:h-[100dvh] md:rounded-none md:border-y-0 md:border-r-0 md:animate-slide-in-right`
            : `relative w-full ${sizeClasses[size] || sizeClasses['lg']} bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-[95vh] animate-in zoom-in-95 fade-in duration-300`
        }
        style={{ display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b flex justify-between items-center z-10 ${headerTheme.bg} ${headerTheme.border}`} style={{ flexShrink: 0 }}>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${headerTheme.title}`}>
              {title}
            </h2>
            {subtitle && <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${headerTheme.subtitle}`}>{subtitle}</p>}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${headerTheme.close}`}
            >
              <X size={26} />
            </button>
          )}
        </div>

        {/* Body */}
        <div
          className="overflow-y-auto custom-scrollbar p-6"
          style={{ flex: '1 1 auto', minHeight: 0 }}
        >
          {children}
        </div>

        {/* Footer */}
        {finalFooter && (
          <div
            className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between z-10"
            style={{ flexShrink: 0 }}
          >
            {finalFooter}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, portalRoot);
};

export default Modal;
