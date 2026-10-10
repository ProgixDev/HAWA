# AWA — Phase 9 security design

What was built, why, and what it deliberately does **not** do. Companion to `phase9-storage-inventory.md`.

## 1. Key architecture

| Key domain | Keychain service | Used for | Leaves the device? |
|---|---|---|---|
| structured health data | `com.hawa.private.structured-health-data.encryption-key` | every record in `STRUCTURED_ENCRYPTED_BASES`, the local backup slot | never |
| notes / intimacy / photos / 13 field-level domains | `com.hawa.private.<domain>.encryption-key` | field-level encryption (unchanged) | never |
| portable backup | none — derived from the user's passphrase (PBKDF2-HMAC-SHA256, 600,000 iterations, 16-byte random salt) | the portable backup file only | the passphrase never leaves the user's head; the key is never stored |

- 256-bit random keys in the Android Keystore through `react-native-keychain` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Never derived from the PIN.
- **No key is ever created behind the user's back after a loss.** `@awa/structured-migration/key-established` records that a key
  once existed; if the Keychain later has none, encryption throws `key-lost` and the app shows the recovery screen.
- Key creation is single-flight (two first writes cannot mint two keys).

## 2. Record format (device-bound)

```
{"awa_enc":2,"alg":"AES-256-GCM","kid":1,"n":"<24 hex>","c":"<hex ciphertext||16-byte tag>"}
```
Associated data: `awa-structured:2:<storage key>` — the storage key includes the `:profile:<id>` suffix, so a record copied to another
record or another profile fails authentication. Fresh random 96-bit nonce per write.

## 3. The storage layer (`secureAsyncStorage.ts`)

- Same `getItem/setItem/removeItem` surface as AsyncStorage; stores adopt it with one import line.
- Legacy plaintext is returned as-is until migrated; the next write encrypts.
- **Failed decrypt ⇒ `StructuredDataUnavailableError`, key recorded as unavailable, writes to it refused until a read succeeds.**
- Per-key FIFO lock shared by normal writes, the migration, restore and deletion.
- Bounded decrypted cache (≤16 entries, ≤2 M chars) keyed by the raw stored string; cleared on profile change.

## 4. Migration state machine (`structuredDataMigration.ts`)

`read → encrypt → stage (temp key) → verify staged → mark "committing" → re-check original → commit → verify committed → mark "done" → drop temp`.
Kill points are injected between every pair of steps in the tests; recovery at launch decides from what is on disk:
verified envelope ⇒ finish; still plaintext ⇒ retry; record gone ⇒ drop the copy and **never recreate**; unreadable envelope ⇒ "failed", everything kept.
A failure never deletes the original and is never read as "empty". The migration is not run on any real device by this phase.

## 5. Backups

- **Local slot** (`@awa/backup/local-v1[:profile:<id>]`): the snapshot is encrypted (device-bound) with the slot key as associated data.
  Plain snapshots written by older builds are still read. If encryption is impossible the old backup stays — no plaintext fallback.
- **Restore** (`planRestore` + `applyWritesWithJournal`): everything validated first; previous values journaled; writes applied; journal removed.
  A journal found at launch is rolled back **before any store reads**. Deleted-profile tombstones still win. A snapshot without
  Qadaa entries never touches existing Qadaa records.
- **Portable backup** (`portableBackup.ts`): JSON file `{format:"awa-portable-backup", version:1, createdAt, scope, kdf:{alg,iter,salt}, cipher, n, c}`;
  the header is authenticated as GCM associated data. Export decrypts each record (structured envelope + every field-level envelope,
  trying each domain's *existing* key, never creating one) in memory and seals the whole payload once under the passphrase key.
  Restore authenticates, validates, re-seals every record under the destination phone's own fresh keys, then applies through the
  journal. Wrong passphrase / damaged file ⇒ nothing changes. An incomplete backup is never produced silently.
- **Not included anywhere:** private photo files.

## 6. Recovery (`structuredKeyRecovery.ts`, `DataRecoveryScreen`)

User-initiated only: retry · restore a backup · create a new protection key (only after `key-lost`; old records stay unreadable) ·
erase unreadable records (confirmed, irreversible). While anything is unreadable: banner on the main screens, Statistics says
"cannot be shown", cycle reminders are left untouched.

## 7. Known limits

- PBKDF2 cost has not been timed on a phone (Node: ≈0.46 s for 600k). Hermes/Android timing is unmeasured.
- Hermes-side speed of AES-GCM in JS is unmeasured (Node: 9 ms encrypt / 11 ms decrypt for a 365-day journal).
- The migration, the recovery screens and the portable backup have run only under Jest.
- Plaintext by decision: in-app notification items, library state, UI preferences, the profile registry, the raw JSON and medical exports.
- Other objectives' reminder schedulers do not yet consult the availability registry (only Cycle's does).
