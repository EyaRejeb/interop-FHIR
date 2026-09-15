/**
 * fhir-client.js
 * -----------------------------------------------------------------------
 * Client FHIR minimal (fetch natif, aucune dependance) pour MediRDV
 * (Sujet B — Rendez-vous / calendrier patient), utilise a la fois par
 * l'espace patient et l'espace professionnel de sante.
 *
 * Serveur utilise : serveur de test public HAPI FHIR R4
 *   Base URL     : https://hapi.fhir.org/baseR4
 *   FHIR version : 4.0.1 (R4)
 *
 * Toutes les requetes passent par fhirRequest(), qui journalise chaque
 * echange (methode, URL, statut, horodatage) pour la vue "tracabilite"
 * exigee par le cahier des charges (section 6, point 5).
 * -----------------------------------------------------------------------
 */

const FHIR_BASE_URL = "https://hapi.fhir.org/baseR4";

/** Erreur specifique aux echanges FHIR, porte le statut HTTP et le corps OperationOutcome eventuel. */
class FhirClientError extends Error {
  constructor(message, status = null, operationOutcome = null) {
    super(message);
    this.name = "FhirClientError";
    this.status = status;
    this.operationOutcome = operationOutcome;
  }
}

/** Journal des echanges (en memoire), affiche par app.js dans la vue "tracabilite". */
const requestLog = [];

function logRequest(entry) {
  requestLog.unshift(entry); // le plus recent en premier
  if (requestLog.length > 50) requestLog.pop();
  document.dispatchEvent(new CustomEvent("fhir-log-updated"));
}

/**
 * Effectue un appel HTTP vers le serveur FHIR et journalise l'echange.
 * @param {"GET"|"POST"|"PUT"} method
 * @param {string} path  chemin relatif a FHIR_BASE_URL, ex: "/Appointment?patient=Patient/123"
 * @param {object} [body] corps JSON (POST/PUT)
 */
async function fhirRequest(method, path, body) {
  const url = `${FHIR_BASE_URL}${path}`;
  const startedAt = new Date();
  const opts = {
    method,
    headers: {
      "Content-Type": "application/fhir+json;charset=utf-8",
      "Accept": "application/fhir+json",
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(url, opts);
  } catch (networkErr) {
    logRequest({
      method, url, status: "ERREUR RÉSEAU", ok: false,
      startedAt, finishedAt: new Date(), detail: networkErr.message,
    });
    throw new FhirClientError(
      `Impossible de contacter le serveur FHIR (${networkErr.message}). ` +
      `Vérifiez la connexion réseau ou l'URL du serveur.`
    );
  }

  const status = response.status;
  const ok = response.ok;
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    // reponse vide (ex: 204) ou non-JSON : on garde data = null
  }

  logRequest({
    method, url, status, ok, startedAt, finishedAt: new Date(),
    detail: ok ? null : summarizeOperationOutcome(data),
  });

  if (!ok) {
    throw new FhirClientError(
      summarizeOperationOutcome(data) || `Le serveur FHIR a répondu avec le statut HTTP ${status}.`,
      status,
      data
    );
  }
  return data;
}

function summarizeOperationOutcome(data) {
  if (!data) return null;
  if (data.resourceType === "OperationOutcome" && Array.isArray(data.issue) && data.issue.length) {
    const issue = data.issue[0];
    return issue.diagnostics || (issue.details && issue.details.text) || issue.code || "Erreur FHIR non détaillée.";
  }
  return null;
}

/** GET /Appointment?patient=Patient/{id}&date=ge{today}&_sort=date  -> Bundle */
async function searchAppointmentsForPatient(patientId) {
  const today = new Date().toISOString().slice(0, 10);
  const path = `/Appointment?patient=Patient/${encodeURIComponent(patientId)}&date=ge${today}&_sort=date&_count=20`;
  return fhirRequest("GET", path);
}

/** GET /Appointment?actor=Practitioner/{id}&date=ge{today}&_sort=date -> Bundle (agenda professionnel) */
async function searchAppointmentsForPractitioner(practitionerId) {
  const today = new Date().toISOString().slice(0, 10);
  const path = `/Appointment?actor=Practitioner/${encodeURIComponent(practitionerId)}&date=ge${today}&_sort=date&_count=30`;
  return fhirRequest("GET", path);
}

/** GET /Appointment/{id} -> Appointment */
async function readAppointment(id) {
  return fhirRequest("GET", `/Appointment/${encodeURIComponent(id)}`);
}

/** POST /Appointment -> Appointment (cree, avec id serveur) */
async function createAppointment(appointmentResource) {
  return fhirRequest("POST", "/Appointment", appointmentResource);
}

/**
 * PUT /Appointment/{id} -> Appointment mis a jour.
 * FHIR exige la representation complete de la ressource dans un PUT : on part
 * donc de la ressource existante, on ne change que le statut, et on renvoie
 * l'ensemble (utilise par l'espace professionnel : confirmer / annuler / clore).
 */
async function updateAppointmentStatus(appointment, newStatus) {
  const updated = { ...appointment, status: newStatus };
  return fhirRequest("PUT", `/Appointment/${encodeURIComponent(appointment.id)}`, updated);
}

/** POST /Patient -> Patient (utilise par le jeu de donnees de demonstration) */
async function createPatient(patientResource) {
  return fhirRequest("POST", "/Patient", patientResource);
}

/** GET /Patient/{id} -> Patient (verification d'existence) */
async function readPatient(id) {
  return fhirRequest("GET", `/Patient/${encodeURIComponent(id)}`);
}

/** GET /Practitioner/{id} -> Practitioner (verification d'existence, espace professionnel) */
async function readPractitioner(id) {
  return fhirRequest("GET", `/Practitioner/${encodeURIComponent(id)}`);
}
