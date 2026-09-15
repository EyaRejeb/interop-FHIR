/**
 * app.js
 * -----------------------------------------------------------------------
 * Cablage de l'interface : recherche des rendez-vous, creation, et
 * affichage des 4 vues exigees par le cahier des charges :
 *   1. Vue metier (liste + formulaire)
 *   2. Vue ressource FHIR brute
 *   3. Vue conversion HL7 v2 (SIU^S12)
 *   4. Vue mapping terminologique
 * + gestion d'erreurs et vue de tracabilite (journal des echanges FHIR).
 * -----------------------------------------------------------------------
 */

const state = {
  patientId: null,
  practitionerId: null,
  practitionerDisplay: null,
  locationId: null,
  locationDisplay: null,
  lastAppointment: null, // dernier Appointment affiche/cree (objet FHIR complet)
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fhirBaseUrlLabel").textContent = FHIR_BASE_URL;
  populateTypeOptions();
  bindEvents();
  renderLog();
  document.addEventListener("fhir-log-updated", renderLog);
});

function bindEvents() {
  document.getElementById("btnSeedDemo").addEventListener("click", onSeedDemo);
  document.getElementById("btnSearchAppointments").addEventListener("click", onSearchAppointments);
  document.getElementById("createForm").addEventListener("submit", onCreateAppointment);
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

// ------------------------------------------------------------------ erreurs
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

// ------------------------------------------------------------ 0. démo data
async function onSeedDemo() {
  clearError();
  setBusy(true, "Création des données de démonstration sur le serveur FHIR…");
  try {
    const result = await seedDemoData((msg) => setBusy(true, msg));
    document.getElementById("patientIdInput").value = result.patientId;
    state.patientId = result.patientId;
    document.getElementById("seedResult").textContent =
      `Patient de démonstration créé : ${result.patientId} — ${result.appointmentIds.length} rendez-vous créés.`;
    await onSearchAppointments();
  } catch (err) {
    handleFhirError(err, "Impossible de créer les données de démonstration.");
  } finally {
    setBusy(false);
  }
}

// -------------------------------------------------------- 1. vue métier : recherche
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
    renderFhirRawView(bundle);
    updateStateFromBundle(bundle);
    document.getElementById("createSection").classList.remove("hidden");
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
  const hint = document.getElementById("createHint");
  if (state.practitionerId) {
    hint.textContent = `Praticien / lieu réutilisés automatiquement : ${state.practitionerDisplay} — ${state.locationDisplay || "(lieu inconnu)"}.`;
    document.getElementById("btnCreateAppointment").disabled = false;
  } else {
    hint.textContent = "Aucun praticien connu pour ce patient : cliquez sur « Charger les données de démonstration » avant de créer un rendez-vous.";
    document.getElementById("btnCreateAppointment").disabled = true;
  }
}

function renderAppointmentsList(bundle) {
  const container = document.getElementById("appointmentsList");
  const entries = (bundle.entry || []).map(e => e.resource);
  if (!entries.length) {
    container.innerHTML = `<p class="muted">Aucun rendez-vous à venir pour ce patient.</p>`;
    return;
  }
  container.innerHTML = "";
  for (const appt of entries) {
    const card = document.createElement("div");
    card.className = "appt-card";
    const statusInfo = mapAppointmentStatus(appt.status);
    const typeCoding = (appt.appointmentType && appt.appointmentType.coding && appt.appointmentType.coding[0]) || {};
    const typeInfo = mapAppointmentType(typeCoding.code);
    card.innerHTML = `
      <div class="appt-card-header">
        <span class="badge">${escapeHtml(appt.status)} → ${escapeHtml(statusInfo.code)}</span>
        <span class="appt-date">${formatFrDateTime(appt.start)} \u2192 ${formatFrDateTime(appt.end)}</span>
      </div>
      <div class="appt-card-body">
        <div><strong>Type :</strong> ${escapeHtml(typeCoding.display || typeCoding.code || "non renseigné")} (HL7 v2 : ${escapeHtml(typeInfo.v2Code)})</div>
        <div><strong>Identifiant FHIR :</strong> <code>Appointment/${escapeHtml(appt.id)}</code></div>
      </div>
      <div class="appt-card-actions">
        <button type="button" data-id="${escapeHtml(appt.id)}" class="btn-view">Voir ressource / conversion HL7 v2</button>
      </div>
    `;
    container.appendChild(card);
    card.querySelector(".btn-view").addEventListener("click", () => onSelectAppointment(appt));
  }
}

async function onSelectAppointment(appt) {
  clearError();
  state.lastAppointment = appt;
  renderFhirRawView(appt);
  renderHl7View(appt);
  document.querySelectorAll(".appt-card").forEach(c => c.classList.remove("selected"));
  window.scrollTo({ top: document.getElementById("view-fhir").offsetTop - 20, behavior: "smooth" });
}

// -------------------------------------------------------- 1bis. vue métier : création
async function onCreateAppointment(evt) {
  evt.preventDefault();
  clearError();
  if (!state.patientId) {
    showError("Merci de rechercher (ou charger) un patient avant de créer un rendez-vous.");
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
    state.lastAppointment = created;
    renderFhirRawView(created);
    renderHl7View(created);
    await onSearchAppointments(); // rafraîchit la vue métier avec le nouveau RDV
    window.scrollTo({ top: document.getElementById("view-hl7").offsetTop - 20, behavior: "smooth" });
  } catch (err) {
    handleFhirError(err, "La création du rendez-vous a échoué.");
  } finally {
    setBusy(false);
  }
}

// -------------------------------------------------------- 2. vue ressource FHIR brute
function renderFhirRawView(resourceOrBundle) {
  document.getElementById("fhirRawView").textContent = JSON.stringify(resourceOrBundle, null, 2);
}

// -------------------------------------------------------- 3. vue conversion HL7 v2 + 4. mapping
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
}

// -------------------------------------------------------- tracabilité
function renderLog() {
  const container = document.getElementById("logList");
  container.innerHTML = "";
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

// -------------------------------------------------------- erreurs FHIR
function handleFhirError(err, context) {
  if (err instanceof FhirClientError) {
    const statusPart = err.status ? ` (HTTP ${err.status})` : "";
    showError(`${context}${statusPart} : ${err.message}`);
  } else {
    showError(`${context} : ${err.message || err}`);
  }
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
