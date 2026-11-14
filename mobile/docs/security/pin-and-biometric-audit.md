# Audit PIN et biométrie — quatre observations (14/11/2026)

> Audit en lecture seule : **aucun code de production n'a été modifié pour ces quatre points**, aucun format de données changé. Les solutions ci-dessous sont des propositions à valider. Les chiffres cités viennent du code actuel et de mesures faites sur ce poste de développement.

## Priorité recommandée

| Rang | Point | Risque réel | Effort |
|---|---|---|---|
| 1 | **A. Limite d'essais** (surtout le PIN à 4 chiffres du verrouillage) | Moyen | Moyen (nouvelles chaînes dans 73 langues) |
| 2 | **C. Biométrie des sections privées** (repli sur le code du téléphone) | Moyen à faible, à trancher côté produit | Moyen |
| 3 | **D. PIN temporaire** | Faible | Très faible (quelques lignes) |
| 4 | **B. Vérificateur du PIN privé** | Faible tant que le Keychain n'est pas extrait | Moyen (migration) |

D est le plus simple à corriger et peut partir avec A. B a un effet limité sans A.

---

## A. Absence de limite d'essais

**Constat (prouvé par les tests ajoutés en phase 3).** Aucun compteur d'échecs, aucun délai, aucun blocage n'existe, nulle part (aucune occurrence de tentative/verrouillage dans le code de sécurité). Les tests `many wrong codes in a row` (écran de verrouillage) et `repeated wrong codes` (écran privé) montrent des essais illimités qui n'altèrent rien. Il n'y a rien à « réinitialiser » au redémarrage : il n'y a aucun état d'échec, donc un redémarrage ne coûte rien à celui qui devine.

**Où.**
- PIN de l'app (4 chiffres) : `src/screens/AppLockScreen.tsx` (effet de vérification), `src/services/appSecurityService.ts` (`verifyPin`, `disableStoredPin`), `src/components/security/PinSheet.tsx` (contrôle d'identité avant changement ou suppression).
- PIN des sections privées (6 chiffres) : `src/screens/PrivateAccessScreen.tsx`, `src/screens/journal/PrivateIntimacyPinScreen.tsx`, `src/services/privateSectionAuth.ts` (`verifyPrivatePin`).

**Risque réel.** Il concerne quelqu'un qui tient le téléphone **déverrouillé** (proche, enfant, personne à qui on le prête), pas un attaquant qui extrait des fichiers. Un code à 4 chiffres a 10 000 combinaisons : à la main, quelques secondes par essai suffisent pour les épuiser en quelques heures, sans que rien ne s'y oppose. Un code à 6 chiffres (1 000 000) est hors de portée à la main. Si la biométrie est activée, c'est une voie parallèle qui ne change pas ce calcul.

**Solution recommandée.**
- Un compteur d'échecs **persistant**, un par système (app / privé) : `{failures, lockedUntil}`.
- Délais croissants à partir du 5ᵉ échec consécutif (par exemple 30 s, 1 min, 5 min, 15 min, 1 h), remis à zéro après un succès. **Pas d'effacement des données** (perte irréversible pour une app de santé).
- Pendant un délai, le clavier est désactivé et l'écran affiche le temps restant ; un code juste est lui aussi refusé.
- Stockage : AsyncStorage suffit (effacer les données de l'app efface déjà les données de santé). Pour limiter la triche par l'horloge, enregistrer aussi l'heure de lancement de l'appareil si disponible ; sinon l'assumer et le documenter.

**Données existantes.** Aucun format existant ne change : une nouvelle clé additive (par exemple `@awa/security/pin-attempts/v1`), absente = zéro échec. À classer dans `storageKeyClassifier` (famille `@awa/security/`, déjà « préférences »).

**Tests nécessaires.** Le compteur monte à chaque échec et pas à une saisie incomplète ; le délai s'applique et s'allonge ; un code juste est refusé pendant le délai, accepté après ; remise à zéro après succès ; **le délai survit à un redémarrage à froid** ; les deux systèmes ont des compteurs séparés ; l'écran montre le temps restant ; horloge reculée ; textes dans les 73 langues.

---

## B. Vérificateur SHA-256 salé et PIN à six chiffres

**Constat.**
- PIN **privé** : `savePrivatePin` stocke `{salt, hash}` avec `hash = SHA-256("<sel>:<code>:hawa-intimacy")`, **un seul tour**. Le sel contient `Date.now()` et `Math.random()` : suffisant comme sel public, mais pas aléatoire cryptographique.
- PIN de **l'app** : stocké **en clair** comme mot de passe du Keychain (`setGenericPassword('awa-pin', pin)`), protégé par le Keystore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Ce n'est pas un vérificateur.

**Risque réel.** Seulement si le contenu du Keychain est extrait (appareil rooté, faille du Keystore). Dans ce cas, 6 chiffres = 1 000 000 de possibilités : mesuré, 1 000 000 de SHA-256 en JavaScript prennent environ 9 s sur un poste de bureau ; un outil natif ou un GPU le fait en une fraction de seconde. Un KDF lent n'enlève pas le problème (l'espace est petit), il multiplie seulement le coût : la vraie protection est le Keystore matériel **plus la limite d'essais (A)**. Risque faible aujourd'hui, mais bon marché à améliorer pour le PIN privé.

