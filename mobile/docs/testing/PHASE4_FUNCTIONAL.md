# Phase 4 — tests fonctionnels

> Une fonctionnalité à la fois. Les écrans et les stores sont les vrais ; seuls les choix de l'OS (permission de notification) et le point d'entrée unique des notifications sont simulés. Aucun code de production n'est modifié par cette phase. Les bugs trouvés sont rapportés, pas corrigés, tant que tu ne les as pas validés.

Outils : Jest 29 et `react-test-renderer` (pas de Testing Library ni de test de bout en bout installé). Aucune dépendance ajoutée.

## 1. Configuration du cycle (14/11/2026)

### Écrans et stores lus avant d'écrire
`CycleInformationScreen`, `CycleRemindersScreen`, `onboardingPreferences` (`setCyclePreferences`, `correctPeriodOccurrence`, `setPeriodEndDateTime`), `confirmedPeriodHistoryStore`, `cycleReminderPreferences`, `cycleReminderScheduling`, `saveFailure`, `cycleMath` (`computeCyclePredictionStatus`).

### Déjà couvert, donc non répété
`ProfileConfigEditPaths` (lignes de profil, préremplissage, enregistrement inchangé, édition des habitudes, « je ne sais pas », continuation de l'onboarding), les suites du planificateur (`cycleReminderScheduling*`, règles internes), le temps « 24:30 » stocké (`StoredMidnightTimeEditors`), les libellés d'heure en anglais (`MidnightTimeLabelsEnglish`), l'isolation des rappels par profil (`reminderProfileIsolation`).

### Tests ajoutés
**`src/screens/__tests__/CycleInformationFunctional.test.tsx` — 29 tests** (dates fixées : « aujourd'hui » = 20/08/2026, seul `Date` est simulé)

| Groupe | Scénarios |
|---|---|
| Dates des dernières règles (7) | début futur refusé (message, rien d'écrit, pas de navigation, pas d'alerte) ; message effacé après une date valide puis enregistrement ; « terminées : oui » sans date de fin ; fin avant le début, fin future ; « non » masque la fin et supprime son erreur ; fin plus ancienne que le début non présentée comme terminée ; navigation par mois et choix d'un jour du mois précédent |
| Ce qu'un enregistrement écrit (7) | « oui » + nouvelle fin : fin, occurrence confirmée et historique concordent ; « non » : fin effacée et occurrence de CETTE période retirée, une période confirmée plus ancienne reste ; déplacement du début de la dernière période confirmée (correction : l'ancien début quitte l'historique) ; correction qui chevauche une période antérieure (repli sans message) ; bornes des durées (règles 2–10, cycle 20–40, 1/11 et 19/41 absents) ; « je ne sais pas » ouvre une fenêtre d'observation à la date des règles et un nouvel enregistrement la conserve ; relecture après redémarrage |
| Prédictions (3) | cycle 28 → 30 jours déplace la prochaine date de 2 septembre à 4 septembre ; « régularité : non » fait passer la prédiction de « date exacte » à « fenêtre » ; nouveau début (3 août) → 31 août |
| Écriture refusée ou en échec (4) | habitudes : une seule alerte, valeurs revenues en arrière, choix conservé à l'écran, nouvel essai réussi ; édition complète : alerte, pas de navigation, ni fin ni occurrence confirmée écrites ; onboarding : pas d'étape suivante ; bouton libéré après l'échec |
| Où mène un enregistrement (3) | raccourci « Configure ton cycle » → retour ; onboarding conception → `ConceptionTryingDuration` ; onboarding cycle → `CycleReminders` |
| Second appui pendant l'enregistrement (5) | édition complète : écran quitté une seule fois ; habitudes (corrigé, voir §Correction) : deux appuis à 30 ms pendant une écriture de 80 ms = une écriture et un `goBack()`, bouton tenu (« Enregistrement… ») ; deux appels dans le même tick ; bouton de nouveau utilisable après un succès ; garde libérée après un échec |

**`src/screens/__tests__/CycleRemindersFunctional.test.tsx` — 20 tests** (vrais stores, vrai planificateur, câblage identique à `App.tsx`)

| Groupe | Scénarios |
|---|---|
| Interrupteurs et enregistrement (8) | ouverture sur les valeurs stockées sans rien demander ni écrire ; « règles à venir » propose 1/2/3 jours et le choix est enregistré ; l'interrupteur fertilité pilote les deux cases, chaque case seule, aucune case = interrupteur éteint ; journal sans heure refusé (rien d'enregistré, d'écrit ni demandé) ; message effacé dès qu'un interrupteur change ; tout éteindre enregistre sans demander la permission ; relecture après redémarrage ; onboarding « Continuer » enregistre et avance, « Pas maintenant » avance sans enregistrer |
| Permission de notification (5) | accordée : demandée une fois, à l'enregistrement ; refusée : choix conservé, écran conservé, explication, « ouvrir les réglages » ; refusée puis accordée dans les réglages : le nouvel enregistrement passe ; refusée en onboarding : « Pas maintenant » permet d'avancer ; échec d'ouverture des réglages sans plantage |
| Planification réelle (4) | « 3 jours avant » : 30/08 09:00, identifiant propre au profil ; journal quotidien à 21:15, annulé à la désactivation ; fertilité : les deux, puis ovulation seule (fenêtre fertile annulée) ; rien tant qu'un autre objectif est actif |
| Profil de fille sans cycle confirmé (1) | trois rappels datés désactivés à l'écran et enregistrés éteints, le journal reste possible, les choix de la mère sont intacts |
| Échec d'écriture (2) | alerte unique, brouillon conservé, aucune permission demandée, retour en arrière puis nouvel essai réussi ; onboarding : pas d'étape suivante |

### Tests de mutation (code de production remis en état après chaque essai)
`CycleInformationScreen` : contrôle de la date future retiré (2 échecs) ; remise à zéro de la fin avec « non » retirée (1) ; retrait de l'occurrence confirmée avec « non » (1) ; gestion de l'échec des habitudes retirée (1). Deux mutations ne sont pas détectées : le message d'échec du formulaire complet (le magasin d'abord, par repli, affiche déjà la même alerte : redondance voulue) et le chemin de correction du début (le repli aboutit au même historique observable : mutant équivalent).
`CycleRemindersScreen` : 6 mutations, toutes détectées : gabarit du profil de fille retiré (1 échec), demande de permission retirée (5), contrôle de l'heure retiré (2), navigation malgré le refus (3), message d'échec retiré (1), règle de l'interrupteur fertilité inversée (1).

### Commandes exécutées et résultats
| Commande | Résultat |
|---|---|
| `npx jest CycleInformationFunctional` | 26 / 26 (exécutée 3 fois, stable) |
| `npx jest CycleRemindersFunctional` | 20 / 20 (3 fois, stable) |
| `npx jest CycleInformation CycleReminders ProfileConfigEditPaths NotificationPermissionGuidance StoredMidnightTimeEditors MidnightTimeLabelsEnglish cycleReminder reminderSyncCoalescing AdultCyclePredictionReliability OnboardingThemeHardening SharedCycleJournals` | 14 suites, 452 tests : 451 passés, 1 échec dans `SharedCycleJournals` (déjà en échec à HEAD) |
| `npx tsc --noEmit` | propre |
| `npx eslint` sur les deux fichiers de test | propre |

### Problèmes constatés (aucune correction appliquée)
1. **Bug démontré, CORRIGÉ le 14/11/2026 (voir §Correction) — `CycleInformationScreen`, édition des habitudes (`section: 'habits'`)** : la branche `habitsOnly` de `handleNext` ne met jamais `submitting` à vrai ; le bouton n'est pas tenu. Deux appuis à 30 ms d'écart pendant l'écriture appellent `navigation.goBack()` **deux fois** (reproduit avec une écriture simulée à 80 ms) : la personne peut quitter aussi l'écran précédent. L'édition complète n'a pas ce défaut (le bouton passe à « Enregistrement… »). Correction proposée : dans la branche, `setSubmitting(true)` avec `try/finally`, et une garde par référence (`useRef`) contre deux appels dans le même rendu. Le test `it.failing` deviendra alors un `it`.
2. **Observation — enregistrement partiel de l'édition complète** : si l'écriture de la fin des règles échoue après celle du cycle, l'alerte s'affiche et l'écran reste, mais les durées et le début sont déjà enregistrés (vérifié : 30 jours conservés après redémarrage). Un nouvel essai achève l'enregistrement ; il n'y a pas de perte de donnée, mais le message « échec » est trompeur. Aucun correctif proposé tant que tu n'as pas tranché (une écriture groupée serait un changement plus large).
3. **Limite des tests** : le sélecteur d'heure est un composant natif simulé par un composant vide dans `jest.setup.js` ; le choix de l'heure par ce sélecteur n'est donc testé qu'à travers l'heure stockée. Les tests ne prouvent pas qu'un téléphone affiche ou délivre une notification.

### Correction du double appui (habitudes seulement), autorisée le 14/11/2026
`CycleInformationScreen.tsx`, branche `habitsOnly` de `handleNext` uniquement : une garde synchrone `habitsSaveInFlight` (`useRef`) vérifiée avant toute chose, `setSubmitting(true)` (le bouton passe à « Enregistrement… » et se désactive), et un `finally` qui libère la garde et remet `submitting` à faux, succès comme échec, avant le `goBack()` du succès. Rien d'autre n'est modifié : sauvegarde, gestion d'erreur (`presentSaveFailure`, pas de navigation) et navigation sont les mêmes ; le parcours d'édition complète et l'enregistrement partiel (observation 2) sont intacts.

Le test `it.failing` est devenu un `it` normal, avec trois tests complémentaires. Mutations : garde par référence retirée (2 échecs), libération de la garde retirée (3), état de chargement retiré (1) — code remis en état après chaque essai.

| Commande | Résultat |
|---|---|
| `npx jest CycleInformationFunctional` (3 exécutions) | 29 / 29 |
| `npx jest CycleInformation ProfileConfigEditPaths OnboardingThemeHardening PhaseTurkishScreens localizedWeekDays Phase7EProfileLanguageSwitch MiscarriageDateAndConceiveTransition ProfileScreen.test AdultCyclePredictionReliability` | 9 suites, 268 / 268 |
| `npx tsc --noEmit` ; `npx eslint` (écran + test) | propres |

## 2. Profil — `PersonalInformationScreen` (14/11/2026)

### Lu avant d'écrire
`PersonalInformationScreen.tsx`, `personalInformationStore.ts` (cache, chiffrement des champs sensibles, `persistWithRollback`, prénom d'accueil via `setFirstName`), `saveFailure.ts`. Comportement réel : lignes prénom / nom / e-mail / téléphone / nom préféré (feuille avec champ prérempli), pays / calendrier / format de l'heure (listes), date de naissance (sélecteur natif, bornée à aujourd'hui), photo (appareil / galerie / suppression), « Langue » en lecture seule. Validation : champ vide refusé, e-mail `x@y.z`, téléphone ≥ 8 chiffres. Succès : feuille fermée + toast de 2,2 s, **pas de navigation**. Échec : alerte, feuille et brouillon conservés, pas de toast, retour en arrière du store. **Il n'existe pas d'état de chargement ni de garde de double soumission** : aucun test de « prévention » n'est donc créé (voir observation).

### Déjà couvert, donc non répété
« Non renseigné » partout et rien d'écrit à l'ouverture (`MissingPersonalHealthInfoScreens`) ; chiffrement, migration, langue toujours française, absence de valeurs inventées (`personalInformationStore`, `MissingPersonalHealthInfo`) ; ligne « Langue » vivante, textes FR/EN, thème (`SettingsFamily`, `Phase7EProfileLanguageSwitch`, `PhaseTurkishScreens`). Aucun test redondant à retirer.

### Tests ajoutés — `src/screens/__tests__/PersonalInformationFunctional.test.tsx` : 30 tests
Écran, store, chiffrement et Keychain réels ; simulés : le sélecteur de date natif (composant vide dans `jest.setup.js`, remplacé localement par un double qui expose ses propriétés), le sélecteur de photo et l'écriture mise en échec.

| Groupe | Scénarios |
|---|---|
| Affichage (2) | valeurs stockées, date lisible, « Non renseigné » seulement pour le vide ; enregistrement abîmé (nombres, null, junk) sans « NaN »/« undefined » |
| Champs texte (13) | éditeur prérempli, valeur rognée, feuille fermée, toast, ligne mise à jour ; champ vide ouvert vide, seul le champ édité change ; 7 refus (vide, espaces, e-mail sans `@` / `a@b` / avec espace, téléphone 7 chiffres / 4 chiffres) : message sous le champ, feuille et brouillon conservés, rien d'écrit, pas de toast ; bornes acceptées (8 chiffres, `a@b.c`) ; erreur effacée en tapant ; annuler n'écrit rien ; le prénom (puis le nom préféré) devient le nom d'accueil ; e-mail chiffré au repos, prénom lisible, tout relu par un module de store neuf (redémarrage) |
| Listes (4) | pays : filtre sans casse, aucun résultat, choix enregistré ; calendrier (3 choix) ; format 12 h / 24 h ; annuler ne change rien |
| Date de naissance (3) | l'ouverture n'écrit rien, borne = aujourd'hui, départ sur la date enregistrée ; date choisie enregistrée en jour local `AAAA-MM-JJ`, y compris à 23:30 et à 00:30 (fuseau Africa/Algiers : un `toISOString()` décalerait la seconde) |
| Photo (3) | galerie et appareil photo enregistrent l'URI ; annulation = rien, pas de toast ; « supprimer » seulement s'il y a une photo, retire l'URI du stockage |
| Échec d'écriture (3) | alerte unique, éditeur et texte conservés, pas de toast, nom et stockage revenus en arrière, nouvel essai réussi ; choix de liste non écrit non affiché comme choisi ; pas de navigation après un enregistrement, retour fonctionnel |
| Observation (1) | deux appuis simultanés sur Enregistrer : état final cohérent, pas d'alerte |

### Mutations (code remis en état après chaque essai)
Écran : validation de l'e-mail retirée (4 échecs), seuil du téléphone 8 → 5 (2), `trim()` retiré (2), effacement de l'erreur retiré (1), `return` après échec retiré (2), date en `toISOString()` (1), filtre pays sensible à la casse (1). Store : retour en arrière retiré (2). Toutes détectées.

### Commandes exécutées et résultats
| Commande | Résultat |
|---|---|
| `npx jest PersonalInformationFunctional` (3 exécutions) | 30 / 30 |
| `npx jest PersonalInformation MissingPersonalHealthInfo personalInformationStore SettingsFamily Phase7EProfileLanguageSwitch PhaseTurkishScreens ProfileScreen.test ManagedProfileFlow AuthThemeHardening Phase7BFirstRunLanguageSwitch ManagedDaughterCalendarNoFakePredictions` | 12 suites, 338 / 338 |
| `npx tsc --noEmit` ; `npx eslint` (fichier de test) | propres |

### Problèmes et observations (aucun correctif appliqué, aucun code de production modifié)
1. **Pas de garde de double soumission** sur « Enregistrer » : deux appuis lancent deux écritures des mêmes valeurs. Constaté sans conséquence (même patch, état final cohérent, un seul toast visible, pas d'alerte, pas de navigation à doubler). Aucun correctif proposé.
2. **Un champ rempli ne peut plus être vidé** : toute valeur vide est refusée (« champ obligatoire »), y compris pour des champs facultatifs comme le nom, l'e-mail, le téléphone ou le nom préféré. Il n'y a donc aucun moyen de revenir à « Non renseigné » depuis l'écran (sauf la photo). À confirmer côté produit : voulu ou à permettre pour les champs facultatifs.
3. **Validations minimales** : l'e-mail accepte tout `x@y.z` sans espace ; le téléphone n'exige que 8 chiffres (le message dit « numéro international valide », sans contrôle du format international). Comportement actuel documenté, pas un bug démontré.
4. **Limites des tests** : le sélecteur de date natif et le choix de la photo sont simulés ; ils ne prouvent pas l'affichage sur téléphone. Le jeton du toast est vérifié par son texte, pas par son animation. Un minuteur de 2,2 s du toast peut rester en attente à la fin d'un test (message « Jest did not exit » sans effet sur le résultat).

### Règle des champs facultatifs, validée et appliquée le 14/11/2026
Décision produit (réponse aux observations 2 et 3 ci-dessus) :

| Champ | Règle |
|---|---|
| Prénom, nom | **Obligatoires** : jamais vides (message « Ce champ est obligatoire. ») |
| E-mail | **Facultatif** : vide accepté ; si renseigné, format `x@y.z` obligatoire |
| Téléphone | **Facultatif** : vide accepté ; si renseigné, au moins 8 chiffres (règle inchangée) |
| Nom préféré | **Facultatif** : vide accepté |

Comportement : effacer le contenu puis enregistrer suffit (**pas** de bouton « Supprimer », décision de la maquette) ; la ligne affiche « Non renseigné » ; les autres champs ne changent pas ; une valeur invalide saisie reste refusée (elle n'est jamais traitée comme un effacement) ; en cas d'échec, brouillon conservé et valeur précédente restaurée ; toast habituel conservé ; le double appui n'est pas modifié.

**Code de production modifié (uniquement `src/screens/PersonalInformationScreen.tsx`)** : `saveTextField` enregistre `''` pour un champ facultatif vide ou fait d'espaces, et refuse toujours un prénom/nom vide ; liste `OPTIONAL_FIELDS` ; `InfoRow` accepte une indication `hint` affichée en pastille discrète sur les trois lignes concernées. Le store (`personalInformationStore`) n'est pas modifié : une chaîne vide y signifie déjà « non renseigné » (champ sensible chiffré : clé absente au repos).
**Libellé de l'indication** : j'ai réutilisé la clé existante `irregularJournalEntry.optional` (présente dans les 74 langues), soit « Optionnel » en français et non « Facultatif ». Aucune clé de traduction ajoutée. Si le mot exact « Facultatif » est exigé, il faut une clé dédiée traduite dans toutes les langues : à confirmer.

**Tests ajoutés (+15, `PersonalInformationFunctional.test.tsx`, total 45)** : pour chacun des trois champs, effacement accepté (pas d'erreur, toast, éditeur fermé, « Non renseigné », autres champs intacts, valeur absente du stockage) ; espaces seuls = vide ; les trois effacés à la suite ; champ vidé puis rempli de nouveau, la nouvelle valeur devant être valide ; téléphone invalide toujours refusé sans effacer l'ancien ; effacer le nom préféré rend le prénom comme nom d'accueil ; relecture avec un module de store neuf (restart) : vidés restent vides, le reste est conservé ; écriture refusée sur un effacement (alerte, brouillon vide conservé, valeur restaurée, nouvel essai réussi) ; prénom et nom vides refusés avec valeur, autres champs et stockage intacts ; pastille présente sur exactement les trois lignes facultatives.
Les 30 tests précédents sont inchangés.

**Mutations (code remis en état après chaque essai)** : liste facultative vidée (11 échecs), nom de famille déclaré facultatif (1), effacement ignoré (11), effacement sans écriture (11), pastille retirée du téléphone (1). Toutes détectées.

| Commande | Résultat |
|---|---|
| `npx jest PersonalInformationFunctional` (2 exécutions) | 45 / 45 |
| Suites liées (13 suites : profil, paramètres, `ProfileScreen`, `ManagedProfileFlow`, `designSystemCoverage`…) | 357 / 357 |
| `npx tsc --noEmit` ; `npx eslint` (écran + test) | propres |

À prévoir : vérification sur téléphone réel du sélecteur de date natif, du choix de photo et de l'aspect de la pastille (limite connue des tests).

### Clôture de la fonctionnalité Profil — vérification du diff (14/11/2026)
**Diff de `PersonalInformationScreen.tsx`, séparé en deux.** La référence « avant mon intervention » est la copie du fichier prise avant mes modifications ; rien n'a été restauré depuis HEAD, aucun changement préexistant n'a été supprimé.

| Origine | Contenu |
|---|---|
| **Préexistant** (HEAD → avant mon intervention, ~46 lignes, changements non commités de l'utilisatrice) | en-tête du titre (`adjustsFontSizeToFit`, une ligne) ; avatar centré 96 px sans carte ni salutation (suppression de la carte « Salam / intro / bouton photo » et des styles associés) ; `navigationBarTranslucent` sur la feuille |
| **Mon intervention** (13 lignes ajoutées, 3 remplacées) | `OPTIONAL_FIELDS` ; `InfoRow` : prop `hint` + pastille ; `optionalHint = t('irregularJournalEntry.optional')` ; `saveTextField` : champ facultatif vide → `persist({[key]: ''})`, prénom/nom vides toujours refusés ; `hint` passé aux lignes e-mail, téléphone, nom préféré ; style `rowHint` |

**Clé de traduction réutilisée `irregularJournalEntry.optional`.** Présente dans les 74 dictionnaires (les 2 surcouches `ptBR` et `enUS` héritent de `pt-PT` et `en`) ; contrôle d'exécution sur les 75 codes de langue de l'application : aucune valeur manquante ni clé brute. Ce n'est **pas** « Optionnel » partout : c'est le mot propre à chaque langue (fr « Optionnel », en « Optional », it « Facoltativo », es « Opcional », ar « اختياري », ja « 任意 », zh « 选填 », zh-Hant « 選填 », pt-BR « Opcional »…). Le français affiche « Optionnel » et non « Facultatif » (décision en attente).

**Confirmation des résultats** (réexécutés pour cette clôture) : `PersonalInformationFunctional` 45 / 45 ; 13 suites liées 357 / 357.

### Finalisation du Profil : clé dédiée et revue du stockage (14/11/2026)

**Clé de traduction dédiée `profile.optional`** (remplace la réutilisation de `irregularJournalEntry.optional`) :
- Ajoutée dans le bloc `profile` de 73 dictionnaires de langue (une ligne chacun, juste après `notProvided`) ; le danois n'a qu'un bloc utilisé (`da.ts`). Les surcouches `ptBR` et `enUS` n'ont pas la clé et héritent de `pt-PT` et de `en` ; `da_chunk2.ts` est un fichier orphelin (importé nulle part), laissé intact.
- Français : « Facultatif » (demandé). Les autres langues reprennent le mot déjà employé pour « optionnel » dans leur propre dictionnaire (déjà relu pour le SOPK) : par exemple en « Optional », it « Facoltativo », es/pt « Opcional », ar « اختياري », ja « 任意 », zh « 选填 », zh-Hant « 選填 », ru « Необязательно », tr « İsteğe bağlı », da « Valgfri ». **Ce ne sont pas de nouvelles traductions relues par des locuteurs natifs** : pour les langues rares (wo, rn, ff, sn, ln, om…), une relecture native reste à faire.
- Contrôle d'exécution sur les **75 codes de langue** de l'application : aucune valeur manquante, aucune clé brute. Compteur de clés des 4 tests de parité : 6165 → 6166.
- L'écran lit `t('profile.optional')` ; le test de la pastille aussi.

**Consommateurs des champs e-mail, téléphone et nom préféré** (recherche dans tout `src` hors tests) :

| Champ | Qui le lit | Valeur vide |
|---|---|---|
| E-mail, téléphone | uniquement `PersonalInformationScreen` ; aucun export, sauvegarde, rappel ni écran de l'AWA à deux ne les lit (un test existant vérifie qu'aucun service d'export n'importe ce store) | « Non renseigné » ; clé absente au repos pour ces champs chiffrés |
| Nom préféré | `NameOnboardingScreen` (préremplissage et enregistrement de `name.trim()`, **déjà capable d'enregistrer une chaîne vide** quand elle passe l'étape), le store (`setFirstName(preferredName \|\| firstName)`), puis tout l'accueil via `getFirstName()` | retombe sur le prénom (test existant et test ajouté) |
| Autres champs du store (calendrier, format de l'heure, pays, date de naissance) | calendriers des objectifs via `loadPersonalInformation().calendar` | non concernés |

Aucun risque de régression identifié ; format de stockage inchangé (une chaîne vide signifiait déjà « non renseigné » : `sanitizeInformation`, `encryptInformationForStorage`).

**Résultats exacts** : `PersonalInformationFunctional` 45 / 45 ; 13 suites liées 357 / 357 ; avec les 27 suites `src/i18n` : 40 suites, 8 421 tests, tous verts ; `npx tsc --noEmit` et `npx eslint` (écran, test, 4 tests de parité, 3 dictionnaires) propres.

**À vérifier à la main sur le Huawei (non couvert par Jest)** :
1. Pastille « Facultatif » : lisibilité et contraste dans chaque thème (clair, sombre, vrai noir), sur les lignes e-mail, téléphone et nom préféré.
2. Grande police système (taille maximale) et petit écran : la pastille ne doit ni écraser ni tronquer la valeur de la ligne.
3. Sélecteur de date de naissance natif (ouverture sur la date enregistrée, date future impossible, enregistrement) et choix de photo (galerie, appareil photo, suppression).
4. Effacer chacun des trois champs facultatifs, enregistrer, quitter l'écran, le rouvrir puis redémarrer l'application : « Non renseigné » doit rester ; le nom d'accueil doit redevenir le prénom après l'effacement du nom préféré.
5. Messages d'erreur : e-mail invalide, téléphone de moins de 8 chiffres, prénom/nom vides ; le texte tapé doit rester dans le champ.
6. Libellé de la pastille dans une langue à écriture non latine (arabe en lecture de droite à gauche, hindi, japonais).

## 3. Symptômes et humeur — `JournalSymptomsScreen`, `JournalMoodScreen` (14/11/2026)

### Lu avant d'écrire
`JournalMoodScreen`, `JournalSymptomsScreen`, `dailyJournalStore` (lecture/écriture par entrée, notes chiffrées, `deleteJournalSection`), `useJournalDay` / `JournalDaySwitcher`, `ClearEntryButton`, lecteurs en aval (`SelectedDayCard`). Comportement réel : **humeur** = 9 humeurs, 4 échelles 1–5, note ≤ 300 caractères, sélecteur de jour (30 jours en arrière, jamais de futur) ; **symptômes** = 15 symptômes à cocher, 4 intensités (« Forte » et « Très forte » enregistrées `severe`), 5 zones, note ≤ 300, enregistrement pour **aujourd'hui seulement**, toast puis fermeture ≈ 2,5 s. Les écrans propres aux autres objectifs (grossesse, post-partum, ménopause, SOPK) ont leurs propres tests et ne sont pas concernés.

### Déjà couvert, donc non répété
Les 9 humeurs et leurs libellés (`MoodScreenEmojiCards`) ; enregistrement → réouverture → réenregistrement sans changement, défauts d'un jour vide, préremplissage partagé avec la grossesse, noms inconnus et `severe` conservés (`SharedCycleJournals`) ; effacement avec confirmation (`CycleJournalsClearEntry`) ; écriture refusée sur un enregistrement protégé (`RefusedWriteFeedback`) ; présentation et titre de la fille ; chiffrement des notes (`dailyJournalStore`).

### Tests ajoutés
**`src/screens/journal/__tests__/MoodJournalFunctional.test.tsx` — 14 tests** (dates fixées : aujourd'hui = 15/10/2026, seul `Date` est simulé ; pile de navigation Base → Middle → Journal pour voir un `goBack()` en trop)

| Groupe | Scénarios |
|---|---|
| Modifier une humeur existante (4) | l'humeur est remplacée (une seule entrée, même id) et symptômes/sommeil du jour intacts ; échelles : toutes à 1, toutes à 5, valeurs différentes sur chacune |
| Commentaire (3) | 300 caractères maximum, compteur, valeur rognée ; espaces seuls = commentaire vide, aucun blob chiffré écrit ; 300 caractères conservés et relus par un store neuf, chiffrés au repos |
| Autre jour (4) | hier s'ouvre sur sa propre humeur, l'enregistrement ne change qu'hier ; un jour vide ouvre les défauts, jamais les valeurs de la veille ; un jour passé vide reçoit une nouvelle entrée de ce jour seulement ; pas de jour futur, pas plus de 30 jours en arrière |
| Échec d'écriture (3) | alerte propre à l'humeur, écran et choix conservés, rien stocké, nouvel essai réussi ; échec sur une humeur existante : l'ancienne reste ; deuxième appui 30 ms plus tard pendant une écriture de 80 ms : une écriture, un seul `goBack()` |

**`src/screens/journal/__tests__/SymptomsJournalFunctional.test.tsx` — 23 tests**

| Groupe | Scénarios |
|---|---|
| Choix des symptômes (4) | les 15 cases (rôle `checkbox`), « Douleurs menstruelles » et « Fatigue » cochées d'office et compteur « 2 sélectionnés » ; cocher/décocher plusieurs, compteur, ordre d'enregistrement ; chacun des 15 (dont « Autre ») enregistrable seul ; tout décocher : liste vide enregistrée avec intensité et zone, rien de coché à la réouverture |
| Intensité et zone (10) | légère / modérée / forte / très forte → `mild` / `moderate` / `severe` / `severe` ; un `severe` rouvre sur « Forte » ; chacune des 5 zones enregistrée et seule cochée à la réouverture |
| Modifier une entrée existante (2) | symptômes remplacés (une entrée, même id), humeur et sommeil du jour intacts ; les deux contrôles d'enregistrement (coche de l'en-tête, bouton du bas) |
| Commentaire (2) | 300 caractères maximum, rogné, espaces seuls = aucune note au repos ; entrée complète et note relues par un store neuf, note chiffrée au repos |
| Après l'enregistrement (2) | toast, puis fermeture après ≈ 2,5 s (pas avant 2 s) ; fermer le toast à la main laisse sur l'écran |
| Échec d'écriture (3) | alerte propre aux symptômes, pas de toast, écran et choix conservés, rien stocké, nouvel essai réussi ; échec sur une entrée existante : l'ancienne reste ; deuxième appui à 30 ms : une seule écriture |

### Mutations (code remis en état après chaque essai)
Humeur : `trim()` retiré (2 échecs), remise des défauts au changement de jour retirée (1), alerte retirée (2), énergie enregistrée à la place du stress (1), `maxLength` 300 → 400 (1), limite des 30 jours → 31 (1). Symptômes : décoche retirée (4), « Très forte » enregistrée `moderate` (2), `trim()` retiré (1), alerte retirée (2), zone ignorée (7), fermeture du toast à 0,8 s (1), `maxLength` (1), garde `saving` retirée (1). Toutes détectées.

### Commandes exécutées et résultats
| Commande | Résultat |
|---|---|
| `npx jest MoodJournalFunctional` | 14 / 14 |
| `npx jest SymptomsJournalFunctional` (2 exécutions) | 23 / 23 |
| 16 suites liées (journal, calendrier, `dailyJournalStore`, `RefusedWriteFeedback`, thème…) | 412 tests, **406 passés, 6 en échec dans 5 suites**, tous identiques aux échecs du code commité (HEAD) : `dashboardsUseSharedToday` (2), `JournalLocalization` (1), `MoodScreenEmojiCards` (1), `SharedCycleJournals` (1), `journalHeroContrast` (1). Comparaison test par test avec la référence HEAD : aucun échec nouveau. |
| `npx tsc --noEmit` ; `npx eslint` (2 fichiers de test) | propres |

### Observations (aucun code de production modifié)
1. **Humeur : double appel dans le même tick.** Deux `onPress` appelés avant tout nouveau rendu écrivent deux fois et appellent `goBack()` deux fois (la garde est l'état `saving`, sans référence synchrone). Le cas réaliste (deuxième appui 30 ms plus tard) est protégé et testé ; le cas « même tick » n'a pas de test (il échouerait). Même correctif possible que pour `CycleInformationScreen` (référence synchrone) : à valider.
2. **Valeurs par défaut enregistrées sans action** : enregistrer un jour intact écrit les valeurs par défaut (humeur « très bien », énergie 4…) ; pour les symptômes, « Douleurs menstruelles » et « Fatigue », intensité « Forte » et zone « Bas ventre » sont cochées d'office et deviennent des données saisies. Choix de conception à confirmer (cf. règle « données réelles uniquement » du projet).
3. **Symptômes : pas de sélecteur de jour** : seul aujourd'hui peut être saisi ou corrigé (l'humeur permet 30 jours en arrière).
4. **Symptômes : « Forte » et « Très forte »** sont enregistrées toutes deux `severe` ; la réouverture affiche « Forte ». Documenté dans le code et testé.
5. **Un enregistrement sans aucun symptôme coché** est accepté (liste vide, avec intensité et zone) ; le calendrier le considère comme une entrée de symptômes. À confirmer côté produit.
6. **Non couvert** : l'affichage de ces entrées dans le calendrier (`SelectedDayCard`) par un test d'intégration dédié.

À vérifier sur le Huawei : défilement des 15 symptômes et lisibilité du compteur, zones et images du corps, toast (position, fermeture), clavier et note multiligne, flèches de jour de l'humeur, grande police, fermeture automatique après l'enregistrement des symptômes.

### Suite de la fonctionnalité 3 : correction du double appui, audit des valeurs par défaut (14/11/2026)

**1. Correction autorisée — double appui dans le même tick, écran d'humeur (`JournalMoodScreen.tsx`).**
Mécanisme existant : la garde de `save()` était l'état `saving`, qui ne change qu'au rendu suivant ; deux appels dans le même tick passaient tous deux (2 écritures, 2 `goBack()`, la personne arrivait deux écrans en arrière). Même approche que `CycleInformationScreen` : une référence synchrone `saveInFlight` (`useRef`) testée avant tout, prise tout de suite, libérée dans le `finally` (succès comme échec) avec `setSaving(false)`. Rien d'autre n'est modifié (sauvegarde, alerte, navigation, symptômes, autres écrans).
Tests ajoutés (+2, `MoodJournalFunctional`, total 16) : deux appuis synchrones = une écriture et une seule navigation ; après un échec, la garde est libérée (le nouvel essai, de nouveau à deux appels simultanés, écrit une fois). Mutations : garde par référence retirée (2 échecs), libération retirée (2 échecs). Le test à 30 ms existant reste vert.

**2. Audit des valeurs par défaut (aucun changement de production).** Sonde exécutée sur les vrais écrans, le vrai store et les vraies fonctions de statistiques :

| Constat | Résultat mesuré |
|---|---|
| Ouvrir l'écran d'humeur ou de symptômes sans rien faire | **rien n'est écrit** (stockage resté vide). Les valeurs par défaut sont affichées, pas persistées. |
| Humeur : bouton « Enregistrer » sur un jour intact | **persiste** `veryGood`, énergie 4, stress 3, irritabilité 2, motivation 4 (sans note). |
| Symptômes : cases cochées d'office (« Douleurs menstruelles », « Fatigue ») | affichées cochées à l'ouverture ; **persistées** à l'enregistrement avec l'intensité `severe` (« Forte ») et la zone « Bas ventre », que la personne n'a pas choisies. |
| Symptômes : tout décocher puis enregistrer | **persiste** `names: []`, `severe`, « Bas ventre » : une intensité et une zone sans aucun symptôme. |
| Conséquences en aval | `calculateMoodDistribution` compte 1 jour « très bien » ; `calculateSymptomFrequency` compte « Douleurs menstruelles » et « Fatigue » ; `countTrackedDays` = 1 ; le calendrier met le point « symptômes » (`Boolean(entry.symptoms)`, vrai même avec `names: []`) ; l'export médical du cycle lit les mêmes entrées (`getAllJournalEntries`) ; l'AWA à deux affiche l'humeur persistée au partenaire quand le partage de l'humeur est actif. |
| Entrée vide / jamais enregistrée | **aucune fausse donnée** : pas de section, rien dans les statistiques, le calendrier, l'export. |

Conclusion : le risque n'est pas l'ouverture de l'écran mais l'enregistrement par réflexe (le bouton est toujours actif) : un appui sur « Enregistrer » sans choix produit des données qui ressemblent à des déclarations.

Proposition de correction minimale (à valider, rien n'est appliqué) :
- **Symptômes** : ne plus cocher d'office (`selected` initial `[]`), et refuser l'enregistrement tant qu'aucun symptôme n'est coché (ou l'enregistrer en supprimant la section). L'intensité et la zone ne s'enregistrent que s'il y a au moins un symptôme ; sinon on n'écrit pas ces deux champs.
- **Humeur** : garder les niveaux par défaut visibles mais ne rendre l'enregistrement actif qu'après au moins une interaction (humeur, échelle ou note), via un indicateur « modifié » dans l'écran. Même règle que les symptômes pour « enregistrer sans interaction ».
- Les tests existants qui affirment les valeurs par défaut (« Fatigue »/« Douleurs menstruelles » cochées, `[4, 3, 2, 4]`) seront à adapter explicitement avec ce changement.

**3. Symptômes sans sélecteur de jour (limitation documentée, interface inchangée).** Comportement actuel : la route `SymptomEntry` n'a aucun paramètre de date ; l'écran lit `useToday()` et n'écrit que pour le jour courant. Cohérence avec les autres écrans de journal du cycle : seuls l'humeur et le sommeil utilisent `useJournalDay` (30 jours en arrière) ; activité, hydratation, notes, vie intime, glaire, température, LH, flux et symptômes n'éditent que le jour courant. Les journaux de conception acceptent une date en paramètre (`ConceiveJournalPastDateAndClear`). Aucune incohérence de données (un seul jour est écrit, jamais un autre) ; c'est une limite fonctionnelle commune à la plupart des écrans.

**Vérifications.** `MoodJournalFunctional` 16 / 16 ; `SymptomsJournalFunctional` 23 / 23 (donc **39 tests** de la fonctionnalité 3, verts) ; 16 suites liées : 414 tests, 408 passés, **6 échecs historiques conservés et inchangés** (`dashboardsUseSharedToday` 2, `JournalLocalization` 1, `MoodScreenEmojiCards` 1, `SharedCycleJournals` 1, `journalHeroContrast` 1) ; `tsc` et ESLint propres.

### Valeurs par défaut : correction appliquée après validation (14/11/2026)

**Code de production modifié (4 fichiers) :**
- `JournalMoodScreen.tsx` : état `touched` (remis à faux à chaque changement de jour) ; l'enregistrement (en-tête et bouton du bas) est désactivé et `save()` refuse tant qu'aucune interaction (humeur, une des 4 échelles, commentaire) n'a eu lieu, sauf si une entrée existe déjà pour ce jour. Les valeurs restent affichées.
- `JournalSymptomsScreen.tsx` : plus aucun symptôme pré-coché ; option « Aucun symptôme » (déclaration explicite, enregistrée comme liste vide, sans intensité ni zone) ; enregistrement possible seulement avec au moins un symptôme coché ou « Aucun symptôme » ; intensité et zone enregistrées seulement si elles ont été choisies (rien n'est pré-sélectionné à l'écran) et seulement avec des symptômes.
- `SelectedDayCard.tsx` : une journée sans section de symptômes affiche « Non renseigné » ; « Aucun » reste réservé à la déclaration explicite (avant, les deux cas affichaient « Aucun »).
- `CalendarScreen.tsx` : le point « symptômes » exige au moins un symptôme enregistré (une liste vide explicite n'en met pas).
- Nouvelle clé `journalSymptoms.noSymptoms` dans 73 dictionnaires (mots dérivés du terme « symptôme » déjà présent dans chaque langue ; **relecture par des locuteurs natifs à faire**) ; compteur de clés des 4 tests de parité : 6167.

**Tests :** `MoodJournalFunctional` 27 (rien d'écrit à l'ouverture, boutons désactivés avant interaction, chacune des 7 interactions active l'enregistrement, changement de jour, entrée existante réenregistrable) ; `SymptomsJournalFunctional` 32 (aucun symptôme au départ, enregistrement désactivé, « Aucun symptôme », intensité/zone seulement si choisies) ; nouveau `JournalDefaultsIntegration` 6 (jour non renseigné ne pollue ni stockage, ni statistiques, ni export, ni calendrier ; entrée volontaire dans la carte du jour, les points, les statistiques et l'export ; « Aucun symptôme » ; AWA à deux : pas d'humeur partagée sans choix, humeur choisie partagée seulement si le partage est actif, symptômes jamais partagés).
**Assertions historiques adaptées (objectif conservé, aucun test supprimé) :** `SharedCycleJournals` (symptômes : elle coche elle-même les deux symptômes), `RefusedWriteFeedback` (humeur : elle choisit d'abord une humeur), `JournalFamilyThemeHardening` (charge utile de l'humeur identique entre thèmes : confirme d'abord l'humeur proposée).
**Mutations (détectées)** : carte du jour (absent traité comme « Aucun »), point de liste vide, enregistrement symptômes toujours actif, enregistrement humeur toujours actif, intensité toujours enregistrée.

**Résultats.** Série de 64 suites (traductions, journal, calendrier, AWA à deux, export) : 9 001 tests, 8 993 passés, 8 en échec : les 6 échecs historiques inchangés (`dashboardsUseSharedToday` 2, `JournalLocalization` 1, `MoodScreenEmojiCards` 1, `SharedCycleJournals` 1, `journalHeroContrast` 1), plus `AwaADeuxPartnerJourney` (1, test dépendant de la date, déjà connu) et `JournalFamilyThemeHardening` (1, **régression causée par cette correction, corrigée ensuite** : 66 / 66). `tsc` et ESLint propres (vérifiés sur les fichiers modifiés avant la dernière adaptation de test, puis ESLint sur ce dernier fichier).
**Non vérifié :** l'export médical n'écrit rien pour « Aucun symptôme » (choix inchangé) ; le point « humeur » du calendrier et les autres objectifs (conception, grossesse…) n'ont pas été modifiés.

### Vérification finale de la fonctionnalité 3 (14/11/2026)

**Relance exacte des 64 suites** (même commande que la série précédente, après l'adaptation de `JournalFamilyThemeHardening`) : 64 suites, **58 réussies, 6 en échec** ; **9 001 tests, 8 994 réussis, 7 en échec, 0 ignoré, 0 à faire**. Série précédente : 8 993 / 8 en échec ; la différence est `JournalFamilyThemeHardening` (régression de ma correction, corrigée : 66 / 66). Les 7 échecs restants sont **identifiés et inchangés** : les 6 historiques (`dashboardsUseSharedToday` 2, `JournalLocalization` 1, `MoodScreenEmojiCards` 1, `SharedCycleJournals` 1, `journalHeroContrast` 1) et `AwaADeuxPartnerJourney` (1, dépendant de la date). Aucune nouvelle régression.
**Technique** : `tsc --noEmit` propre ; ESLint propre sur les 4 fichiers de production et les 10 fichiers de test/parité concernés ; traductions : `journalSymptoms.noSymptoms` présente dans 73 dictionnaires, résolue sur les 75 codes de langue (aucune valeur manquante, aucune clé brute, aucune copie française ailleurs qu'en français), de même pour `profile.optional` et les deux clés du calendrier.
**Relecture des changements de production** : aucune déclaration fictive n'est créée (rien n'est écrit à l'ouverture, ni sans interaction, ni sans symptôme ou « Aucun symptôme ») ; les entrées existantes restent modifiables et réenregistrables (humeur : `hasSaved` ; symptômes : une entrée relue remplit les cases, l'intensité et la zone comme choisies) ; « Aucun symptôme » ne modifie que le brouillon à l'écran (cases, intensité, zone) : le stockage ne change qu'à « Enregistrer », qui remplace alors volontairement les symptômes par une liste vide (commentaire et autres sections du jour conservés). Les journaux déjà enregistrés avec les anciennes valeurs par défaut ne sont pas modifiés ni nettoyés.

**Procédure de vérification sur le Huawei** (données de test uniquement, sur un profil de test) :
1. *Humeur, avant interaction* : ouvrir « Humeur » sur un jour sans saisie. Les niveaux proposés sont visibles ; la coche de l'en-tête et le bouton « Enregistrer » apparaissent désactivés (grisés) ; les presser n'enregistre rien et ne ferme pas l'écran.
2. *Humeur, après sélection* : toucher une humeur (ou un niveau, ou taper une note) : les deux boutons s'activent ; « Enregistrer » ferme l'écran. Rouvrir : l'humeur choisie est restituée. Changer de jour avec les flèches : retour à l'état désactivé.
3. *Symptômes, rien de précoché* : ouvrir « Symptômes » sur un jour sans saisie : aucun des 15 symptômes ni « Aucun symptôme » n'est coché, le compteur indique 0, aucune intensité ni zone n'est sélectionnée (l'illustration du corps peut montrer une image), « Enregistrer » est désactivé.
4. *« Aucun symptôme »* : le cocher, enregistrer, rouvrir : il reste coché, rien d'autre. Cocher un symptôme le décoche ; le cocher après des symptômes les décoche ainsi que l'intensité et la zone ; dans le calendrier, ce jour affiche « Aucun » (et non « Non renseigné ») et n'a pas de point « symptômes ».
5. *Intensité et zone* : cocher un symptôme sans toucher l'intensité ni la zone, enregistrer : le calendrier n'affiche ni intensité ni zone ; l'export (PDF/CSV) n'en mentionne pas.
6. *Petit écran et grande police* : régler la police du téléphone sur la taille maximale puis, si possible, la taille d'affichage ; ouvrir les deux écrans : le libellé « Aucun symptôme » (plus long dans certaines langues, tester aussi l'arabe et l'allemand), le compteur, les boutons désactivés, la pastille de la carte du jour et le texte « Non renseigné » ne sont ni tronqués ni superposés ; la liste défile jusqu'au bas ; le bouton du bas reste accessible au-dessus de la barre de navigation Android.

### `AwaADeuxPartnerJourney` : test dépendant de la date, corrigé (14/11/2026)
Cause : deux tests fixaient la fenêtre fertile au 8–13 et au 10–15 novembre 2026 ; l'état affiché (« Dans N jours » / « En cours ») dépend du jour réel, donc le premier échouait depuis le 14 novembre et le second échouerait dès le 16. Correction **dans le test uniquement** : un utilitaire `daysFromToday(n)` et des fenêtres relatives (début dans 3 jours pour « Dans 3 jours » ; commencée hier pour « En cours »). Aucun code de production modifié. Résultat : 79 / 79, ESLint et `tsc` propres. Il ne reste donc que les 6 échecs historiques.

### Tests historiques corrigés, analyse de `journalHeroContrast` (14/11/2026)

**Corrections de tests autorisées (aucun code de production, aucune clé de traduction, aucun test supprimé) :**
- `dashboardsUseSharedToday` : Humeur et Sommeil sont sortis de la liste « `useToday()` » ; un groupe dédié exige `useJournalDay()`, le sélecteur de jour et que `useJournalDay` s'appuie sur `useToday()` (jamais un `new Date()` isolé) : 62 tests.
- Nouveau `useJournalDay.test.tsx` (6) : jour courant, pas de jour futur, limite de 30 jours, mois/année, passage de minuit (le jour modifié suit minuit ; un jour précédent choisi garde son décalage).
- `MoodScreenEmojiCards` : icône vectorielle attendue (nom du jeu d'icônes), libellé de la langue courante, pas de cercle, taille ≥ 30 : 11 tests.
- `JournalLocalization` (Sommeil) : « Tiredness on waking », quatre niveaux anglais, plus de « Night awakenings », aucun texte français : 15 tests.
- `SharedCycleJournals` (Sommeil) : quatre niveaux de fatigue au réveil, aucun compteur inventé ; +3 tests : une ancienne entrée (Reposée/Fatiguée/Moyenne) rouvre sur le bon niveau et son compteur de réveils est conservé : 78 tests.
- `GlobalTodayRefresh` (régression de ma correction des valeurs par défaut, découverte par la suite complète) : l'humeur ouverte avant minuit choisit d'abord une humeur sur le nouveau jour avant d'enregistrer : l'objectif (enregistrer sous le NOUVEAU jour) est inchangé.
Mutations (toutes détectées, code restauré) : hook non basé sur `useToday`, absence de limite à 30 jours, mauvaise icône de l'humeur « triste », niveau de sommeil renommé, compteur de réveils ignoré à la reprise. Chaque suite corrigée relancée 3 fois : même résultat.

**`journalHeroContrast` (non modifié).** Le commit `85afff6` (déjà dans HEAD, 6 nov. 2026, « improve journal and pregnancy experiences ») a retiré le bandeau illustré de l'écran d'humeur : image `mood-header-woman.png`, `JOURNAL_HERO_INK`, aide RTL et styles `heroTitle`/`heroCopy`/`heroImage`, remplacés par un sous-titre en couleur du thème (`AwaText`, `onSurfaceVariant`) et le sélecteur de jour. Le test date d'un commit antérieur (`9880420`). Conclusion : décision de conception très probablement intentionnelle (retrait cohérent et complet, texte suivant le thème donc contraste garanti, aucune spécification de `DESIGN.md` ni de `docs/` n'exige le bandeau) ; l'intention n'est toutefois pas documentée dans le message du commit. Restes : image orpheline, clé `journalMood.heroTitle` inutilisée, commentaire de la ligne 76 de l'écran inexact. Correction proposée, en attente de confirmation : retirer `JournalMoodScreen` de la liste du test (il n'a plus de titre sur photo).

**Suite Jest complète (avant la correction de `GlobalTodayRefresh`)** : 526 suites (498 réussies, 28 en échec) ; 16 855 tests : 16 800 réussis, 55 en échec, 0 ignoré. Référence précédente (exécution complète de la phase 3, 516 suites / 16 592 tests / 60 échecs) : 53 des 55 échecs y figuraient déjà ; les 2 autres : `GlobalTodayRefresh` (régression, corrigée ci-dessus) et `SpiritualTodayRefresh` (dépassement de 5 s sous charge, connu à HEAD ; réussit en isolation). 7 échecs de la référence réussissent maintenant (les 5 historiques corrigés, `AwaADeuxPartnerJourney` et `structuredDataMigration`, instable sous charge).

### Clôture de la première partie de la phase 4 : `journalHeroContrast` adapté, suite complète et couverture (14/11/2026)

**Décision de conception confirmée :** l'écran d'humeur garde son design actuel (pas de bandeau illustré). Aucun élément visuel n'est modifié ; rien du bandeau, de l'image ou des anciens styles n'est réintroduit.
**`journalHeroContrast` (20 tests)** : l'écran d'humeur sort de la liste « encre fixe sur photo » ; un bloc de 7 tests vérifie le design réel : aucun `ImageBackground` / image d'en-tête / `JOURNAL_HERO_INK` / style `heroTitle` ; sous-titre via `AwaText` (rôle `onSurfaceVariant`, aucune couleur en dur) ; `JournalDaySwitcher` et `useJournalDay()` ; rendu en 4 scénarios (AWA Original clair et sombre, Lavender Night sombre et en noir pur) : couleur = couleur accessible du thème, contraste ≥ 4,5 sur le fond, flèche « jour suivant » désactivée aujourd'hui ; la couleur diffère entre clair et sombre. Mutations détectées (couleur en dur, mauvais rôle, sélecteur renommé). Les 13 tests précédents sont conservés.

**Suite Jest complète (sans couverture)** : 526 suites (500 réussies, 26 en échec) ; 16 861 tests : 16 808 réussis, **53 en échec**, 0 ignoré. Référence phase 3 : 516 suites, 16 592 tests, 60 échecs. Aucun échec nouveau par rapport à la série du même jour ; seul écart avec la phase 3 : `SpiritualTodayRefresh` (dépassement de 5 s sous charge, connu à HEAD, réussit en isolation).
**Avec couverture** : 526 suites (499 réussies, 27 en échec) ; 16 861 tests : 16 807 réussis, 54 en échec, 0 ignoré. Seul écart avec l'exécution sans couverture : `reminderProfileIsolation` (« real App module… », dépassement de 60 s sous couverture ; 23 / 23 en isolation, deux fois).
**Couverture** (hors dictionnaires) : Statements **83,56 %** (29 570 / 35 385), Branches **73,56 %** (16 732 / 22 746), Functions **78,31 %** (8 215 / 10 490), Lines **85,67 %** (27 020 / 31 537). Phase 3 : 83,01 / 72,64 / 77,63 / 85,14 (soit +0,55 / +0,92 / +0,68 / +0,53 points).
**Échecs restants (53, tous antérieurs à cette phase)** : tests `*Objectives` par langue (12), `ProfileScreenPremiumCardLanguage` (10), `PregnancyProgressionConsistency` (9), `PilotOnboardingCorrections` (5) et `Finalization` (2), `Phase7CSecurityLanguageSwitch` (4) et `Phase7J…` (1), `PrivateAccessScreenThemeHardening` (2), `CustomBottomTabBar*` (3), `PregnancyTrackingPreferencesAndLegend`, `Phase7H1StatisticsLanguageSwitch`, `TurkishLayoutResilience`, `uiFoundationGuard`, `SpiritualTodayRefresh` (instable sous charge).

### Préparation de la phase 5 (14/11/2026) — classement des 53 échecs et plan

**Classement par niveau de preuve** (tous : échec confirmé sur une copie intacte de HEAD et dans ≥ 5 exécutions, sauf mention) :

| Groupe | Tests | Assertion / constat | Statut |
|---|---|---|---|
| `Phase<Langue>Objectives` (12 suites) | 12 | « pregnancy / Home : texte dans la langue, pas de résidu étranger » reçoit `["Prochain RDV", "Ajouter un RDV"]` en français sur l'accueil Grossesse | **Bug de production démontré** (pas un test obsolète) : `PregnancyDashboard.tsx` (l. 728 et 743) appelle les clés `pregnancyDashboard.appointments.addAppointment` et `nextAppointmentShort`, **absentes de tous les dictionnaires** (même `fr.ts`), avec un `defaultValue` français ; toute langue autre que le français affiche donc ces deux libellés en français. Présent dans HEAD. Correction (clés + traductions) = changement de production à valider. |
| `ProfileScreenPremiumCardLanguage` | 10 | texte anglais attendu (« Advanced statistics ») absent de la carte Premium du profil | cause non diagnostiquée (test obsolète ou écart de traduction) |
| `Phase7CSecurityLanguageSwitch` (4), `PrivateAccessScreenThemeHardening` (2) | 6 | la ligne propre à l'usage (« Tes notes personnelles sont protégées. ») n'est plus rendue par `PrivateAccessScreen` | cause non diagnostiquée (ligne retirée ou test obsolète) |
| `Phase7JSecurityLanguageSwitch` | 1 | après passage en anglais sans remonter l'écran, « Confidentialité & Sécurité » reste en français | cause non diagnostiquée (écran non réactif à la langue ou test obsolète) |
| `PregnancyProgressionConsistency` | 9 | « 1er trimestre » attendu, `undefined` reçu | cause non diagnostiquée |
| `PilotOnboardingCorrections` (5), `PilotOnboardingFinalization` (2) | 7 | mesures de mise en page de l'écran de bienvenue (hauteurs, `justifyContent: 'center'`) | probablement obsolètes (mise en page redessinée), à confirmer |
| `CustomBottomTabBarThemeHardening` (2), `TurkishLayoutResilience` (1) | 3 | couleur de pastille « #FFFFFF » / libellé d'onglet | probablement obsolètes, à confirmer |
| Gardes statiques : `PregnancyTrackingPreferencesAndLegend`, `Phase7H1StatisticsLanguageSwitch`, `CustomBottomTabBarFloatingOverlay`, `uiFoundationGuard` | 4 | le motif cherché dans le code source n'existe plus (ou la liste de composants a changé) | probablement obsolètes, à confirmer |
| `SpiritualTodayRefresh` | 1 | dépassement de 5 s | **instable sous charge** (réussit en isolation ; absent de l'exécution de la phase 3) |
| `reminderProfileIsolation` (« real App module… ») | (1, couverture seulement) | dépassement de 60 s | **limite connue** (voir `JEST_AUDIT.md` §14) |

**Plan de la phase 5 (à valider avant exécution) :**
1. *Référence* : figer les chiffres de départ de la seconde exécution de la phase 3 (518 / 16 675, couverture 83,08 / 72,75 / 77,65 / 85,23) et ceux de la fin de phase 4 (526 / 16 861, 83,56 / 73,56 / 78,31 / 85,67), conserver désormais les JSON bruts de chaque exécution (hors dépôt).
2. *Exécution complète Jest* (`npx jest`, JSON) puis *exécution avec couverture* (`npm run test:coverage`), mêmes commandes qu'aujourd'hui ; comparaison test par test (clé = fichier + titre complet) avec la référence : nouveaux échecs, échecs réparés, tests ajoutés.
3. *TypeScript* (`npx tsc --noEmit`) et *ESLint* sur l'ensemble du projet (`npm run lint`, pas seulement les fichiers modifiés), avec rapport des avertissements préexistants.
4. *Instabilité* : relancer 3 fois chaque suite instable ou chargée (`SpiritualTodayRefresh`, `reminderProfileIsolation`, `NotificationForegroundResync`, `PhaseTurkishScreens`, `structuredDataMigration`) seule et sous charge, mesurer les durées ; proposer un traitement (isolation, délai justifié, simulation d'horloge) sans relever aveuglément un délai.
5. *Diagnostic des causes non établies* (tableau ci-dessus) : une fiche par groupe (assertion, attendu, observé, bug ou test obsolète) avec ses preuves ; **aucune correction de production sans validation** ; correction proposée du bug démontré de l'accueil Grossesse (clés `pregnancyDashboard.appointments.*` dans les 74 dictionnaires).
6. *Workflows critiques et non-régression* (parcours de bout en bout au niveau écran, sur données de test) : configuration du cycle → calendrier → statistiques ; journal (humeur, symptômes) → calendrier → export PDF/CSV ; profil → AWA à deux ; verrouillage (PIN, biométrie, accès privé) → export sensible ; sauvegarde / restauration ; changement de profil et de langue ; vérification des garanties de la phase 3 (limite d'essais, PBKDF2, biométrie séparée, retour visuel de vérification).
7. *Rapport* : chiffres exacts avant/après (suites et tests réussis, échoués, ignorés ; couverture), échecs historiques, nouveaux échecs éventuels, limites connues, liste des fichiers modifiés.
Contraintes inchangées : aucun test supprimé ou désactivé, aucun changement de production pour faire passer un test, aucune donnée utilisateur touchée, aucun commit / push / reset, TODO et rapports journaliers intacts.
