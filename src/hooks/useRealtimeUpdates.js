import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEcho } from '../services/echo';
import { realtimeModelUpdated, fetchDashboardRecap } from '../redux/slices/parcelSlice';
import { appendMessageToConversation, updateMessageInConversation, removeMessageFromConversation } from '../redux/slices/messageSlice';
import { performLogout } from '../redux/slices/authSlice';
import { showNotification } from '../redux/slices/uiSlice';

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
  const currentUserId = useSelector((state) => state.auth?.user?.id);

  useEffect(() => {
    if (!backofficeId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`backoffice.${backofficeId}`);

    channel.listen('.model.updated', (payload) => {
      if (payload.model === 'Message') {
        const item = payload.data?.[0];
        if (!item?.agence_id) return;

        if (payload.action === 'created') {
          dispatch(appendMessageToConversation({ agenceId: item.agence_id, message: item }));
        } else if (payload.action === 'updated') {
          dispatch(updateMessageInConversation({ agenceId: item.agence_id, message: item }));
        } else if (payload.action === 'deleted') {
          dispatch(removeMessageFromConversation({ agenceId: item.agence_id, messageId: item.id }));
        }
        return;
      }

      // Rôle (donc permissions d'accès aux pages) modifié pour cet agent
      // précis pendant qu'il est connecté : déconnexion immédiate pour
      // qu'il ne garde jamais l'accès aux pages de son ancien rôle.
      if (payload.model === 'User' && payload.action === 'role_changed') {
        const item = payload.data?.[0];
        if (item?.id && item.id === currentUserId) {
          dispatch(showNotification({ type: 'info', message: 'Vos permissions ont été modifiées. Merci de vous reconnecter.' }));
          dispatch(performLogout());
        }
        return;
      }

      dispatch(realtimeModelUpdated({ ...payload, currentBackofficeCountry: backofficeCountry }));
      // Rafraîchit les compteurs du dashboard à chaque changement, peu coûteux.
      dispatch(fetchDashboardRecap());
    });

    return () => {
      echo.leave(`backoffice.${backofficeId}`);
    };
  }, [backofficeId, dispatch, backofficeCountry, currentUserId]);
}
