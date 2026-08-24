export type SymptomSeverity = 'mild' | 'moderate' | 'severe';
export type MoodLevel = 'veryGood' | 'good' | 'neutral' | 'stressed' | 'irritable' | 'anxious' | 'sad' | 'tired' | 'motivated';
export type FlowIntensity = 'none' | 'light' | 'moderate' | 'heavy' | 'veryHeavy';
export type CervicalMucusType = 'dry' | 'sticky' | 'creamy' | 'watery' | 'eggWhite';
export type LHTestResult = 'negative' | 'positive' | 'invalid';

export type DailyJournalEntry = {
  id: string;
  date: string;
  cycleDay?: number;
  symptoms?: {names: string[]; severity?: SymptomSeverity; painLocation?: string; note?: string};
  mood?: {level: MoodLevel; energy: number; stress: number; irritability: number; motivation: number; note?: string};
  flow?: {intensity: FlowIntensity; color?: string; clots?: string; protections?: string[]; periodStart?: boolean; periodEnd?: boolean; pain?: string; note?: string};
  temperature?: {value: number; unit: 'C' | 'F'; time?: string; method?: string; note?: string};
  sleep?: {bedtime?: string; wakeTime?: string; duration?: string; quality?: string; awakenings?: number; wakeFeeling?: string; note?: string};
  activity?: {type?: string; durationMinutes?: number; intensity?: string; feeling?: string; none?: boolean; note?: string};
  hydration?: {milliliters: number; dailyGoal?: number; glasses?: number; goalGlasses?: number};
  weight?: {value?: number; unit: 'kg' | 'lb'; moment?: string; note?: string};
  // LEGACY plaintext shape — no longer written, kept only so existing
  // "Notes personnelles" saved before encryption-at-rest existed still count
  // as "a note exists" for presence checks (CalendarScreen.tsx,
  // SelectedDayCard.tsx) and so migrateLegacyPlainNotes() in
  // privateNotesEncryption.ts can find and upgrade them. Never write this
  // field again; see `encryptedNote` below.
  note?: {text: string; private: true; updatedAt: string};
  // AES-256-GCM-encrypted "Notes personnelles" (see
  // privateNotesEncryption.ts) — the only field that ever holds this
  // section's real content going forward. Same envelope shape as
  // `encryptedIntimacy` below, own Keychain key/domain. Frontend local
  // encryption only — see TODO.md §1.19.
  encryptedNote?: EncryptedNotePayload;
  // LEGACY plaintext shape — no longer written, kept only so
  // resolveIntimacySection() in privateJournalEncryption.ts can still read
  // entries saved before encryption-at-rest existed. Never write this field
  // again; see `encryptedIntimacy` below.
  intimacy?: IntimacySection;
  // AES-256-GCM-encrypted "Vie intime"/"Rapports" data (see
  // privateJournalEncryption.ts) — the only field that ever holds this
  // section's real content going forward. `iv`/`ciphertext` are hex strings;
  // the GCM authentication tag is already embedded in `ciphertext`. Frontend
  // local encryption only — see TODO.md §2.14.
  encryptedIntimacy?: EncryptedIntimacyPayload;
  cervicalMucus?: {type: CervicalMucusType; note?: string};
  lhTest?: {result: LHTestResult; time?: string; note?: string};
  // LEGACY single-photo shape — no longer written, kept only so
  // resolvePrivatePhotos() below can still read entries saved before
  // multi-photo support existed. Never write this field again.
  privatePhoto?: {uri: string; addedAt: string};
  // Local-only references to picked images (gallery or camera) — URIs only,
  // never binary/base64 data (see JournalPrivatePhotosScreen.tsx). Up to
  // MAX_PRIVATE_PHOTOS_PER_DAY (5) entries. A `.awaenc`-suffixed uri points
  // at an AES-256-GCM-encrypted file at rest (see privatePhotoEncryption.ts/
  // privatePhotoStorage.ts); any other app-owned uri is a legacy plaintext
  // file, transparently re-encrypted the next time that day is saved.
  // Frontend/local encryption only — see TODO.md §1.4/§2.15.
  privatePhotos?: PrivatePhoto[];
};

export type PrivatePhoto = {id: string; uri: string; addedAt: string};

export type IntimacySection = {answer: 'yes' | 'no' | 'preferNot'; time?: string; protection?: 'yes' | 'no' | 'unknown'; libido?: string; discomfort?: string; note?: string};

/** `iv`/`ciphertext` are hex-encoded byte strings (see privateJournalEncryption.ts,
 * which uses @noble/ciphers' own bytesToHex/hexToBytes — no separate base64
 * dependency). `ciphertext` already includes the GCM authentication tag. */
export type EncryptedIntimacyPayload = {version: 1; iv: string; ciphertext: string};

/** Same hex-envelope shape as EncryptedIntimacyPayload — see
 * privateNotesEncryption.ts. A distinct type (not a shared alias) so a
 * future change to one payload's shape can never silently affect the
 * other. */
export type EncryptedNotePayload = {version: 1; iv: string; ciphertext: string};

export type JournalSection = Exclude<keyof DailyJournalEntry, 'id' | 'date' | 'cycleDay'>;

/** Read-time compatibility for the pre-multi-photo `privatePhoto` field —
 * see the field's own comment above. A legacy entry gets a deterministic
 * (not random) id derived from its date, so the resulting React key stays
 * stable across re-renders/reloads without ever being persisted itself.
 * Saving this day's photos from JournalPrivatePhotosScreen.tsx converts it
 * to the real `privatePhotos` shape and drops the legacy field — no global
 * migration sweep, no data loss for days never revisited. */
export const resolvePrivatePhotos = (entry: DailyJournalEntry | undefined): PrivatePhoto[] => {
  if (entry?.privatePhotos) {return entry.privatePhotos;}
  if (entry?.privatePhoto?.uri) {
    return [{id: `legacy-${entry.date}`, uri: entry.privatePhoto.uri, addedAt: entry.privatePhoto.addedAt}];
  }
  return [];
};
