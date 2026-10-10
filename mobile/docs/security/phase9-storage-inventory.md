# AWA — storage security inventory (Phase 9)

Source of truth: the code. Produced by reading the source only (no device, no user data). Scope: every AsyncStorage key,
what it holds, whether it is profile-scoped, how it was protected **before** Phase 9 and how it is now.

## 1. Namespaces and ownership

| Namespace | Used by | Notes |
|---|---|---|
| `@hawa/*` | Most stores | Main namespace |
| `@awa/*` | Theme, security settings, general health, backup slots/settings, Phase 9 bookkeeping | |
| `awa:*` | Qadaa ledger (`awa:qadaa:ledger:v1`), Qadaa progress (`awa:qadaa:progress:v1`) | Predates the `@` convention. **Was silently excluded from backup and from "delete my data"** — fixed in Phase 9 |
| anything else | Not ours | Never touched |

Profile scoping (`profileScopedKey(base, id)`): the owner keeps the bare key, a managed profile uses `<base>:profile:<id>`.
Only 7 bases are profile-scoped; every other store is owner-only global:

`@hawa/daily-journal/v1`, `@hawa/confirmed-period-history`, `@hawa/cycle-preferences`, `@hawa/period-end-datetime`,
`@hawa/cycle-reminder-preferences/v1`, `@hawa/remaining-qadaa-days`, `awa:qadaa:ledger:v1`.

## 2. Classification (`src/services/storageKeyClassifier.ts`)

One classifier decides every backup / restore / delete question.

| Kind | Examples | In owner backup | Removed by "delete my data" |
|---|---|---|---|
| tracking-data | journals, cycle, pregnancy…, `awa:qadaa:*` | yes | yes |
| preferences | theme, language, security settings, reminder preferences | yes | yes |
| profile-registry | managed-profile list, active profile id, deleted-profile ids | yes (restore filters deleted profiles) | yes |
| backup-artifact | `@awa/backup/local-v1[:profile:<id>]`, `@awa/backup/settings-v1` | never | slots yes, settings **no** |
| internal-state | restore journal, migration state/temp copies, key-established marker | never | yes |
| unclassified | any `awa:` key not on the reviewed list | never | **never** (reported, left alone) |
| foreign | not an AWA key | never | never |

## 3. Health and personal stores — status

"Phase 8" = before Phase 9. "Now" = Phase 9 code. ✱ = encrypted whole-record by `secureAsyncStorage` (key in `STRUCTURED_ENCRYPTED_BASES`).

