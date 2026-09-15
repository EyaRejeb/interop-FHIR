/**
 * tests/test-logic.js
 * -----------------------------------------------------------------------
 * Tests hors-ligne de la logique metier (aucun appel reseau reel) :
 *   - construction d'une ressource Appointment
 *   - generation du message HL7 v2 SIU^S12 + table de mapping
 *   - mapping terminologique (avec valeurs de repli)
 *   - client FHIR : succes ET erreur (fetch simule)
 *
 * Lancer avec :  node tests/test-logic.js
 * (aucune dependance : Node.js standard suffit)
 * -----------------------------------------------------------------------
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.join(__dirname, "..");
global.document = { dispatchEvent: () => {} };
global.CustomEvent = function (name) { this.name = name; };

const ctx = { console, document: global.document, CustomEvent: global.CustomEvent, Date, fetch: null };
vm.createContext(ctx);
for (const f of ["js/terminology.js", "js/appointment-builder.js", "js/hl7v2-mapper.js", "js/fhir-client.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
}

let passed = 0;
function ok(label) { passed++; console.log(`  ✓ ${label}`); }

console.log("1. Construction d'une ressource Appointment");
const appt = ctx.buildAppointmentResource({
  status: "booked",
  appointmentTypeCode: "ROUTINE",
  start: "2026-10-01T09:00:00.000Z",
  end: "2026-10-01T09:30:00.000Z",
  patientId: "pat123", patientDisplay: "Eya-Demo Martin",
  practitionerId: "prac456", practitionerDisplay: "Luc Chatty",
  locationId: "loc789", locationDisplay: "Cabinet 3",
  reasonText: "Contrôle annuel",
});
assert.strictEqual(appt.resourceType, "Appointment");
assert.strictEqual(appt.participant.length, 3);
assert.strictEqual(appt.appointmentType.coding[0].code, "ROUTINE");
ok("resourceType, participants (3) et type corrects");
appt.id = "appt-999"; // simule un id attribué par le serveur

console.log("\n2. Génération du message HL7 v2 SIU^S12");
const { message, mapping } = ctx.appointmentToSIU(appt);
for (const seg of ["MSH|", "SIU^S12", "SCH|", "PID|", "RGS|", "AIP|", "AIL|", "BOOKED", "ROUT"]) {
  assert.ok(message.includes(seg), `segment/valeur manquant: ${seg}`);
}
assert.strictEqual(mapping.length, 6);
ok("6 segments présents (MSH/SCH/PID/RGS/AIP/AIL) et 6 lignes de mapping");
console.log("\n--- Message généré ---\n" + message + "\n");

console.log("3. Mapping terminologique (avec repli sur code inconnu)");
assert.strictEqual(ctx.mapAppointmentStatus("booked").code, "BOOKED");
assert.strictEqual(ctx.mapAppointmentStatus("valeur-inexistante").code, "PENDING");
assert.strictEqual(ctx.mapAppointmentType("ROUTINE").v2Code, "ROUT");
assert.strictEqual(ctx.mapAppointmentType("valeur-inexistante").v2Code, "ROUT");
ok("mapping direct + repli (fallback) sur code non reconnu");

(async () => {
  console.log("\n4. Client FHIR — cas de succès (POST simulé)");
  ctx.fetch = async (_url, opts) => ({
    ok: true, status: 201,
    json: async () => ({ ...JSON.parse(opts.body), resourceType: "Appointment", id: "created-1" }),
  });
  vm.runInContext("globalThis.fetch = fetch;", ctx);
  const created = await ctx.createAppointment(appt);
  assert.strictEqual(created.id, "created-1");
  ok("createAppointment renvoie bien la ressource créée");

  console.log("\n5. Client FHIR — cas d'erreur (422 OperationOutcome simulé)");
  ctx.fetch = async () => ({
    ok: false, status: 422,
    json: async () => ({ resourceType: "OperationOutcome", issue: [{ diagnostics: "Champ start manquant" }] }),
  });
  vm.runInContext("globalThis.fetch = fetch;", ctx);
  try {
    await ctx.createAppointment({});
    throw new Error("aurait dû lever une FhirClientError");
  } catch (e) {
    assert.ok(e.message.includes("Champ start manquant"));
    assert.strictEqual(e.status, 422);
    ok("erreur FHIR correctement propagée avec message et statut HTTP");
  }

  console.log(`\n=== ${passed}/5 groupes de tests réussis ===`);
})();
