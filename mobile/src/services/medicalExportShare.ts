import {CachesDirectoryPath, exists, mkdir, readDir, unlink, writeFile} from '@dr.pogodin/react-native-fs';
import Share from 'react-native-share';

// Local-only file + native Share-sheet wiring for the Medical Export feature.
// Deliberately the ONLY file in this feature that touches react-native-fs/
// react-native-share — medicalExportFormatting.ts/medicalExportOrchestrator.ts/
// medicalExportPdf.ts stay free of native imports so their logic remains
// Jest-testable without native mocking.
//
// React Native's own core `Share` API cannot reliably attach a local file on
// Android (its `url` option is iOS-only) — confirmed by reading RN's own
// Share module before adding a dependency. react-native-share is added
// specifically to cover this Android gap; it bundles its own FileProvider
// (see node_modules/react-native-share/android/.../AndroidManifest.xml,
// authority `${applicationId}.rnshare.fileprovider`, granting exactly the
// app cache directory) so no manual AndroidManifest.xml edit is required —
// autolinking is sufficient.

const EXPORT_DIR = `${CachesDirectoryPath}/medical-export`;

export type ExportFileKind = 'csv' | 'pdf';

const MIME_BY_KIND: Record<ExportFileKind, string> = {
  csv: 'text/csv',
  pdf: 'application/pdf',
};

/** Sober, non-revealing filename — "AWA_suivi_..."/"AWA_rapport_suivi_...",
 * never a category or objective name, so the file itself never advertises
 * sensitive content if seen in a share sheet, a downloads folder, or an
 * email attachment list. */
export function buildExportFilename(kind: ExportFileKind, fromKey: string, toKey: string): string {
  const prefix = kind === 'csv' ? 'AWA_suivi' : 'AWA_rapport_suivi';
  return `${prefix}_${fromKey}_${toKey}.${kind}`;
}

export type ShareExportOutcome = 'shared' | 'cancelled';

// Excel (Android/Windows, the app's whole French-speaking audience) does not
// reliably auto-detect a plain UTF-8 .csv as UTF-8 — without this marker it
// falls back to the system ANSI/Windows-1252 codepage, corrupting every
// accented character (e.g. "Symptômes" renders as "SymptÃ´mes") even though
// the file's bytes were always valid UTF-8. Prepending the standard UTF-8
// BOM is the fix Excel actually looks for; it is invisible in every other
// CSV-compatible reader. The string below contains exactly one literal
// U+FEFF character (equivalent to '﻿') between the quotes.
export const UTF8_BOM = '﻿';

/** Best-effort removal of any file left over from a previous export — run
 * before writing a new one, never right after Share.open() resolves. The
 * receiving app (email client, file manager, etc.) may still be reading the
 * shared content:// URI for a moment after the share intent hands off, so
 * deleting immediately after Share.open() would risk truncating the
 * attachment the user just sent; the cache directory is already app-private,
 * non-public, and OS-reclaimable, so leaving one file there briefly is safe. */
async function clearPreviousExports(): Promise<void> {
  try {
    if (!(await exists(EXPORT_DIR))) {return;}
    const entries = await readDir(EXPORT_DIR);
    await Promise.all(entries.map(entry => unlink(entry.path).catch(() => {})));
  } catch {
    // Best-effort only — a stale leftover file is not worth failing the
    // current export over.
  }
}

/** Writes the export to the app's cache directory (never public/shared
 * storage — no broad storage permission is needed), opens the native Share
 * sheet with it as a REAL file attachment (correct MIME type, correct
 * filename). A user cancelling the Share sheet resolves as `'cancelled'`,
 * never throws — this is not an application error. Any other failure (file
 * write, Share sheet unavailable) throws, so the caller can show the
 * existing error UI; the error itself never includes the exported content. */
export async function shareExportFile(
  kind: ExportFileKind,
  content: string,
  filename: string,
): Promise<ShareExportOutcome> {
  await mkdir(EXPORT_DIR);
  await clearPreviousExports();
  const path = `${EXPORT_DIR}/${filename}`;

  const fileContent = kind === 'csv' ? UTF8_BOM + content : content;
  await writeFile(path, fileContent, kind === 'pdf' ? 'base64' : 'utf8');

  try {
    await Share.open({
      url: `file://${path}`,
      type: MIME_BY_KIND[kind],
      filename,
      failOnCancel: false,
    });
    return 'shared';
  } catch (error) {
    // react-native-share rejects with a user-cancellation error when the
    // Share sheet is dismissed without picking a target, even with
    // failOnCancel: false on some Android versions — treat any rejection
    // whose message mentions cancellation as a non-fatal cancel, and
    // re-throw anything else as a real failure.
    const message = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(message)) {return 'cancelled';}
    throw error;
  }
}
