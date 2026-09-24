'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Copy,
  CreditCard,
  Crown,
  FileText,
  Headphones,
  MoonStar,
  Pencil,
  Power,
  Shield,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ALL_PERMISSION_KEYS,
  PERMISSION_GROUPS,
  normalizeSecuritySearch,
  type PermissionKey,
  type SecurityRole,
} from '@/data/security';
import { deleteRole, saveRole, useSecuritySession } from '@/stores/securitySessionStore';
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
  textareaClassName,
} from '@/app/content/components/ContentUI';

type RoleDialog = { type: 'create' } | { type: 'edit' | 'delete'; role: SecurityRole } | null;

const ROLE_ICONS = {
  super_admin: Crown,
  content_manager: FileText,
  medical_reviewer: Stethoscope,
  religious_reviewer: MoonStar,
  support_agent: Headphones,
  subscription_manager: CreditCard,
  analytics_viewer: BarChart3,
};

function RoleIcon({ role }: { role: SecurityRole }) {
  const Icon = ROLE_ICONS[role.id as keyof typeof ROLE_ICONS] ?? Shield;
  const isSuperAdmin = role.id === 'super_admin';
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
        isSuperAdmin ? 'bg-[#fff3df] text-[#d58a1f]' : 'bg-primary-ghost text-primary'
      }`}
    >
      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}

function RoleStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        active ? 'bg-success-bg text-success' : 'bg-muted text-muted-foreground'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-success' : 'bg-muted-foreground'}`}
      />
      {active ? 'Actif' : 'Inactif'}
    </span>
  );
}

