'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Eye,
  Filter,
  Pencil,
  Power,
  ShieldCheck,
  Trash2,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SecurityAdministrator, SecurityRole } from '@/data/security';
import { normalizeSecuritySearch } from '@/data/security';
import {
  deleteAdministrator,
  saveAdministrator,
  useSecuritySession,
} from '@/stores/securitySessionStore';
import {
  ActionButton,
  ConfirmDialog,
  DemoNotice,
  FieldLabel,
  inputClassName,
  Modal,
  PageHeader,
  Pagination,
  RowActions,
  SearchInput,
  SelectField,
} from '@/app/content/components/ContentUI';

type AdministratorDialog =
  | { type: 'create' }
  | { type: 'details' | 'edit' | 'delete'; administrator: SecurityAdministrator }
  | null;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RoleBadge({ role }: { role?: SecurityRole }) {
  const isSuperAdmin = role?.id === 'super_admin';
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        isSuperAdmin ? 'bg-[#f1eafb] text-[#7653b5]' : 'bg-[#edf1fb] text-[#5670ad]'
      }`}
    >
      {isSuperAdmin && <ShieldCheck size={11} aria-hidden="true" />}
      {role?.name ?? 'Rôle inconnu'}
    </span>
  );
}

function AdminStatusBadge({ status }: { status: SecurityAdministrator['status'] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        status === 'active' ? 'bg-success-bg text-success' : 'bg-muted text-muted-foreground'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'active' ? 'bg-success' : 'bg-muted-foreground'
        }`}
      />
      {status === 'active' ? 'Actif' : 'Inactif'}
    </span>
  );
}

function TwoFactorBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        enabled ? 'bg-success-bg text-success' : 'bg-muted text-muted-foreground'
      }`}
    >
      {enabled ? '2FA activée' : '2FA désactivée'}
    </span>
  );
}

function AdministratorForm({
  administrator,
  roles,
  administrators,
  onCancel,
  onSave,
}: {
  administrator?: SecurityAdministrator;
  roles: SecurityRole[];
  administrators: SecurityAdministrator[];
  onCancel: () => void;
  onSave: (administrator: SecurityAdministrator) => void;
}) {
  const [name, setName] = useState(administrator?.name ?? '');
  const [email, setEmail] = useState(administrator?.email ?? '');
  const [roleId, setRoleId] = useState(
    administrator?.roleId ?? roles.find((role) => role.active && !role.system)?.id ?? ''
  );
  const [status, setStatus] = useState<SecurityAdministrator['status']>(
    administrator?.status ?? 'active'
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    administrator?.twoFactorEnabled ?? false
  );
  const [error, setError] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLocaleLowerCase('fr-FR');
    if (!emailPattern.test(cleanEmail)) {
      setError('Saisissez une adresse e-mail valide.');
      return;
    }
    if (
      administrators.some(
        (item) => item.id !== administrator?.id && item.email.toLowerCase() === cleanEmail
      )
    ) {
      setError('Cette adresse e-mail est déjà utilisée.');
      return;
    }
    const activeSuperAdmins = administrators.filter(
      (item) => item.roleId === 'super_admin' && item.status === 'active'
    );
    const isLastActiveSuperAdmin =
      administrator?.roleId === 'super_admin' &&
      administrator.status === 'active' &&
      activeSuperAdmins.length === 1;
    if (isLastActiveSuperAdmin && (roleId !== 'super_admin' || status !== 'active')) {
      setError('Le dernier Super Admin actif ne peut pas être rétrogradé ni désactivé.');
      return;
    }
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
    onSave({
      id: administrator?.id ?? `admin-session-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      roleId,
      status,
      twoFactorEnabled,
      lastActivityAt: administrator?.lastActivityAt ?? new Date().toISOString(),
      avatarInitials: initials || 'A',
    });
  };

  return (
    <form className="space-y-5 p-5 sm:p-6" onSubmit={submit}>
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <FieldLabel>Nom complet</FieldLabel>
          <input
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label>
          <FieldLabel>Adresse e-mail</FieldLabel>
          <input
            required
            type="email"
            maxLength={120}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            className={inputClassName}
          />
        </label>
        <label>
          <FieldLabel>Rôle</FieldLabel>
          <select
            required
            value={roleId}
            onChange={(event) => {
              setRoleId(event.target.value);
              setError('');
            }}
            className={inputClassName}
          >
            {roles
              .filter((role) => role.active || role.id === administrator?.roleId)
              .map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          <FieldLabel>Statut</FieldLabel>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as SecurityAdministrator['status']);
              setError('');
            }}
            className={inputClassName}
          >
            <option value="active">Actif</option>
            <option value="disabled">Inactif</option>
          </select>
        </label>
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={twoFactorEnabled}
          onChange={(event) => setTwoFactorEnabled(event.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span>
          <span className="block text-sm font-medium text-foreground">
            Authentification à deux facteurs
          </span>
          <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
            Ajoute une couche de sécurité supplémentaire à ce compte administrateur.
          </span>
        </span>
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/20 bg-danger-bg px-3 py-2 text-xs text-danger"
        >
          {error}
        </p>
      )}
      <p className="text-[10px] leading-5 text-muted-foreground">
        Aucun envoi d’invitation n’est simulé : le projet ne dispose pas encore de workflow e-mail
        pour les comptes administrateurs.
      </p>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary h-10 text-xs">
          Annuler
        </button>
        <button type="submit" className="btn-primary h-10 text-xs">
          {administrator ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}

