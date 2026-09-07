'use client';

import React, { useMemo, useState } from 'react';
import { Archive, Copy, Eye, MoreHorizontal, Pencil, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SpiritualArticle, SpiritualFeatureConfiguration } from '@/types/spiritual';
import type { ArticleStatus, UserObjective, UserPlan } from '@/types';
import { mutateSpiritualContent } from '@/services/spiritual';
import { contentCategories } from '@/data/mock/content';
import {
  OBJECTIVE_LABELS,
  SearchInput,
  SelectField,
  formatContentDate,
} from '@/app/content/components/ContentUI';
import {
  BackendNotice,
  FeatureStatusCard,
  PrivacyNotice,
  PublicationStatusBadge,
  SpiritualEmptyState,
  SpiritualModal,
  SpiritualPageHeader,
  SpiritualTabs,
  ValidationStatusBadge,
} from './SpiritualUI';

type ArticleTab = 'all' | 'draft' | 'review' | 'published' | 'archived';
type ArticleModal =
  | { type: 'create' }
  | { type: 'view' | 'edit' | 'action'; article: SpiritualArticle; action?: string }
  | null;

const tabs: Array<{ value: ArticleTab; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'review', label: 'En revue' },
  { value: 'published', label: 'Publiés' },
  { value: 'archived', label: 'Archivés' },
];

const ARTICLE_ACTIONS: Array<{
  label: string;
  icon: React.ElementType;
  name: string;
}> = [
  { label: 'Voir', icon: Eye, name: 'view' },
  { label: 'Modifier', icon: Pencil, name: 'edit' },
  { label: 'Dupliquer', icon: Copy, name: 'duplicate' },
  { label: 'Envoyer en validation', icon: Send, name: 'submit_review' },
  { label: 'Publier / Dépublier', icon: Send, name: 'publish_toggle' },
  { label: 'Archiver', icon: Archive, name: 'archive' },
  { label: 'Supprimer', icon: Trash2, name: 'delete' },
];

function ArticleForm({ article, onClose }: { article?: SpiritualArticle; onClose: () => void }) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [slug, setSlug] = useState(article?.slug ?? '');
  const [description, setDescription] = useState(article?.shortDescription ?? '');
  const [body, setBody] = useState(article?.body ?? '');
  const [category, setCategory] = useState(
    article?.category ??
      contentCategories.find((item) => item.domain === 'religious')?.name ??
      'Cycle & pratique religieuse'
  );
  const [tags, setTags] = useState(article?.tags.join(', ') ?? '');
  const [objective, setObjective] = useState<UserObjective>(
    article?.objectives[0] ?? 'cycle_menstruel'
  );
  const [access, setAccess] = useState<UserPlan>(article?.access ?? 'FREE');
  const [status, setStatus] = useState<ArticleStatus>(article?.publicationStatus ?? 'draft');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await mutateSpiritualContent(article ? 'update' : 'create', article?.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enregistrement indisponible.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
      <BackendNotice />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="label-field">Titre</span>
          <input
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!article)
                setSlug(
                  event.target.value
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')
                );
            }}
            className="input-field bg-white"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="label-field">Slug</span>
          <input
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="input-field bg-white"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="label-field">Description courte</span>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="input-field resize-y bg-white"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="label-field">Contenu</span>
          <textarea
            required
            rows={7}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="input-field resize-y bg-white"
          />
        </label>
        <label>
          <span className="label-field">Catégorie</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="input-field bg-white"
          >
            {contentCategories
              .filter((item) => item.domain === 'religious')
              .map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
          </select>
        </label>
        <label>
          <span className="label-field">Objectif associé</span>
          <select
            value={objective}
            onChange={(event) => setObjective(event.target.value as UserObjective)}
            className="input-field bg-white"
          >
            {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label-field">Accès</span>
          <select
            value={access}
            onChange={(event) => setAccess(event.target.value as UserPlan)}
            className="input-field bg-white"
          >
            <option value="FREE">Gratuit</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </label>
        <label>
          <span className="label-field">Publication</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ArticleStatus)}
            className="input-field bg-white"
          >
            <option value="draft">Brouillon</option>
            <option value="review">En revue</option>
            <option value="published" disabled={article?.validationStatus !== 'validated'}>
              Publié — validation requise
            </option>
            <option value="archived">Archivé</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="label-field">Tags</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Séparés par des virgules"
            className="input-field bg-white"
          />
        </label>
        <div className="sm:col-span-2 rounded-xl bg-[#f3f2f3] px-4 py-3 text-xs text-muted-foreground">
          Statut religieux initial : <strong>Non validé</strong>. Aucun contenu n’est validé
          automatiquement.
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onClose} className="btn-secondary h-10">
          Annuler
        </button>
        <button type="submit" className="btn-primary h-10">
          Enregistrer
        </button>
      </div>
    </form>
  );
}