function RoleForm({
  role,
  roles,
  onCancel,
  onSave,
}: {
  role?: SecurityRole;
  roles: SecurityRole[];
  onCancel: () => void;
  onSave: (role: SecurityRole) => void;
}) {
  const protectedRole = role?.id === 'super_admin';
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [active, setActive] = useState(role?.active ?? true);
  const [selected, setSelected] = useState<PermissionKey[]>(role?.permissions ?? []);
  const [error, setError] = useState('');

  const togglePermission = (key: PermissionKey) => {
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const toggleGroup = (keys: PermissionKey[]) => {
    setSelected((current) => {
      const allSelected = keys.every((key) => current.includes(key));
      return allSelected
        ? current.filter((key) => !keys.includes(key))
        : Array.from(new Set([...current, ...keys]));
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (protectedRole) {
      onCancel();
      return;
    }
    if (
      roles.some(
        (item) =>
          item.id !== role?.id &&
          normalizeSecuritySearch(item.name) === normalizeSecuritySearch(name)
      )
    ) {
      setError('Un rôle porte déjà ce nom.');
      return;
    }
    if (!selected.length) {
      setError('Sélectionnez au moins une permission.');
      return;
    }
    onSave({
      id: role?.id ?? `custom-role-${Date.now()}`,
      technicalRole: role?.technicalRole,
      name: name.trim(),
      description: description.trim(),
      permissions: selected,
      active,
      system: role?.system ?? false,
    });
  };

  const allSelected = ALL_PERMISSION_KEYS.every((key) => selected.includes(key));

  return (
    <form className="space-y-5 p-5 sm:p-6" onSubmit={submit}>
      <DemoNotice />
      {protectedRole && (
        <div className="rounded-xl border border-[#ead7b8] bg-[#fff8ed] px-4 py-3 text-[11px] leading-5 text-[#8b652f]">
          Super Admin est un rôle système protégé. Son nom, son statut et ses permissions complètes
          ne peuvent pas être modifiés.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <FieldLabel>Nom du rôle</FieldLabel>
          <input
            required
            disabled={protectedRole}
            maxLength={60}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            className={inputClassName}
          />
        </label>
        <label>
          <FieldLabel>Statut</FieldLabel>
          <select
            disabled={protectedRole}
            value={active ? 'active' : 'disabled'}
            onChange={(event) => setActive(event.target.value === 'active')}
            className={inputClassName}
          >
            <option value="active">Actif</option>
            <option value="disabled">Inactif</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <FieldLabel>Description</FieldLabel>
          <textarea
            required
            disabled={protectedRole}
            maxLength={160}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={textareaClassName}
          />
        </label>
      </div>

      <fieldset disabled={protectedRole}>
        <legend className="text-xs font-semibold text-foreground">Permissions</legend>
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-primary/15 bg-primary-ghost px-3.5 py-3 text-xs font-semibold text-primary">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? [] : [...ALL_PERMISSION_KEYS])}
            className="rounded border-border text-primary focus:ring-primary/20"
          />
          Tout sélectionner
          <span className="ml-auto text-[10px] font-medium opacity-70">
            {selected.length}/{ALL_PERMISSION_KEYS.length}
          </span>
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {PERMISSION_GROUPS.map((group) => {
            const keys = group.permissions.map((permission) => permission.key);
            const groupSelected = keys.every((key) => selected.includes(key));
            return (
              <section key={group.id} className="rounded-xl border border-border bg-white p-3.5">
                <label className="flex cursor-pointer items-center gap-2 border-b border-border pb-2.5 text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={groupSelected}
                    onChange={() => toggleGroup(keys)}
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  {group.label}
                </label>
                <div className="mt-3 space-y-2.5">
                  {group.permissions.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex cursor-pointer items-start gap-2 text-[11px] leading-4 text-muted-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(permission.key)}
                        onChange={() => togglePermission(permission.key)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/20 bg-danger-bg px-3 py-2 text-xs text-danger"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary h-10 text-xs">
          {protectedRole ? 'Fermer' : 'Annuler'}
        </button>
        {!protectedRole && (
          <button type="submit" className="btn-primary h-10 text-xs">
            {role ? 'Enregistrer' : 'Ajouter le rôle'}
          </button>
        )}
      </div>
    </form>
  );
}

export default function RolesPermissionsContent() {
  const { administrators, roles } = useSecuritySession();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [dialog, setDialog] = useState<RoleDialog>(null);

  const userCount = (roleId: string) =>
    administrators.filter((administrator) => administrator.roleId === roleId).length;

  const filtered = useMemo(() => {
    const query = normalizeSecuritySearch(search);
    return roles.filter((role) =>
      normalizeSecuritySearch(`${role.name} ${role.description}`).includes(query)
    );
  }, [roles, search]);
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  useEffect(() => setPage(1), [search]);

  const persist = (role: SecurityRole) => {
    const exists = roles.some((item) => item.id === role.id);
    saveRole(role);
    toast.success(exists ? 'Rôle mis à jour.' : 'Rôle ajouté à cette session.');
    setDialog(null);
  };

  const duplicate = (role: SecurityRole) => {
    saveRole({
      ...role,
      id: `custom-role-${Date.now()}`,
      technicalRole: undefined,
      name: `${role.name} — copie`,
      active: false,
      system: false,
    });
    toast.success('Rôle dupliqué dans cette session.');
  };

  const toggle = (role: SecurityRole) => {
    if (role.id === 'super_admin') {
      toast.error('Le rôle Super Admin doit rester actif.');
      return;
    }
    if (role.active && userCount(role.id) > 0) {
      toast.error('Réaffectez les administrateurs avant de désactiver ce rôle.');
      return;
    }
    saveRole({ ...role, active: !role.active });
    toast.success(role.active ? 'Rôle désactivé.' : 'Rôle activé.');
  };

  const requestDelete = (role: SecurityRole) => {
    if (role.id === 'super_admin' || role.system) {
      toast.error('Ce rôle système ne peut pas être supprimé.');
      return;
    }
    const count = userCount(role.id);
    if (count > 0) {
      toast.error(`Ce rôle est attribué à ${count} administrateur${count > 1 ? 's' : ''}.`);
      return;
    }
    setDialog({ type: 'delete', role });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Sécurité"
        title="Rôles & permissions"
        subtitle="Définissez les rôles et leurs permissions d’accès."
        actionLabel="Ajouter un rôle"
        onAction={() => setDialog({ type: 'create' })}
      />
      <DemoNotice />

      <section className="rounded-[20px] border border-border bg-white shadow-card">
        <div className="border-b border-border p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un rôle..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#faf8fa] text-[9px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                <th className="px-4 py-3.5">Nom du rôle</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Utilisatrices</th>
                <th className="px-4 py-3.5">Permissions</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {visible.map((role) => {
                const count = userCount(role.id);
                return (
                  <tr key={role.id} className="transition-colors hover:bg-[#fbf9fb]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <RoleIcon role={role} />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{role.name}</p>
                          {role.id === 'super_admin' && (
                            <span className="mt-0.5 text-[9px] font-semibold text-[#b7791f]">
                              Rôle système
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[280px] px-4 py-3.5 text-[11px] leading-5 text-muted-foreground">
                      {role.description}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-foreground">{count}</td>
                    <td className="px-4 py-3.5 text-[11px] font-medium text-[#655f68]">
                      {role.id === 'super_admin'
                        ? 'Toutes'
                        : `${role.permissions.length} permission${role.permissions.length > 1 ? 's' : ''}`}
                    </td>
                    <td className="px-4 py-3.5">
                      <RoleStatusBadge active={role.active} />
                    </td>
                    <td className="px-4 py-3.5">
                      <RowActions label={`Actions pour ${role.name}`}>
                        <ActionButton onClick={() => setDialog({ type: 'edit', role })}>
                          <Pencil size={14} />{' '}
                          {role.id === 'super_admin' ? 'Voir les permissions' : 'Modifier'}
                        </ActionButton>
                        <ActionButton onClick={() => duplicate(role)}>
                          <Copy size={14} /> Dupliquer
                        </ActionButton>
                        <ActionButton onClick={() => toggle(role)}>
                          <Power size={14} /> {role.active ? 'Désactiver' : 'Activer'}
                        </ActionButton>
                        <ActionButton danger onClick={() => requestDelete(role)}>
                          <Trash2 size={14} /> Supprimer
                        </ActionButton>
                      </RowActions>
                    </td>
                  </tr>
                );
              })}
              {!visible.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-ghost text-primary/70">
                      <Shield size={21} />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-foreground">Aucun rôle trouvé</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Essayez une autre recherche.
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
            wide
            title="Ajouter un rôle"
            subtitle="Définir les permissions d’accès"
            onClose={() => setDialog(null)}
          >
            <RoleForm roles={roles} onCancel={() => setDialog(null)} onSave={persist} />
          </Modal>
        )}
        {dialog?.type === 'edit' && (
          <Modal
            wide
            title={
              dialog.role.id === 'super_admin' ? 'Permissions du Super Admin' : 'Modifier le rôle'
            }
            subtitle={dialog.role.name}
            onClose={() => setDialog(null)}
          >
            <RoleForm
              key={dialog.role.id}
              role={dialog.role}
              roles={roles}
              onCancel={() => setDialog(null)}
              onSave={persist}
            />
          </Modal>
        )}
        {dialog?.type === 'delete' && (
          <ConfirmDialog
            title="Supprimer ce rôle ?"
            message={`« ${dialog.role.name} » n’est attribué à aucun administrateur et sera retiré de cette session.`}
            confirmLabel="Supprimer"
            onCancel={() => setDialog(null)}
            onConfirm={() => {
              deleteRole(dialog.role.id);
              toast.success('Rôle supprimé de cette session.');
              setDialog(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
