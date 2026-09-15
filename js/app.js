/**
 * app.js
 * -----------------------------------------------------------------------
 * Cablage de l'application MediRDV :
 *   - landing : choix de l'espace (patient / professionnel)
 *   - espace patient : mes rendez-vous + prise de rendez-vous
 *   - espace professionnel : agenda multi-patients + actions (confirmer/
 *     annuler/clore un RDV via PUT)
 *   - panneau "Interopérabilité" partagé par les deux espaces : les 4 vues
 *     exigees par le cahier des charges (metier deja couvert ci-dessus,
 *     ressource FHIR brute, conversion HL7 v2, mapping terminologique)
 *     + tracabilite + critères d'acceptation.
 * -----------------------------------------------------------------------
 */

const state = {
  role: null,               // "patient" | "pro"
  patientId: null,
  practitionerId: null,     // praticien/lieu à réutiliser pour une création (patient)
  practitionerDisplay: null,
  locationId: null,
  locationDisplay: null,
  proPractitionerId: null,  // praticien connecté dans l'espace professionnel
  lastAppointment: null,    // dernier Appointment ouvert dans le panneau technique
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fhirBaseUrlLabel").textContent = FHIR_BASE_URL;
  populateTypeOptions();
  bindEvents();
  renderLog();
  document.addEventListener("fhir-log-updated", renderLog);
});

// ============================================================== navigation
function bindEvents() {
  document.querySelectorAll(".role-card").forEach(card => {
    card.addEventListener("click", () => chooseRole(card.dataset.role));
  });
  document.getElementById("btnSwitchRole").addEventListener("click", switchToLanding);
  document.querySelectorAll(".side-nav a[data-target]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      showView(link.dataset.target);
    });
  });

  document.getElementById("btnSeedDemo").addEventListener("click", onSeedDemo);
  document.getElementById("btnSearchAppointments").addEventListener("click", onSearchAppointments);
  document.getElementById("createForm").addEventListener("submit", onCreateAppointment);

  document.getElementById("btnSeedDemoPro").addEventListener("click", onSeedDemoPro);
  document.getElementById("btnSearchAgenda").addEventListener("click", onSearchAgenda);

  document.getElementById("btnTestError").addEventListener("click", onTestError);
}

function chooseRole(role) {
  state.role = role;
  document.getElementById("landing").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("btnSwitchRole").classList.remove("hidden");
  document.getElementById("navPatient").classList.toggle("hidden", role !== "patient");
  document.getElementById("navPro").classList.toggle("hidden", role !== "pro");
  showView(role === "patient" ? "view-patient-home" : "view-pro-agenda");
}