**Options (compatibilité React Native).**

| Option | Disponible sans nouvelle dépendance ? | Remarque |
|---|---|---|
| **PBKDF2-HMAC-SHA256** | **Oui** : `react-native-aes-crypto` 3.3.0 est déjà installé (utilisé pour la phrase de passe des sauvegardes portables) | Natif, rapide ; mesuré : 200 000 itérations ≈ 290 ms sur poste de bureau, à régler pour un téléphone modeste |
| scrypt | Non : `@noble/hashes` n'est pas installé (seul `@noble/ciphers`) | Implémentation JS sur Hermes : lente, à mesurer |
| Argon2id | Non : aucune dépendance présente ; les paquets natifs existants sont peu maintenus, compatibilité New Architecture à vérifier | À éviter pour l'instant : nouvelle dépendance à justifier (règle du projet) |

**Solution recommandée.** PBKDF2-HMAC-SHA256 via le module déjà présent, sel aléatoire de 16 octets, itérations choisies pour environ 300 ms sur un Galaxy A13, vérificateur **versionné** : `{v: 2, kdf: 'pbkdf2-sha256', iter, salt, hash}`. Lecture des deux versions.

**Données existantes.** Le vérificateur actuel est un JSON sans champ `v` : il est lu comme version 1. La migration se fait **à la volée** : le code n'est connu qu'au moment où il est saisi juste ; on réécrit alors le vérificateur en version 2, de façon transparente. Si l'écriture échoue, la version 1 reste valable. Pour le PIN de l'app (en clair), un même schéma est possible (un code `^\d{4}$` est reconnaissable) mais change le format stocké : à décider séparément. Risque : une **ancienne version de l'app** ne saurait pas lire la version 2, d'où un blocage en cas de retour en arrière ; à traiter par une version intermédiaire qui sait lire v2 avant d'en écrire.

**Tests nécessaires.** v1 vérifie et migre en v2 ; v2 vérifie ; mauvais code ; verrou corrompu ; deux sauvegardes du même code donnent des sels différents ; bornes sur les itérations ; temps de vérification sous un seuil ; écriture de migration en échec sans perte du v1.

---

## C. Couplage des deux biométries

**Constat (lu dans le code).**
- Les écrans privés n'affichent leur touche biométrique que si `isBiometricEnabled()` est vrai, c'est-à-dire le réglage du **verrouillage de l'app** : `PrivateAccessScreen.tsx` (ligne 328) et `PrivateIntimacyUnlockScreen.tsx` (ligne 67).
- Pourtant, la session biométrique privée est un **autre secret** (`com.hawa.private.intimacy.biometric`), créé à la première utilisation par `authenticateWithBiometry`.
- Contrôle d'accès **différent** : le verrouillage de l'app utilise `BIOMETRY_CURRENT_SET` (strict ; invalidé si une empreinte est ajoutée) ; le privé utilise `BIOMETRY_ANY_OR_DEVICE_PASSCODE`, c'est-à-dire que **le code de déverrouillage du téléphone suffit**.

**Risque réel.**
1. Fonctionnel : on ne peut pas avoir la biométrie pour les sections privées sans l'avoir pour le verrouillage de l'app, ni l'inverse. CLAUDE.md demande de ne pas confondre les deux systèmes.
2. Sécurité : quelqu'un qui connaît le code du téléphone (souvent un proche) passe la porte de la **vie intime** par le repli sur le code du téléphone, alors qu'il ne passerait pas le verrouillage de l'app. Le PIN privé propre à AWA est contourné sur cette voie. Peut être voulu : à trancher.

