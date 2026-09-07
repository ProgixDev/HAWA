'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  Filter,
  KeyRound,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  ShieldBan,
  Trash2,
  UserRoundX,
  UsersRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { mockUsers } from '@/data/mock/users';
import type { Country, ManagedUser, UserObjective, UserStatus } from '@/types';

type SortKey = 'name' | 'createdAt' | 'accountType' | 'lastActiveAt';
type SortDirection = 'asc' | 'desc';
type PremiumFilter = 'all' | 'active' | 'expired' | 'none';
type AccountFilter = 'all' | 'registered' | 'anonymous';
type ConfirmAction = 'toggle' | 'suspend' | 'delete';

type ModalState =
  | { type: 'details' | 'edit' | 'subscription' | 'reset'; userId: string }
  | { type: 'confirm'; userId: string; action: ConfirmAction }
  | null;

interface Filters {
  search: string;
  country: 'all' | Country;
  status: 'all' | UserStatus;
  objective: 'all' | UserObjective;
  account: AccountFilter;
  premium: PremiumFilter;
}

interface ActionMenuState {
  userId: string;
  top: number;
  left: number;
}

const INITIAL_FILTERS: Filters = {
  search: '',
  country: 'all',
  status: 'all',
  objective: 'all',
  account: 'all',
  premium: 'all',
};

const COUNTRY_META: Record<Country, { label: string; flag: string }> = {
  FR: { label: 'France', flag: '🇫🇷' },
  MA: { label: 'Maroc', flag: '🇲🇦' },
  DZ: { label: 'Algérie', flag: '🇩🇿' },
  TN: { label: 'Tunisie', flag: '🇹🇳' },
  CA: { label: 'Canada', flag: '🇨🇦' },
  BE: { label: 'Belgique', flag: '🇧🇪' },
  CH: { label: 'Suisse', flag: '🇨🇭' },
  other: { label: 'Autre', flag: '🌍' },
};