function switchToLanding() {
  state.role = null;
  document.getElementById("landing").classList.remove("hidden");
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("btnSwitchRole").classList.add("hidden");
  document.getElementById("connectedAs").classList.add("hidden");
  clearError();
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");
  document.querySelectorAll(".side-nav a").forEach(a => a.classList.remove("nav-active"));
  const link = document.querySelector(`.side-nav a[data-target="${viewId}"]`);
  if (link) link.classList.add("nav-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setConnectedAs(label) {
  const el = document.getElementById("connectedAs");
  el.textContent = label;
  el.classList.remove("hidden");
}

function populateTypeOptions() {
  const select = document.getElementById("apptType");
  select.innerHTML = "";
  for (const opt of appointmentTypeOptions()) {
    const el = document.createElement("option");
    el.value = opt.fhirCode;
    el.textContent = `${opt.fhirDisplay} (→ HL7 v2 : ${opt.v2Code})`;
    select.appendChild(el);
  }
}

// ------------------------------------------------------------------ erreurs / busy
function showError(message) {
  const banner = document.getElementById("errorBanner");
  banner.textContent = "⚠ " + message;
  banner.classList.remove("hidden");
}
function clearError() {
  const banner = document.getElementById("errorBanner");
  banner.textContent = "";
  banner.classList.add("hidden");
}
function setBusy(busy, label) {
  document.getElementById("busyIndicator").textContent = busy ? (label || "Chargement…") : "";
}

// -------------------------------------------------------- critères d'acceptation (CdC §1)
function markCriterion(name) {
  const el = document.querySelector(`.criterion[data-criterion="${name}"]`);
  if (el) el.classList.add("met");
}

/* ===================================================================
   ESPACE PATIENT
   =================================================================== */

async function onSeedDemo() {
  clearError();
  setBusy(true, "Création des données de démonstration sur le serveur FHIR…");
  try {
    const result = await seedDemoData((msg) => setBusy(true, msg));
    document.getElementById("patientIdInput").value = result.patientId;
    document.getElementById("seedResult").textContent =
      `Patient créé : ${result.patientId} (${result.patientDisplay}) — ${result.appointmentIds.length} rendez-vous au total sur ${result.practitionerDisplay}.`;
    await onSearchAppointments();
  } catch (err) {
    handleFhirError(err, "Impossible de créer les données de démonstration.");
  } finally {
    setBusy(false);
  }
}

async function onSearchAppointments() {
  clearError();
  const patientId = document.getElementById("patientIdInput").value.trim();
  if (!patientId) {
    showError("Merci de renseigner un identifiant patient (ou de charger les données de démonstration).");
    return;
  }
  state.patientId = patientId;
  setBusy(true, "Recherche des rendez-vous (GET /Appointment)…");
  try {
    const bundle = await searchAppointmentsForPatient(patientId);
    renderAppointmentsList(bundle);
    updateStateFromBundle(bundle);
    setConnectedAs(`Patient connecté : ${patientId}`);
    markCriterion("search");
  } catch (err) {
    handleFhirError(err, "La recherche des rendez-vous a échoué.");
  } finally {
    setBusy(false);
  }
}

function updateStateFromBundle(bundle) {
  const entries = (bundle.entry || []).map(e => e.resource);
  for (const appt of entries) {
    const pr = (appt.participant || []).find(p => p.actor && p.actor.reference && p.actor.reference.startsWith("Practitioner/"));
    const loc = (appt.participant || []).find(p => p.actor && p.actor.reference && p.actor.reference.startsWith("Location/"));
    if (pr && !state.practitionerId) {
      state.practitionerId = pr.actor.reference.split("/")[1];
      state.practitionerDisplay = pr.actor.display || state.practitionerId;
    }
    if (loc && !state.locationId) {
      state.locationId = loc.actor.reference.split("/")[1];
      state.locationDisplay = loc.actor.display || state.locationId;
    }
  }
  refreshBookHint();
}

function refreshBookHint() {
  const hint = document.getElementById("createHint");
  const btn = document.getElementById("btnCreateAppointment");
  if (!state.patientId) {
    hint.textContent = "Connectez-vous d'abord depuis « Mes rendez-vous » pour activer la prise de rendez-vous.";
    btn.disabled = true;
  } else if (state.practitionerId) {
    hint.textContent = `Rendez-vous pris avec ${state.practitionerDisplay} — ${state.locationDisplay || "lieu inconnu"} (repris de votre dossier).`;
    btn.disabled = false;
  } else {
    hint.textContent = "Aucun praticien connu pour ce patient : chargez d'abord les données de démonstration depuis « Mes rendez-vous ».";
    btn.disabled = true;
  }
}

function renderAppointmentsList(bundle) {
  const container = document.getElementById("appointmentsList");
  const entries = (bundle.entry || []).map(e => e.resource);
  if (!entries.length) {
    container.innerHTML = `<p class="empty-state">Aucun rendez-vous à venir. Utilisez « Prendre rendez-vous » dans le menu pour en créer un.</p>`;
    return;
  }
  container.innerHTML = "";
  for (const appt of entries) {
    container.appendChild(buildAppointmentCard(appt, { showPatient: false, showActions: false }));
  }
}

/* ===================================================================
   ESPACE PROFESSIONNEL
   =================================================================== */

async function onSeedDemoPro() {
  clearError();
  setBusy(true, "Création des données de démonstration sur le serveur FHIR…");
  try {
    const result = await seedDemoData((msg) => setBusy(true, msg));
    document.getElementById("practitionerIdInput").value = result.practitionerId;
    document.getElementById("agendaResult").textContent =
      `Praticien créé : ${result.practitionerDisplay} — ${result.appointmentIds.length} rendez-vous répartis sur 2 patients de démonstration.`;
    await onSearchAgenda();
  } catch (err) {
    handleFhirError(err, "Impossible de créer les données de démonstration.");
  } finally {
    setBusy(false);
  }
}

async function onSearchAgenda() {
  clearError();
  const practitionerId = document.getElementById("practitionerIdInput").value.trim();
  if (!practitionerId) {
    showError("Merci de renseigner un identifiant praticien (ou de charger les données de démonstration).");
    return;
  }
  state.proPractitionerId = practitionerId;
  setBusy(true, "Recherche de l'agenda (GET /Appointment?actor=Practitioner/...)…");
  try {
    const bundle = await searchAppointmentsForPractitioner(practitionerId);
    renderAgendaList(bundle);
    setConnectedAs(`Professionnel connecté : ${practitionerId}`);
    markCriterion("search");
  } catch (err) {
    handleFhirError(err, "La recherche de l'agenda a échoué.");
  } finally {
    setBusy(false);
  }
}

function renderAgendaList(bundle) {
  const container = document.getElementById("agendaList");
  const entries = (bundle.entry || []).map(e => e.resource);
  if (!entries.length) {
    container.innerHTML = `<p class="empty-state">Aucun rendez-vous à venir pour ce praticien.</p>`;
    return;
  }
  container.innerHTML = "";
  for (const appt of entries) {
    container.appendChild(buildAppointmentCard(appt, { showPatient: true, showActions: true }));
  }
}

async function onChangeStatus(appt, newStatus) {
  clearError();
  setBusy(true, `Mise à jour du statut (PUT /Appointment/${appt.id})…`);
  try {
    const updated = await updateAppointmentStatus(appt, newStatus);
    if (state.lastAppointment && state.lastAppointment.id === updated.id) {
      openTechDetail(updated);
    }
    await onSearchAgenda();
  } catch (err) {
    handleFhirError(err, "La mise à jour du rendez-vous a échoué.");
  } finally {
    setBusy(false);
  }
}

/* ===================================================================
   CARTE DE RENDEZ-VOUS (partagée patient / pro)
   =================================================================== */

function buildAppointmentCard(appt, { showPatient, showActions }) {
  const card = document.createElement("div");
  card.className = "appt-card";
  const statusInfo = mapAppointmentStatus(appt.status);
  const typeCoding = (appt.appointmentType && appt.appointmentType.coding && appt.appointmentType.coding[0]) || {};
  const typeInfo = mapAppointmentType(typeCoding.code);
  const pillClass = `status-pill--${(appt.status || "pending").replace(/[^a-z-]/g, "")}`;
  const patientParticipant = (appt.participant || []).find(p => p.actor && p.actor.reference && p.actor.reference.startsWith("Patient/"));

  card.innerHTML = `
    <div class="appt-card-header">
      <span class="status-pill ${pillClass}">${escapeHtml(appt.status)} → ${escapeHtml(statusInfo.code)}</span>
      <span class="appt-date">${formatFrDateTime(appt.start)} \u2192 ${formatFrDateTime(appt.end)}</span>
    </div>
    <div class="appt-card-body">
      ${showPatient && patientParticipant ? `<div><strong>Patient :</strong> ${escapeHtml(patientParticipant.actor.display || patientParticipant.actor.reference)}</div>` : ""}
      <div><strong>Type :</strong> ${escapeHtml(typeCoding.display || typeCoding.code || "non renseigné")} (HL7 v2 : ${escapeHtml(typeInfo.v2Code)})</div>
      <div><strong>Identifiant FHIR :</strong> <code>Appointment/${escapeHtml(appt.id)}</code></div>
    </div>
    <div class="appt-card-actions"></div>
  `;

  const actions = card.querySelector(".appt-card-actions");

  const btnTech = document.createElement("button");
  btnTech.type = "button";
  btnTech.className = "secondary";
  btnTech.textContent = "Détails techniques (FHIR / HL7 v2)";
  btnTech.addEventListener("click", () => openTechDetail(appt));
  actions.appendChild(btnTech);

  if (showActions) {
    const transitions = {
      pending:  [["booked", "Confirmer"], ["cancelled", "Annuler"]],
      booked:   [["fulfilled", "Marquer réalisé"], ["cancelled", "Annuler"]],
      arrived:  [["fulfilled", "Marquer réalisé"]],
      cancelled: [],
      fulfilled: [],
      noshow: [],
    };
    const options = transitions[appt.status] || [];
    for (const [target, label] of options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.addEventListener("click", () => onChangeStatus(appt, target));
      actions.appendChild(btn);
    }
  }

  return card;
}

/* ===================================================================
   PRISE DE RENDEZ-VOUS (espace patient)
   =================================================================== */

async function onCreateAppointment(evt) {
  evt.preventDefault();
  clearError();
  if (!state.patientId) {
    showError("Connectez-vous depuis « Mes rendez-vous » avant de créer un rendez-vous.");
    return;
  }
  if (!state.practitionerId || !state.locationId) {
    showError("Praticien / lieu inconnus : chargez d'abord les données de démonstration.");
    return;
  }
  const datetimeLocal = document.getElementById("apptDate").value;
  const duration = parseInt(document.getElementById("apptDuration").value, 10) || 30;
  const typeCode = document.getElementById("apptType").value;
  const reason = document.getElementById("apptReason").value.trim();

  if (!datetimeLocal) {
    showError("Merci de choisir une date et une heure de rendez-vous.");
    return;
  }
  const start = new Date(datetimeLocal);
  if (isNaN(start.getTime()) || start.getTime() < Date.now()) {
    showError("La date du rendez-vous doit être valide et dans le futur.");
    return;
  }
  const end = new Date(start.getTime() + duration * 60000);

  const resource = buildAppointmentResource({
    status: "booked",
    appointmentTypeCode: typeCode,
    start: start.toISOString(),
    end: end.toISOString(),
    patientId: state.patientId,
    patientDisplay: null,
    practitionerId: state.practitionerId,
    practitionerDisplay: state.practitionerDisplay,
    locationId: state.locationId,
    locationDisplay: state.locationDisplay,
    reasonText: reason || undefined,
  });

  setBusy(true, "Création du rendez-vous (POST /Appointment)…");
  try {
    const created = await createAppointment(resource);
    document.getElementById("createResult").textContent = `Rendez-vous créé : Appointment/${created.id}`;
    await onSearchAppointments(); // relecture GET (vérifie la persistance)
    markCriterion("create");
    openTechDetail(created);
  } catch (err) {
    handleFhirError(err, "La création du rendez-vous a échoué.");
  } finally {
    setBusy(false);
  }
}

/* ===================================================================
   PANNEAU "INTEROPÉRABILITÉ" (partagé)
   =================================================================== */

function openTechDetail(appt) {
  state.lastAppointment = appt;
  const statusInfo = mapAppointmentStatus(appt.status);
  document.getElementById("techCurrentLabel").innerHTML =
    `Rendez-vous inspecté : <code>Appointment/${escapeHtml(appt.id)}</code> — statut FHIR <code>${escapeHtml(appt.status)}</code> → HL7 v2 <code>${escapeHtml(statusInfo.code)}</code>`;
  renderFhirRawView(appt);
  renderHl7View(appt);
  showView("view-tech");
}

function renderFhirRawView(resourceOrBundle) {
  document.getElementById("fhirRawView").textContent = JSON.stringify(resourceOrBundle, null, 2);
}

function renderHl7View(appointment) {
  const { message, mapping } = appointmentToSIU(appointment);
  document.getElementById("hl7View").textContent = message;

  const tbody = document.getElementById("mappingTableBody");
  tbody.innerHTML = "";
  for (const row of mapping) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${escapeHtml(row.field)}</code></td>
      <td>${escapeHtml(String(row.fhirValue))}</td>
      <td>${escapeHtml(row.hl7Field)}</td>
      <td><code>${escapeHtml(String(row.hl7Value))}</code></td>
      <td class="muted">${escapeHtml(row.note || "")}</td>
    `;
    tbody.appendChild(tr);
  }
  markCriterion("hl7");
  markCriterion("mapping");
}

async function onTestError() {
  clearError();
  setBusy(true, "Envoi d'une requête volontairement invalide…");
  try {
    await readAppointment("id-inexistant-demo-erreur");
    showError("Le serveur a répondu sans erreur — essayez à nouveau plus tard (comportement inattendu pour cette démonstration).");
  } catch (err) {
    handleFhirError(err, "Erreur volontaire déclenchée pour démonstration : le serveur a refusé la requête, l'application ne plante pas");
  } finally {
    setBusy(false);
  }
}

function renderLog() {
  const container = document.getElementById("logList");
  container.innerHTML = "";
  if (!requestLog.length) {
    container.innerHTML = `<tr class="empty-row"><td colspan="5">Aucun échange pour l'instant.</td></tr>`;
    return;
  }
  for (const entry of requestLog) {
    const row = document.createElement("tr");
    row.className = entry.ok === false ? "log-error" : "log-ok";
    const time = entry.startedAt ? entry.startedAt.toLocaleTimeString("fr-FR") : "";
    row.innerHTML = `
      <td>${time}</td>
      <td>${escapeHtml(entry.method)}</td>
      <td class="log-url">${escapeHtml(entry.url)}</td>
      <td>${escapeHtml(String(entry.status))}</td>
      <td>${escapeHtml(entry.detail || "")}</td>
    `;
    container.appendChild(row);
  }
}

function handleFhirError(err, context) {
  if (err instanceof FhirClientError) {
    const statusPart = err.status ? ` (HTTP ${err.status})` : "";
    showError(`${context}${statusPart} : ${err.message}`);
  } else {
    showError(`${context} : ${err.message || err}`);
  }
  markCriterion("error");
  console.error(err);
}

// -------------------------------------------------------- utilitaires
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function formatFrDateTime(iso) {
  if (!iso) return "?";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}
