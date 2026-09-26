# Rapport quotidien — AWA

**Date du rapport :** 25/09/2026  
**Développeuse :** Manel Kadri  
**Projet :** AWA Mobile  
**Temps de travail :** 9 h


## Résumé de la journée

La journée représente **12 commits**, entièrement consacrés à l’application Mobile :

- **6 commits de correction** sur le Cycle, la Conception, la Contraception, les cycles irréguliers/SOPK, la Grossesse, le Post-partum, la Fausse couche, la Ménopause et les exports médicaux ;
- **1 commit fonctionnel** pour la configuration et le changement d’objectif ;
- **1 commit de refactorisation** des fonctionnalités spirituelles ;
- **4 commits de tests** couvrant les principaux parcours de santé, les calendriers, les journaux, les statistiques, le profil et les hooks partagés.


## Travail effectué aujourd’hui

### 1. Suivi du cycle, calendrier et journal quotidien

Commits : `581a5ef`, `3dcde4e`

- amélioration du calendrier, de la frise du cycle, de la sélection des jours et de l’enregistrement du début des règles ;
- consolidation de l’historique des règles confirmées et de la cohérence entre début, fin et occurrences de règles ;
- amélioration des prédictions, des superpositions du calendrier, des rappels et des statistiques du cycle ;
- ajout d’un hook partagé `useToday` pour rafraîchir correctement les écrans lors du passage à minuit ou du retour de l’application au premier plan ;
- ajout de helpers communs pour la date du journal, le jour du cycle, le changement de journée et le statut menstruel ;
- amélioration des journaux Hydratation, Activité, Glaire cervicale, Humeur, Sommeil, Symptômes, Température, Flux menstruel, Notes, Intimité, Test LH et Photos privées ;
- ajout d’une action partagée permettant d’effacer une entrée de journal ;
- utilisation plus cohérente des données réellement enregistrées dans les cartes d’accueil, le journal et les statistiques.

Les tests ajoutés couvrent notamment le calendrier, les mois passés, les prédictions, l’édition des règles, la conservation des habitudes, les cartes d’accueil, le changement global de journée, les calculs du cycle, les rappels et les statistiques.

### 2. Conception et Contraception

Commits : `2d23c2b`, `4c028f2`

#### Conception

- amélioration du Dashboard et du calendrier de Conception ;
- meilleure gestion des règles enregistrées, des longueurs de cycle et de la fenêtre fertile ;
- amélioration du suivi des indicateurs de fertilité ;
- correction des calculs statistiques et de la programmation des rappels ;
- amélioration du parcours d’édition des préférences de Conception ;
- ajout de tests sur les cycles mesurés, la température, la cohérence de la fenêtre fertile et l’absence de configuration du cycle.

#### Contraception

- amélioration du Dashboard, du calendrier, du journal, des rappels et des statistiques ;
- prise en charge plus cohérente des jours de pause du traitement ;
- amélioration du calcul du jour de plaquette, y compris autour des changements d’heure ;
- consolidation des rappels liés à la pilule et au traitement ;
- possibilité de gérer correctement des ressentis enregistrés pour une date passée ;
- ajout de tests sur le journal, les jours de pause, les rappels et la persistance des données.

### 3. Cycles irréguliers et SOPK

Commits : `92f1633`, `4c028f2`

- amélioration du calendrier, du Dashboard, de l’onboarding, du journal et des statistiques ;
- ajout d’une source partagée pour les données de règles liées au parcours irrégulier ;
- amélioration de l’affichage du jour du cycle et des jours de règles ;
- prise en charge des réponses explicites indiquant l’absence de symptômes ;
- amélioration de la saisie d’anciennes règles et d’anciennes catégories de suivi ;
- ajout de sélecteurs dédiés au journal irrégulier ;
- consolidation du suivi de la fatigue et des symptômes associés ;
- correction de la programmation des rappels et des calculs statistiques ;
- ajout de tests sur les catégories passées, l’effacement d’entrées, les règles passées et la forme des données enregistrées.

### 4. Grossesse

Commits : `5be3ec3`, `359017e`

- amélioration du Dashboard, du calendrier, des semaines de grossesse, du poids, des symptômes et des informations médicales ;
- ajout d’un hook partagé pour les préférences de suivi de Grossesse ;
- amélioration de la configuration et de la modification de la datation de grossesse ;
- ajout de validations de dates et resynchronisation cohérente de la progression ;
- amélioration des légendes, libellés, transitions et préférences de suivi ;
- consolidation des rappels selon le cycle de vie et les changements d’objectif ;
- amélioration des statistiques et de la cohérence entre la date prévue, la progression et l’accouchement ;
- ajout de tests sur la datation, les grossesses à terme ou post-terme, la progression, les rappels et les transitions.

