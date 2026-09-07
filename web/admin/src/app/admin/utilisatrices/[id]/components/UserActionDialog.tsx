'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { mutateUser, type UserMutationType } from '@/services/users';
import type { Country, ManagedUser } from '@/types';
import { COUNTRY_LABELS, getCountryFlag } from '@/components/users/userPresentation';

export type UserDialogAction = UserMutationType;

const ACTION_COPY: Record<
  Exclude<UserDialogAction, 'update'>,
  { title: string; description: string; confirm: string }
> = {
  suspend: {
    title: 'Suspendre cette utilisatrice ?',
    description: 'La connexion au compte sera temporairement bloquée après confirmation serveur.',
    confirm: 'Confirmer la suspension',
  },
  disable: {
    title: 'Désactiver le compte ?',
    description: 'L’accès sera désactivé sans supprimer les données du compte.',
    confirm: 'Confirmer la désactivation',
  },
  reactivate: {
    title: 'Réactiver le compte ?',
    description: 'Le compte retrouvera son accès uniquement après confirmation serveur.',
    confirm: 'Confirmer la réactivation',
  },
  delete: {
    title: 'Supprimer définitivement ce compte ?',
    description:
      'Cette opération destructive doit être traitée par le backend et ne peut être annulée.',
    confirm: 'Supprimer définitivement',
  },
};

export default function UserActionDialog({
  action,
  user,
  onClose,
}: {
  action: UserDialogAction;
  user: ManagedUser;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [name, setName] = useState(user.name);
  const [country, setCountry] = useState<Country>(user.country);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onClose]);

  const isEdit = action === 'update';
  const copy = isEdit
    ? {
        title: 'Modifier le profil',
        description: 'Seules les métadonnées générales du compte peuvent être modifiées.',
        confirm: 'Enregistrer',
      }
    : ACTION_COPY[action];
  const canSubmit =
    !submitting &&
    (!isEdit || Boolean(name.trim())) &&
    (action !== 'suspend' || Boolean(reason.trim())) &&
    (action !== 'delete' || typedConfirmation === 'SUPPRIMER');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await mutateUser({
        type: action,
        userId: user.id,
        reason: reason.trim() || undefined,
        internalNote: note.trim() || undefined,
        suspensionEndsAt: endDate || undefined,
        changes: isEdit ? { name: name.trim(), country } : undefined,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action indisponible.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#2b2232]/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-action-title"
        className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-border bg-[#fcfaf7] shadow-modal"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2
              id="user-action-title"
              className="font-display text-lg font-semibold text-foreground"
            >
              {copy.title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{user.name}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fermer"
          >
            <X size={17} />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start gap-3 rounded-xl border border-[#e6dfd0] bg-[#fbf6eb] p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#9a7b49]" />
            <div>
              <p className="text-[13px] font-semibold text-[#6f5d40]">Confirmation requise</p>
              <p className="mt-1 text-xs leading-5 text-[#806f55]">{copy.description}</p>
              <p className="mt-1 text-xs leading-5 text-[#806f55]">
                Aucun service de mutation n’est connecté dans ce projet. La confirmation ne
                modifiera pas le jeu de données local.
              </p>
            </div>
          </div>

          {isEdit ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-foreground">Nom</span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="input-field h-11 bg-white"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-foreground">Pays</span>
                <select
                  value={country}
                  onChange={(event) => setCountry(event.target.value as Country)}
                  className="input-field h-11 bg-white"
                >
                  {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {getCountryFlag(code as Country)} {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <>
              {action === 'suspend' && (
                <>
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-foreground">
                      Motif
                    </span>
                    <input
                      required
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Motif administratif"
                      className="input-field h-11 bg-white"
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-foreground">
                      Fin de suspension optionnelle
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="input-field h-11 bg-white"
                    />
                  </label>
                </>
              )}
              {(action === 'suspend' || action === 'disable') && (
                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-foreground">
                    Note interne optionnelle
                  </span>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="input-field min-h-[92px] resize-y bg-white"
                  />
                </label>
              )}
              {action === 'delete' && (
                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-foreground">
                    Saisissez SUPPRIMER pour confirmer
                  </span>
                  <input
                    value={typedConfirmation}
                    onChange={(event) => setTypedConfirmation(event.target.value)}
                    autoComplete="off"
                    className="input-field h-11 bg-white"
                  />
                </label>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="btn-secondary h-10">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 ${
                action === 'delete' || action === 'suspend' || action === 'disable'
                  ? 'bg-[#a65f58] hover:bg-[#92514b]'
                  : 'bg-primary hover:bg-primary-light'
              }`}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {copy.confirm}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
