import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { PHONE_COUNTRY_OPTIONS, sanitizePhoneDigits, isPhoneLengthValid } from '../../utils/phoneCountries';

// Retire les accents pour que "cote divoire" trouve "Côte d'Ivoire".
const stripAccents = (value) => value.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Champ téléphone à deux parties : indicatif pays (obligatoire, choisi dans
 * une liste déroulante compacte - voir PHONE_COUNTRY_OPTIONS) + numéro local
 * (chiffres uniquement, tout autre caractère saisi est filtré à la volée).
 * Les deux valeurs restent séparées côté formulaire, cohérent avec le
 * stockage backend (`indicatif_telephone` + `telephone`, voir
 * AuthController::register()).
 *
 * L'indicatif sélectionné n'affiche que "+225" (pas le nom du pays) une fois
 * choisi, pour laisser toute la place au numéro local - le nom du pays reste
 * cherchable/visible dans la liste déroulante elle-même. La longueur du
 * numéro local (maxLength de l'input + message d'erreur) s'adapte au pays
 * sélectionné (voir PHONE_COUNTRY_OPTIONS.maxLength / isPhoneLengthValid).
 *
 * La liste déroulante se rend via un portail (document.body), en position
 * fixed calculée depuis le bouton - sans ça, un ancêtre avec overflow-hidden
 * (ex: une carte de formulaire) tronque le menu au lieu de le laisser flotter
 * par-dessus le reste de la page (bug rencontré et corrigé).
 *
 * @param {string} dialCode - Indicatif sélectionné (ex: "+225"), '' si aucun.
 * @param {string} localNumber - Numéro local déjà nettoyé (chiffres seuls).
 * @param {(dialCode: string) => void} onDialCodeChange
 * @param {(localNumber: string) => void} onLocalNumberChange
 */
const PhoneInput = ({
    dialCode,
    localNumber,
    onDialCodeChange,
    onLocalNumberChange,
    required = true,
    inputClassName = '',
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [menuPos, setMenuPos] = useState(null);
    const containerRef = useRef(null);
    const menuRef = useRef(null);

    const selected = PHONE_COUNTRY_OPTIONS.find((c) => c.dialCode === dialCode);
    const lengthOk = isPhoneLengthValid(dialCode, localNumber);

    const filteredOptions = PHONE_COUNTRY_OPTIONS.filter((c) =>
        stripAccents(c.name.toLowerCase()).includes(stripAccents(searchTerm.toLowerCase()))
    );

    const updateMenuPos = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMenuPos({
            top: rect.bottom + 4,
            left: rect.left,
            width: Math.max(rect.width, 288), // 288px = largeur mini confortable pour les noms de pays
        });
    };

    useEffect(() => {
        if (!isOpen) return;

        updateMenuPos();

        const handleClickOutside = (event) => {
            if (
                containerRef.current && !containerRef.current.contains(event.target)
                && menuRef.current && !menuRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        // Recalcule la position si la page défile/redimensionne pendant que
        // le menu est ouvert (capture:true pour suivre le scroll d'un
        // conteneur interne, pas seulement window).
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', updateMenuPos, true);
        window.addEventListener('resize', updateMenuPos);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateMenuPos, true);
            window.removeEventListener('resize', updateMenuPos);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleSelect = (country) => {
        onDialCodeChange(country.dialCode);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="grid grid-cols-[6.5rem_1fr] gap-2">
            <div className="relative" ref={containerRef}>
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen((o) => !o)}
                    disabled={disabled}
                    className={`${inputClassName} !rounded-lg w-full flex items-center justify-between gap-1 !px-3 text-left`}
                >
                    <span className={selected ? '' : 'text-slate-400'}>
                        {selected ? selected.dialCode : 'Indicatif'}
                    </span>
                    <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && !disabled && menuPos && createPortal(
                    <div
                        ref={menuRef}
                        className="fixed bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                        // z-index au-dessus de Modal.jsx (9999) : même correction
                        // que SearchableDropdown - un menu en portail sous un
                        // modal serait invisible sans erreur visible.
                        style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 10050 }}
                    >
                        <input
                            type="text"
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher un pays..."
                            className="w-full px-3 py-2.5 text-sm border-b border-slate-100 outline-none"
                        />
                        <div className="max-h-60 overflow-y-auto">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((country) => (
                                    <div
                                        key={country.code}
                                        onClick={() => handleSelect(country)}
                                        className={`px-3 py-2 cursor-pointer text-sm flex items-center justify-between gap-2 transition-colors ${country.dialCode === dialCode
                                            ? 'bg-slate-100 font-semibold text-slate-900'
                                            : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                    >
                                        <span className="truncate">{country.name}</span>
                                        <span className="text-slate-400 shrink-0">{country.dialCode}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-3 text-center text-sm text-slate-400">Aucun résultat</div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            <div>
                <input
                    type="tel"
                    inputMode="numeric"
                    required={required}
                    value={localNumber}
                    maxLength={selected?.maxLength}
                    onChange={(e) => onLocalNumberChange(sanitizePhoneDigits(e.target.value))}
                    onPaste={(e) => {
                        e.preventDefault();
                        const pasted = sanitizePhoneDigits(e.clipboardData.getData('text'));
                        onLocalNumberChange(sanitizePhoneDigits(`${localNumber}${pasted}`).slice(0, selected?.maxLength));
                    }}
                    disabled={disabled}
                    className={inputClassName}
                    placeholder={selected ? '0'.repeat(selected.maxLength) : 'XX XX XX XX'}
                />
                {!lengthOk && (
                    <p className="mt-1 ml-1 text-sm font-medium text-red-500">
                        Numéro invalide pour {selected.name} (attendu : {selected.maxLength} chiffres).
                    </p>
                )}
            </div>
        </div>
    );
};

export default PhoneInput;