const COUNTRY_FLAG_ART: Record<string, React.ReactNode> = {
  FR: (
    <>
      <rect width="8" height="16" fill="#0055A4" />
      <rect x="8" width="8" height="16" fill="#FFFFFF" />
      <rect x="16" width="8" height="16" fill="#EF4135" />
    </>
  ),
  MA: (
    <>
      <rect width="24" height="16" fill="#C1272D" />
      <path
        d="m12 4.1 1.02 3.14h3.3l-2.67 1.94 1.02 3.14L12 10.38l-2.67 1.94 1.02-3.14-2.67-1.94h3.3L12 4.1Z"
        fill="none"
        stroke="#006233"
        strokeWidth="0.85"
        strokeLinejoin="round"
      />
    </>
  ),
  DZ: (
    <>
      <rect width="12" height="16" fill="#006233" />
      <rect x="12" width="12" height="16" fill="#FFFFFF" />
      <circle cx="12.15" cy="8" r="3.25" fill="#D21034" />
      <circle cx="13.25" cy="7.35" r="2.65" fill="#FFFFFF" />
      <path
        d="m14.25 6.35.55 1.14 1.24.18-.9.87.21 1.24-1.1-.58-1.1.58.21-1.24-.9-.87 1.24-.18.55-1.14Z"
        fill="#D21034"
      />
    </>
  ),
  TN: (
    <>
      <rect width="24" height="16" fill="#E70013" />
      <circle cx="12" cy="8" r="4.25" fill="#FFFFFF" />
      <circle cx="11.45" cy="8" r="2.45" fill="#E70013" />
      <circle cx="12.25" cy="7.55" r="1.95" fill="#FFFFFF" />
      <path
        d="m13.8 6.1.48 1 .99.14-.72.7.17 1-.92-.48-.88.48.17-1-.72-.7.99-.14.44-1Z"
        fill="#E70013"
      />
    </>
  ),
  CA: (
    <>
      <rect width="5.5" height="16" fill="#D52B1E" />
      <rect x="5.5" width="13" height="16" fill="#FFFFFF" />
      <rect x="18.5" width="5.5" height="16" fill="#D52B1E" />
      <path
        d="m12 2.7.7 1.55 1.35-.72-.43 2.16 1.45-.12-1.05 1.35 1.05.56-2.42 2 .38 1.35-1.03-.22-1.03.22.38-1.35-2.42-2 1.05-.56-1.05-1.35 1.45.12-.43-2.16 1.35.72L12 2.7Z"
        fill="#D52B1E"
      />
      <rect x="11.7" y="10.3" width="0.6" height="2.7" fill="#D52B1E" />
    </>
  ),
  BE: (
    <>
      <rect width="8" height="16" fill="#1A171B" />
      <rect x="8" width="8" height="16" fill="#FFD90C" />
      <rect x="16" width="8" height="16" fill="#EF3340" />
    </>
  ),
  CH: (
    <>
      <rect width="24" height="16" fill="#D52B1E" />
      <path d="M10.25 3.5h3.5v2.75H17v3.5h-3.25v2.75h-3.5V9.75H7v-3.5h3.25V3.5Z" fill="#FFFFFF" />
    </>
  ),
  ES: (
    <>
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
    </>
  ),
  DE: (
    <>
      <rect width="24" height="5.34" fill="#000000" />
      <rect y="5.33" width="24" height="5.34" fill="#DD0000" />
      <rect y="10.66" width="24" height="5.34" fill="#FFCE00" />
    </>
  ),
  IT: (
    <>
      <rect width="8" height="16" fill="#009246" />
      <rect x="8" width="8" height="16" fill="#FFFFFF" />
      <rect x="16" width="8" height="16" fill="#CE2B37" />
    </>
  ),
  GB: (
    <>
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#FFFFFF" strokeWidth="3.5" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M12 0v16M0 8h24" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="2.8" />
    </>
  ),
  US: (
    <>
      <rect width="24" height="16" fill="#FFFFFF" />
      {[0, 2.46, 4.92, 7.38, 9.84, 12.3, 14.76].map((y) => (
        <rect key={y} y={y} width="24" height="1.24" fill="#B22234" />
      ))}
      <rect width="10.5" height="8.7" fill="#3C3B6E" />
      {[1.2, 3.1, 5, 6.9].flatMap((y) =>
        [1.25, 3.25, 5.25, 7.25, 9.25].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.32" fill="#FFFFFF" />
        ))
      )}
    </>
  ),
};

function CountryFlag({ code, label }: { code: string; label: string }) {
  const artwork = COUNTRY_FLAG_ART[code];

  if (!artwork) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-[14px] w-[20px] shrink-0 items-center justify-center rounded-[2px] border border-black/10 bg-[#f2f0ec] text-[9px] text-[#777078]"
        data-country-code={code}
      >
        &#9678;
      </span>
    );
  }

  return (
    <span
      aria-label={`Drapeau ${label}`}
      className="inline-flex h-[14px] w-[20px] shrink-0 overflow-hidden rounded-[2px] border border-black/10 shadow-[0_1px_2px_rgba(45,35,48,0.08)]"
      data-country-code={code}
      role="img"
    >
      <svg
        aria-hidden="true"
        className="h-full w-full"
        viewBox="0 0 24 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        {artwork}
      </svg>
    </span>
  );
}

const OBJECTIVE_META: Record<UserObjective, { label: string; className: string }> = {
  cycle_menstruel: { label: 'Suivi du cycle', className: 'bg-[#eee8f3] text-[#6c587c]' },
  ttc: { label: 'Essai de conception', className: 'bg-[#f6eadf] text-[#9a6742]' },
  contraception: { label: 'Contraception', className: 'bg-[#e8eef5] text-[#526d89]' },
  sopk: { label: 'SOPK / cycles irréguliers', className: 'bg-[#eee8f3] text-[#6c587c]' },
  grossesse: { label: 'Grossesse', className: 'bg-[#f6eadf] text-[#9a6742]' },
  post_partum: { label: 'Post-partum', className: 'bg-[#e8f0ed] text-[#527468]' },
  fausse_couche: { label: 'Après fausse couche', className: 'bg-[#e8eef5] text-[#526d89]' },
  menopause: { label: 'Périménopause / ménopause', className: 'bg-[#f1ece2] text-[#856d43]' },
};

