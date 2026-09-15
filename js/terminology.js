/**
 * terminology.js
 * -----------------------------------------------------------------------
 * Tables de correspondance terminologique FHIR -> HL7 v2, utilisees par
 * la vue "mapping terminologique" (cahier des charges, section 6 pt.4)
 * et par le generateur de message SIU^S12 (hl7v2-mapper.js).
 *
 * IMPORTANT (a documenter dans le CdC / a l'oral) :
 * Ces tables sont une CONVENTION LOCALE definie pour ce prototype, et non
 * une reproduction verbatim d'une table officielle HL7 v2 tierce. Le
 * cahier des charges (section 5) signale deja que tout mapping de code
 * sans equivalent exact cote cible doit etre documente comme une
 * approximation assumee -- c'est le cas ici pour appointmentType.
 * -----------------------------------------------------------------------
 */

/**
 * Appointment.status (value set FHIR "appointmentstatus", cf.
 * http://hl7.org/fhir/R4/valueset-appointmentstatus.html)
 *   -> statut de filler simplifie que ce prototype ecrit dans SCH-25
 *      (Filler Status Code) du message SIU^S12.
 */
const STATUS_MAP = {
  "proposed":          { code: "PENDING",   label: "En attente de confirmation" },
  "pending":           { code: "PENDING",   label: "En attente de confirmation" },
  "booked":            { code: "BOOKED",    label: "Confirmé" },
  "arrived":           { code: "ARRIVED",   label: "Patient arrivé" },
  "checked-in":        { code: "ARRIVED",   label: "Patient enregistré" },
  "fulfilled":         { code: "COMPLETE",  label: "Consultation réalisée" },
  "cancelled":         { code: "CANCELLED", label: "Annulé" },
  "noshow":            { code: "NOSHOW",    label: "Patient absent" },
  "entered-in-error":  { code: "CANCELLED", label: "Saisie erronée (annulé)" },
  "waitlist":          { code: "PENDING",   label: "Liste d'attente" },
};

const DEFAULT_STATUS_MAPPING = { code: "PENDING", label: "Statut non reconnu (repli : en attente)" };

function mapAppointmentStatus(fhirStatus) {
  return STATUS_MAP[fhirStatus] || DEFAULT_STATUS_MAPPING;
}

/**
 * Appointment.appointmentType (CodeableConcept) -> code de type de
 * rendez-vous cote cible. Les options proposees dans le formulaire de
 * creation (app.js) utilisent exactement les codes de la colonne
 * "fhirCode" ci-dessous, ce qui rend la demonstration deterministe.
 */
const APPOINTMENT_TYPE_MAP = {
  "ROUTINE":   { fhirDisplay: "Consultation de routine",     v2Code: "ROUT",    v2Label: "Routine" },
  "WALKIN":    { fhirDisplay: "Consultation sans rendez-vous", v2Code: "WALKIN",  v2Label: "Sans rendez-vous" },
  "CHECKUP":   { fhirDisplay: "Bilan de santé",                v2Code: "CHECKUP", v2Label: "Bilan / contrôle" },
  "EMERGENCY": { fhirDisplay: "Urgence",                       v2Code: "EMER",    v2Label: "Urgence" },
  "FOLLOWUP":  { fhirDisplay: "Consultation de suivi",         v2Code: "FLWUP",   v2Label: "Suivi" },
};

const DEFAULT_TYPE_MAPPING = { v2Code: "ROUT", v2Label: "Routine (repli, type non reconnu)" };

function mapAppointmentType(fhirCode) {
  return APPOINTMENT_TYPE_MAP[fhirCode] || DEFAULT_TYPE_MAPPING;
}

/** Options affichees dans le formulaire de creation de RDV (app.js). */
function appointmentTypeOptions() {
  return Object.entries(APPOINTMENT_TYPE_MAP).map(([fhirCode, def]) => ({ fhirCode, ...def }));
}
