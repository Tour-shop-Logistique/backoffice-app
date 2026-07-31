import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEcho } from '../services/echo';
import { realtimeModelUpdated, fetchDashboardRecap } from '../redux/slices/parcelSlice';
import { realtimeExpeditionUpdated } from '../redux/slices/backofficeSlice';
import { appendMessageToConversation, updateMessageInConversation, removeMessageFromConversation } from '../redux/slices/messageSlice';
import { updateUserRole } from '../redux/slices/authSlice';
import { showNotification } from '../redux/slices/uiSlice';
import { notificationAdded } from '../redux/slices/inAppNotificationsSlice';
import { classifyNotification } from '../utils/notificationClassifier';
import { showBrowserNotification } from '../utils/browserNotification';
import soundNotification from '../utils/soundNotification';

/**
 * S'abonne au canal privé du backoffice et écoute l'event universel unique
 * "model.updated" (voir WEBSOCKETS.md pour le contrat model/action/data).
 * Un seul listener pour toutes les entités — pas besoin d'en ajouter un par
 * nouveau cas d'usage côté backend.
 */
export default function useRealtimeUpdates(backofficeId, navigate) {
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
      // précis pendant qu'il est connecté : resynchronise en direct sans le
      // déconnecter, le menu et les routes se recalculent immédiatement.
      if (payload.model === 'User' && payload.action === 'role_changed') {
        const item = payload.data?.[0];
        if (item?.id && item.id === currentUserId) {
          dispatch(updateUserRole({ role_id: item.role_id, role_details: item.role_details }));
          dispatch(showNotification({ type: 'info', message: 'Vos permissions d\'accès ont été mises à jour.' }));
        }
        return;
      }

      // Paiement enregistré côté agence, ou décision agence sur les frais
      // annexes (payé maintenant / à percevoir à l'arrivée) : le backoffice
      // doit être alerté immédiatement, même s'il n'est pas sur la bonne
      // page (notification système + son), au même titre que la notif
      // "colis à réceptionner" côté agence.
      if (
        payload.model === 'Expedition' &&
        (payload.action === 'payment_confirmed' || payload.action === 'frais_decision_agence')
      ) {
        const entry = classifyNotification(payload.model, payload.action, payload.data);
        if (entry) {
          dispatch(notificationAdded(entry));
          soundNotification.playSuccess();
          showBrowserNotification(entry.title, {
            body: entry.message,
            onClick: () => navigate?.(entry.link),
          });
        }
        // Pas de return : realtimeModelUpdated doit quand même s'exécuter
        // ci-dessous pour garder son comportement de synchro existant.
      }

      dispatch(realtimeModelUpdated({ ...payload, currentBackofficeCountry: backofficeCountry }));
      // Même événement, répercuté sur le slice backoffice : c'est lui que lit
      // la page Historique (state.backoffice.expeditions), un state distinct
      // de parcelSlice ci-dessus.
      if (payload.model === 'Expedition' || payload.model === 'Colis') {
        dispatch(realtimeExpeditionUpdated(payload));
      }
      // Rafraîchit les compteurs du dashboard à chaque changement, peu coûteux.
      dispatch(fetchDashboardRecap());
    });

    return () => {
      echo.leave(`backoffice.${backofficeId}`);
    };
  }, [backofficeId, dispatch, backofficeCountry, currentUserId, navigate]);
}
