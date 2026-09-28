// Small, dependency-free age helper for the managed-profile creation flow
// (see src/screens/managedProfile/). Age is always DERIVED from a birth date —
// it is never itself stored as a source of truth (CLAUDE.md §5, "real data only").

/** Whole years between `birthDate` and `today` (defaults to now). Never negative. */
export function calculateAgeInYears(birthDate: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return Math.max(age, 0);
}

/** "8 ans" / "1 an" — French pluralization for the age shown under the birth-date field. */
export function formatAgeInYears(birthDate: Date, today: Date = new Date()): string {
  const age = calculateAgeInYears(birthDate, today);
  return `${age} an${age > 1 ? 's' : ''}`;
}
