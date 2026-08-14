import {diffDays, startOfDay} from './cycleMath';

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
export function computePostpartumStatus(deliveryDate: Date | null, referenceDate: Date): PostpartumStatus {
  if (!deliveryDate || Number.isNaN(deliveryDate.getTime())) {
    return {...UNCONFIGURED_STATUS};
  }

  const daysSinceDelivery = Math.max(0, diffDays(startOfDay(referenceDate), startOfDay(deliveryDate)));
  const postpartumDay = daysSinceDelivery + 1;
  const postpartumWeek = Math.floor(daysSinceDelivery / 7) + 1;

  return {
    configured: true,
    daysSinceDelivery,
    postpartumDay,
    postpartumWeek,
  };
}