| Key (base) | Scope | Sensitive content | Phase 8 | Now |
|---|---|---|---|---|
| `@hawa/daily-journal/v1` | profile | symptoms, mood, flow, temperature, sleep, activity, weight, cervical mucus, LH test, hydration, photo refs | notes only (`note`, `encryptedNote`, `encryptedIntimacy`) | ✱ whole record (+ notes/intimacy field encryption underneath) |
| `@hawa/confirmed-period-history` | profile | period start/end dates | plaintext | ✱ |
| `@hawa/cycle-preferences` | profile | last period, cycle/period length, history, confirmation flags | plaintext | ✱ |
| `@hawa/period-end-datetime` | profile | period end | plaintext | ✱ |
| `@hawa/cycle-reminder-preferences/v1` | profile | reminder timings | plaintext | ✱ |
| `@hawa/remaining-qadaa-days` | profile | Qadaa days (religious practice) | plaintext | ✱ |
| `awa:qadaa:ledger:v1` | profile | Qadaa entries and completions | plaintext, **not backed up** | ✱ and backed up |
| `awa:qadaa:progress:v1` | owner | legacy completed days | plaintext, **not backed up** | ✱ and backed up |
| `@hawa/qadaa-post-ramadan-reminder/v1` | owner | reminder state | plaintext | ✱ |
| `@awa/general-health/v1` | owner | weight, height, blood group, conditions; `medicalNotes` encrypted | partial | ✱ |
| `@hawa/personal-information/v1` | owner | name, birth date, email, phone | partial (last name/birth date/email/phone) | ✱ |
| `@hawa/pregnancy-dating`, `-tracking-preferences`, `-reminder-preferences` | owner | LMP, due date, tracking flags | plaintext | ✱ |
| `@hawa/pregnancy-journal/v1`, `-medical-events`, `-health-reminders`, `-custom-reminders` | owner | symptoms, weight, kicks, appointments, reminder text | notes/titles only | ✱ |
| `@hawa/pregnancy-notification-settings` | owner | notification settings | plaintext | ✱ |
| `@hawa/postpartum-preferences/v1`, `-journal/v3`, `-lochia/v1`, `-nifas-reminders/v1` | owner | delivery date, mood, bleeding, Nifas reminders | notes only | ✱ |
| `@hawa/miscarriage-preferences/v1`, `-journal/v1` | owner | loss data | notes only | ✱ |
| `@hawa/contraception-preferences`, `-journal/v1`, `-intake-history/v1`, `-event-history/v1` | owner | method, intake, events | notes only | ✱ |
| `@hawa/conception-preferences` | owner | TTC preferences | plaintext | ✱ |
| `@hawa/irregular-preferences/v1`, `-journal/v1` | owner | irregular-cycle data | notes only | ✱ |
| `@hawa/menopause-preferences/v1`, `-journal/v1`, `-lab-results/v1` | owner | menopause data, lab results | notes only (lab results plaintext) | ✱ |
| `@hawa/selected-location` | owner | location | plaintext | ✱ |
| `@hawa/active-objective` | owner | life stage (reveals pregnancy, loss, …) | plaintext | ✱ |

Not encrypted by decision (low sensitivity or functional need): `@hawa/in-app-notifications/v2/item/*` (many keys; reminder
titles — **follow-up**), `@hawa/library/state/v1`, `@hawa/profile-avatar-preferences/v1`, calendar filters, quick-action order,
theme/language/true-black, security *flags*, onboarding flag, Awa-à-deux demo stores, `@hawa/hijri-adjustment-days`,
`@hawa/spiritual-markers-enabled`, the profile registry (`managed-profiles`, `active-profile-id`, deleted ids).

Outside AsyncStorage: private photos are AES-256-GCM-encrypted files under `DocumentDirectoryPath/journal-private-photos/`
(not part of any backup, not portable); medical PDF/CSV exports are plaintext files in `CachesDirectoryPath/medical-export`
(user-initiated, cleared by the export screen).

## 4. Where a failed read used to become "empty" (Phase 8 finding) and what stops it now

Many stores catch a read error and fall back to defaults (`catch → []`, `hydrated = true`, a missing note field deleted), and
every save is read-modify-write — so an unreadable record could be overwritten by "nothing + the new edit". Phase 9 puts the
guard in the storage layer instead of in 30 stores:

1. a read that cannot decrypt throws `StructuredDataUnavailableError` and records the key as unavailable;
2. **writes to a key whose last read failed are refused until a read of it succeeds** (even if the cause has gone away — the
   store may still hold its empty fallback);
3. encryption refuses to create a replacement key when a key existed before (`key-lost`);
4. Statistics shows "cannot be shown" (not "no statistics"), cycle reminders are left untouched, and a banner explains it.

## 5. Findings left as findings (not changed)

- `deleteTrackedData()` ("delete my data") has always removed the profile registry, onboarding flag, security *flags* (while the
  Keychain PIN survives), theme and language. Behaviour kept; flagged.
- The encrypted private-photo files are not covered by backup, deletion or the portable backup.
- `@hawa/in-app-notifications/v2/item/*` carries reminder text in plaintext and is not removed by `deleteTrackedDataForProfile`
  (only by managed-profile deletion).
- Medical export files are plaintext in the cache by design.
- Several stores' own `catch` blocks still turn *non-encryption* read errors into defaults (unchanged; now protected by the
  write guard above).