**Solution recommandée.**
- Un réglage **distinct** « Biométrie pour les sections privées » (nouvelle clé additive dans `securityPreferences`), géré dans l'écran « Contenu protégé » (`ProtectedContentSettingsScreen`). La touche privée dépend de lui seul, plus de `isBiometricEnabled()`.
- Valeur initiale pour les personnes existantes : la valeur effective d'aujourd'hui (activée si la biométrie de l'app l'est), pour ne rien changer silencieusement.
- Décision produit : passer le contrôle d'accès privé à `BIOMETRY_CURRENT_SET` avec le PIN privé comme secours, plutôt que le code du téléphone.

**Données existantes.** Nouveau réglage additif. Changer le contrôle d'accès oblige à supprimer et recréer la session biométrique privée (`session-…`) : une invite supplémentaire à la première utilisation après la mise à jour, aucune donnée perdue.

**Tests nécessaires.** Indépendance dans les deux sens (app oui / privé non, et l'inverse) ; matrice d'affichage de la touche (support, réglage app, réglage privé) ; valeur initiale reprise de l'existant ; réglage privé persisté ; migration du contrôle d'accès.

---

## D. PIN temporaire quand le Keychain refuse l'écriture

**Constat (prouvé).** Dans `confirmAndSavePin` (`appSecurityService.ts`), `pendingPin = null` n'est exécuté qu'**après** `await Keychain.setGenericPassword(...)`. Si cet appel **lève une exception**, la ligne n'est jamais atteinte. Preuve par un test temporaire (supprimé) : après un échec du Keychain, un nouvel appel `confirmAndSavePin('1234')` renvoie `success` alors que le premier code n'a pas été ressaisi. Si l'appel renvoie simplement `false`, le code est bien effacé.

**Risque réel.** Faible : le code reste seulement dans la mémoire du processus JavaScript, jusqu'au prochain `beginPinSetup` ou `cancelPinSetup`. Il faudrait une lecture de la mémoire du processus. Mais un code que la personne croit abandonné peut être enregistré plus tard.

**Solution recommandée.** `try { ... } finally { pendingPin = null; }` dans `confirmAndSavePin` ; en plus, effacer le code en attente quand l'app passe en arrière-plan. Aucun changement de logique de vérification ni de format.

**Données existantes.** Aucune.

**Tests nécessaires.** Après une exception du Keychain, un second `confirmAndSavePin` renvoie `missing` ; après `false`, `mismatch`, `success` : même résultat ; passage en arrière-plan efface le code en attente.

---

## Ce qui n'a pas été fait

Aucune de ces corrections n'est appliquée. Les tests actuels décrivent le comportement existant : **si D est corrigé, il faudra ajouter le test de régression** (le test temporaire de preuve le montre). L'import statique d'`AppLockScreen` (autorisé) est fait à part, avec ses tests.

---

# Mise en œuvre des quatre corrections (14/11/2026)

> Les propositions ci-dessus ont été validées puis appliquées, dans l'ordre D → A → C → B. Ce qui suit décrit l'état réel du code ; rien n'a été commité.

## D. PIN temporaire (`appSecurityService.ts`)

`confirmAndSavePin` efface `pendingPin` dans un `finally`, **après** la fin de l'opération asynchrone (succès, échec, exception du Keychain). Un écouteur `AppState` l'efface aussi au passage en arrière-plan, sauf pendant une sauvegarde en cours. Une nouvelle confirmation exige donc une nouvelle saisie (`missing`). Tests : `appSecurityServicePinAndBiometric.test.ts`.

## A. Limite d'essais (`pinAttemptLimiter.ts`)

- Deux compteurs indépendants : `appLock` et `privateSection`, persistés sous `@awa/security/pin-attempts/v1/<scope>` (uniquement `failures`, `lockedUntil`, `lastFailureAt` : ni PIN ni vérificateur).
- Quatre erreurs gratuites ; attente de 30 s à la 5ᵉ, puis 1 min, 5 min, 15 min, 1 h à partir de la 9ᵉ. Jamais plus d'une heure, jamais d'effacement de données.
- Appliquée dans `verifyPin` et `verifyPrivatePin` (tous les appelants sont couverts). Pendant l'attente, même le bon code est refusé sans être vérifié (`PinLockedError`).
- Ne compte que les saisies fausses face à un vérificateur lisible : une erreur du Keychain ou un vérificateur illisible n'est pas comptée.
- Un succès ne remet à zéro que le compteur concerné.
- Redémarrage : l'attente survit (lecture du disque). Lecture illisible au démarrage : compteur à zéro. Écriture ou suppression impossible : le compteur reste valable en mémoire pour la session.
- Écrans : message `security.tooManyAttempts` (minutes restantes), clavier désactivé (`AppLockScreen`, `PrivateAccessScreen`, `PrivateIntimacyPinScreen`, `PinSheet`, `PinSetupScreen`). Nouvelle chaîne dans les 73 langues.

## C. Biométrie des sections privées

- Réglage propre : `@hawa/security/private-biometric-enabled` (`securityPreferences.ts`), **absent = désactivé**. Aucune activation silencieuse : la commodité précédente (biométrie des sections privées créée automatiquement) disparaît tant que la personne n'active pas l'option, le PIN privé restant le repli.
- Identifiant Keychain propre : `com.hawa.private.intimacy.biometric.v2`, contrôle d'accès `BIOMETRY_CURRENT_SET` : le code du téléphone ne remplace plus le PIN privé, et un changement d'empreintes ou de visages invalide l'identifiant.
- `authenticateWithBiometry` ne fait que **lire** : il ne recrée jamais l'identifiant (sinon une nouvelle empreinte le réarmerait). Après invalidation, il faut réactiver l'option.
- L'activation (`enablePrivateBiometry`) prouve l'identifiant par une invite puis retire l'ancien identifiant (`…biometric`, repli code du téléphone). Une invite refusée n'efface pas l'ancien.
- Interface : troisième ligne dans `ProtectedContentSettingsScreen` (`usePrivateBiometricToggle`). La biométrie du verrouillage de l'app est inchangée.

## B. Vérificateur du PIN privé (`privateSectionAuth.ts`)

- Format v2 versionné : `{v:2, kdf:'pbkdf2-sha256', iter, salt, hash}`, sel aléatoire de 16 octets, stocké sous `com.hawa.private.intimacy.pin.v2`. Réutilise `passphraseKdf.ts` (`react-native-aes-crypto` déjà présent) : aucune dépendance ajoutée. Le coût stocké est relu à chaque vérification (le coût peut donc évoluer sans migration).
- Le PIN du verrouillage de l'app reste dans son Keychain actuel (inchangé).
- Migration : le vérificateur v1 (SHA-256) reste valable. Après une saisie **correcte**, le v2 est écrit, relu et confirmé, **puis seulement** le v1 est supprimé. Échec d'écriture ou de relecture : v2 retiré, v1 conservé, la personne entre quand même, nouvelle tentative à la saisie suivante.
- Migration interrompue (v1 et v2 présents) : seul le v2 est consulté ; un ancien PIN du v1 ne rouvre pas l'accès ; le v1 résiduel est supprimé à la prochaine bonne saisie.
- Changement de PIN : le v1 n'est retiré qu'une fois le nouveau v2 confirmé.
- Un vérificateur illisible (JSON invalide, coût non entier, nul ou supérieur à 5 000 000, etc.) refuse tout, vite, sans être compté comme essai.
- **Coût retenu : 200 000 itérations. Ce chiffre n'est PAS mesuré sur un Android physique** (aucune action sur l'appareil sans ton accord) ; il est inférieur au coût des sauvegardes (600 000) pour garder une saisie fluide sur un téléphone d'entrée de gamme. Il est constant `PRIVATE_PIN_KDF_ITERATIONS` : à ajuster après mesure.
- Rétrogradation : une ancienne version de l'app ne voit plus le v1 supprimé et proposera de créer un nouveau PIN privé. Les données privées elles-mêmes ne sont pas chiffrées avec ce PIN (il ne sert qu'à la porte d'accès), donc rien n'est perdu.