const STATUS_META: Record<UserStatus, { label: string; className: string; dot: string }> = {
  active: {
    label: 'Compte actif',
    className: 'border-[#d8ebe2] bg-[#edf7f2] text-[#367b60]',
    dot: 'bg-[#4c9a78]',
  },
  pending_verification: {
    label: 'En attente',
    className: 'border-[#e3dfea] bg-[#f3f0f5] text-[#73677c]',
    dot: 'bg-[#9a8aa5]',
  },
  disabled: {
    label: 'Désactivé',
    className: 'border-[#e5e3e5] bg-[#f5f4f5] text-[#777178]',
    dot: 'bg-[#aaa4ab]',
  },
  deletion_pending: {
    label: 'Suppression demandée',
    className: 'border-[#eadfcf] bg-[#faf3e8] text-[#927149]',
    dot: 'bg-[#c79a59]',
  },
  deleted: {
    label: 'Supprimé',
    className: 'border-[#efddd8] bg-[#fbefec] text-[#a25f55]',
    dot: 'bg-[#c77b70]',
  },
  inactive: {
    label: 'Inactif',
    className: 'border-[#e5e3e5] bg-[#f5f4f5] text-[#777178]',
    dot: 'bg-[#aaa4ab]',
  },
  suspended: {
    label: 'Suspendu',
    className: 'border-[#f0ddd9] bg-[#fbefec] text-[#a25f55]',
    dot: 'bg-[#c77b70]',
  },
};

