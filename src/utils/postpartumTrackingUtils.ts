import { diffDays, startOfDay } from './cycleMath';
import type {
  PostpartumLochiaEntry,
  PostpartumLochiaTracking,
} from '../state/postpartumLochiaStore';
import {
  NIFAS_REFERENCE_DAYS,
  NIFAS_WARNING_DAYS,
} from '../config/nifasReminderConfig';

export type PostpartumStatus = {
  /** false until a real deliveryDate has been confirmed — every other
   * field is then a safe, inert placeholder, never a fake "real" value. */
  configured: boolean;
  daysSinceDelivery: number;
  /** 1-indexed — the day delivery happened is "Jour 1". */
  postpartumDay: number;
  /** 1-indexed, `Math.floor(daysSinceDelivery / 7) + 1`. */
  postpartumWeek: number;
};

const UNCONFIGURED_STATUS: PostpartumStatus = {
  configured: false,
  daysSinceDelivery: 0,
  postpartumDay: 0,
  postpartumWeek: 0,
};

/**
 * THE single postpartum-day calculation — every screen that needs "Jour X"
 * (Dashboard, Nifas tracking, future Postpartum content) must call this
 * instead of scattering `diffDays`/`deliveryDate` math across files, so
 * they can never disagree. Mirrors computePregnancyStatus()'s shape/
 * conventions (utils/pregnancyTrackingUtils.ts).
 */
export function computePostpartumStatus(
  deliveryDate: Date | null,
  referenceDate: Date,
): PostpartumStatus {
  if (!deliveryDate || Number.isNaN(deliveryDate.getTime())) {
    return { ...UNCONFIGURED_STATUS };
  }

  const daysSinceDelivery = Math.max(
    0,
    diffDays(startOfDay(referenceDate), startOfDay(deliveryDate)),
  );
  const postpartumDay = daysSinceDelivery + 1;
  const postpartumWeek = Math.floor(daysSinceDelivery / 7) + 1;

  return {
    configured: true,
    daysSinceDelivery,
    postpartumDay,
    postpartumWeek,
  };
}

export type PostpartumLochiaSummary = {
  deliveryDate: string | null;
  firstRecordedDate: string | null;
  lastRecordedDate: string | null;
  endedDate: string | null;
  recordedDays: number;
  durationDays: number | null;
  status: 'no_data' | 'ongoing' | 'ended';
};

const parseLocalDay = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
};

/** Medical lochia summary only. It contains no fiqh threshold or ruling. */
export function computePostpartumLochiaSummary(
  deliveryDateValue: string | null,
  entries: Record<string, PostpartumLochiaEntry>,
  tracking: PostpartumLochiaTracking,
): PostpartumLochiaSummary {
  const deliveryDate = parseLocalDay(deliveryDateValue);
  const dates = Object.keys(entries)
    .filter(date => {
      const parsed = parseLocalDay(date);
      return Boolean(
        parsed && (!deliveryDate || diffDays(parsed!, deliveryDate) >= 0),
      );
    })
    .sort();
  const endedDate = parseLocalDay(tracking.endedDate);
  const effectiveEndDate =
    endedDate && deliveryDate && diffDays(endedDate, deliveryDate) >= 0
      ? tracking.endedDate
      : null;
  const lastRecordedDate = dates.length ? dates[dates.length - 1] : null;
  const durationEnd = parseLocalDay(effectiveEndDate ?? lastRecordedDate);
  const durationDays =
    deliveryDate && durationEnd
      ? diffDays(durationEnd, deliveryDate) + 1
      : null;

  return {
    deliveryDate: deliveryDateValue,
    firstRecordedDate: dates[0] ?? null,
    lastRecordedDate,
    endedDate: effectiveEndDate,
    recordedDays: dates.length,
    durationDays,
    status: effectiveEndDate
      ? 'ended'
      : dates.length > 0
      ? 'ongoing'
      : 'no_data',
  };
}

export type PostpartumNifasStatus = {
  postpartumDay: number;
  lochiaOngoing: boolean;
  lochiaEnded: boolean;
  lochiaEndDate: string | null;
  status:
    | 'not_configured'
    | 'no_lochia_data'
    | 'losses_ongoing'
    | 'losses_ended';
  educationalReference: string;
};

/** Neutral educational context derived from medical tracking. It never
 * decides ritual purity and deliberately contains no universal day limit. */
export function getPostpartumNifasStatus(
  deliveryDateValue: string | null,
  referenceDate: Date,
  lochia: PostpartumLochiaSummary,
): PostpartumNifasStatus {
  const postpartum = computePostpartumStatus(
    parseLocalDay(deliveryDateValue),
    referenceDate,
  );
  const educationalReference =
    'Les références juridiques concernant la durée maximale du nifas peuvent varier selon les écoles.';

  if (!postpartum.configured) {
    return {
      postpartumDay: 0,
      lochiaOngoing: false,
      lochiaEnded: false,
      lochiaEndDate: null,
      status: 'not_configured',
      educationalReference,
    };
  }
  if (lochia.status === 'ended') {
    return {
      postpartumDay: postpartum.postpartumDay,
      lochiaOngoing: false,
      lochiaEnded: true,
      lochiaEndDate: lochia.endedDate,
      status: 'losses_ended',
      educationalReference,
    };
  }
  if (lochia.status === 'ongoing') {
    return {
      postpartumDay: postpartum.postpartumDay,
      lochiaOngoing: true,
      lochiaEnded: false,
      lochiaEndDate: null,
      status: 'losses_ongoing',
      educationalReference,
    };
  }
  return {
    postpartumDay: postpartum.postpartumDay,
    lochiaOngoing: false,
    lochiaEnded: false,
    lochiaEndDate: null,
    status: 'no_lochia_data',
    educationalReference,
  };
}

export type NifasReminderStatus = 'none' | 'approaching' | 'reference_reached';

/** Product reminder state only; never a purity or prayer ruling. */
export function getNifasReminderStatus({
  postpartumDay,
  lochiaEnded,
}: {
  postpartumDay: number;
  lochiaEnded: boolean;
}): NifasReminderStatus {
  if (lochiaEnded) {
    return 'none';
  }
  if (postpartumDay >= NIFAS_REFERENCE_DAYS) {
    return 'reference_reached';
  }
  if (postpartumDay >= NIFAS_WARNING_DAYS) {
    return 'approaching';
  }
  return 'none';
}
