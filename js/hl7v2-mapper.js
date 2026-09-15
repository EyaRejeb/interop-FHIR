/**
 * hl7v2-mapper.js
 * -----------------------------------------------------------------------
 * Conversion d'une ressource FHIR R4 `Appointment` vers un message
 * HL7 v2 SIU^S12 (Notification of new appointment booking).
 *
 * Structure du message (cf. cahier des charges, section 5) :
 *   MSH  -  en-tete du message
 *   SCH  -  informations de planification (Schedule Activity Information)
 *   PID  -  identification du patient
 *   RGS  -  groupe de ressources
 *   AIP  -  ressource "personnel" (praticien)
 *   AIL  -  ressource "localisation"
 *
 * Ce mapping est volontairement simplifie pour un prototype pedagogique :
 * seuls les champs necessaires a la demonstration sont renseignes. Les
 * limites et pertes d'information sont documentees dans le CdC (section 5).
 * -----------------------------------------------------------------------
 */

const HL7_FIELD_SEP = "|";
const HL7_SEGMENT_SEP = "\n"; // '\r' est le vrai separateur HL7 v2 ; '\n' est utilise ici pour l'affichage ecran

function findParticipant(appointment, resourceType) {
  const list = appointment.participant || [];
  const found = list.find(p => p.actor && typeof p.actor.reference === "string" && p.actor.reference.startsWith(resourceType + "/"));
  if (!found) return null;
  const ref = found.actor.reference; // ex: "Patient/123"
  return {
    id: ref.split("/")[1],
    display: found.actor.display || null,
    status: found.status || null,
  };
}

function formatHL7DateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = n => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() + pad(d.getMonth() + 1) + pad(d.getDate()) +
    pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
  );
}

function durationMinutes(appointment) {
  if (!appointment.start || !appointment.end) return "";
  const ms = new Date(appointment.end) - new Date(appointment.start);
  if (isNaN(ms) || ms <= 0) return "";
  return String(Math.round(ms / 60000));
}

function splitDisplayName(display) {
  // display attendu au format "Nom Prenom" ; a defaut, renvoie tel quel.
  if (!display) return { family: "", given: "" };
  const parts = display.trim().split(/\s+/);
  if (parts.length === 1) return { family: parts[0], given: "" };
  return { family: parts[0], given: parts.slice(1).join(" ") };
}

/**
 * Construit le message SIU^S12 (chaine multi-lignes) a partir d'une
 * ressource Appointment. Retourne aussi le detail du mapping applique
 * (utilise par la vue "mapping terminologique").
 */
function appointmentToSIU(appointment) {
  const statusMapping = mapAppointmentStatus(appointment.status);
  const typeCoding = (appointment.appointmentType && appointment.appointmentType.coding && appointment.appointmentType.coding[0]) || {};
  const typeMapping = mapAppointmentType(typeCoding.code);

  const patient = findParticipant(appointment, "Patient");
  const practitioner = findParticipant(appointment, "Practitioner");
  const location = findParticipant(appointment, "Location");

  const now = formatHL7DateTime(new Date().toISOString());
  const startHL7 = formatHL7DateTime(appointment.start);
  const endHL7 = formatHL7DateTime(appointment.end);
  const duration = durationMinutes(appointment);
  const messageControlId = "MSG" + Math.floor(Math.random() * 1e8);
  const placerApptId = appointment.id || "TEMP-" + messageControlId;

  const patientName = splitDisplayName(patient && patient.display);
  const practitionerName = splitDisplayName(practitioner && practitioner.display);

  const MSH = ["MSH", "^~\\&", "PORTAILRDV", "HOPITAL", "SIHOSPITALIER", "HOPITAL",
    now, "", "SIU^S12", messageControlId, "P", "2.5.1"].join(HL7_FIELD_SEP);

  const SCH = ["SCH",
    placerApptId,           // SCH-1 Placer Appointment ID
    appointment.id || "",   // SCH-2 Filler Appointment ID
    "", "", "",
    `${typeMapping.v2Code}^${typeMapping.v2Label}`, // SCH-6-ish : type de RDV
    duration, "MIN",
    `^^^${startHL7}^${endHL7}`,
    "", "", "", "", "", "", "", "", "",
    statusMapping.code,     // statut (SCH-25 dans la norme complete)
  ].join(HL7_FIELD_SEP);

  const PID = ["PID", "1", "",
    `${patient ? patient.id : ""}^^^HOPITAL^MR`, "",
    `${patientName.family}^${patientName.given}`, "", "", "", "",
  ].join(HL7_FIELD_SEP);

  const RGS = ["RGS", "1"].join(HL7_FIELD_SEP);

  const AIP = ["AIP", "1", "",
    `${practitioner ? practitioner.id : ""}^${practitionerName.family}^${practitionerName.given}`,
  ].join(HL7_FIELD_SEP);

  const AIL = ["AIL", "1", "",
    (location && (location.display || location.id)) || "",
  ].join(HL7_FIELD_SEP);

  const message = [MSH, SCH, PID, RGS, AIP, AIL].join(HL7_SEGMENT_SEP);

  return {
    message,
    mapping: [
      { field: "Appointment.status", fhirValue: appointment.status, hl7Field: "SCH \u2014 statut filler", hl7Value: statusMapping.code, note: statusMapping.label },
      { field: "Appointment.appointmentType", fhirValue: typeCoding.code || "(non renseigné)", hl7Field: "SCH \u2014 type de RDV", hl7Value: typeMapping.v2Code, note: typeMapping.v2Label },
      { field: "Appointment.start / end", fhirValue: `${appointment.start || "?"} \u2192 ${appointment.end || "?"}`, hl7Field: "SCH \u2014 créneau horaire", hl7Value: `${startHL7} \u2192 ${endHL7}`, note: duration ? `${duration} min` : "" },
      { field: "participant[Patient]", fhirValue: patient ? patient.id : "(absent)", hl7Field: "PID-3", hl7Value: patient ? patient.id : "", note: "" },
      { field: "participant[Practitioner]", fhirValue: practitioner ? (practitioner.display || practitioner.id) : "(absent)", hl7Field: "AIP-3", hl7Value: practitioner ? practitioner.id : "", note: "" },
      { field: "participant[Location]", fhirValue: location ? (location.display || location.id) : "(absent)", hl7Field: "AIL-3", hl7Value: location ? (location.display || location.id) : "", note: "" },
    ],
  };
}
