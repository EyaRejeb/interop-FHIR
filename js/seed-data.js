/**
 * seed-data.js
 * -----------------------------------------------------------------------
 * Jeu de donnees de demonstration : cree un Patient, un Practitioner, une
 * Location et deux Appointment sur le serveur FHIR reellement utilise
 * (aucune donnee n'est codee en dur dans l'application elle-meme -- ces
 * ressources sont creees via de vrais appels POST au demarrage, a la
 * demande de l'utilisateur, exactement comme le ferait un vrai flux de
 * creation).
 *
 * Ce fichier ne s'execute jamais automatiquement : il est declenche par
 * le bouton "Charger des données de démonstration" dans l'interface
 * (voir app.js), pour rester conforme a l'exigence "pas de donnees
 * codees en dur" du cahier des charges.
 * -----------------------------------------------------------------------
 */

async function seedDemoData(onProgress) {
  const log = (msg) => { if (onProgress) onProgress(msg); };

  log("Création du patient de démonstration…");
  const patient = await createPatient({
    resourceType: "Patient",
    name: [{ family: "Martin", given: ["Eya-Demo"] }],
    gender: "female",
    birthDate: "1990-05-12",
  });

  log("Création du praticien de démonstration…");
  const practitioner = await fhirRequest("POST", "/Practitioner", {
    resourceType: "Practitioner",
    name: [{ family: "Chatty", given: ["Luc"] }],
  });

  log("Création du lieu de consultation…");
  const location = await fhirRequest("POST", "/Location", {
    resourceType: "Location",
    name: "Cabinet 3 — Cardiologie",
    status: "active",
  });

  const now = new Date();
  const start1 = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
  const end1 = new Date(start1.getTime() + 30 * 60 * 1000);
  const start2 = new Date(now.getTime() + 10 * 24 * 3600 * 1000);
  const end2 = new Date(start2.getTime() + 20 * 60 * 1000);

  const patientDisplay = "Eya-Demo Martin";
  const practitionerDisplay = "Luc Chatty";
  const locationDisplay = "Cabinet 3 — Cardiologie";

  log("Création du premier rendez-vous (confirmé)…");
  const appt1 = await createAppointment(buildAppointmentResource({
    status: "booked",
    appointmentTypeCode: "ROUTINE",
    start: start1.toISOString(),
    end: end1.toISOString(),
    patientId: patient.id, patientDisplay,
    practitionerId: practitioner.id, practitionerDisplay,
    locationId: location.id, locationDisplay,
    reasonText: "Consultation de suivi cardiologique",
  }));

  log("Création du second rendez-vous (en attente)…");
  const appt2 = await createAppointment(buildAppointmentResource({
    status: "pending",
    appointmentTypeCode: "FOLLOWUP",
    start: start2.toISOString(),
    end: end2.toISOString(),
    patientId: patient.id, patientDisplay,
    practitionerId: practitioner.id, practitionerDisplay,
    locationId: location.id, locationDisplay,
    reasonText: "Contrôle post-traitement",
  }));

  log("Jeu de données de démonstration créé.");
  return {
    patientId: patient.id,
    patientDisplay,
    appointmentIds: [appt1.id, appt2.id],
  };
}
