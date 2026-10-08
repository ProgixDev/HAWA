# -*- coding: utf-8 -*-
"""Validates the 16 localized editorial WebP illustrations against their lossless PNG masters.

Usage (from mobile/):  python scripts/validate-editorial-images.py

Checks, for every language variant of every image:
  * the WebP file exists, decodes, and is RGB/RGBA;
  * its pixel dimensions (and aspect ratio) equal the master / original artwork;
  * it is not blank (pixel standard deviation) and not corrupted (decodes fully);
  * it stays close to the master (overall PSNR / SSIM and the worst lettering-region SSIM).
Prints a size report (PNG master vs shipped WebP). Exits non-zero on any failure.
The automated metrics are supplementary: they do not replace looking at the images.
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'src', 'assets', 'images', 'library')
MASTERS = os.path.join(ROOT, 'design-sources', 'editorial-images')
LANGS = ('en', 'fr', 'es', 'it')

# lettering regions (x0, y0, x1, y1) - where compression artifacts would be most visible
TEXT = {
    'cycle-phases-hero': [(735, 396, 975, 506)],
    'grossesse_semiane': [(1205, 200, 1700, 520)],
    'activité_grossesse': [(270, 225, 820, 370), (1505, 598, 1662, 702)],
    'activité': [(340, 215, 625, 320), (1478, 612, 1594, 710)],
}
MIN_PSNR, MIN_SSIM, MIN_TEXT_SSIM, MIN_STD = 38.0, 0.97, 0.98, 8.0


def psnr(a, b):
    mse = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)
    return 99.0 if mse == 0 else 10 * np.log10(255 ** 2 / mse)


def ssim(a, b):
    a = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(np.float64)
    b = cv2.cvtColor(b, cv2.COLOR_RGB2GRAY).astype(np.float64)
    c1, c2, k = (0.01 * 255) ** 2, (0.03 * 255) ** 2, (11, 11)
    mu1, mu2 = cv2.GaussianBlur(a, k, 1.5), cv2.GaussianBlur(b, k, 1.5)
    s11 = cv2.GaussianBlur(a * a, k, 1.5) - mu1 ** 2
    s22 = cv2.GaussianBlur(b * b, k, 1.5) - mu2 ** 2
    s12 = cv2.GaussianBlur(a * b, k, 1.5) - mu1 * mu2
    return float((((2 * mu1 * mu2 + c1) * (2 * s12 + c2)) / ((mu1 ** 2 + mu2 ** 2 + c1) * (s11 + s22 + c2))).mean())


def master_path(base, lang):
    candidate = os.path.join(MASTERS, f'{base}.{lang}.png')
    if os.path.exists(candidate):
        return candidate
    original = os.path.join(ASSETS, f'{base}.png')  # French covers/heroes are the untouched originals
    return original if lang == 'fr' and os.path.exists(original) else None


failures, rows = [], []
for base, regions in TEXT.items():
    ref_size = Image.open(os.path.join(ASSETS, f'{base}.png')).size  # original artwork proportions
    for lang in LANGS:
        name = f'{base}.{lang}.webp'
        path = os.path.join(ASSETS, name)
        try:
            with Image.open(path) as im:
                fmt, mode, size = im.format, im.mode, im.size
                im.load()  # full decode: raises on corruption
                dec = np.asarray(im.convert('RGB'))
        except Exception as error:  # noqa: BLE001 - report any decode problem
            failures.append(f'{name}: cannot decode ({error})')
            continue
        if fmt != 'WEBP' or mode not in ('RGB', 'RGBA'):
            failures.append(f'{name}: unexpected format/mode {fmt}/{mode}')
        if size != ref_size or abs(size[0] / size[1] - ref_size[0] / ref_size[1]) > 1e-9:
            failures.append(f'{name}: size {size} != original {ref_size}')
        if float(dec.std()) < MIN_STD:
            failures.append(f'{name}: looks blank (std {dec.std():.1f})')
        mp = master_path(base, lang)
        if mp is None:
            failures.append(f'{name}: no lossless master found')
            continue
        ref = np.asarray(Image.open(mp).convert('RGB'))
        if ref.shape != dec.shape:
            failures.append(f'{name}: master shape {ref.shape} != {dec.shape}')
            continue
        p, s = psnr(ref, dec), ssim(ref, dec)
        ts = min(ssim(ref[y0:y1, x0:x1], dec[y0:y1, x0:x1]) for x0, y0, x1, y1 in regions)
        if p < MIN_PSNR or s < MIN_SSIM or ts < MIN_TEXT_SSIM:
            failures.append(f'{name}: quality below threshold (PSNR {p:.1f}, SSIM {s:.4f}, text SSIM {ts:.4f})')
        rows.append((name, os.path.getsize(mp), os.path.getsize(path), size, mode, p, s, ts))

print('%-30s %9s %9s %6s %-11s %-4s %6s %7s %8s' % ('file', 'master MB', 'webp MB', 'saved', 'size', 'mode', 'PSNR', 'SSIM', 'txtSSIM'))
for n, m, w, size, mode, p, s, ts in rows:
    print('%-30s %9.2f %9.2f %5.0f%% %-11s %-4s %6.1f %7.4f %8.4f' % (n, m / 1048576, w / 1048576, 100 * (1 - w / m), f'{size[0]}x{size[1]}', mode, p, s, ts))
tm, tw = sum(r[1] for r in rows), sum(r[2] for r in rows)
print('TOTAL: masters %.2f MB -> shipped WebP %.2f MB  (-%.2f MB, -%.1f%%)' % (tm / 1048576, tw / 1048576, (tm - tw) / 1048576, 100 * (1 - tw / tm) if tm else 0))
if len(rows) != 16:
    failures.append(f'expected 16 validated variants, got {len(rows)}')
if failures:
    print('\nFAILED:')
    for f in failures:
        print('  -', f)
    sys.exit(1)
print('\nOK: all 16 variants decode, match the original proportions, are not blank, and stay within quality thresholds.')
