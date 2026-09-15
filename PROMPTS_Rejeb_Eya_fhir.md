# PROMPTS_Rejeb_Eya.md

Étudiante : Eya Rejeb
Projet : Interopérabilité en santé - Sujet B (rendez-vous FHIR vers HL7 v2 SIU^S12)

## Phase Conception

1. hello, je vais te donner le contexte du cours ici pour que tu connaisses le contexte précis, et l'exercice d'évaluation pour que tu connaisses l'objectif, et ensuite je te guiderai étape par étape et on créera ensemble le travail demandé

2. les fichiers du cours : [MCLB0, MCLB1, MCLB2, MCLB6, MCLB9]

3. [texte complet de l'énoncé d'évaluation]

4. le sujet B parle de rendez-vous patient avec un serveur FHIR et une conversion vers HL7 v2. avant de choisir, je veux comprendre les 5 sujets sur les mêmes bases : quelle ressource FHIR est utilisée, quel format cible est imposé, et si le mapping terminologique est gérable en 2h de dev. donne moi des pistes de comparaison, je te guide ensuite

5. entre les 5 sujets, celui sur les résumés médicaux (E) demande d'assembler plusieurs ressources FHIR en même temps (Bundle avec Condition, MedicationStatement, AllergyIntolerance...), ça me semble trop risqué en 2h. on veut un sujet qu'on maîtrise complètement plutôt qu'un sujet ambitieux mal exécuté. compare les 5 sujets selon ces critères précis : ressource(s) FHIR principale(s), format cible imposé, complexité du mapping sémantique, complexité technique réaliste en 2h, et risque d'inachèvement. appuie chaque case sur des faits FHIR réels, pas un avis général

6. choix B confirmé avec ma binôme, la ressource Appointment est plus simple à manipuler qu'un Bundle multi-ressources et le format cible HL7 v2 SIU est bien documenté

7. je veux que le scénario couvre à la fois la lecture (GET, consulter ses rendez-vous) et l'écriture (POST, créer un rendez-vous), parce que le barème demande de démontrer la conversion HL7 v2 sur une vraie création, pas juste un affichage. on combine portail patient et prise de rdv avec creation, l'objectif c'est vraiment l'interop

8. dans le cours on a vu que l'interopérabilité s'analyse par couches (ReEIF : infrastructure, application, information, métier, organisation, juridique), et que l'IA propose mais que c'est à nous de vérifier et comprendre. je vais te coller un extrait de l'énoncé, explique-moi ce bloc point par point : ce qui est concrètement attendu, comment ça s'applique à notre sujet, et ce qu'il faudra vérifier nous-mêmes plutôt que de laisser l'IA décider

9. on a maintenant le scénario, les specs FHIR et la lecture ReEIF, donc je pense qu'on a tout pour la suite. en se basant sur tout ça donne moi un cahier de charge complet en prenant en compte tout ce que je t'ai donnée et n'hesite pas a me demander en cas de besoin

10. le BPMN doit montrer le parcours complet du patient, avec un couloir pour chaque acteur (patient, application, serveur FHIR, système tiers), et le cas où la création échoue, pas juste le chemin qui marche. donne moi le bpmn complet avec ça aussi

11. la première version n'a pas vraiment la notation BPMN standard (les formes et les couloirs). donne moi un bpmn plus lisible plus claire comme le format normal de bpmn et tu peux faire une verification pour etre sure que le contenu reste correct aussi

12. j'ai préparé le cahier des charges en LaTeX pour que ce soit plus professionnel pour la remise, avec des cadres à compléter pour les points qu'on n'a pas encore vérifiés (comme l'URL exacte du serveur), pour être sûres de ne rien inventer. [document LaTeX joint]

13. il manque encore le diagramme de cas d'utilisation, celui de séquence et celui de déploiement, pour montrer les acteurs, les échanges dans le temps et l'architecture technique. fais moi maintenant le diagramme de cas d'utilisations et fais de façon que ce soit complet avec notre projet et le diagramme de déploiement et le diagramme de séquence chaqun dans un fichier puis donne moi le nouveau fichier .tex

## Phase Réalisation

14. le barème dit clairement pas de données métier codées en dur, donc il faut une vraie connexion au serveur FHIR et pas des exemples statiques. maintenant fais moi la realisation du projet sur le git directement de "https://github.com/EyaRejeb/FHIR-interop" en utilisant ce serveur de test comment le serveur principale et s'il faut des données de test fais les

15. je sais que pour pousser sur GitHub il faut être authentifié avec mon compte, donc avant d'insister je veux vérifier si c'est possible techniquement depuis ton côté. can you please do the commit sur github ?

16. j'ai testé la première version et le rendu est trop basique pour une remise, ça ne correspond pas à ce que demande le barème sur les vues attendues (vue métier, vue ressource FHIR, vue conversion, vue mapping terminologique). je veux une version qui sépare clairement ces vues à l'écran, avec un vrai retour visuel quand la conversion réussit ou échoue, et qui reste utilisable sur mobile puisque l'énoncé insiste sur le côté user friendly. reprends la structure du cahier des charges point par point pour vérifier qu'aucune vue demandée ne manque

17. le sujet B parle de rendez-vous mais dans un vrai hôpital ce sont aussi les professionnels de santé qui gèrent leur agenda, pas seulement le patient qui consulte le sien. une application qui ne représente que le patient est incomplète par rapport à l'usage réel. je veux deux profils distincts avec des droits différents : le patient qui consulte et crée ses propres rendez-vous, et le professionnel de santé qui voit son planning et valide ou refuse une demande. les deux vues doivent utiliser la même conversion HL7 v2 en arrière-plan, pas deux logiques séparées, sinon ça ne prouve plus l'interop demandée par le barème

