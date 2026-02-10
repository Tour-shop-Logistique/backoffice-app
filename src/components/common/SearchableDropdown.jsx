import React, { useState, useEffect, useRef } from 'react';

/**
 * Composant Dropdown avec recherche intégrée
 * 
 * @param {string} value - Valeur sélectionnée
 * @param {function} onChange - Callback appelé lors de la sélection (reçoit la valeur sélectionnée)
 * @param {array} options - Tableau d'options (strings ou objets avec label/value)
 * @param {string} placeholder - Texte du placeholder
 * @param {string} error - Message d'erreur (optionnel)
 * @param {string} themeColor - Couleur du thème ('amber', 'emerald', 'blue', 'purple', 'red')
 * @param {boolean} disabled - Désactiver le dropdown
 * @param {string} className - Classes CSS additionnelles
 */
const SearchableDropdown = ({
    value,
    onChange,
    options = [],
    placeholder = 'Rechercher...',
    error,
    themeColor = 'blue',
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Couleurs dynamiques basées sur le thème
    const colors = {
        amber: {
            icon: 'text-amber-500',
            iconDark: 'text-amber-600',
            ring: 'focus:ring-amber-500',
            border: 'focus:border-amber-500',
            hover: 'hover:border-amber-400',
            bgSelected: 'bg-amber-100',
            textSelected: 'text-amber-900',
            bgHover: 'hover:bg-amber-50'
        },
        emerald: {
            icon: 'text-emerald-500',
            iconDark: 'text-emerald-600',
            ring: 'focus:ring-emerald-500',
            border: 'focus:border-emerald-500',
            hover: 'hover:border-emerald-400',
            bgSelected: 'bg-emerald-100',
            textSelected: 'text-emerald-900',
            bgHover: 'hover:bg-emerald-50'
        },
        blue: {
            icon: 'text-blue-500',
            iconDark: 'text-blue-600',
            ring: 'focus:ring-blue-500',
            border: 'focus:border-blue-500',
            hover: 'hover:border-blue-400',
            bgSelected: 'bg-blue-100',
            textSelected: 'text-blue-900',
            bgHover: 'hover:bg-blue-50'
        },
        purple: {
            icon: 'text-purple-500',
            iconDark: 'text-purple-600',
            ring: 'focus:ring-purple-500',
            border: 'focus:border-purple-500',
            hover: 'hover:border-purple-400',
            bgSelected: 'bg-purple-100',
            textSelected: 'text-purple-900',
            bgHover: 'hover:bg-purple-50'
        },
        red: {
            icon: 'text-red-500',
            iconDark: 'text-red-600',
            ring: 'focus:ring-red-500',
            border: 'focus:border-red-500',
            hover: 'hover:border-red-400',
            bgSelected: 'bg-red-100',
            textSelected: 'text-red-900',
            bgHover: 'hover:bg-red-50'
        }
    };

    const theme = colors[themeColor] || colors.blue;

    // Normaliser les options (supporter strings et objets)
    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    // Filtrer les options selon le terme de recherche
    const filteredOptions = normalizedOptions.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Trouver le label de la valeur sélectionnée
    const selectedLabel = normalizedOptions.find(opt => opt.value === value)?.label || value;

    // Fermer le dropdown en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        onChange(option.value);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setSearchTerm('');
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Search Input */}
            <div className="relative">
                {/* Search Icon */}
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className={`w-5 h-5 ${disabled ? 'text-gray-400' : theme.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <input
                    type="text"
                    value={isOpen ? searchTerm : selectedLabel}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => !disabled && setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg bg-white text-sm font-medium ${theme.ring} ${theme.border} transition-all cursor-text text-slate-700 ${error
                        ? 'border-red-400 bg-red-50'
                        : disabled
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed text-gray-500'
                            : `border-gray-300 ${theme.hover}`
                        }`}
                />

                {/* Clear/Chevron Icon */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {value && !isOpen && !disabled ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    ) : (
                        <svg
                            className={`w-5 h-5 ${disabled ? 'text-gray-400' : theme.iconDark} transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Dropdown List */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => handleSelect(option)}
                                className={`px-4 py-2.5 cursor-pointer transition-colors ${option.value === value
                                    ? `${theme.bgSelected} ${theme.textSelected} font-medium`
                                    : `${theme.bgHover} text-slate-700`
                                    }`}
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            Aucun résultat trouvé
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
