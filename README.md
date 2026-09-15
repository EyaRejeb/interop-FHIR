# MediRDV — Portail de rendez-vous (Sujet B)

Application réalisée dans le cadre de l'évaluation *Interopérabilité en santé*
— Sujet B : Rendez-vous / calendrier patient.

**Groupe** : Eya Rejeb, Neirouz Attia
**Cahier des charges** : `docs/CdC_SujetB_RDV_Patient.pdf` / `.tex`.

## Ce que fait l'application

MediRDV a deux espaces, choisis à l'écran d'accueil :

- **Espace patient** — se connecter avec un identifiant patient, consulter
  ses rendez-vous à venir, en prendre un nouveau.
- **Espace professionnel de santé** — se connecter avec un identifiant
  praticien, voir l'agenda de tous ses patients, confirmer / annuler / clore
  un rendez-vous (`PUT /Appointment`).

Les deux espaces s'appuient sur le **même serveur FHIR réel**, sans donnée
codée en dur. Un panneau **« Interopérabilité »**, accessible depuis chaque
rendez-vous (dans les deux espaces), regroupe les vues exigées par le
cahier des charges :

- Ressource **FHIR brute** (JSON) réellement reçue du serveur.
- Conversion en message **HL7 v2 SIU^S12**, présentée dans un bloc
  « terminal » qui rappelle volontairement qu'il s'agit d'un format hérité.
- **Mapping terminologique** appliqué (code FHIR → code HL7 v2).
- **Traçabilité** : journal de tous les échanges FHIR (méthode, URL,
  statut, horodatage), avec un bouton pour déclencher une erreur
  volontaire et vérifier la gestion d'erreur à la demande.
- **Critères d'acceptation** du CdC (section 1), cochés automatiquement
  au fil de la démonstration.

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
périodiquement — d'où le bouton *« Charger des données de démonstration »*,
présent dans les deux espaces, qui recrée à la demande 2 patients, 1
praticien, 1 lieu et 3 rendez-vous (aucune donnée pré-enregistrée dans le
code). Les deux boutons créent le **même jeu de données partagé** : chargez-le
depuis un espace, notez l'identifiant affiché, et utilisez-le pour vous
connecter à l'autre espace si vous voulez démontrer les deux points de vue
sur les mêmes rendez-vous.

## Lancer l'application

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

### Parcours de démonstration conseillé

1. Ouvrir l'application → choisir **Espace professionnel de santé**.
2. Cliquer **Charger des données de démonstration** → l'agenda se remplit
   avec 3 rendez-vous sur 2 patients différents.
3. Cliquer **Détails techniques** sur un rendez-vous → montrer les 3 vues
   FHIR / HL7 v2 / mapping, et la checklist des critères d'acceptation.
4. Depuis l'agenda, cliquer **Confirmer** ou **Annuler** sur un rendez-vous
   « en attente » → observer le `PUT` dans le journal de traçabilité.
5. Revenir à l'accueil (**Changer d'espace**) → choisir **Espace patient**,
   coller l'identifiant patient noté à l'étape 2, consulter ses rendez-vous,
   puis **Prendre rendez-vous** pour démontrer le `POST`.
6. Dans le panneau Interopérabilité, cliquer **Tester la gestion d'erreur**
   pour démontrer ce critère sans attendre un incident réel.

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
index.html                 landing bi-profil + shell applicatif (SPA)
css/style.css               mise en forme
js/fhir-client.js           client FHIR générique + journal des échanges
js/terminology.js           tables de correspondance FHIR → HL7 v2 (documentées)
js/appointment-builder.js   construction d'une ressource Appointment
js/hl7v2-mapper.js          génération du message HL7 v2 SIU^S12
js/seed-data.js             jeu de données de démonstration (créé via POST réels)
js/app.js                   interface : landing, espace patient, espace pro, panneau technique
tests/test-logic.js         tests hors-ligne de la logique métier
```

Aucun backend, aucune base de données locale : l'application est un
client FHIR REST pur exécuté dans le navigateur (cf. diagramme de
déploiement du CdC). Les deux espaces et le panneau technique partagent
le même client FHIR (`js/fhir-client.js`) et le même générateur HL7 v2
(`js/hl7v2-mapper.js`) — pas de logique dupliquée entre les profils.

## Limites connues (cf. CdC, section 5)

- Pas d'authentification réelle (identifiant saisi librement, patient ou
  praticien) — hors périmètre du prototype ; en production ce serait un
  vrai flux d'authentification (OAuth2/SMART on FHIR par exemple).
- Le mapping terminologique est une **convention locale documentée**
  pour ce prototype, pas une reproduction d'une table HL7 v2 officielle
  tierce.
- La réception du message SIU^S12 par un système tiers est **simulée**
  (affichée, non transmise à un système réel).
- Un seul champ de motif libre (`reasonCode.text`) ; pas de gestion de
  récurrence ni de détection fine de conflits de créneaux.
