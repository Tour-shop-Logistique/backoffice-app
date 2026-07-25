import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEcho } from '../services/echo';
import { realtimeModelUpdated, fetchDashboardRecap } from '../redux/slices/parcelSlice';

/**
 * S'abonne au canal privé du backoffice et écoute l'event universel unique
 * "model.updated" (voir WEBSOCKETS.md pour le contrat model/action/data).
 * Un seul listener pour toutes les entités — pas besoin d'en ajouter un par
 * nouveau cas d'usage côté backend.
 */
export default function useRealtimeUpdates(backofficeId) {
  const dispatch = useDispatch();
  // Nécessaire pour ne pas insérer une expédition "created" dans les arrivages
  // prévus si ce backoffice est celui de départ (il reçoit aussi l'event, mais
  // seul le backoffice du pays de destination doit voir apparaître le colis).
  const backofficeCountry = useSelector((state) => state.backoffice?.config?.pays);

  useEffect(() => {
    if (!backofficeId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`backoffice.${backofficeId}`);

    channel.listen('.model.updated', (payload) => {
      dispatch(realtimeModelUpdated({ ...payload, currentBackofficeCountry: backofficeCountry }));
      // Rafraîchit les compteurs du dashboard à chaque changement, peu coûteux.
      dispatch(fetchDashboardRecap());
    });

    return () => {
      echo.leave(`backoffice.${backofficeId}`);
    };
  }, [backofficeId, dispatch, backofficeCountry]);
}