### 5. Post-partum et suivi des lochies

Commits : `5be3ec3`, `359017e`

- amélioration du Dashboard, du calendrier et du journal Post-partum ;
- amélioration de la saisie de la date et du type d’accouchement ;
- meilleure cohérence entre le Nifas, les lochies et les rappels associés ;
- ajout de la date de fin des lochies et de ses validations ;
- amélioration du suivi du retour du cycle ;
- ajout de layouts cohérents avec le journal du cycle et les évaluations de bien-être ;
- amélioration de la persistance des notifications liées au Nifas ;
- ajout de tests sur l’édition des données, les lochies, les dates de fin, l’effacement du journal et la cohérence du Nifas.

### 6. Parcours après une fausse couche

Commits : `5be3ec3`, `359017e`

- amélioration du Dashboard, du calendrier, du journal, des statistiques et des rappels ;
- amélioration des écrans Date, Saignements, Retour du cycle et Essayer à nouveau ;
- création d’un modèle commun de validation chronologique des dates ;
- contrôle de la cohérence entre la date de la fausse couche, la date de retour des règles, les entrées du journal et la date actuelle ;
- amélioration de la transition vers l’objectif Conception ;
- consolidation des écritures dans les préférences et de l’effacement de l’historique ;
- ajout de tests sur les dates, les statuts, l’historique, les transitions et les validations.

### 7. Ménopause

Commits : `0cffabb`, `359017e`

- amélioration du Dashboard, du calendrier et du journal Ménopause ;
- amélioration du suivi du stade, des symptômes, du traitement hormonal et des analyses biologiques ;
- prise en charge des entrées historiques et de leur suppression ;
- amélioration de la gestion des résultats d’analyses ;
- correction des statistiques, notamment pour les périodes ne contenant que des analyses ;
- rafraîchissement plus fiable des statistiques et distinction plus claire entre historique et préférences ;
- ajout de tests dédiés aux préférences, au journal, aux dates passées, aux analyses et aux statistiques.

### 8. Exports médicaux adaptés à chaque objectif

Commit : `17dfa5d`

- amélioration de la configuration des catégories exportables selon l’objectif actif ;
- ajout d’un export spécifique au Cycle basé sur les règles et les catégories réellement enregistrées par son journal ;
- ajout d’un export spécifique aux cycles irréguliers/SOPK ;
- exclusion des catégories qui ne peuvent pas produire de données pour l’objectif concerné ;
- amélioration des lecteurs de données, du formatage, de l’orchestration et de la sélection de la plage de dates ;
- prise en compte des dates de règles même lorsqu’elles précèdent les entrées du journal ;
- ajout de tests dédiés aux exports Cycle, Conception et Cycles irréguliers.

### 9. Configuration et changement d’objectif

Commit : `e32b4d8`

- création d’un service centralisé de changement d’objectif ;
- conservation des données propres à chaque objectif lors d’un changement ;
- activation directe d’un objectif déjà configuré ;
- reprise du parcours de configuration à la première étape obligatoire incomplète lorsqu’un objectif n’est pas encore prêt ;
- gestion des étapes obligatoires et facultatives pour Cycle, Conception, Contraception, Cycles irréguliers, Ménopause, Grossesse, Post-partum et Fausse couche ;
- amélioration des chemins d’édition depuis le Profil ;
- mise à jour de la navigation, du résumé et des statistiques selon l’objectif actif ;
- ajout d’un état partagé pour le parcours de configuration en cours ;
- ajout de tests sur la complétude, la persistance, la reprise de configuration et le changement d’objectif.

### 10. Fonctionnalités spirituelles

Commits : `8004795`, `9ae3cc9`

- mise à jour et optimisation de l’asset visuel principal ;
- amélioration de la carte de guidance spirituelle ;
- enrichissement de la configuration des rappels du Nifas ;
- amélioration des statuts liés à la pureté pour la prière et au Qadaa ;
- mise à jour du calendrier Hijri, des horaires de prière et des préférences spirituelles ;
- amélioration du rafraîchissement des informations spirituelles lors d’un changement de journée ;
- ajout de tests sur les préférences en mode édition, les horaires de prière et le rafraîchissement quotidien.