const AVATAR_COLORS = [
  'bg-[#e8dfec] text-[#665173]',
  'bg-[#e4ece9] text-[#4e7065]',
  'bg-[#efe5dc] text-[#8a6244]',
  'bg-[#e3e8f0] text-[#536985]',
  'bg-[#eee8dc] text-[#7e6a46]',
];

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDate(date?: string) {
  return date ? dateFormatter.format(new Date(date)) : '—';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getAccountType(user: ManagedUser) {
  return user.isAnonymous
    ? { key: 'anonymous' as const, label: 'Compte anonyme' }
    : { key: 'registered' as const, label: 'Compte inscrit' };
}

function getPremiumState(user: ManagedUser): Exclude<PremiumFilter, 'all'> {
  if (user.plan === 'FREE' || !user.premiumExpiresAt) return 'none';
  return new Date(user.premiumExpiresAt).getTime() < Date.now() ? 'expired' : 'active';
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr');
}

function StatusBadge({ status }: { status: UserStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${meta.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function ObjectiveBadge({ objective }: { objective: UserObjective }) {
  const meta = OBJECTIVE_META[objective];
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function TrackingBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        active ? 'bg-[#edf7f2] text-[#367b60]' : 'bg-[#f2f0f2] text-[#7f7780]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#4c9a78]' : 'bg-[#aaa4ab]'}`} />
      {active ? 'Actif' : 'Inactif'}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-xl border border-border bg-[#f8f6f8] px-3 pr-8 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          {children}
        </select>
        <ChevronDown
          size={13}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </span>
    </label>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="group inline-flex items-center gap-1.5 whitespace-nowrap text-left transition-colors hover:text-foreground"
      aria-label={`Trier par ${label}`}
    >
      {label}
      {active ? (
        direction === 'asc' ? (
          <ArrowUp size={12} className="text-primary" />
        ) : (
          <ArrowDown size={12} className="text-primary" />
        )
      ) : (
        <ArrowUpDown
          size={12}
          className="text-muted-foreground/55 transition-colors group-hover:text-muted-foreground"
        />
      )}
    </button>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#2b2232]/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
        className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-border bg-[#fcfaf7] shadow-modal"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2
              id="user-modal-title"
              className="font-display text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
            aria-label="Fermer"
          >
            <X size={17} />
          </button>
        </header>
        {children}
      </motion.section>
    </motion.div>
  );
}

function UserDetails({ user }: { user: ManagedUser }) {
  const details = [
    ['E-mail', user.email ?? '—'],
    ['Identifiant', user.displayId],
    ['Pays', `${COUNTRY_META[user.country].flag} ${COUNTRY_META[user.country].label}`],
    ['Inscription', formatDate(user.createdAt)],
    ['Statut', STATUS_META[user.status].label],
    ['Type de compte', getAccountType(user).label],
    ['Objectif actuel', OBJECTIVE_META[user.objective].label],
    ['Repères spirituels', user.spiritualMode ? 'Activés' : 'Désactivés'],
    ['Dernière activité', formatDate(user.lastActiveAt)],
    ['Échéance premium', formatDate(user.premiumExpiresAt)],
    ['Suivi', user.notificationOptIn ? 'Actif' : 'Inactif'],
  ];

  return (
    <div className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${AVATAR_COLORS[user.name.length % AVATAR_COLORS.length]}`}
        >
          {getInitials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[#f5f2f5] px-3.5 py-3">
            <dt className="text-[9px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 break-words text-xs font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EditUserForm({
  user,
  onCancel,
  onSave,
}: {
  user: ManagedUser;
  onCancel: () => void;
  onSave: (
    values: Pick<ManagedUser, 'name' | 'status' | 'objective' | 'plan' | 'billingCycle'>
  ) => void;
}) {
  const [name, setName] = useState(user.name);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [objective, setObjective] = useState<UserObjective>(user.objective);
  const [plan, setPlan] = useState(user.plan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    user.billingCycle ?? 'monthly'
  );

  return (
    <form
      className="space-y-4 p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          name: name.trim(),
          status,
          objective,
          plan,
          billingCycle: plan === 'PREMIUM' ? billingCycle : undefined,
        });
      }}
    >
      <div className="rounded-xl border border-[#e6dfd0] bg-[#fbf6eb] px-3.5 py-3 text-[11px] leading-relaxed text-[#806b48]">
        Aucun service de modification des comptes n’est connecté. Les champs sont consultables, mais
        aucune mise à jour ne sera simulée localement.
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-foreground">Nom complet</span>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <FilterSelect
          label="Statut"
          value={status}
          onChange={(value) => setStatus(value as UserStatus)}
        >
          {Object.entries(STATUS_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Objectif actuel"
          value={objective}
          onChange={(value) => setObjective(value as UserObjective)}
        >
          {Object.entries(OBJECTIVE_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Type de compte"
          value={plan}
          onChange={(value) => setPlan(value as ManagedUser['plan'])}
        >
          <option value="FREE">Gratuit</option>
          <option value="PREMIUM">Premium</option>
        </FilterSelect>
        <FilterSelect
          label="Facturation"
          value={billingCycle}
          onChange={(value) => setBillingCycle(value as 'monthly' | 'annual')}
        >
          <option value="monthly">Mensuelle</option>
          <option value="annual">Annuelle</option>
        </FilterSelect>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary h-10">
          Annuler
        </button>
        <button type="submit" className="btn-primary h-10">
          Enregistrer localement
        </button>
      </div>
    </form>
  );
}

export default function UsersContent() {
  const router = useRouter();
  const [users] = useState<ManagedUser[]>(() => mockUsers.map((user) => ({ ...user })));
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    if (!actionMenu) return;
    const closeMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-actions]')) setActionMenu(null);
    };
    const closeOnViewportChange = () => setActionMenu(null);
    document.addEventListener('mousedown', closeMenu);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnViewportChange, true);
    };
  }, [actionMenu]);

  const availableCountries = useMemo(
    () =>
      Array.from(new Set(users.map((user) => user.country))).sort((a, b) =>
        COUNTRY_META[a].label.localeCompare(COUNTRY_META[b].label, 'fr')
      ),
    [users]
  );

  const availableObjectives = useMemo(
    () =>
      Array.from(new Set(users.map((user) => user.objective))).sort((a, b) =>
        OBJECTIVE_META[a].label.localeCompare(OBJECTIVE_META[b].label, 'fr')
      ),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = normalize(filters.search.trim());
    return users.filter((user) => {
      const account = getAccountType(user).key;
      const premium = getPremiumState(user);
      const matchesSearch = !query || normalize(`${user.name} ${user.email ?? ''}`).includes(query);
      return (
        matchesSearch &&
        (filters.country === 'all' || user.country === filters.country) &&
        (filters.status === 'all' || user.status === filters.status) &&
        (filters.objective === 'all' || user.objective === filters.objective) &&
        (filters.account === 'all' || account === filters.account) &&
        (filters.premium === 'all' || premium === filters.premium)
      );
    });
  }, [filters, users]);

  const sortedUsers = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const accountOrder: Record<ReturnType<typeof getAccountType>['key'], number> = {
      registered: 0,
      anonymous: 1,
    };
    return [...filteredUsers].sort((first, second) => {
      if (sortKey === 'name') return first.name.localeCompare(second.name, 'fr') * direction;
      if (sortKey === 'accountType') {
        return (
          (accountOrder[getAccountType(first).key] - accountOrder[getAccountType(second).key]) *
          direction
        );
      }
      return (new Date(first[sortKey]).getTime() - new Date(second[sortKey]).getTime()) * direction;
    });
  }, [filteredUsers, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const visibleUsers = sortedUsers.slice(pageStart, pageStart + rowsPerPage);
  const selectedUser = modal ? users.find((user) => user.id === modal.userId) : undefined;
  const hasActiveFilters = Object.entries(filters).some(([key, value]) =>
    key === 'search' ? Boolean(value) : value !== 'all'
  );

  const updateFilter = <Key extends keyof Filters>(key: Key, value: Filters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const openActions = (event: React.MouseEvent<HTMLButtonElement>, userId: string) => {
    event.stopPropagation();
    if (actionMenu?.userId === userId) {
      setActionMenu(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 278;
    const top =
      rect.bottom + menuHeight > window.innerHeight
        ? Math.max(12, rect.top - menuHeight)
        : rect.bottom + 6;
    const left = Math.max(12, Math.min(rect.right - 220, window.innerWidth - 232));
    setActionMenu({ userId, top, left });
  };

  const exportCsv = () => {
    const headers = [
      'Nom',
      'E-mail',
      'Date d’inscription',
      'Type d’abonnement',
      'Pays',
      'Statut du compte',
      'Objectif actuel',
      'Dernière activité',
      'Échéance premium',
      'Statut premium',
      'Suivi',
    ];
    const rows = filteredUsers.map((user) => [
      user.name,
      user.email ?? '',
      formatDate(user.createdAt),
      getAccountType(user).label,
      COUNTRY_META[user.country].label,
      STATUS_META[user.status].label,
      OBJECTIVE_META[user.objective].label,
      formatDate(user.lastActiveAt),
      formatDate(user.premiumExpiresAt),
      getPremiumState(user) === 'active'
        ? 'Actif'
        : getPremiumState(user) === 'expired'
          ? 'Expiré'
          : 'Aucun',
      user.notificationOptIn ? 'Actif' : 'Inactif',
    ]);
    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `awa-utilisatrices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(
      `${filteredUsers.length} utilisatrice${filteredUsers.length > 1 ? 's' : ''} exportée${filteredUsers.length > 1 ? 's' : ''}`
    );
  };

  const applyConfirmation = (_user: ManagedUser, _action: ConfirmAction) => {
    toast.error(
      'Aucun service de gestion des comptes n’est connecté. Aucune modification n’a été appliquée.'
    );
    setModal(null);
    setActionMenu(null);
  };

  const saveUser = (
    values: Pick<ManagedUser, 'name' | 'status' | 'objective' | 'plan' | 'billingCycle'>
  ) => {
    void values;
    toast.error(
      'Aucun service de gestion des comptes n’est connecté. Aucune modification n’a été appliquée.'
    );
    setModal(null);
  };

  const actionUser = actionMenu ? users.find((user) => user.id === actionMenu.userId) : undefined;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Gestion des comptes
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[28px]">
            Utilisatrices
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Gérez les comptes et consultez les informations générales.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced((visible) => !visible)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition-colors ${
              showAdvanced
                ? 'border-primary/25 bg-primary-ghost text-primary'
                : 'border-border bg-white text-foreground hover:bg-muted/60'
            }`}
            aria-expanded={showAdvanced}
            aria-controls="advanced-user-filters"
          >
            <Filter size={15} />
            Filtres avancés
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredUsers.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#655276] px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(81,64,95,0.16)] transition-colors hover:bg-[#584767] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Download size={15} />
            Exporter
          </button>
        </div>
      </div>

      <section
        className="rounded-[18px] border border-border bg-white p-4 shadow-card"
        aria-label="Filtres des utilisatrices"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Recherche
            </span>
            <span className="relative block">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Nom ou email..."
                className="h-10 w-full rounded-xl border border-border bg-[#f8f6f8] pl-10 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </span>
          </label>
          <div className="flex h-10 items-center gap-2 text-xs text-muted-foreground sm:px-2">
            <UsersRound size={15} />
            <span>
              <strong className="font-semibold text-foreground">{filteredUsers.length}</strong>{' '}
              résultat{filteredUsers.length > 1 ? 's' : ''}
            </span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setFilters(INITIAL_FILTERS);
                setPage(1);
              }}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw size={13} /> Réinitialiser
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {showAdvanced && (
            <motion.div
              id="advanced-user-filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                <FilterSelect
                  label="Pays"
                  value={filters.country}
                  onChange={(value) => updateFilter('country', value as Filters['country'])}
                >
                  <option value="all">Tous</option>
                  {availableCountries.map((country) => (
                    <option key={country} value={country}>
                      {COUNTRY_META[country].label}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect
                  label="Statut"
                  value={filters.status}
                  onChange={(value) => updateFilter('status', value as Filters['status'])}
                >
                  <option value="all">Tous</option>
                  {Object.entries(STATUS_META).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect
                  label="Objectif"
                  value={filters.objective}
                  onChange={(value) => updateFilter('objective', value as Filters['objective'])}
                >
                  <option value="all">Tous</option>
                  {availableObjectives.map((objective) => (
                    <option key={objective} value={objective}>
                      {OBJECTIVE_META[objective].label}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect
                  label="Type de compte"
                  value={filters.account}
                  onChange={(value) => updateFilter('account', value as AccountFilter)}
                >
                  <option value="all">Tous</option>
                  <option value="registered">Compte inscrit</option>
                  <option value="anonymous">Compte anonyme</option>
                </FilterSelect>
                <FilterSelect
                  label="Abonnement premium"
                  value={filters.premium}
                  onChange={(value) => updateFilter('premium', value as PremiumFilter)}
                >
                  <option value="all">Tous</option>
                  <option value="active">Actif</option>
                  <option value="expired">Expiré</option>
                  <option value="none">Aucun</option>
                </FilterSelect>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section
        className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white shadow-card"
        aria-label="Liste des utilisatrices"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1420px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#faf8fa] text-[9px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                <th className="w-[230px] px-4 py-3.5">
                  <SortableHeader
                    label="Utilisatrice"
                    sortKey="name"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="w-[120px] px-4 py-3.5">
                  <SortableHeader
                    label="Inscription"
                    sortKey="createdAt"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="w-[145px] px-4 py-3.5">
                  <SortableHeader
                    label="Type de compte"
                    sortKey="accountType"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="w-[120px] px-4 py-3.5">Pays</th>
                <th className="w-[145px] px-4 py-3.5">Statut du compte</th>
                <th className="w-[180px] px-4 py-3.5">Objectif actuel</th>
                <th className="w-[135px] px-4 py-3.5">
                  <SortableHeader
                    label="Dernière activité"
                    sortKey="lastActiveAt"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="w-[145px] px-4 py-3.5">Abonnement premium</th>
                <th className="w-[90px] px-4 py-3.5">Suivi</th>
                <th className="w-[65px] px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {visibleUsers.length ? (
                visibleUsers.map((user) => {
                  const premiumState = getPremiumState(user);
                  return (
                    <tr key={user.id} className="group transition-colors hover:bg-[#fbf9fb]">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${AVATAR_COLORS[user.name.length % AVATAR_COLORS.length]}`}
                          >
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {user.name}
                            </p>
                            <p className="mt-0.5 max-w-[170px] truncate text-[10px] text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-[#655f68]">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${user.isAnonymous ? 'bg-[#f1f0f1] text-[#726d73]' : 'bg-primary-ghost text-primary'}`}
                        >
                          {getAccountType(user).label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[11px] font-medium text-[#5f5962]">
                        <span className="inline-flex items-center gap-2">
                          <CountryFlag
                            code={user.country}
                            label={COUNTRY_META[user.country].label}
                          />
                          <span>{COUNTRY_META[user.country].label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <ObjectiveBadge objective={user.objective} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-[#655f68]">
                        {formatDate(user.lastActiveAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        {premiumState === 'none' ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="whitespace-nowrap">
                            <p className="text-[11px] font-medium text-[#5f5962]">
                              {formatDate(user.premiumExpiresAt)}
                            </p>
                            <p
                              className={`mt-0.5 text-[9px] font-semibold ${premiumState === 'active' ? 'text-[#4d8b70]' : 'text-[#b06c61]'}`}
                            >
                              {premiumState === 'active' ? 'Actif' : 'Expiré'}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <TrackingBadge active={user.notificationOptIn} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={(event) => openActions(event, user.id)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          aria-label={`Actions pour ${user.name}`}
                          aria-haspopup="menu"
                          aria-expanded={actionMenu?.userId === user.id}
                          data-user-actions
                        >
                          <MoreHorizontal size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-ghost text-primary/70">
                      <UsersRound size={21} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      Aucune utilisatrice trouvée
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Modifiez vos filtres pour afficher d&apos;autres résultats.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border bg-[#fcfbfc] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted-foreground">
            Affichage de{' '}
            <strong className="font-semibold text-foreground">
              {sortedUsers.length ? pageStart + 1 : 0}
            </strong>{' '}
            à{' '}
            <strong className="font-semibold text-foreground">
              {Math.min(pageStart + rowsPerPage, sortedUsers.length)}
            </strong>{' '}
            sur <strong className="font-semibold text-foreground">{sortedUsers.length}</strong>{' '}
            résultats
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
              Lignes par page
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-border bg-white px-2 text-[11px] text-foreground outline-none focus:border-primary"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Page précédente"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition-colors ${safePage === pageNumber ? 'bg-primary text-white' : 'border border-border bg-white text-muted-foreground hover:text-foreground'}`}
                  aria-label={`Page ${pageNumber}`}
                  aria-current={safePage === pageNumber ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Page suivante"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </footer>
      </section>

      <AnimatePresence>
        {actionMenu && actionUser && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.13 }}
            role="menu"
            aria-label={`Actions pour ${actionUser.name}`}
            data-user-actions
            className="fixed z-[75] w-[220px] overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-dropdown"
            style={{ top: actionMenu.top, left: actionMenu.left }}
          >
            {[
              {
                label: 'Voir les détails',
                icon: Eye,
                action: () => router.push(`/admin/utilisatrices/${actionUser.id}`),
              },
              {
                label: 'Modifier',
                icon: Pencil,
                action: () => router.push(`/admin/utilisatrices/${actionUser.id}?action=edit`),
              },
              {
                label: "Voir l'abonnement",
                icon: CreditCard,
                action: () => router.push(`/admin/utilisatrices/${actionUser.id}?tab=subscription`),
              },
              {
                label: 'Suspendre',
                icon: ShieldBan,
                action: () => router.push(`/admin/utilisatrices/${actionUser.id}?action=suspend`),
              },
              {
                label: 'Désactiver le compte',
                icon: UserRoundX,
                action: () => router.push(`/admin/utilisatrices/${actionUser.id}?action=disable`),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.action();
                    setActionMenu(null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-medium text-[#5e5762] transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                router.push(`/admin/utilisatrices/${actionUser.id}?action=delete`);
                setActionMenu(null);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-medium text-danger transition-colors hover:bg-danger-bg"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && selectedUser && modal.type === 'details' && (
          <ModalShell
            title="Profil de l’utilisatrice"
            subtitle="Informations générales du compte"
            onClose={() => setModal(null)}
          >
            <UserDetails user={selectedUser} />
          </ModalShell>
        )}
        {modal && selectedUser && modal.type === 'edit' && (
          <ModalShell
            title="Modifier l’utilisatrice"
            subtitle={selectedUser.email}
            onClose={() => setModal(null)}
          >
            <EditUserForm
              key={selectedUser.id}
              user={selectedUser}
              onCancel={() => setModal(null)}
              onSave={saveUser}
            />
          </ModalShell>
        )}
        {modal && selectedUser && modal.type === 'subscription' && (
          <ModalShell
            title="Abonnement"
            subtitle={selectedUser.name}
            onClose={() => setModal(null)}
          >
            <div className="space-y-3 p-5 sm:p-6">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-ghost text-primary">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {getAccountType(selectedUser).label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {getPremiumState(selectedUser) === 'none'
                      ? 'Aucun abonnement premium'
                      : `Échéance : ${formatDate(selectedUser.premiumExpiresAt)}`}
                  </p>
                </div>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f5f2f5] p-3">
                  <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    Statut
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-foreground">
                    {getPremiumState(selectedUser) === 'active'
                      ? 'Actif'
                      : getPremiumState(selectedUser) === 'expired'
                        ? 'Expiré'
                        : 'Aucun'}
                  </dd>
                </div>
                <div className="rounded-xl bg-[#f5f2f5] p-3">
                  <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    Fournisseur
                  </dt>
                  <dd className="mt-1 text-xs font-semibold capitalize text-foreground">
                    {selectedUser.subscriptionProvider ?? '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </ModalShell>
        )}
        {modal && selectedUser && modal.type === 'reset' && (
          <ModalShell
            title="Réinitialiser le mot de passe"
            subtitle={selectedUser.email}
            onClose={() => setModal(null)}
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3 rounded-xl border border-[#e6dfd0] bg-[#fbf6eb] p-4">
                <KeyRound size={18} className="mt-0.5 flex-shrink-0 text-[#9a7b49]" />
                <div>
                  <p className="text-xs font-semibold text-[#6f5d40]">Connexion backend requise</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#806f55]">
                    Aucun service d’authentification utilisateur n’est configuré dans ce projet.
                    Aucune réinitialisation n’a été envoyée.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary h-10">
                  Fermer
                </button>
              </div>
            </div>
          </ModalShell>
        )}
        {modal && selectedUser && modal.type === 'confirm' && (
          <ModalShell
            title={
              modal.action === 'delete'
                ? 'Supprimer l’utilisatrice ?'
                : modal.action === 'suspend'
                  ? 'Suspendre le compte ?'
                  : selectedUser.status === 'active'
                    ? 'Désactiver le compte ?'
                    : 'Activer le compte ?'
            }
            subtitle={selectedUser.name}
            onClose={() => setModal(null)}
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3 rounded-xl border border-[#efddd8] bg-[#fbefec] p-4">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-[#b46b60]" />
                <div>
                  <p className="text-xs font-semibold text-[#84554e]">Confirmation requise</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#8d6761]">
                    {modal.action === 'delete'
                      ? 'La suppression nécessite un service backend sécurisé.'
                      : 'La modification du statut nécessite une confirmation serveur.'}{' '}
                    Aucun backend n’est configuré : aucune action ne sera simulée localement.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary h-10">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => applyConfirmation(selectedUser, modal.action)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-white ${modal.action === 'delete' || modal.action === 'suspend' ? 'bg-[#a65f58] hover:bg-[#92514b]' : 'bg-primary hover:bg-primary-light'}`}
                >
                  {modal.action === 'delete' ? <Trash2 size={14} /> : <Check size={14} />}
                  {modal.action === 'delete' ? 'Confirmer la suppression' : 'Confirmer'}
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
