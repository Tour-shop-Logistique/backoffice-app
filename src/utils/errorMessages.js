/**
 * Messages d'erreur prédéfinis : l'utilisateur ne voit jamais un texte brut
 * venu du serveur ou du navigateur (SQL, chemin de fichier, "Failed to
 * fetch"...). Un message n'est affiché tel quel que s'il a été rédigé pour
 * l'utilisateur ; sinon on retombe sur le message du code HTTP.
 */

export const ERROR_MESSAGES = {
  NETWORK: "Connexion impossible. Vérifiez votre connexion internet puis réessayez.",
  TIMEOUT: "Le délai de la requête a expiré. Veuillez réessayer.",
  UNAVAILABLE: "Le service est momentanément indisponible. Veuillez réessayer dans quelques instants.",
  SERVER: "Une erreur est survenue de notre côté. Veuillez réessayer dans quelques instants.",
  DEFAULT: "Une erreur est survenue. Veuillez réessayer.",
  CLIENT: "La demande n'a pas pu être traitée. Vérifiez les informations saisies puis réessayez.",
  400: "La requête est invalide.",
  401: "Votre session a expiré. Veuillez vous reconnecter.",
  403: "Vous n'avez pas l'autorisation d'effectuer cette action.",
  404: "La ressource demandée est introuvable.",
  405: "Cette action n'est pas disponible.",
  408: "Le délai de la requête a expiré. Veuillez réessayer.",
  409: "Cette action est incompatible avec l'état actuel des données. Actualisez la page puis réessayez.",
  413: "Le fichier envoyé est trop volumineux.",
  415: "Le format du fichier envoyé n'est pas accepté.",
  419: "Votre session a expiré. Veuillez actualiser la page.",
  422: "Les données envoyées sont invalides.",
  429: "Trop de tentatives. Veuillez patienter avant de réessayer.",
};

const GATEWAY_STATUSES = [502, 503, 504, 520, 521, 522, 523, 524];

// Texte technique (serveur ou navigateur) qui ne doit jamais atteindre
// l'utilisateur, ainsi que les messages génériques anglais de Laravel/axios.
const TECHNICAL_PATTERN = new RegExp(
  [
    "SQLSTATE", "Exception\\b", "Stack trace", "[\\\\/]vendor[\\\\/]", "\\.php", "App\\\\",
    "Illuminate", "Symfony", "No query results", "could not be found",
    "method is not supported", "Undefined", "Call to", "Class \"", "Trying to",
    "Argument #", "syntax error", "violates", "relation \"", "column \"",
    "\\bselect\\b.+\\bfrom\\b", "pgsql", "mysql", "supabase", "Connection:",
    "TypeError", "ErrorException", "Failed to fetch", "NetworkError", "Network Error",
    "Load failed", "Request failed with status code", "timeout of", "AbortError",
    "Cannot read prop", "is not a function", "is not defined", "is not iterable",
    "Unexpected (token|end)", "JSON", "<!DOCTYPE", "<html", "\\bnull\\b",
    "^(Unauthenticated|Unauthorized|Forbidden|Server Error|Not Found|Bad Request|Too Many Attempts|Internal Server Error)\\.?$",
  ].join("|"),
  "i"
);

export function isSafeMessage(message) {
  if (typeof message !== "string") return false;
  const text = message.trim();
  if (text === "" || text.length > 300) return false;
  return !TECHNICAL_PATTERN.test(text);
}

export function messageForStatus(status) {
  if (GATEWAY_STATUSES.includes(status)) return ERROR_MESSAGES.UNAVAILABLE;
  if (ERROR_MESSAGES[status]) return ERROR_MESSAGES[status];
  if (status >= 500) return ERROR_MESSAGES.SERVER;
  if (status >= 400) return ERROR_MESSAGES.CLIENT;
  return ERROR_MESSAGES.DEFAULT;
}

/** Message affichable pour une réponse d'erreur du serveur. */
export function friendlyMessage(status, serverMessage) {
  if (GATEWAY_STATUSES.includes(status)) return ERROR_MESSAGES.UNAVAILABLE;
  if (isSafeMessage(serverMessage)) return serverMessage.trim();
  return messageForStatus(status);
}

/**
 * Nettoie le corps d'une réponse d'erreur : `message`, `error` et les
 * messages de validation (`errors`) sont tous garantis sans texte technique.
 * `code`, `reference` et `retry_after` sont conservés.
 */
export function sanitizeErrorPayload(data, status) {
  if (!data || typeof data !== "object") {
    return { success: false, message: messageForStatus(status) };
  }

  const rawMessage = data.message || (typeof data.error === "string" ? data.error : undefined);
  let message = friendlyMessage(status, rawMessage);
  if (status >= 500 && data.reference && !isSafeMessage(rawMessage)) {
    message = `${message} Réf. : ${data.reference}.`;
  }

  const clean = { ...data, message };

  if (typeof clean.error === "string") clean.error = message;

  const cleanFields = (fields) => {
    if (!fields || typeof fields !== "object") return undefined;
    const out = {};
    Object.entries(fields).forEach(([field, value]) => {
      const list = Array.isArray(value) ? value : [value];
      out[field] = list.map((entry) => (isSafeMessage(entry) ? entry : message));
    });
    return out;
  };

  if (clean.errors && typeof clean.errors === "object") clean.errors = cleanFields(clean.errors);
  else if (typeof clean.errors === "string") delete clean.errors;

  if (clean.error && typeof clean.error === "object") clean.error = cleanFields(clean.error);

  return clean;
}

/**
 * Convertit une erreur levée par le navigateur (réseau coupé, timeout,
 * exception JavaScript) en erreur au message prédéfini. Les erreurs déjà
 * normalisées (avec un `status`) sont retournées telles quelles.
 */
export function friendlyThrown(error) {
  if (error && typeof error.status === "number") return error;

  let message = ERROR_MESSAGES.DEFAULT;
  if (error?.name === "AbortError") message = ERROR_MESSAGES.TIMEOUT;
  else if (error instanceof TypeError || /fetch|network|load failed/i.test(error?.message || "")) {
    message = ERROR_MESSAGES.NETWORK;
  } else if (isSafeMessage(error?.message)) {
    return error;
  }

  const friendly = new Error(message);
  friendly.status = 0;
  friendly.success = false;
  friendly.cause = error;
  return friendly;
}
