import type { Country, ManagedUser, UserObjective, UserStatus } from '@/types';

const names = [
  'Lina Benali',
  'Sarah El Mansouri',
  'Nour Boudiaf',
  'Yasmine Trabelsi',
  'Inès Martin',
  'Meryem Alaoui',
  'Amel Khelifi',
  'Sofia Rahmani',
  'Aya Haddad',
  'Leïla Cherif',
  'Hana Belkacem',
  'Mouna Saïdi',
  'Imane El Idrissi',
  'Selma Gharbi',
  'Maya Bensalem',
  'Rania Ouali',
  'Camélia Dupont',
  'Asmae Bouzid',
  'Myriam Hamdi',
  'Nesrine Fassi',
  'Dounia Merabet',
  'Farah Amrani',
  'Houda Mansour',
  'Malika Ziani',
  'Rim Ben Youssef',
  'Sana El Amrani',
  'Kenza Lahlou',
  'Nadia Ferhat',
  'Lamia Roux',
  'Amina Chérif',
  'Samira Bensaïd',
  'Wafa Jaziri',
];

const countries: Country[] = ['FR', 'MA', 'DZ', 'TN', 'CA', 'BE', 'CH'];
const objectives: UserObjective[] = [
  'cycle_menstruel',
  'ttc',
  'contraception',
  'sopk',
  'grossesse',
  'post_partum',
  'menopause',
  'fausse_couche',
];

function getStatus(index: number): UserStatus {
  if ((index + 1) % 11 === 0) return 'suspended';
  if ((index + 1) % 7 === 0) return 'pending_verification';
  if ((index + 1) % 9 === 0) return 'inactive';
  return 'active';
}

function toEmail(name: string) {
  return `${name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '')}@awa-membre.com`;
}

export const mockUsers: ManagedUser[] = names.map((name, index) => {
  const premium = index % 3 !== 0;
  const annual = premium && index % 2 === 0;
  const expired = premium && (index + 1) % 8 === 0;
  const createdYear = 2023 + (index % 3);
  const createdMonth = (index * 5) % 12;
  const createdDay = 3 + ((index * 7) % 24);
  const activityMonth = 7 + (index % 2);
  const activityDay = 2 + ((index * 3) % 27);

  return {
    id: `user-${String(index + 1).padStart(3, '0')}`,
    displayId: `AWA-${String(24846 - index).padStart(5, '0')}`,
    name,
    email: toEmail(name),
    isAnonymous: false,
    country: countries[index % countries.length],
    objective: objectives[index % objectives.length],
    spiritualMode: index % 2 === 0,
    plan: premium ? 'PREMIUM' : 'FREE',
    billingCycle: premium ? (annual ? 'annual' : 'monthly') : undefined,
    status: getStatus(index),
    createdAt: new Date(Date.UTC(createdYear, createdMonth, createdDay)).toISOString(),
    lastActiveAt: new Date(Date.UTC(2026, activityMonth, activityDay)).toISOString(),
    language: 'fr',
    notificationOptIn: index % 5 !== 0,
    premiumSince: premium
      ? new Date(Date.UTC(2025, index % 12, 2 + (index % 20))).toISOString()
      : undefined,
    premiumExpiresAt: premium
      ? new Date(
          Date.UTC(expired ? 2026 : 2027, expired ? 4 : index % 12, 10 + (index % 14))
        ).toISOString()
      : undefined,
    subscriptionProvider: premium ? (['apple', 'google', 'stripe'] as const)[index % 3] : undefined,
  };
});
