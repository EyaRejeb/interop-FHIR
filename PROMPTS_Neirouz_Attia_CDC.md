# PROMPTS_Neirouz_Attia_CDC.md

**Sujet :** B — Rendez-vous / calendrier patient
**Format cible :** HL7 v2 — message SIU^S12

---

## Prompt 1

```
salut, on bosse sur un cahier des charges pour un projet FHIR (rdv patient, avec
conversion en HL7 v2 SIU). ma partie c'est plutot la technique. tu peux me faire
le tableau des ressources FHIR qu'on va utiliser (Appointment, Patient,
Practitioner, Location) avec pourquoi chacune sert, et me dire aussi c'est quoi
la version FHIR la plus utilisée sur les serveurs publics en ce moment
```

## Prompt 2

```
faut que je fasse les diagrammes: BPMN du parcours, cas d'utilisation, sequence,
et deploiement. tu peux me proposer une structure pour le diagramme de sequence
qui montre bien: patient consulte ses rdv, cree un rdv (POST), le serveur repond,
et l'appli genere le message hl7. inclus aussi le cas ou ca marche pas (erreur du
serveur)
```

## Prompt 3 — correction

```
attends je crois que tu t'es trompé sur le mapping, t'as mis le statut FHIR direct
dans un segment PID alors que normalement le statut du rdv ca devrait etre dans le
segment SCH non ? et les participants (practitioner/location) c'est pas plutot des
segments AIP et AIL sous un groupe RGS ? verifie et corrige stp
```

## Prompt 4

```
avant de tout finaliser, je dois verifier un truc important: est ce que le
serveur FHIR public qu'on va utiliser accepte vraiment les POST (creation) ou si
c'est en lecture seule ? parce que si on peut pas créer de vrai Appointment dessus
tout notre scenario tombe a l'eau. aide moi a écrire une checklist de points à
vérifier avant de commencer la phase 2 (url du serveur, version fhir confirmée
avec /metadata, test du POST, version HL7 v2 exacte a utiliser)
```

## Prompt 5 — vérification finale

```
dernière relecture: est ce que le mapping FHIR -> HL7v2 qu'on a mis est honnête,
cad est ce qu'on dit bien clairement les endroits ou on perd de l'info (genre le
statut par participant qui existe en FHIR mais pas pareil en HL7v2, ou les champs
comme comment/basedOn qui ont pas d'équivalent direct) ? je veux pas qu'on dise
que le mapping est parfait alors que c'est pas le cas
```

---

## Bilan personnel

J'ai du corriger l'IA sur le placement des segments HL7 v2 (elle avait mis le statut
dans PID au lieu de SCH), donc fallait bien connaitre la structure d'un message SIU
pour repérer l'erreur. Le point le plus important pour moi c'est la vérif du POST
sur le serveur FHIR avant, l'IA proposait direct une architecture avec écriture sans
qu'on ait vérifié que c'était possible, du coup on a rajouté ça comme point critique
a checker avant la phase 2.
