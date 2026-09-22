import React from 'react';
import { useSelector } from 'react-redux';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { getCurrencyLabel } from '../../utils/format';

/**
 * Affiche un montant dans sa devise d'origine, complété par sa conversion
 * dans la devise du backoffice connecté quand elle diffère (ex: expédition
 * initiée en Côte d'Ivoire (XOF) consultée par un backoffice France (EUR)).
 * N'affiche jamais rien de plus si les deux devises sont identiques - pas
 * de bruit visuel pour le cas courant (même pays/devise).
 *
 * Le montant source n'est jamais modifié : seule la couche d'affichage
 * convertit, voir ExchangeRateService côté backend.
 */
const ConvertedAmount = ({ amount, sourceCurrency, className = '' }) => {
  const viewerCurrency = useSelector((state) => state.backoffice?.devise) || 'XOF';
  const rate = useExchangeRate(sourceCurrency, viewerCurrency);

  const formattedSource = `${new Intl.NumberFormat('fr-FR').format(amount || 0)} ${getCurrencyLabel(sourceCurrency)}`;

  if (!sourceCurrency || sourceCurrency === viewerCurrency) {
    return <span className={className}>{formattedSource}</span>;
  }

  if (rate === null) {
    return <span className={className}>{formattedSource}</span>;
  }

  const converted = (amount || 0) * rate;
  const formattedConverted = `${new Intl.NumberFormat('fr-FR').format(converted)} ${getCurrencyLabel(viewerCurrency)}`;

  return (
    <span className={className}>
      {formattedSource} <span className="text-slate-400 font-normal">({formattedConverted})</span>
    </span>
  );
};

export default ConvertedAmount;
