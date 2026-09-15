# PROMPTS_Attia_Neirouz.md

Étudiante : Neirouz Attia
Projet : Interopérabilité en santé - Sujet B (rendez-vous FHIR vers HL7 v2 SIU^S12)

## Phase Conception

1. je te transmets les supports du cours sur l'interopérabilité en santé et l'énoncé complet de l'évaluation, pour qu'on parte sur les mêmes bases avant de commencer à travailler dessus. [fichiers du cours + énoncé joints]

2. le sujet B demande de convertir une ressource FHIR Appointment vers un message HL7 v2 SIU^S12, qui a plusieurs segments (MSH pour l'en-tête, SCH pour la planification, PID pour le patient). avant de choisir un sujet je veux comparer les 5 options sur ce que ça implique vraiment en termes de ressources FHIR et de terminologies à mapper (LOINC, SNOMED, ICD-10 selon le sujet). fais moi une comparaison des 5 sujets et apres on choisit

3. notre priorité c'est un sujet qu'on peut maîtriser complètement et justifier solidement, pas un sujet ambitieux mal exécuté. compare les 5 sujets selon ces critères précis : ressource(s) FHIR principale(s) impliquée(s), format cible imposé (HL7 v2/CDA/CSV), complexité du mapping sémantique et des terminologies, complexité technique réaliste en 2h de développement, et risque d'inachèvement. ne me donne pas juste un avis général : appuie chaque case du tableau sur les ressources FHIR réelles, pour que je puisse vérifier moi-même la pertinence de chaque évaluation

4. le sujet B reste le plus simple à maîtriser complètement, mais je veux comprendre pourquoi avant de valider avec ma binôme : Appointment est une ressource unique avec un statut clair (booked, cancelled, noshow...), alors qu'un sujet comme les résumés médicaux oblige à assembler plusieurs ressources dans un Bundle, donc plus de points de rupture possibles en 2h. le format cible HL7 v2 SIU^S12 est aussi bien documenté, ce qui réduit le risque d'inventer une structure de segments fausse. sur cette base on garde le sujet B

5. le barème dit que l'IA peut proposer mais que c'est à nous de spécifier, vérifier et comprendre, donc avant de te laisser rédiger le cahier des charges je veux qu'on décortique l'énoncé ensemble. je vais te coller un extrait de l'énoncé d'évaluation. explique-moi ce bloc point par point, en détaillant pour chaque ligne : ce qui est concrètement attendu, comment ça s'applique à notre sujet précis, et ce qu'il faudra justifier ou vérifier nous-mêmes plutôt que de laisser l'IA décider

6. le diagramme BPMN doit représenter les 4 acteurs du scénario (patient, application, serveur FHIR, système tiers qui reçoit le message HL7) et pas juste les étapes techniques, sinon on ne montre pas la lecture ReEIF qu'on a faite. donne moi le bpmn complet avec ça aussi

7. la première version du BPMN ne respecte pas vraiment la notation standard (formes des événements, des passerelles, des tâches). donne moi un bpmn plus lisible plus claire comme le format normal de bpmn et tu peux faire une verification pour etre sure que le contenu reste correct aussi

8. pour la remise on veut un document propre plutôt qu'un simple fichier texte, donc je prépare la version LaTeX du cahier des charges avec des encadrés à compléter pour ce qu'on n'a pas encore vérifié, comme ça on n'invente rien à la place. [document LaTeX joint]

9. il manque le diagramme de cas d'utilisation (qui interagit avec quoi), le diagramme de séquence (l'ordre des échanges dans le temps) et le diagramme de déploiement (où tourne chaque composant), les trois demandés en plus du BPMN. fais moi maintenant le diagramme de cas d'utilisations et fais de façon que ce soit complet avec notre projet et le diagramme de déploiement et le diagramme de séquence chaqun dans un fichier puis donne moi le nouveau fichier .tex

## Phase Réalisation

10. le cahier des charges est validé, on passe à la réalisation. le barème demande une vraie connexion au serveur, pas de données codées en dur, donc il faut utiliser le serveur FHIR public qu'on a choisi et vérifié en conception. maintenant fais moi la realisation du projet sur le git directement de "https://github.com/EyaRejeb/FHIR-interop" en utilisant ce serveur de test comment le serveur principale et s'il faut des données de test fais les

11. j'ai testé l'application déployée et il y a une vraie erreur du serveur, je te colle le message exact tel quel plutôt que de le résumer, pour que la cause soit claire.
Heure Méthode URL Statut Détail
16:33:48 POST https://hapi.fhir.org/baseR4/Patient 412 HAPI-2840: Can not create resource duplicating existing resource: Patient/138784794

12. on ne peut pas juste supposer que les endpoints marchent, il faut vérifier contre la documentation réelle du serveur avant de dire que le prototype est fonctionnel à 100%, sinon ça reste une hypothèse. prends en consideration ce qui est demandé dans la partie réalisation du barème (connexion réelle, vue métier, vue ressource FHIR, vue conversion, vue mapping terminologique, gestion d'erreur et traçabilité). regarde les details des erreur de fhir et les endpoints (fais le test sur les endpoints pour etre sure que l'application est fonctionnelle) à 100% et aussi regarde le coté de user friendly et adpté a l'utilisation et facile a utiliser mme pour une premiere utilisatin

13. après correction, je veux qu'on rejoue exactement le même scénario que l'erreur 412 (création d'un patient déjà existant) pour vérifier que l'application affiche maintenant un message clair au lieu de planter, et qu'on teste aussi un cas qui doit réussir (nouveau patient, nouveau rendez-vous) pour être sûre que le correctif n'a rien cassé côté cas normal. donne moi les deux résultats côte à côte pour que je les vérifie moi-même avant de considérer que c'est corrigé

