export type DayKind = 'period' | 'fertile' | 'ovulation' | 'normal';

export type CycleBasics = {
  lastPeriodStart: Date;
  cycleDuration: number;
  periodDuration: number;
};

export const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const DAY_MS = 86_400_000;

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const diffDays = (later: Date, earlier: Date): number =>
  Math.round(
    (startOfDay(later).getTime() - startOfDay(earlier).getTime()) / DAY_MS,
  );

export const positiveModulo = (value: number, divisor: number): number =>
  ((value % divisor) + divisor) % divisor;

export const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const capitalize = (value: string): string =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export const formatShortDate = (date: Date): string =>
  capitalize(
    new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long'}).format(date),
  );

export const formatFullDate = (date: Date): string =>
  capitalize(
    new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date),
  );

export const formatDateRange = (start: Date, end: Date): string => {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return sameMonth
    ? `${start.getDate()} – ${formatShortDate(end)}`
    : `${formatShortDate(start)} – ${formatShortDate(end)}`;
};

export const formatHijriDate = (date: Date): string | undefined => {
  try {
    return capitalize(
      new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date),
    );
  } catch {
    return undefined;
  }
};

export const formatHijriDay = (date: Date): string | undefined => {
  try {
    return new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {day: 'numeric'}).format(date);
  } catch {
    return undefined;
  }
};

export const formatHijriMonthYear = (date: Date): string | undefined => {
  try {
    return capitalize(
      new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {month: 'long', year: 'numeric'}).format(date),
    );
  } catch {
    return undefined;
  }
};

export const ovulationDayFor = (cycleDuration: number): number => cycleDuration - 13;

export const cycleDayFor = (date: Date, basics: CycleBasics): number =>
  positiveModulo(diffDays(date, basics.lastPeriodStart), basics.cycleDuration) + 1;

export const kindFor = (date: Date, basics: CycleBasics): DayKind => {
  const cycleDay = cycleDayFor(date, basics);
  const ovulationDay = ovulationDayFor(basics.cycleDuration);

  if (cycleDay <= basics.periodDuration) {
    return 'period';
  }

  if (cycleDay === ovulationDay) {
    return 'ovulation';
  }

  if (cycleDay >= ovulationDay - 5 && cycleDay <= ovulationDay + 1) {
    return 'fertile';
  }

  return 'normal';
};

export type ComputedCyclePhase = 'menstruation' | 'follicular' | 'fertile' | 'ovulation' | 'luteal';

export const phaseFor = (date: Date, basics: CycleBasics): ComputedCyclePhase => {
  const kind = kindFor(date, basics);
  if (kind === 'period') {return 'menstruation';}
  if (kind === 'ovulation') {return 'ovulation';}
  if (kind === 'fertile') {return 'fertile';}
  const cycleDay = cycleDayFor(date, basics);
  const ovulationDay = ovulationDayFor(basics.cycleDuration);
  return cycleDay < ovulationDay ? 'follicular' : 'luteal';
};

export const computeNextPeriod = (basics: CycleBasics, today: Date): Date => {
  const elapsed = diffDays(today, basics.lastPeriodStart);
  const cyclesElapsed = Math.max(0, Math.floor(elapsed / basics.cycleDuration));
  let next = addDays(basics.lastPeriodStart, (cyclesElapsed + 1) * basics.cycleDuration);
  if (next < today) {
    next = addDays(next, basics.cycleDuration);
  }
  return next;
};

export const periodStartForCycleContaining = (date: Date, basics: CycleBasics): Date => {
  const cycleDay = cycleDayFor(date, basics);
  return addDays(date, -(cycleDay - 1));
};

export const upcomingDateForCycleDay = (basics: CycleBasics, dayNumber: number, today: Date): Date => {
  let date = addDays(basics.lastPeriodStart, dayNumber - 1);
  while (date < today) {
    date = addDays(date, basics.cycleDuration);
  }
  return date;
};

// phaseFor only estimates menstruation from the cycle length/period-duration
// averages. If the user has explicitly confirmed her period ended (via
// MenstrualFlowScreen) at a datetime within the current period, that
// confirmation overrides the estimate so the rest of the app (purity status,
// spiritual guidance) reflects reality instead of the average-based guess.
export const isMenstruatingNow = (
  now: Date,
  basics: CycleBasics,
  periodEndDateTime: Date | null,
): boolean => {
  if (phaseFor(now, basics) !== 'menstruation') {return false;}
  if (
    periodEndDateTime &&
    periodEndDateTime.getTime() <= now.getTime() &&
    periodEndDateTime.getTime() >= basics.lastPeriodStart.getTime()
  ) {
    return false;
  }
  return true;
};
