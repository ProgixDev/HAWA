import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Bell,
  CreditCard,
  Database,
  Languages,
  MonitorSmartphone,
  MoonStar,
  ShieldCheck,
  Target,
  UserRound,
} from 'lucide-react';
import type { UserDetailsRecord } from '@/services/users';
import {
  COUNTRY_LABELS,
  OBJECTIVE_LABELS,
  USER_STATUS_LABELS,
  formatUserDate,
  getAccountTypeLabel,
  getPlanLabel,
} from '@/components/users/userPresentation';
import CountryFlag from '@/components/users/CountryFlag';

export type UserDetailTab =
  | 'overview'
  | 'account'
  | 'objective'
  | 'subscription'
  | 'preferences'
  | 'devices'
  | 'data'
  | 'activity';

export const USER_DETAIL_TABS: Array<{ value: UserDetailTab; label: string }> = [
  { value: 'overview', label: "Vue d'ensemble" },
  { value: 'account', label: 'Compte' },
  { value: 'objective', label: 'Objectif' },
  { value: 'subscription', label: 'Abonnement' },
  { value: 'preferences', label: 'Préférences' },
  { value: 'devices', label: 'Appareils & sessions' },
  { value: 'data', label: 'Demandes de données' },
  { value: 'activity', label: 'Activité administrative' },
];

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-border bg-white p-5 shadow-card sm:p-6">
      <header className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-ghost text-primary">
          <Icon size={18} strokeWidth={1.7} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

function InfoGrid({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-border/70 bg-[#faf8fa] px-4 py-3.5">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </dt>
          <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
            {value || 'Non renseigné'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function HonestEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-[#faf8fa] px-5 py-10 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1.5 max-w-lg text-[13px] leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function UserOverview({ detail }: { detail: UserDetailsRecord }) {
  const { user } = detail;
  const cards = [
    ['Statut du compte', USER_STATUS_LABELS[user.status], ShieldCheck],
    ['Type de compte', getAccountTypeLabel(user), UserRound],
    ['Abonnement', getPlanLabel(user), CreditCard],
    ['Objectif actuel', OBJECTIVE_LABELS[user.objective], Target],
    ["Date d'inscription", formatUserDate(user.createdAt), Activity],
    ['Dernière activité', formatUserDate(user.lastActiveAt, true), Activity],
    [
      'Pays',
      <span key="country" className="inline-flex items-center gap-2">
        <CountryFlag code={user.country} label={COUNTRY_LABELS[user.country]} />
        {COUNTRY_LABELS[user.country]}
      </span>,
      Languages,
    ],
    ['Repères spirituels', user.spiritualMode ? 'Activés' : 'Désactivés', MoonStar],
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value, Icon]) => (
        <article
          key={label}
          className="rounded-[18px] border border-border bg-white p-4 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-sm font-semibold leading-5 text-foreground">{value}</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-ghost text-primary">
              <Icon size={17} />
            </span>
          </div>
        </article>
      ))}
      <div className="sm:col-span-2 xl:col-span-4">
        <PrivacyNotice />
      </div>
    </div>
  );
}

function PrivacyNotice() {
  return (
    <aside className="flex items-start gap-3 rounded-[18px] border border-[#e3dce7] bg-[#f6f2f7] px-4 py-4 text-[#655672]">
      <ShieldCheck size={18} className="mt-0.5 shrink-0" />
      <p className="text-[13px] leading-5">
        Cette vue est limitée aux données de gestion du compte. Aucun journal intime, suivi
        menstruel détaillé, mesure de fertilité, photo privée ou note médicale n’est exposé.
      </p>
    </aside>
  );
}

export function UserAccountSection({ detail }: { detail: UserDetailsRecord }) {
  const { user } = detail;
  return (
    <SectionCard
      title="Informations du compte"
      description="Métadonnées administratives et identité du compte."
      icon={UserRound}
    >
      <InfoGrid
        items={[
          ['ID utilisateur', user.id],
          ['Identifiant affiché', user.displayId],
          ['Nom', user.name],
          ['E-mail', user.email ?? 'Non renseigné'],
          ['Type de compte', getAccountTypeLabel(user)],
          [
            'Pays',
            <span key="country" className="inline-flex items-center gap-2">
              <CountryFlag code={user.country} label={COUNTRY_LABELS[user.country]} />
              {COUNTRY_LABELS[user.country]}
            </span>,
          ],
          ['Statut', USER_STATUS_LABELS[user.status]],
          ["Date d'inscription", formatUserDate(user.createdAt, true)],
          ['Dernière activité', formatUserDate(user.lastActiveAt, true)],
          ['Créé le', formatUserDate(user.createdAt, true)],
          ['Mis à jour le', 'Non renseigné'],
        ]}
      />
    </SectionCard>
  );
}

export function UserObjectiveSection({ detail }: { detail: UserDetailsRecord }) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="Objectif actuel"
        description="Taxonomie canonique utilisée par l’application AWA."
        icon={Target}
      >
        <p className="rounded-xl bg-primary-ghost px-4 py-4 text-base font-semibold text-primary">
          {OBJECTIVE_LABELS[detail.user.objective]}
        </p>
      </SectionCard>
      <SectionCard
        title="Historique des objectifs"
        description="Les changements d’objectif apparaîtront ici lorsqu’ils seront disponibles."
        icon={Activity}
      >
        {detail.objectiveHistory.length ? (
          <InfoGrid
            items={detail.objectiveHistory.map((item) => [
              OBJECTIVE_LABELS[item.objective],
              `${formatUserDate(item.startedAt)} → ${formatUserDate(item.endedAt)}`,
            ])}
          />
        ) : (
          <HonestEmptyState
            title="Aucun historique disponible"
            description="Le backend actuel ne fournit pas l’historique des objectifs. Aucun parcours n’a été inventé."
          />
        )}
      </SectionCard>
    </div>
  );
}