### 11. Profil, onboarding et hooks partagés

Commit : `9ae3cc9`

- amélioration du sélecteur de date utilisé pendant l’onboarding ;
- ajout de tests sur les données de règles irrégulières affichées dans le Profil ;
- validation de l’utilisation du hook partagé de date par les différents Dashboards ;
- tests du passage à un nouveau jour, du retour au premier plan et du rafraîchissement des écrans dépendants de la date ;
- tests complémentaires sur les préférences spirituelles et les données du Profil.

## Renforcement de la couverture automatisée

Les quatre commits exclusivement consacrés aux tests sont :

- `3dcde4e` — Cycle, calendrier, journal, rappels et statistiques ;
- `4c028f2` — Conception, Contraception et cycles irréguliers/SOPK ;
- `359017e` — Grossesse, Post-partum, Fausse couche et Ménopause ;
- `9ae3cc9` — Profil, onboarding, spiritualité et hooks partagés.

La nouvelle couverture porte notamment sur :

- les calculs de dates et le passage à minuit ;
- les dates passées, futures ou chronologiquement incompatibles ;
- la conservation et l’effacement des entrées de journal ;
- les rappels, y compris les cas liés aux changements d’heure ;
- les statistiques et leur rafraîchissement ;
- les changements d’objectif et la conservation des configurations ;
- la cohérence entre calendriers, Dashboards, journaux et historiques ;
- les parcours d’édition depuis le Profil.

## Points restant à valider

- exécuter la suite Jest Mobile complète sur l’état final regroupant les 12 commits ;
- exécuter TypeScript et ESLint sur l’ensemble du projet Mobile ;
- réaliser des tests manuels sur appareil Android pour les notifications et les rappels ;
- vérifier les passages à minuit, changements de fuseau horaire et changements d’heure sur appareil réel ;
- tester de bout en bout chaque changement d’objectif, y compris l’interruption puis la reprise d’une configuration ;
- vérifier les exports médicaux avec des historiques volumineux et plusieurs plages de dates ;
- effectuer une validation fonctionnelle et médicale des règles métier affichées à l’utilisatrice ;
- effectuer une validation religieuse des comportements liés au Nifas, à la prière, au Qadaa et au calendrier Hijri.

> Ces commandes de validation n’ont pas été relancées pendant la préparation de ce rapport. Le rapport décrit les changements et les tests présents dans les commits, sans déclarer que la suite complète est réussie.

## Message pour le client

> Le rapport du **25 septembre 2026** couvre **12 commits enregistrés dans Git le 26 septembre 2026**, représentant **9 heures de travail** entièrement consacrées à l’application Mobile AWA. Les parcours Cycle, Conception, Contraception, SOPK, Grossesse, Post-partum, Fausse couche et Ménopause ont été renforcés en profondeur. Les calendriers, journaux, rappels, statistiques et validations de dates sont désormais plus cohérents, les exports médicaux tiennent mieux compte de l’objectif actif, et le changement d’objectif conserve les données tout en reprenant les configurations incomplètes au bon endroit. La qualité a également progressé avec 97 nouveaux fichiers de tests couvrant les principaux cas fonctionnels, temporels et de persistance. Les prochaines étapes sont l’exécution de la validation technique complète et les tests sur appareils réels.

## Suivi

| Indicateur | État du rapport |
|---|---:|
| Date du rapport | **25/09/2026** |
| Temps de travail | **9 h** |
| Commits analysés | **12** |
| Commits Mobile | **12** |
| Fichiers modifiés | **251** |
| Lignes ajoutées | **26 510** |
| Lignes supprimées | **1 517** |
| Fichiers de tests touchés | **107** |
| Nouveaux fichiers de tests | **97** |
| Suivi Cycle | ✅ Fortement amélioré |
| Conception et Contraception | ✅ Fortement améliorées |
| Cycles irréguliers / SOPK | ✅ Fortement améliorés |
| Grossesse, Post-partum et Fausse couche | ✅ Fortement améliorés |
| Ménopause | ✅ Fortement améliorée |
| Exports médicaux par objectif | ✅ Étendus et corrigés |
| Changement d’objectif | ✅ Centralisé et testé |
| Fonctionnalités spirituelles | ✅ Mises à jour et davantage testées |
| Suite complète Jest / TypeScript / ESLint | ⏳ À relancer |
| Tests sur appareil réel | ⏳ À effectuer |
