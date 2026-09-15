# PROMPTS_Eya_Rejeb_CDC.md

**Sujet :** B — Rendez-vous / calendrier patient
**Format cible :** HL7 v2 — message SIU^S12

---

## Prompt 1

```
salut jai un projet decole sur l'interoperabilité en santé, faut faire un cahier
des charges pour un prototype qui se connecte a un serveur FHIR. le sujet c'est
"rendez vous / calendrier patient", et l'utilisateur c'est le patient direct (pas
la secretaire), il doit pouvoir voir ses rdv et en prendre un nouveau depuis un
portail. aide moi a ecrire le besoin metier et le scenario utilisateur, avec les
criteres d'acceptation. le format cible doit etre du HL7 v2 (message SIU) pas
du CDA ni du csv
```

## Prompt 2

```
en fait je me suis rendu compte que si le patient peut créer un rdv, ca veut dire
qu'on doit pas juste lire (GET) mais aussi ecrire (POST /Appointment) sur le
serveur FHIR. tu peux corriger le cahier des charges pour que ca soit clair que
c'est pas juste de la lecture, et rajouter un critère d'acceptation genre "le rdv
créé est bien persisté sur le serveur, verifiable en relisant apres" ?
```

## Prompt 3

```
c'est bien mais je pense pas qu'on ait vraiment besoin d'authentification pour la
demo, on va juste demander l'identifiant patient direct sans login. c'est ok pour
un prototype ecole ou il faut vraiment que je mette un vrai systeme de connexion ?
explique moi pourquoi et note le comme une limite dans le document si c'est ok
```

## Prompt 4

```
maintenant fait moi la partie ReEIF (infrastructure/securité, application,
information, metier, organisation, juridique) mais applique la vraiment a notre
cas, pas des définitions generales. genre pour juridique je veux que tu parles
du RGPD vu que c'est des données de rdv medical meme si c'est pas hyper sensible
comme contenu
```

## Prompt 5 — vérification

```
relis tout stp et dis moi si il manque un truc par rapport a la consigne : besoin
metier, scenario, criteres d'acceptation, specifs FHIR, interactions serveur,
ReEIF, mapping. et vérifie aussi que le scenario est bien coherent du debut a la
fin (creation du rdv jusqu'a la generation du message HL7 v2)
```

---

## Bilan personnel

Au début j'avais pas pensé au fait que créer un rdv = écriture sur le serveur, pas
juste de la lecture, l'IA me l'a pas dit tout de suite non plus donc j'ai du y penser
moi meme et lui redemander de corriger. Aussi j'ai du décider nous meme que
l'authentification c'etait hors périmètre pour un prototype d'1h de conception,
l'IA proposait un vrai système de login au debut ce qui etait pas réaliste pour le
temps qu'on a.