## Risques restants

1. Coût PBKDF2 non mesuré sur appareil physique.
2. L'attente repose sur l'horloge : avancer l'heure du téléphone la termine (elle n'est jamais permanente, et reculer l'horloge n'en raccourcit pas la durée).
3. Biométrie privée désormais optionnelle : la personne doit la réactiver, et après un changement d'empreintes aussi.
4. Le PIN du verrouillage reste à 4 chiffres, en clair dans le Keychain (décision : inchangé).
5. Rétrogradation d'app : voir B.

## Benchmark PBKDF2 sur Android physique (14/11/2026)

**Conditions.** Huawei MAR-LX1M, Android 10, arm64-v8a, 8 cœurs, batterie 60 %, 28–29 °C, écran allumé, branché en USB. Aucune application installée ni modifiée : un petit programme Java hors dépôt (`D:\ClaudeTemp\pbkdf2-bench`), lancé via `adb` avec `app_process`, a été copié dans `/data/local/tmp` puis supprimé. Il reprend le chemin exact de `react-native-aes-crypto` (`Aes.java` : `PKCS5S2ParametersGenerator` SpongyCastle 1.58, SHA-256, clé de 256 bits). PIN fictif `135790`, sel aléatoire ; aucune donnée AWA, aucun Keychain, aucune biométrie touchés. Code de production et nombre d'itérations inchangés.