export function UserSubscriptionSection({ detail }: { detail: UserDetailsRecord }) {
  const { subscription } = detail;
  return (
    <SectionCard
      title="Abonnement"
      description="Informations d’accès disponibles dans la source utilisateur actuelle."
      icon={CreditCard}
    >
      {subscription.status === 'none' ? (
        <HonestEmptyState
          title="Aucun abonnement Premium"
          description="Ce compte utilise actuellement l’offre gratuite."
        />
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-[#e6dfd0] bg-[#fbf6eb] px-4 py-3 text-[12px] leading-5 text-[#806b48]">
            Données de démonstration issues du jeu local. Aucun droit Premium réel n’est créé par
            cette interface.
          </div>
          <InfoGrid
            items={[
              ['Accès', subscription.plan === 'PREMIUM' ? 'Premium' : 'Gratuit'],
              ['Plan', detail.user.billingCycle === 'annual' ? 'Annuel' : 'Mensuel'],
              ['Statut', subscription.status],
              ['Date de début', formatUserDate(subscription.startDate)],
              ['Renouvellement / expiration', formatUserDate(subscription.renewalOrExpirationDate)],
              ['Plateforme', subscription.platform ?? 'Non renseignée'],
              ['Fournisseur', subscription.provider ?? 'Non renseigné'],
              ['Annulation', subscription.cancellationState ?? 'Non renseignée'],
            ]}
          />
        </>
      )}
    </SectionCard>
  );
}

export function UserPreferencesSection({ detail }: { detail: UserDetailsRecord }) {
  const { user } = detail;
  return (
    <SectionCard
      title="Préférences"
      description="Uniquement les préférences générales et non sensibles du compte."
      icon={Bell}
    >
      <InfoGrid
        items={[
          ['Objectif sélectionné', OBJECTIVE_LABELS[user.objective]],
          ['Repères spirituels', user.spiritualMode ? 'Activés' : 'Désactivés'],
          ['Langue', user.language.toUpperCase()],
          ['Unités', 'Non renseigné'],
          ['Notifications', user.notificationOptIn ? 'Activées' : 'Désactivées'],
          ['Notifications discrètes', 'Non renseigné'],
          ['Apparence', 'Non renseigné'],
          ['Onboarding terminé', 'Non renseigné'],
        ]}
      />
    </SectionCard>
  );
}

export function UserDevicesSection({ detail }: { detail: UserDetailsRecord }) {
  return (
    <SectionCard
      title="Appareils & sessions"
      description="Sessions applicatives associées au compte."
      icon={MonitorSmartphone}
    >
      {detail.devices.length ? (
        <InfoGrid
          items={detail.devices.map((device) => [
            device.deviceName,
            `${device.platform} · ${formatUserDate(device.lastActiveAt, true)}`,
          ])}
        />
      ) : (
        <HonestEmptyState
          title="Aucun appareil synchronisé"
          description="Le backend actuel ne collecte ou n’expose aucune donnée d’appareil ou de session."
        />
      )}
    </SectionCard>
  );
}

export function UserDataRequestsSection({ detail }: { detail: UserDetailsRecord }) {
  return (
    <SectionCard
      title="Demandes de données"
      description="Exports, suppressions et demandes de rectification liées au RGPD."
      icon={Database}
    >
      {detail.dataRequests.length ? (
        <InfoGrid
          items={detail.dataRequests.map((request) => [
            request.type,
            `${formatUserDate(request.createdAt)} · ${request.status}`,
          ])}
        />
      ) : (
        <HonestEmptyState
          title="Aucune demande disponible"
          description="Aucune demande RGPD n’est fournie pour cette utilisatrice par la source actuelle."
        />
      )}
      <div className="mt-4 flex justify-end">
        <Link href="/admin/securite/demandes-donnees" className="btn-secondary h-10 text-xs">
          Ouvrir Demandes de données
        </Link>
      </div>
    </SectionCard>
  );
}

export function UserAdminActivitySection({ detail }: { detail: UserDetailsRecord }) {
  return (
    <SectionCard
      title="Activité administrative"
      description="Actions réalisées par les administrateurs sur ce compte."
      icon={Activity}
    >
      {detail.adminActivity.length ? (
        <InfoGrid
          items={detail.adminActivity.map((entry) => [
            entry.action,
            `${entry.adminName} · ${formatUserDate(entry.timestamp, true)}`,
          ])}
        />
      ) : (
        <HonestEmptyState
          title="Aucune activité administrative"
          description="Aucun journal d’audit utilisateur n’est connecté dans ce projet."
        />
      )}
    </SectionCard>
  );
}

export function UserDetailSection({
  tab,
  detail,
}: {
  tab: UserDetailTab;
  detail: UserDetailsRecord;
}) {
  if (tab === 'account') return <UserAccountSection detail={detail} />;
  if (tab === 'objective') return <UserObjectiveSection detail={detail} />;
  if (tab === 'subscription') return <UserSubscriptionSection detail={detail} />;
  if (tab === 'preferences') return <UserPreferencesSection detail={detail} />;
  if (tab === 'devices') return <UserDevicesSection detail={detail} />;
  if (tab === 'data') return <UserDataRequestsSection detail={detail} />;
  if (tab === 'activity') return <UserAdminActivitySection detail={detail} />;
  return <UserOverview detail={detail} />;
}
