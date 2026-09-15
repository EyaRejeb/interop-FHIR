/**
 * seed-data.js
 * -----------------------------------------------------------------------
 * Jeu de donnees de demonstration : cree 2 Patient, 1 Practitioner, une
 * Location et 3 Appointment sur le serveur FHIR reellement utilise
 * (aucune donnee n'est codee en dur dans l'application elle-meme -- ces
 * ressources sont creees via de vrais appels POST au demarrage, a la
 * demande de l'utilisateur).
 *
 * Deux patients partagent le meme praticien, pour que l'espace
 * professionnel (recherche par praticien) affiche un agenda credible
 * avec plusieurs patients, tandis que l'espace patient peut se
 * connecter avec l'identifiant du premier patient.
 *
 * Ce fichier ne s'execute jamais automatiquement : il est declenche par
 * le bouton "Charger des données de démonstration" dans l'interface
 * (voir app.js), pour rester conforme a l'exigence "pas de donnees
 * codees en dur" du cahier des charges.
 * -----------------------------------------------------------------------
 */

async function seedDemoData(onProgress) {
  const log = (msg) => { if (onProgress) onProgress(msg); };

  log("Création du patient de démonstration (1/2)…");
  const patientA = await createPatient({
    resourceType: "Patient",
    name: [{ family: "Martin", given: ["Eya-Demo"] }],
    gender: "female",
    birthDate: "1990-05-12",
  });

  log("Création du patient de démonstration (2/2)…");
  const patientB = await createPatient({
    resourceType: "Patient",
    name: [{ family: "Diallo", given: ["Karim-Demo"] }],
    gender: "male",
    birthDate: "1978-11-03",
  });

  log("Création du praticien de démonstration…");
  const practitioner = await fhirRequest("POST", "/Practitioner", {
    resourceType: "Practitioner",
    name: [{ family: "Chatty", given: ["Luc"], prefix: ["Dr"] }],
  });

  log("Création du lieu de consultation…");
  const location = await fhirRequest("POST", "/Location", {
    resourceType: "Location",
    name: "Cabinet 3 — Cardiologie",
    status: "active",
  });

  const now = new Date();
  const start1 = new Date(now.getTime() + 1 * 24 * 3600 * 1000 + 2 * 3600 * 1000);
  const end1 = new Date(start1.getTime() + 30 * 60 * 1000);
  const start2 = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
  const end2 = new Date(start2.getTime() + 20 * 60 * 1000);
  const start3 = new Date(now.getTime() + 1 * 24 * 3600 * 1000 + 5 * 3600 * 1000);
  const end3 = new Date(start3.getTime() + 45 * 60 * 1000);

  const patientADisplay = "Eya-Demo Martin";
  const patientBDisplay = "Karim-Demo Diallo";
  const practitionerDisplay = "Dr Luc Chatty";
  const locationDisplay = "Cabinet 3 — Cardiologie";

  log("Création du rendez-vous 1/3 (confirmé)…");
  const appt1 = await createAppointment(buildAppointmentResource({
    status: "booked",
    appointmentTypeCode: "ROUTINE",
    start: start1.toISOString(),
    end: end1.toISOString(),
    patientId: patientA.id, patientDisplay: patientADisplay,
    practitionerId: practitioner.id, practitionerDisplay,
    locationId: location.id, locationDisplay,
    reasonText: "Consultation de suivi cardiologique",
  }));

  log("Création du rendez-vous 2/3 (en attente)…");
  const appt2 = await createAppointment(buildAppointmentResource({
    status: "pending",
    appointmentTypeCode: "FOLLOWUP",
    start: start2.toISOString(),
    end: end2.toISOString(),
    patientId: patientA.id, patientDisplay: patientADisplay,
    practitionerId: practitioner.id, practitionerDisplay,
    locationId: location.id, locationDisplay,
    reasonText: "Contrôle post-traitement",
  }));

  log("Création du rendez-vous 3/3 (autre patient)…");
  const appt3 = await createAppointment(buildAppointmentResource({
    status: "booked",
    appointmentTypeCode: "CHECKUP",
    start: start3.toISOString(),
    end: end3.toISOString(),
    patientId: patientB.id, patientDisplay: patientBDisplay,
    practitionerId: practitioner.id, practitionerDisplay,
    locationId: location.id, locationDisplay,
    reasonText: "Bilan annuel",
  }));

  log("Jeu de données de démonstration créé.");
  return {
    patientId: patientA.id,
    patientDisplay: patientADisplay,
    secondPatientId: patientB.id,
    secondPatientDisplay: patientBDisplay,
    practitionerId: practitioner.id,
    practitionerDisplay,
    locationId: location.id,
    locationDisplay,
    appointmentIds: [appt1.id, appt2.id, appt3.id],
  };
}