export default function ReligiousArticlesContent({
  articles,
  configuration,
}: {
  articles: SpiritualArticle[];
  configuration: SpiritualFeatureConfiguration;
}) {
  const [tab, setTab] = useState<ArticleTab>('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [validation, setValidation] = useState('all');
  const [access, setAccess] = useState('all');
  const [objective, setObjective] = useState('all');
  const [modal, setModal] = useState<ArticleModal>(null);
  const categories = Array.from(new Set(articles.map((article) => article.category)));

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr');
    return articles.filter(
      (article) =>
        (tab === 'all' || article.publicationStatus === tab) &&
        (!query || article.title.toLocaleLowerCase('fr').includes(query)) &&
        (category === 'all' || article.category === category) &&
        (validation === 'all' || article.validationStatus === validation) &&
        (access === 'all' || article.access === access) &&
        (objective === 'all' || article.objectives.includes(objective as UserObjective))
    );
  }, [access, articles, category, objective, search, tab, validation]);

  const action = async (name: string, article: SpiritualArticle) => {
    try {
      await mutateSpiritualContent(name, article.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action indisponible.');
    }
    setModal(null);
  };

  return (
    <div className="min-w-0 space-y-6">
      <SpiritualPageHeader
        title="Articles religieux"
        description="Gérez les contenus spirituels sans contourner leur validation religieuse."
        actionLabel="Nouvel article"
        onAction={() => setModal({ type: 'create' })}
      />
      <BackendNotice />
      <PrivacyNotice />
      <div className="max-w-xs">
        <FeatureStatusCard enabled={configuration.enabled} label="Module Articles religieux" />
      </div>
      <SpiritualTabs value={tab} onChange={setTab} items={tabs} />
      <section className="rounded-[18px] border border-border bg-white p-4 shadow-card">
        <div className="flex flex-wrap gap-2">
          <SearchInput
            comfortable
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un titre..."
          />
          <SelectField
            compact
            comfortable
            label="Catégorie"
            value={category}
            onChange={setCategory}
          >
            <option value="all">Catégorie</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </SelectField>
          <SelectField
            compact
            comfortable
            label="Validation"
            value={validation}
            onChange={setValidation}
          >
            <option value="all">Validation</option>
            <option value="unvalidated">Non validé</option>
            <option value="pending_review">En attente</option>
            <option value="in_review">En revue</option>
            <option value="validated">Validé</option>
            <option value="rejected">Refusé</option>
          </SelectField>
          <SelectField compact comfortable label="Accès" value={access} onChange={setAccess}>
            <option value="all">Accès</option>
            <option value="FREE">Gratuit</option>
            <option value="PREMIUM">Premium</option>
          </SelectField>
          <SelectField
            compact
            comfortable
            label="Objectif"
            value={objective}
            onChange={setObjective}
          >
            <option value="all">Objectif</option>
            {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        </div>
      </section>
      <section className="overflow-hidden rounded-[18px] border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#faf8fa] text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                <th className="px-4 py-4">Titre</th>
                <th className="px-4 py-4">Catégorie</th>
                <th className="px-4 py-4">Validation</th>
                <th className="px-4 py-4">Accès</th>
                <th className="px-4 py-4">Publication</th>
                <th className="px-4 py-4">Statut validation</th>
                <th className="px-4 py-4">Modification</th>
                <th className="px-4 py-4">Validateur</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {filtered.map((article) => (
                <tr key={article.id} className="hover:bg-[#fbf9fb]">
                  <td className="max-w-[290px] px-4 py-4">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {article.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {article.shortDescription}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[13px] text-foreground">
                    {article.category}
                  </td>
                  <td className="px-4 py-4 text-[13px] text-muted-foreground">Religieuse</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-primary-ghost px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {article.access === 'FREE' ? 'Gratuit' : 'Premium'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <PublicationStatusBadge status={article.publicationStatus} />
                  </td>
                  <td className="px-4 py-4">
                    <ValidationStatusBadge status={article.validationStatus} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[13px] text-muted-foreground">
                    {formatContentDate(article.updatedAt)}
                  </td>
                  <td className="px-4 py-4 text-[13px] text-muted-foreground">
                    {article.reviewer ?? 'Non assigné'}
                  </td>
                  <td className="px-4 py-4">
                    <details className="group relative">
                      <summary className="mx-auto flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">
                        <MoreHorizontal size={17} />
                      </summary>
                      <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-border bg-white p-1.5 shadow-dropdown">
                        {ARTICLE_ACTIONS.map(({ label, icon: Icon, name }) => (
                          <button
                            key={String(label)}
                            type="button"
                            onClick={() =>
                              name === 'view' || name === 'edit'
                                ? setModal({ type: name as 'view' | 'edit', article })
                                : setModal({ type: 'action', article, action: String(name) })
                            }
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-muted ${name === 'delete' ? 'text-danger' : 'text-foreground'}`}
                          >
                            <Icon size={14} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="p-5">
            <SpiritualEmptyState
              title="Aucun article religieux"
              description="Aucun contenu de la source actuelle ne correspond à ces filtres."
            />
          </div>
        )}
      </section>

      {modal?.type === 'create' && (
        <SpiritualModal title="Nouvel article religieux" onClose={() => setModal(null)} wide>
          <ArticleForm onClose={() => setModal(null)} />
        </SpiritualModal>
      )}
      {modal?.type === 'edit' && (
        <SpiritualModal
          title="Modifier l’article"
          subtitle={modal.article.title}
          onClose={() => setModal(null)}
          wide
        >
          <ArticleForm article={modal.article} onClose={() => setModal(null)} />
        </SpiritualModal>
      )}
      {modal?.type === 'view' && (
        <SpiritualModal
          title="Aperçu de l’article"
          subtitle={`Version ${modal.article.version}`}
          onClose={() => setModal(null)}
          wide
        >
          <div className="space-y-4 p-5 sm:p-6">
            <h3 className="font-display text-xl font-semibold text-foreground">
              {modal.article.title}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {modal.article.shortDescription}
            </p>
            <div className="rounded-xl border border-border bg-[#faf8fa] p-4 text-sm leading-6 text-foreground">
              {modal.article.body ?? 'Aucun corps de contenu disponible.'}
            </div>
            <BackendNotice />
          </div>
        </SpiritualModal>
      )}
      {modal?.type === 'action' && (
        <SpiritualModal
          title="Confirmation requise"
          subtitle={modal.article.title}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4 p-5 sm:p-6">
            <BackendNotice />
            <p className="text-sm leading-6 text-muted-foreground">
              Cette action nécessite une confirmation et un service backend. Le statut de validation
              ne sera jamais changé automatiquement.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary h-10">
                Annuler
              </button>
              <button
                type="button"
                onClick={() => action(modal.action ?? 'unknown', modal.article)}
                className="btn-primary h-10"
              >
                Confirmer
              </button>
            </div>
          </div>
        </SpiritualModal>
      )}
    </div>
  );
}
