/**
 * appointment-builder.js
 * -----------------------------------------------------------------------
 * Construit une ressource FHIR R4 `Appointment` valide a partir de champs
 * simples. Utilise a la fois par le formulaire de creation (app.js) et
 * par le jeu de donnees de demonstration (seed-data.js), pour garantir
 * que les deux chemins produisent exactement la meme structure.
 * -----------------------------------------------------------------------
 */

function buildAppointmentResource({
  status = "booked",
  appointmentTypeCode,
  start,
  end,
  patientId, patientDisplay,
  practitionerId, practitionerDisplay,
  locationId, locationDisplay,
  reasonText,
}) {
  const typeDef = (typeof APPOINTMENT_TYPE_MAP !== "undefined" && APPOINTMENT_TYPE_MAP[appointmentTypeCode]) || null;

  const participant = [
    {
      actor: { reference: `Patient/${patientId}`, display: patientDisplay },
      required: "required",
      status: "accepted",
    },
  ];
  if (practitionerId) {
    participant.push({
      actor: { reference: `Practitioner/${practitionerId}`, display: practitionerDisplay },
      required: "required",
      status: "accepted",
    });
  }
  if (locationId) {
    participant.push({
      actor: { reference: `Location/${locationId}`, display: locationDisplay },
      required: "required",
      status: "accepted",
    });
  }

  const resource = {
    resourceType: "Appointment",
    status,
    appointmentType: {
      coding: [{
        system: "https://github.com/EyaRejeb/FHIR-interop/terminology/appointment-type",
        code: appointmentTypeCode,
        display: typeDef ? typeDef.fhirDisplay : appointmentTypeCode,
      }],
    },
    start,
    end,
    participant,
  };
  if (reasonText) {
    resource.reasonCode = [{ text: reasonText }];
  }
  return resource;
}