function AdministratorDetails({
  administrator,
  role,
  onClose,
}: {
  administrator: SecurityAdministrator;
  role?: SecurityRole;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
          {administrator.avatarInitials}
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {administrator.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{administrator.email}</p>
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#f5f2f5] p-3">
          <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">Rôle</dt>
          <dd className="mt-2">
            <RoleBadge role={role} />
          </dd>
        </div>
        <div className="rounded-xl bg-[#f5f2f5] p-3">
          <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">Statut</dt>
          <dd className="mt-2">
            <AdminStatusBadge status={administrator.status} />
          </dd>
        </div>
        <div className="rounded-xl bg-[#f5f2f5] p-3">
          <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Authentification à deux facteurs
          </dt>
          <dd className="mt-2">
            <TwoFactorBadge enabled={administrator.twoFactorEnabled} />
          </dd>
        </div>
        <div className="rounded-xl bg-[#f5f2f5] p-3 sm:col-span-2">
          <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Dernière connexion
          </dt>
          <dd className="mt-1 text-xs font-semibold text-foreground">
            {formatLastActivity(administrator.lastActivityAt)}
          </dd>
        </div>
      </dl>
      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="btn-secondary h-10 text-xs">
          Fermer
        </button>
      </div>
    </div>
  );
}

function formatLastActivity(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AdministratorsContent() {
  const { administrators, roles } = useSecuritySession();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SecurityAdministrator['status']>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [dialog, setDialog] = useState<AdministratorDialog>(null);

  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);
  const filtered = useMemo(() => {
    const query = normalizeSecuritySearch(search);
    return administrators.filter((administrator) => {
      const role = roleById.get(administrator.roleId);
      return (
        normalizeSecuritySearch(
          `${administrator.name} ${administrator.email} ${role?.name ?? ''}`
        ).includes(query) &&
        (roleFilter === 'all' || administrator.roleId === roleFilter) &&
        (statusFilter === 'all' || administrator.status === statusFilter)
      );
    });
  }, [administrators, roleById, roleFilter, search, statusFilter]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  useEffect(() => setPage(1), [roleFilter, search, statusFilter]);

  const persist = (administrator: SecurityAdministrator) => {
    const exists = administrators.some((item) => item.id === administrator.id);
    saveAdministrator(administrator);
    toast.success(exists ? 'Administrateur mis à jour.' : 'Administrateur ajouté à cette session.');
    setDialog(null);
  };

  const toggle = (administrator: SecurityAdministrator) => {
    const activeSuperAdmins = administrators.filter(
      (item) => item.roleId === 'super_admin' && item.status === 'active'
    );
    if (
      administrator.roleId === 'super_admin' &&
      administrator.status === 'active' &&
      activeSuperAdmins.length === 1
    ) {
      toast.error('Le dernier Super Admin actif ne peut pas être désactivé.');
      return;
    }
    saveAdministrator({
      ...administrator,
      status: administrator.status === 'active' ? 'disabled' : 'active',
    });
    toast.success(
      administrator.status === 'active' ? 'Administrateur désactivé.' : 'Administrateur activé.'
    );
  };

  const confirmDelete = (administrator: SecurityAdministrator) => {
    const superAdminCount = administrators.filter((item) => item.roleId === 'super_admin').length;
    if (administrator.roleId === 'super_admin' && superAdminCount === 1) {
      toast.error('Le dernier Super Admin ne peut pas être supprimé.');
      setDialog(null);
      return;
    }
    deleteAdministrator(administrator.id);
    toast.success('Administrateur supprimé de cette session.');
    setDialog(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Sécurité"
        title="Administrateurs"
        subtitle="Gérez les comptes administrateurs de l’application."
        actionLabel="Ajouter un administrateur"
        onAction={() => setDialog({ type: 'create' })}
      />
      <DemoNotice />

      <section className="rounded-[20px] border border-border bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un administrateur..."
          />
          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            aria-expanded={filtersOpen}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition-colors ${
              filtersOpen || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'border-primary/25 bg-primary-ghost text-primary'
                : 'border-border bg-white text-foreground hover:bg-muted'
            }`}
          >
            <Filter size={14} /> Filtrer
          </button>
        </div>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border"
            >
              <div className="flex flex-col gap-3 bg-[#fbf9fb] p-4 sm:flex-row sm:items-end">
                <SelectField compact label="Rôle" value={roleFilter} onChange={setRoleFilter}>
                  <option value="all">Tous les rôles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  compact
                  label="Statut"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as typeof statusFilter)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="disabled">Inactif</option>
                </SelectField>
                {(roleFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setRoleFilter('all');
                      setStatusFilter('all');
                    }}
                    className="h-10 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#faf8fa] text-[9px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                <th className="px-4 py-3.5">Nom</th>
                <th className="px-4 py-3.5">E-mail</th>
                <th className="px-4 py-3.5">Rôle</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="px-4 py-3.5">Dernière connexion</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {visible.map((administrator) => (
                <tr key={administrator.id} className="transition-colors hover:bg-[#fbf9fb]">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                        {administrator.avatarInitials}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {administrator.name}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-muted-foreground">
                    {administrator.email}
                  </td>
                  <td className="px-4 py-3.5">
                    <RoleBadge role={roleById.get(administrator.roleId)} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col items-start gap-1">
                      <AdminStatusBadge status={administrator.status} />
                      <TwoFactorBadge enabled={administrator.twoFactorEnabled} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[10px] text-muted-foreground">
                    {formatLastActivity(administrator.lastActivityAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <RowActions label={`Actions pour ${administrator.name}`}>
                      <ActionButton onClick={() => setDialog({ type: 'details', administrator })}>
                        <Eye size={14} /> Voir les détails
                      </ActionButton>
                      <ActionButton onClick={() => setDialog({ type: 'edit', administrator })}>
                        <Pencil size={14} /> Modifier
                      </ActionButton>
                      <ActionButton onClick={() => toggle(administrator)}>
                        {administrator.status === 'active' ? (
                          <UserRoundX size={14} />
                        ) : (
                          <Power size={14} />
                        )}
                        {administrator.status === 'active' ? 'Désactiver' : 'Activer'}
                      </ActionButton>
                      <ActionButton
                        danger
                        onClick={() => setDialog({ type: 'delete', administrator })}
                      >
                        <Trash2 size={14} /> Supprimer
                      </ActionButton>
                    </RowActions>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-ghost text-primary/70">
                      <UsersRound size={21} />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      Aucun administrateur trouvé
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Modifiez la recherche ou les filtres.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safePage}
          total={filtered.length}
          pageSize={pageSize}
          pageSizes={[5, 10, 25]}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>

      <AnimatePresence>
        {dialog?.type === 'create' && (
          <Modal
            title="Ajouter un administrateur"
            subtitle="Créer un accès à l’administration"
            onClose={() => setDialog(null)}
          >
            <AdministratorForm
              roles={roles}
              administrators={administrators}
              onCancel={() => setDialog(null)}
              onSave={persist}
            />
          </Modal>
        )}
        {dialog?.type === 'edit' && (
          <Modal
            title="Modifier l’administrateur"
            subtitle={dialog.administrator.email}
            onClose={() => setDialog(null)}
          >
            <AdministratorForm
              key={dialog.administrator.id}
              administrator={dialog.administrator}
              roles={roles}
              administrators={administrators}
              onCancel={() => setDialog(null)}
              onSave={persist}
            />
          </Modal>
        )}
        {dialog?.type === 'details' && (
          <Modal
            title="Détails de l’administrateur"
            subtitle={dialog.administrator.email}
            onClose={() => setDialog(null)}
          >
            <AdministratorDetails
              administrator={dialog.administrator}
              role={roleById.get(dialog.administrator.roleId)}
              onClose={() => setDialog(null)}
            />
          </Modal>
        )}
        {dialog?.type === 'delete' && (
          <ConfirmDialog
            title="Supprimer cet administrateur ?"
            message={`« ${dialog.administrator.name} » sera retiré de cette session. Le dernier Super Admin est protégé.`}
            confirmLabel="Supprimer"
            onCancel={() => setDialog(null)}
            onConfirm={() => confirmDelete(dialog.administrator)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
