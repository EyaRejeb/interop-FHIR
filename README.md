# FHIR-interop — Portail rendez-vous patient (Sujet B)

Prototype réalisé dans le cadre de l'évaluation *Interopérabilité en santé*
— Sujet B : Rendez-vous / calendrier patient.

**Groupe** : Eya Rejeb, Neirouz Attia
**Cahier des charges** : voir `CdC_SujetB_RDV_Patient.pdf` / `.tex` (dossier `docs/` ou racine du dépôt).

## Ce que fait le prototype

- Recherche des rendez-vous à venir d'un patient sur un **vrai serveur FHIR R4**
  (`GET /Appointment?patient=...`).
- Création d'un nouveau rendez-vous (`POST /Appointment`) — aucune donnée
  métier n'est codée en dur dans l'application.
- Génère et affiche le message **HL7 v2 SIU^S12** correspondant à la
  ressource FHIR sélectionnée ou créée.
- Affiche le mapping terminologique appliqué (code FHIR → code HL7 v2)
  pour le statut et le type de rendez-vous.
- Journalise chaque échange FHIR (méthode, URL, statut, horodatage) pour
  la traçabilité, et affiche les erreurs serveur de façon explicite.

## Serveur FHIR utilisé

```
https://hapi.fhir.org/baseR4      (FHIR R4 / 4.0.1 — serveur de test public HAPI FHIR)
```

Ce serveur public accepte la lecture et l'écriture anonymes à des fins de
test (aucune authentification requise). **Avant une démonstration**,
vérifiez qu'il répond bien et que `POST` fonctionne :

```bash
curl https://hapi.fhir.org/baseR4/metadata?_format=json | head -c 300
```

Le serveur étant public et partagé, ses données peuvent être purgées
périodiquement — d'où le bouton *« Charger des données de démonstration »*
qui recrée un patient, un praticien, un lieu et deux rendez-vous à la
demande (aucune donnée pré-enregistrée dans le code).

## Lancer le prototype

Aucune installation, aucune dépendance : HTML/CSS/JS natifs.

```bash
# Option 1 — serveur statique local (recommandé)
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/

# Option 2 — GitHub Pages
# Activer GitHub Pages sur la branche main (dossier racine) dans les
# paramètres du dépôt, puis ouvrir l'URL fournie par GitHub.

# Option 3 — ouvrir index.html directement dans le navigateur
```

## Tester la logique métier (hors-ligne, sans réseau)

```bash
node tests/test-logic.js
```

Ce script vérifie, avec un `fetch` simulé (aucun appel réseau réel) :
construction de la ressource `Appointment`, génération du message
SIU^S12 (6 segments), mapping terminologique (y compris les valeurs de
repli sur un code non reconnu), et propagation correcte d'une erreur
FHIR (`OperationOutcome`).

## Architecture

```
index.html              page unique (SPA), 4 vues + journal
css/style.css           mise en forme
js/fhir-client.js       client FHIR générique + journal des échanges
js/terminology.js       tables de correspondance FHIR → HL7 v2 (documentées)
js/appointment-builder.js  construction d'une ressource Appointment
js/hl7v2-mapper.js      génération du message HL7 v2 SIU^S12
js/seed-data.js         jeu de données de démonstration (créé via POST réels)
js/app.js               interface : recherche, création, affichage des 4 vues
tests/test-logic.js     tests hors-ligne de la logique métier
```

Aucun backend, aucune base de données locale : l'application est un
client FHIR REST pur exécuté dans le navigateur (cf. diagramme de
déploiement du CdC).

## Limites connues (cf. CdC, section 5)

- Pas d'authentification patient réelle (identifiant saisi librement) —
  hors périmètre du prototype.
- Le mapping terminologique est une **convention locale documentée**
  pour ce prototype, pas une reproduction d'une table HL7 v2 officielle
  tierce.
- La réception du message SIU^S12 par un système tiers est **simulée**
  (affichée, non transmise à un système réel).
- Un seul champ de motif libre (`reasonCode.text`) ; pas de gestion de
  récurrence ni de conflits de créneaux avancée.
