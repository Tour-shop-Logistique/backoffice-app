import React from 'react';
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
  confirmDisabled = false
}) => {
  if (!isOpen) return null;

  const portalRoot = document.getElementById('modal-root');
  if (!portalRoot) return null;

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
            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : confirmLabel}
          </button>
        </>
      );
    }
    return null;
  };

  const finalFooter = renderFooter();

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full ${sizeClasses[size] || sizeClasses['lg']} bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 fade-in duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            {subtitle && <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{subtitle}</p>}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {children}
        </div>

        {/* Footer */}
        {finalFooter && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between sticky bottom-0 z-10">
            {finalFooter}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, portalRoot);
};

export default Modal;