**Résultats à 200 000 itérations** (ms ; dérivation seule, comparaison du hash négligeable) :

| Opération | Série de 10 | 3 relances de 5 |
|---|---|---|
| Création du vérificateur | médiane 468, min 467, max 474 | 469–471 |
| Vérification d'un PIN correct | médiane 468, max 470 | 469–471 |
| Vérification d'un PIN incorrect | médiane 467, max 469 | 467–470 |

- **Première dérivation d'un processus (démarrage à froid) :** 630–740 ms. **Tout premier lancement de la session :** ≈ 1 070 ms (processeur au repos) ; les lancements suivants sont stables à ≈ 470 ms. Le pire cas observé est donc de l'ordre de 1,1 s.
- Les trois opérations coûtent la même chose (une seule dérivation chacune).
- Pour comparaison : 50 000 → ≈ 118 ms ; 100 000 → ≈ 236 ms ; 600 000 (coût des sauvegardes) → ≈ 1 400 ms (1,9 s à froid). Le coût est linéaire, ≈ 2,3 µs par itération.
- **Interface :** un fil « interface » réveillé toutes les 16 ms pendant 3 dérivations (≈ 3,1 s) en parallèle sur un autre fil : 195 ticks, maximum 17,2 ms, **0 image perdue** (même résultat à 600 000 : max 17,7 ms). `Aes.pbkdf2` est une méthode asynchrone de module natif : elle ne tourne pas sur le fil JS ni sur le fil d'interface.

**Limites.** Mesure faite hors d'une application AWA installée (pas de test dans le vrai processus React Native, où les autres tâches de l'app partagent le processeur) ; un appareil plus lent ou en économie d'énergie sera plus lent ; l'écran de saisie n'a pas été chronométré de bout en bout. Pas d'essai sur un téléphone d'entrée de gamme (A13).

**Recommandation.** Garder **200 000** : ≈ 0,5 s par saisie sans bloquer l'interface, quatre fois plus cher à attaquer que 50 000 ; la limite d'essais (30 s dès le 5ᵉ échec) reste la protection principale contre l'essai de codes sur le téléphone. Ne pas monter à 600 000 (≈ 1,4 s à chaque saisie, ≈ 2 s à froid, davantage sur un A13). Le coût étant stocké dans chaque vérificateur, il pourra être relevé plus tard sans migration forcée. Il faudrait prévoir un indicateur d'attente sur l'écran pendant le calcul (non vérifié : l'écran n'a pas été modifié).

## Retour visuel pendant la dérivation PBKDF2 (14/11/2026)

Constat : « Vérification… » n'existait pas sur les écrans du PIN privé (la correction n'avait été que proposée) ; pendant ~0,5 s (~1,1 s à la première dérivation) l'écran ne changeait pas. Cause : `busy` ne faisait que bloquer les touches. Le calcul est natif et asynchrone : il ne bloque pas le fil JS, l'interface n'a donc pas besoin d'être « libérée », seulement informée.

Correction : nouveau composant `components/security/PinVerifyingNotice.tsx` (loader + `appLock.verifying`, région vivante, `accessibilityState.busy`) affiché à la place de la ligne d'erreur dès le **sixième chiffre** (donc peint pendant le délai existant de 120 ms, avant l'appel natif) dans `PrivateAccessScreen.tsx` et `journal/PrivateIntimacyPinScreen.tsx`. Le clavier est verrouillé dès ce moment ; cela ferme aussi une faille de `PrivateIntimacyPinScreen` où « effacer » + un nouveau chiffre dans les 120 ms pouvait lancer deux vérifications. Rien n'est annoncé quand le premier code de création est seulement mémorisé. Aucune clé de traduction ajoutée.

Vérifié par Jest (le texte et le loader sont présents au moment même de l'appel `pbkdf2`, pas ajoutés après) ; **non vérifié à l'écran du Huawei** (application non réinstallée sur ton téléphone).
