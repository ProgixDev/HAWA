# Phase 5 — qualité et non-régression (14/11/2026)

> Phase de **vérification et de diagnostic**. Aucun changement de production, aucun test supprimé, ignoré ou affaibli, aucun délai modifié, aucune donnée utilisateur touchée, aucun commit / push / reset. Les preuves brutes (JSON de chaque exécution, journaux, scripts) sont conservées **hors du dépôt**, dans `D:\ClaudeTemp\phase5-evidence\` (liste en fin de document).

## 1. Références et ce qu'elles valent
| Référence | Contenu | Usage |
|---|---|---|
| **B** (`ref-B-518-text-only.log`) | 518 suites, 16 675 tests, 60 échecs ; couverture 83,08 / 72,75 / 77,65 / 85,23 (après les corrections de sécurité de la phase 3) | référence **globale** uniquement : c'est un journal texte, **pas** une référence test par test |
| A (`ref-A-phase3-516.json`) | 516 suites, 16 592 tests, 60 échecs (avant ces corrections) | JSON complet : comparaison test par test possible, mais plus ancienne |
| Copie de HEAD (`ref-head-39suites.json`) | exécution réelle sur une copie intacte de HEAD, **limitée aux 39 suites** qui échouaient dans l'arbre de travail (61 tests en échec) | comparaison détaillée « présence à HEAD » : couvre les 53 échecs actuels ; **pas** une exécution complète de HEAD |
| Fin de phase 4 (`phase4-end-*.json`) | 526 suites, 16 861 tests ; couverture 83,56 / 73,56 / 78,31 / 85,67 | référence complète, test par test |

## 2. Exécutions complètes
| | Fin de phase 4 | **Phase 5 sans couverture** | **Phase 5 avec couverture (3 workers)** |
|---|---|---|---|
| Suites (réussies / en échec) | 526 (500 / 26) | **526 (500 / 26)** | **526 (500 / 26)** |
| Tests | 16 861 | **16 861** | **16 861** |
| Réussis / en échec | 16 808 / 53 | **16 808 / 53** | **16 808 / 53** |
| Ignorés / à faire | 0 / 0 | **0 / 0** | **0 / 0** |
| Durée (lancement → fin) | ≈ 549 s (mesure de Jest, sans couverture) | **627 s** | **821 s** |
| Statements | 83,56 % (29 570 / 35 385) | — | **83,56 % (29 570 / 35 385)** |
| Branches | 73,56 % (16 732 / 22 746) | — | **73,56 % (16 732 / 22 746)** |
| Functions | 78,31 % (8 215 / 10 490) | — | **78,31 % (8 215 / 10 490)** |
| Lines | 85,67 % (27 020 / 31 537) | — | **85,67 % (27 020 / 31 537)** |

Comparaison test par test (clé = fichier + titre complet) : **0 échec nouveau, 0 échec réparé** entre la fin de phase 4 et la phase 5 sans couverture ; **aucune différence** entre les exécutions sans et avec couverture de la phase 5. La seule différence avec l'exécution avec couverture de la fin de phase 4 est `reminderProfileIsolation` (54 → 53 échecs), qui avait dépassé 60 s et réussit maintenant (§4). Les durées de la phase 4 et de la phase 5 ne sont pas strictement comparables (méthodes de mesure différentes). Par rapport à B : +8 suites (les 8 fichiers de tests ajoutés pendant les phases 3 et 4 : `CycleInformationFunctional`, `CycleRemindersFunctional`, `PersonalInformationFunctional`, `MoodJournalFunctional`, `SymptomsJournalFunctional`, `JournalDefaultsIntegration`, `useJournalDay`, `PrivateIntimacyPinScreenVerifying`), +186 tests, 60 → 53 échecs, couverture +0,48 / +0,81 / +0,66 / +0,44 point.

## 3. TypeScript et ESLint (projet entier)
- `npx tsc --noEmit` : **0 erreur** (116 s).
- `npm run lint` (`eslint .`) : **8 erreurs, 8 avertissements, aucun dans un fichier modifié pendant ces travaux**. Tous préexistants (fichiers identiques à HEAD ; seul `jest.setup.js` est modifié, et seul le mock de Sentry y est nouveau, sans problème) :
  - `jest.setup.js` : `globalThis` / `Buffer` non définis (l. 163 et 172, 3 erreurs — code commité) ;
  - `PregnancyStatisticsScreen.tsx` : `formatMedicalSummary`, `appointmentCount`, `examCount` inutilisés (3 erreurs) ; `PregnancyCalendarContent.tsx` : `formatPregnancyTrimester` inutilisé (1 erreur, voir §5) ;
  - `pdfAfricanLatinFont.ts` : erreur d'analyse « Maximum call stack size exceeded » (fichier de police volumineux) ;
  - 8 avertissements : `JournalDaySwitcher.tsx` (styles en ligne), deux scripts, rapport HTML généré `coverage/`.

## 4. Suites instables : 3 exécutions seules, 3 sous charge (aucun délai modifié)
Charge = 10 boucles de calcul sur 12 cœurs logiques. Détail : `p5-flaky.tsv`.
| Suite | Seule (3 exécutions) | Sous charge (3 exécutions) | Lecture |
|---|---|---|---|
| `SpiritualTodayRefresh` | 1 échec sur 3 (1ʳᵉ exécution, cache froid : test de 11,8 s) ; tests lents 4–5 s | **3 échecs sur 3** (≈ 9 s) | **Instable** : le test « Hijri MIDNIGHT » dure 4 à 12 s pour un délai de 5 s par défaut ; échoue dès que la machine est chargée ou le cache froid |
| `reminderProfileIsolation` | 0 échec (≈ 29 s ; test le plus lent 8 s) | 0 échec (≈ 78 s ; test le plus lent **18–19 s** pour 60 s autorisés) | Marge de 3× sous charge CPU seule ; le dépassement de 60 s ne s'est produit que dans une exécution **complète avec couverture** (fin de phase 4), pas dans celle de la phase 5 : **non reproductible à la demande**, limite connue (`JEST_AUDIT.md` §14) |
| `NotificationForegroundResync` | 0 / 3 (≈ 24 s) | 0 / 3 (≈ 39 s) | stable |
| `PhaseTurkishScreens` | 0 / 3 (≈ 16 s) | 0 / 3 (≈ 38 s ; test le plus lent 4,6 s, délai du fichier 30 s) | stable |
| `structuredDataMigration` | 0 / 3 (2,3 s) | 0 / 3 (4,5 s) | stable ici ; son échec précédent n'est apparu que dans une exécution complète |

Proposition (non appliquée) : pour `SpiritualTodayRefresh`, mesurer pourquoi le test dure 4 à 12 s, puis fixer un délai **justifié par la mesure** (pas un relèvement aveugle).

## 5. Inventaire des 53 échecs (détail test par test : `p5-failures-inventory.json`)
Tous échouent **aussi sur la copie intacte de HEAD** (53 / 53) ; 52 échouent dans les 7 exécutions comparées (HEAD, audit chiffré, phase 3, fin de phase 4 sans et avec couverture, phase 5 sans et avec couverture) → **reproductibles**. Seul `SpiritualTodayRefresh` varie (6 / 7).

| Groupe | Tests | Suites | À HEAD | Reproductible | Cause | Classification et preuve |
|---|---|---|---|---|---|---|
| `Phase<Langue>Objectives` (turc, chinois, coréen, portugais ×2, hindi, indonésien, albanais, bengali, japonais, allemand, russe) | 12 | 12 | oui | 7 / 7 | **démontrée** | **Bug de production** : l'accueil Grossesse affiche « Prochain RDV » et « Ajouter un RDV » en français (§6). Preuve : message d'échec identique dans les 12 suites (`Received: ["Prochain RDV", "Ajouter un RDV"]`) + clés absentes des dictionnaires. |
| `ProfileScreenPremiumCardLanguage` | 10 | 1 | oui | 7 / 7 | non établie | À diagnostiquer. Constat : le texte anglais attendu (« Advanced statistics ») n'est pas dans la carte Premium rendue. |
| `Phase7JSecurityLanguageSwitch` | 1 | 1 | oui | 7 / 7 | **démontrée** | **Bug de production, même famille que §6** : après passage en anglais, l'écran Confidentialité & Sécurité reste en français (« Code PIN, empreinte », « Verrouillage de l'appli »…) ; ces textes sont les `defaultValue` de clés `privacySecurity.v2.*` absentes des dictionnaires. |
| `Phase7CSecurityLanguageSwitch` | 4 | 1 | oui | 7 / 7 | partielle | 2 tests : la ligne propre à l'usage (« Tes notes personnelles sont protégées. ») n'est plus rendue par `PrivateAccessScreen` (la clé `purposeMiscarriagePersonalNotes` existe mais aucun code ne la lit) ; 2 tests (`SecuritySetupScreen`) non diagnostiqués. |
| `PrivateAccessScreenThemeHardening` | 2 | 1 | oui | 7 / 7 | partielle | Même cause que ci-dessus (ligne propre à l'usage absente). |
| `PregnancyProgressionConsistency` | 9 | 1 | oui | 7 / 7 | partielle | Les assertions de l'accueil et des statistiques passent ; la dernière échoue : le calendrier n'a plus de ligne « Trimestre » (`undefined`). Indice : `formatPregnancyTrimester` est importé mais inutilisé dans `PregnancyCalendarContent.tsx` (ESLint) → **test probablement obsolète**, à confirmer. |
| `PilotOnboardingCorrections` (5), `PilotOnboardingFinalization` (2) | 7 | 2 | oui | 7 / 7 | non établie | Mesures de mise en page de l'écran de bienvenue (ex. `justifyContent: 'center'` encore présent) : probablement obsolètes (mise en page redessinée), à confirmer. |
| `CustomBottomTabBarThemeHardening` (2), `CustomBottomTabBarFloatingOverlay` (1), `TurkishLayoutResilience` (1) | 4 | 3 | oui | 7 / 7 | non établie | Couleur de pastille attendue / motif de code source / libellé d'onglet : probablement obsolètes, à confirmer. |
| `PregnancyTrackingPreferencesAndLegend`, `Phase7H1StatisticsLanguageSwitch`, `uiFoundationGuard` | 3 | 3 | oui | 7 / 7 | établie (message) | **Gardes statiques** : le motif cherché dans le code source n'existe plus, ou la liste de composants a changé → obsolètes tant qu'un auteur ne confirme pas l'intention. |
| `SpiritualTodayRefresh` | 1 | 1 | oui | 6 / 7 | **démontrée** | **Instable** (§4) : dépassement du délai de 5 s. |

**Réconciliation** : 12 + 10 + 1 + 4 + 2 + 9 + 7 + 4 + 3 + 1 = **53 tests**, dans **26 suites** (12 + 1 + 1 + 1 + 1 + 1 + 2 + 3 + 3 + 1). 52 reproductibles + 1 instable. L'exécution avec couverture de la fin de phase 4 comptait 54 échecs : le 54ᵉ était `reminderProfileIsolation` (60 s dépassées), réussi en phase 5. Le total « 53 » est celui des exécutions de la phase 5 ; le nombre de tests instables varie entre **1** (`SpiritualTodayRefresh`) et **2** (avec `reminderProfileIsolation` dans une exécution chargée avec couverture).

## 6. Bug de traduction : preuves, sans correction
- **Constat initial** : les 12 tests `*Objectives` échouent parce que `PregnancyDashboard.tsx` (l. 728 et 743) appelle `pregnancyDashboard.appointments.addAppointment` et `…nextAppointmentShort` avec un `defaultValue` français ; ces clés **n'existent dans aucun dictionnaire** (même pas `fr.ts`), donc toute langue autre que le français affiche du français. Présent à HEAD.
- **Ampleur mesurée** (sonde temporaire, supprimée après usage ; résultat : `p5-missing-keys.json`) : sur 627 fichiers source, **87 appels `t()` avec `defaultValue`**, dont **73 appels (63 clés distinctes) dont la clé n'existe ni en français, ni en anglais, ni en allemand**. Répartition des 63 clés : `DataPrivacyScreens` 19 (« Mes données »…), `PrivacySecurityScreen` 12 (`privacySecurity.v2.*`), `PrivacySecuritySubScreens` 11, `BackupReminderCard` 6, `PregnancyDashboard` 5, `PregnancyPlusMenuSheet` 4, `PregnancyAppointmentsScreen` 4, `PregnancyJournalSheet` 1, `AuthScreen` 1. En français tout s'affiche correctement (le `defaultValue` tient lieu de texte) ; **dans les 72 autres langues ces écrans restent en français**.
- **Proposition de correction (distincte, à valider avant toute modification) :**
  1. Priorité 1 — Grossesse (14 clés : tableau de bord, menu « + », rendez-vous, feuille du journal) : c'est ce que détectent les 12 tests, qui deviendront verts sans toucher aux tests.
  2. Priorité 2 — Confidentialité & Sécurité et « Mes données » (42 clés) : rend vert `Phase7JSecurityLanguageSwitch` et traite l'écran le plus sensible de l'application.
  3. Priorité 3 — rappel de sauvegarde et connexion (7 clés).
  4. Méthode : le français = les `defaultValue` existants (aucun changement de texte pour les francophones) ; traductions dans les 73 dictionnaires par le même pipeline que les chaînes précédentes (script d'insertion par espace de noms) ; **relecture native à prévoir** (surtout langues rares) ; compteur de clés des 4 tests de parité à mettre à jour ; après correction, **ajouter une garde permanente** (la sonde de ce chapitre, transformée en test) qui échoue si un `t()` avec `defaultValue` référence une clé absente de `fr.ts`.
  5. Risque : volume (≈ 63 clés × 72 langues ≈ 4 500 chaînes) et qualité des langues rares ; aucun risque pour les données.

## 7. Workflows critiques : ce que couvre Jest, ce qui exige un appareil
Résultats lus dans l'exécution complète de la phase 5 (réussis / total par suite ; détail : `workflows.js`).
| Workflow | Couverture Jest (niveau écran, vrais stores, données de test) | Lacune Jest | Exige un appareil réel |
|---|---|---|---|
| Cycle → calendrier → statistiques | `CycleInformationFunctional` 29/29, `CycleRemindersFunctional` 20/20, `CalendarScreenBehavior` 8/8, `CalendarPredictionConsistency` 4/4, `CycleStatisticsRealData` 17/17, `CycleStatisticsEvolutionPeriod` 4/4, `AdultCyclePredictionReliability` 16/16, `cycleReminderScheduling` 13/13 | aucun test unique n'enchaîne la sauvegarde du cycle puis le calendrier **et** l'écran de statistiques | notifications réellement livrées, sélecteur de date natif, rendu des anneaux et graphiques |
| Journal → calendrier → export | `MoodJournalFunctional` 27/27, `SymptomsJournalFunctional` 32/32, `JournalDefaultsIntegration` 6/6 (écrans → carte du jour, points, statistiques, export), `CycleJournalsClearEntry` 24/24, `dailyJournalStore` 10/10, `medicalExportCycle` 15/15, `medicalExportOrchestrator` 6/6, `medicalExportReaders` 7/7, `medicalExportPdf` 17/17, `medicalExportShare` 7/7 | l'export est testé jusqu'au modèle (jours / lignes) puis, séparément, à l'écriture du fichier ; aucun test ne va de l'écran « Exporter » au fichier PDF / CSV avec le vrai orchestrateur | génération réelle du PDF / CSV, ouverture dans une application tierce, feuille de partage Android |
| Profil → AWA à deux | `PersonalInformationFunctional` 45/45, `personalInformationStore` 13/13, `AwaADeuxFlow` 18/18, `AwaADeuxAssociation` 29/29, `AwaADeuxSharing` 44/44, `AwaADeuxPartnerJourney` 79/79, `PartnerHomePhaseAndCards` 14/14 | pas de test « modification du prénom puis texte de l'invitation » ; l'AWA à deux est une démonstration locale (aucun serveur) | envoi réel d'une invitation, deux téléphones |
| Verrouillage → accès privé → export sensible | `AppLockScreen` 19/19, `PrivateAccessScreenBehavior` 26/26, `privateSectionAuthPin` 48/48, `privateSectionAuthStore` 12/12, `MedicalExportSensitiveUnlock` 7/7, `medicalExportAuthorization` 5/5, `MiscarriageDoubleLockRegression` 7/7 | `MedicalExportSensitiveUnlock` **simule** le module d'authentification privée : aucun test ne traverse le vrai PIN privé (PBKDF2) jusqu'à l'export | biométrie réelle (Keychain), verrouillage à l'arrière-plan, minuteurs d'attente en durée réelle |
| Sauvegarde → restauration | `portableBackup` 19/19, `backupQadaaAndRestoreSafety` 23/23, `PortableBackupScreen` 16/16, `dataWipeReminderCleanup` 25/25, `structuredStoresIntegration` 53/53, `structuredDataMigration` 26/26, `backupVersusMedicalExport` 6/6 | sélecteur de fichiers et partage simulés | sauvegarde sur un autre téléphone (clés d'appareil), fichiers réels, restauration d'une grosse sauvegarde |
| Changement de profil et de langue | `activeProfileDataIsolation` 18/18, `cycleProfileSwitchHydration` 13/13, `profileScopedNotificationsAndBackup` 17/17, `EncryptedDataUnreadableProfileIsolation` 5/5, `managedProfileDeletion` 23/23, `reminderProfileIsolation` 23/23, `Phase7EProfileLanguageSwitch` 4/4 | **échecs connus** : 12 `*Objectives` et `Phase7J…` (bug §6), `Phase7C…` (4) | changement réel de la langue du système, droite à gauche, polices non latines |
| Garanties de sécurité de la phase 3 | `pinAttemptLimiter` 26/26, `appSecurityServicePinAndBiometric` 39/39, `privateSectionAuthPin` 48/48, `privateSectionAuthBiometricCopy` 3/3, `usePrivateBiometricToggle` 6/6, `PrivateIntimacyPinScreenVerifying` 3/3, `AppLockScreen` 19/19, `PrivateAccessScreenBehavior` 26/26, `PinSheet` 12/12, `FaceIdSetupScreen` 12/12, `structuredEncryption` 20/20 — **toutes vertes, aucune régression** | — | coût PBKDF2 (≈ 470 ms à 200 000 itérations mesurés sur le Huawei, validé) ; retour visuel « Vérification… », biométrie `BIOMETRY_CURRENT_SET`, attente persistante après redémarrage réel : à vérifier sur l'appareil |

**Distinction** : tout ce qui précède est du **test Jest au niveau écran** (react-test-renderer, stockage et Keychain en mémoire, natif simulé). Il n'existe **aucun test de bout en bout sur appareil** (ni Detox, ni Maestro, ni Appium) dans le projet ; la dernière colonne liste ce que seul un appareil peut prouver.

## 8. Limites connues
1. `SpiritualTodayRefresh` est instable (délai de 5 s trop court pour un test de 4 à 12 s) ; `reminderProfileIsolation` peut dépasser 60 s dans une exécution complète avec couverture (non reproduit en phase 5).
2. Référence B : journal texte, pas de comparaison test par test avec B.
3. La copie de HEAD ne couvre que 39 suites : la présence à HEAD est démontrée pour les 53 échecs, pas pour tous les tests du projet.
4. Causes encore non établies : `ProfileScreenPremiumCardLanguage` (10), `PilotOnboarding*` (7), `CustomBottomTabBar*` / `TurkishLayoutResilience` (4), `Phase7CSecurityLanguageSwitch` (partie `SecuritySetupScreen`).
5. 8 erreurs ESLint préexistantes (§3), non traitées.

## 9. Fichiers
- **Modifié dans le dépôt pendant la phase 5** : `docs/testing/PHASE5_QUALITY.md` (ce document, nouveau) ; `docs/testing/JEST_AUDIT.md` (§14, ajouté avant le lancement de la phase) et `docs/testing/PHASE4_FUNCTIONAL.md` (plan de la phase 5) ne changent pas dans cette phase. Aucun fichier source, de test, de dictionnaire, TODO ou rapport journalier.
- **Preuves hors dépôt** (`D:\ClaudeTemp\phase5-evidence\`) : `p5-full.json` / `.log`, `p5-cov.json` / `.log`, `p5-coverage-summary.json`, `p5-tsc.log`, `p5-eslint.log`, `p5-flaky.tsv` et 30 JSON `p5-flaky-*.json`, `p5-failures-inventory.json`, `p5-missing-keys.json`, `p5-missing-keys-unique-by-file.json`, références (`ref-*.json`, `phase4-end-*.json`), scripts (`run-p5.sh`, `run-flaky.sh`, `burn.js`, `inventory.js`, `flaky-summary.js`, `workflows.js`, `unique-keys.js`).
