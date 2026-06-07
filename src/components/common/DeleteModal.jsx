import React from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import Modal from './Modal';

/**
 * Composant de modal unique pour toutes les suppressions de l'application.
 * Offre une interface cohérente (icône rouge, message d'avertissement, boutons stylisés).
 */
const DeleteModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmation de suppression",
    itemName = "",
    message = "",
    isLoading = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            onConfirm={onConfirm}
            isLoading={isLoading}
            confirmLabel="Supprimer"
            confirmVariant="danger"
        >
            <div className="flex flex-col items-center text-center p-2">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="text-red-500" size={24} />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {message || (
                        <>
                            Êtes-vous sûr de vouloir supprimer <span className="font-bold text-slate-900">{itemName || "cet élément"}</span> ?
                            <br />
                            <span className="text-xs text-red-500 mt-2 block italic">Cette action est irréversible.</span>
                        </>
                    )}
                </p>
            </div>
        </Modal>
    );
};

export default DeleteModal;
