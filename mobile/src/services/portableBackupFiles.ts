import {CachesDirectoryPath, exists, mkdir, readDir, readFile, unlink, writeFile} from '@dr.pogodin/react-native-fs';
import {keepLocalCopy, pick, types} from '@react-native-documents/picker';
import Share from 'react-native-share';

// The file side of the portable backup: handing the (already encrypted) file to the share sheet, and reading one the
// user picks. The file only ever contains the sealed backup — never plaintext — and lives in the app's private cache
// directory; same lifecycle rules as the medical export (cleared before the next one and when the screen opens, not
// right after the share sheet closes, because the receiving app may still be reading it).

const SHARE_DIR = `${CachesDirectoryPath}/portable-backup`;

export async function purgeBackupShareCache(): Promise<void> {
  try {
    if (!(await exists(SHARE_DIR))) {return;}
    const entries = await readDir(SHARE_DIR);
    await Promise.all(entries.map(entry => unlink(entry.path).catch(() => undefined)));
  } catch {
    // best effort: a leftover sealed file is not worth failing over
  }
}

export type ShareBackupOutcome = 'shared' | 'cancelled';

export async function shareBackupFile(fileName: string, contents: string, title: string): Promise<ShareBackupOutcome> {
  await mkdir(SHARE_DIR);
  await purgeBackupShareCache();
  const path = `${SHARE_DIR}/${fileName}`;
  await writeFile(path, contents, 'utf8');
  try {
    await Share.open({url: `file://${path}`, type: 'application/octet-stream', filename: fileName, title, failOnCancel: false});
    return 'shared';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(message)) {return 'cancelled';}
    throw error;
  }
}

export type PickedBackupFile = {contents: string; name: string};

/** Lets the user choose a file and returns its text, or null when they cancel. The local copy is removed straight away. */
export async function pickBackupFile(): Promise<PickedBackupFile | null> {
  let picked;
  try {
    [picked] = await pick({type: [types.allFiles], allowMultiSelection: false});
  } catch (error) {
    const code = (error as {code?: string} | null)?.code;
    if (code === 'OPERATION_CANCELED' || /cancel/i.test(String((error as Error | null)?.message ?? ''))) {return null;}
    throw error;
  }
  if (!picked) {return null;}
  const [copy] = await keepLocalCopy({files: [{uri: picked.uri, fileName: picked.name ?? 'backup.awabackup'}], destination: 'cachesDirectory'});
  if (!copy || copy.status !== 'success') {throw new Error('could not read the selected file');}
  const path = decodeURI(copy.localUri).replace(/^file:\/\//, '');
  try {
    return {contents: await readFile(path, 'utf8'), name: picked.name ?? 'backup'};
  } finally {
    await unlink(path).catch(() => undefined);
  }
}
