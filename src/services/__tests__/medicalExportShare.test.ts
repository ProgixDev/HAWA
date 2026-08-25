import {CachesDirectoryPath, exists, mkdir, readDir, unlink, writeFile} from '@dr.pogodin/react-native-fs';
import Share from 'react-native-share';
import {UTF8_BOM, buildExportFilename, shareExportFile} from '../medicalExportShare';

// Explicit factories — @dr.pogodin/react-native-fs and react-native-share are
// native modules unavailable in the Jest environment.
jest.mock('@dr.pogodin/react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  exists: jest.fn(),
  mkdir: jest.fn(),
  readDir: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));
jest.mock('react-native-share', () => ({
  __esModule: true,
  default: {open: jest.fn()},
}));

const mockExists = exists as jest.Mock;
const mockMkdir = mkdir as jest.Mock;
const mockReadDir = readDir as jest.Mock;
const mockUnlink = unlink as jest.Mock;
const mockWriteFile = writeFile as jest.Mock;
const mockShareOpen = Share.open as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockExists.mockResolvedValue(false);
  mockMkdir.mockResolvedValue(undefined);
  mockReadDir.mockResolvedValue([]);
  mockUnlink.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);
  mockShareOpen.mockResolvedValue(undefined);
});

describe('UTF8_BOM', () => {
  it('is exactly one U+FEFF character', () => {
    expect(UTF8_BOM).toHaveLength(1);
    expect(UTF8_BOM.charCodeAt(0)).toBe(0xfeff);
  });
});

describe('shareExportFile — CSV encoding', () => {
  it('prepends the UTF-8 BOM to CSV content before writing, and writes it as utf8', async () => {
    await shareExportFile('csv', 'date;categorie;valeur\r\n2026-08-24;Symptômes;Fatigue', 'AWA_suivi.csv');

    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const [path, writtenContent, encoding] = mockWriteFile.mock.calls[0];
    expect(path).toBe(`${CachesDirectoryPath}/medical-export/AWA_suivi.csv`);
    expect(writtenContent.charCodeAt(0)).toBe(0xfeff);
    expect(writtenContent.slice(1)).toBe('date;categorie;valeur\r\n2026-08-24;Symptômes;Fatigue');
    expect(encoding).toBe('utf8');
  });

  it('preserves French accented strings unchanged inside the written CSV content', async () => {
    const accented = 'Symptômes;Durée;Qualité;Réveil;Énergie;Irritabilité;Activité;Modérée';
    await shareExportFile('csv', accented, 'AWA_suivi.csv');
    const writtenContent = mockWriteFile.mock.calls[0][1];
    expect(writtenContent).toContain(accented);
  });

  it('never prepends the BOM to a PDF file, and writes it as base64', async () => {
    await shareExportFile('pdf', 'base64pdfcontent', 'AWA_rapport.pdf');
    const [, writtenContent, encoding] = mockWriteFile.mock.calls[0];
    expect(writtenContent).toBe('base64pdfcontent');
    expect(writtenContent.charCodeAt(0)).not.toBe(0xfeff);
    expect(encoding).toBe('base64');
  });
});

describe('buildExportFilename', () => {
  it('never reveals a category/objective name in the filename', () => {
    const filename = buildExportFilename('csv', '2026-08-01', '2026-08-25');
    expect(filename).toBe('AWA_suivi_2026-08-01_2026-08-25.csv');
  });
});
