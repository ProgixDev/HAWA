import type { Country, ManagedUser, UserObjective, UserStatus } from '@/types';

export const COUNTRY_LABELS: Record<Country, string> = {
  FR: 'France',
  MA: 'Maroc',
  DZ: 'Algérie',
  TN: 'Tunisie',
  CA: 'Canada',
  BE: 'Belgique',
  CH: 'Suisse',
  other: 'Autre',
};

export const OBJECTIVE_LABELS: Record<UserObjective, string> = {
  cycle_menstruel: 'Cycle menstruel',
  ttc: 'Essayer de concevoir',
  contraception: 'Contraception',
  sopk: 'SOPK / cycles irréguliers',
  menopause: 'Périménopause / Ménopause',
  grossesse: 'Grossesse',
  post_partum: 'Post-partum',
  fausse_couche: 'Après une fausse couche',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
  inactive: 'Désactivé',
  disabled: 'Désactivé',
  pending_verification: 'En attente',
  deletion_pending: 'Suppression demandée',
  deleted: 'Supprimé',
};

export function getCountryFlag(country: Country) {
  if (country === 'other') return '🌍';
  return String.fromCodePoint(...country.split('').map((letter) => 127397 + letter.charCodeAt(0)));
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function formatUserDate(value?: string, includeTime = false) {
  if (!value) return 'Non renseigné';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
}

export function getAccountTypeLabel(user: ManagedUser) {
  return user.isAnonymous ? 'Compte anonyme' : 'Compte inscrit';
}

export function getPlanLabel(user: ManagedUser) {
  if (user.plan === 'FREE') return 'Gratuit';
  return user.billingCycle === 'annual' ? 'Premium annuel' : 'Premium mensuel';
}
