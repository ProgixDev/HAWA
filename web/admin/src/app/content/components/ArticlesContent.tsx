'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  Copy,
  Eye,
  FileText,
  Filter,
  Pencil,
  RotateCcw,
  Send,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { contentArticles, contentCategories } from '@/data/mock/content';
import type { Article, ArticleStatus, ContentType, UserObjective, UserPlan } from '@/types';
import {
  AccessBadge,
  ActionButton,
  CONTENT_TYPE_LABELS,
  ConfirmDialog,
  DemoNotice,
  EmptyState,
  FieldLabel,
  formatContentDate,
  formatCount,
  inputClassName,
  makeSlug,
  Modal,
  OBJECTIVE_LABELS,
  PageHeader,
  Pagination,
  RowActions,
  SearchInput,
  SelectField,
  SortButton,
  type SortDirection,
  StatusBadge,
  Tabs,
  textareaClassName,
} from './ContentUI';

type ArticleTab = 'all' | 'draft' | 'featured' | 'programs' | 'published' | 'archived';
type ArticleSort = 'title' | 'publishedAt' | 'views' | 'status';
type ArticleModal =
  | { type: 'create' }
  | { type: 'edit' | 'view'; article: Article }
  | { type: 'delete' | 'archive'; article: Article }
  | null;

const articleTabs: Array<{ value: ArticleTab; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'featured', label: 'En vedette' },
  { value: 'programs', label: 'Programmes' },
  { value: 'published', label: 'Publiés' },
  { value: 'archived', label: 'Archivés' },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr');
}

function ArticleForm({
  article,
  onCancel,
  onSave,
}: {
  article?: Article;
  onCancel: () => void;
  onSave: (article: Article) => void;
}) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [slug, setSlug] = useState(article?.slug ?? '');
  const [shortDescription, setShortDescription] = useState(article?.shortDescription ?? '');
  const [content, setContent] = useState(article?.content ?? '');
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? '');
  const [category, setCategory] = useState(article?.category ?? contentCategories[0].name);
  const [objective, setObjective] = useState<UserObjective>(
    article?.objective ?? 'cycle_menstruel'
  );
  const [contentType, setContentType] = useState<ContentType>(
    article?.contentType ?? 'educational'
  );
  const [plan, setPlan] = useState<UserPlan>(article?.plan ?? 'FREE');
  const [status, setStatus] = useState<ArticleStatus>(article?.status ?? 'draft');
  const [featured, setFeatured] = useState(article?.featured ?? false);
  const [isProgram, setIsProgram] = useState(article?.isProgram ?? false);
  const [tags, setTags] = useState(article?.tags.join(', ') ?? '');
  const [author, setAuthor] = useState(article?.author ?? 'Rédaction AWA');

  return (
    <form
      className="space-y-5 p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const now = new Date().toISOString();
        onSave({
          id: article?.id ?? `article-session-${Date.now()}`,
          title: title.trim(),
          slug: slug.trim() || makeSlug(title),
          shortDescription: shortDescription.trim(),
          content: content.trim(),
          coverImage: coverImage.trim() || undefined,
          category,
          objective,
          contentType,
          plan,
          status,
          featured,
          isProgram,
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          author: author.trim(),
          updatedAt: now,
          publishedAt:
            status === 'published' ? (article?.publishedAt ?? now) : article?.publishedAt,
          views: article?.views ?? 0,
          readingTime: article?.readingTime ?? Math.max(3, Math.ceil(content.length / 900)),
        });
      }}
    >
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <FieldLabel>Titre</FieldLabel>
          <input
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!article) setSlug(makeSlug(event.target.value));
            }}
            className={inputClassName}
          />
        </label>
        <label>
          <FieldLabel>Slug</FieldLabel>
          <input
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label>
          <FieldLabel>Auteur</FieldLabel>
          <input
            required
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="sm:col-span-2">
          <FieldLabel>Résumé</FieldLabel>
          <textarea
            required
            rows={3}
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            className={textareaClassName}
          />
        </label>
        <label className="sm:col-span-2">
          <FieldLabel>Contenu</FieldLabel>
          <textarea
            required
            rows={8}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className={textareaClassName}
          />
        </label>
        <label className="sm:col-span-2">
          <FieldLabel>Image de couverture (chemin existant, facultatif)</FieldLabel>
          <input
            value={coverImage}
            onChange={(event) => setCoverImage(event.target.value)}
            placeholder="/assets/images/..."
            className={inputClassName}
          />
        </label>
        <SelectField label="Catégorie" value={category} onChange={setCategory}>
          {contentCategories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Objectif"
          value={objective}
          onChange={(value) => setObjective(value as UserObjective)}
        >
          {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Type"
          value={contentType}
          onChange={(value) => setContentType(value as ContentType)}
        >
          {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Accès" value={plan} onChange={(value) => setPlan(value as UserPlan)}>
          <option value="FREE">FREE</option>
          <option value="PREMIUM">PREMIUM</option>
        </SelectField>
        <SelectField
          label="Statut"
          value={status}
          onChange={(value) => setStatus(value as ArticleStatus)}
        >
          <option value="draft">Brouillon</option>
          <option value="review">En revue</option>
          <option value="published">Publié</option>
          <option value="archived">Archivé</option>
        </SelectField>
        <label>
          <FieldLabel>Tags (séparés par des virgules)</FieldLabel>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className={inputClassName}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
            className="rounded border-border text-primary focus:ring-primary/20"
          />{' '}
          En vedette
        </label>
        <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <input
            type="checkbox"
            checked={isProgram}
            onChange={(event) => setIsProgram(event.target.checked)}
            className="rounded border-border text-primary focus:ring-primary/20"
          />{' '}
          Programme
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-border bg-white px-4 text-xs font-semibold text-foreground hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="h-10 rounded-xl bg-primary px-5 text-xs font-semibold text-white hover:opacity-90"
        >
          {article ? 'Enregistrer' : 'Créer l’article'}
        </button>
      </div>
    </form>
  );
}

export default function ArticlesContent() {
  const [articles, setArticles] = useState(contentArticles);
  const [tab, setTab] = useState<ArticleTab>('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [objective, setObjective] = useState<'all' | UserObjective>('all');
  const [type, setType] = useState<'all' | ContentType>('all');
  const [access, setAccess] = useState<'all' | UserPlan>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all');
  const [showMore, setShowMore] = useState(false);
  const [sort, setSort] = useState<ArticleSort>('publishedAt');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState<ArticleModal>(null);

  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    return articles.filter((article) => {
      const tabMatch =
        tab === 'all' ||
        (tab === 'draft' && article.status === 'draft') ||
        (tab === 'featured' && article.featured) ||
        (tab === 'programs' && article.isProgram) ||
        (tab === 'published' && article.status === 'published') ||
        (tab === 'archived' && article.status === 'archived');
      const searchMatch =
        !query ||
        normalize(
          `${article.title} ${article.category} ${OBJECTIVE_LABELS[article.objective]} ${article.tags.join(' ')}`
        ).includes(query);
      return (
        tabMatch &&
        searchMatch &&
        (category === 'all' || article.category === category) &&
        (objective === 'all' || article.objective === objective) &&
        (type === 'all' || article.contentType === type) &&
        (access === 'all' || article.plan === access) &&
        (statusFilter === 'all' || article.status === statusFilter)
      );
    });
  }, [access, articles, category, objective, search, statusFilter, tab, type]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const multiplier = direction === 'asc' ? 1 : -1;
        if (sort === 'title') return a.title.localeCompare(b.title, 'fr') * multiplier;
        if (sort === 'views') return (a.views - b.views) * multiplier;
        if (sort === 'status') return a.status.localeCompare(b.status) * multiplier;
        return (
          ((a.publishedAt ? new Date(a.publishedAt).getTime() : 0) -
            (b.publishedAt ? new Date(b.publishedAt).getTime() : 0)) *
          multiplier
        );
      }),
    [direction, filtered, sort]
  );

  const safePage = Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)));
  const visible = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const categories = Array.from(new Set(articles.map((article) => article.category))).sort();
  const reset = () => {
    setSearch('');
    setCategory('all');
    setObjective('all');
    setType('all');
    setAccess('all');
    setStatusFilter('all');
    setPage(1);
  };
  const handleSort = (field: ArticleSort) => {
    if (field === sort) setDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(field);
      setDirection('asc');
    }
    setPage(1);
  };
  const saveArticle = (article: Article) => {
    const exists = articles.some((item) => item.id === article.id);
    setArticles((current) =>
      exists
        ? current.map((item) => (item.id === article.id ? article : item))
        : [article, ...current]
    );
    toast.info(
      exists ? 'Article mis à jour dans cette session.' : 'Article créé dans cette session.'
    );
    setModal(null);
  };
  const updateArticle = (id: string, changes: Partial<Article>, message: string) => {
    setArticles((current) =>
      current.map((article) =>
        article.id === id
          ? { ...article, ...changes, updatedAt: new Date().toISOString() }
          : article
      )
    );
    toast.info(message);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Gestion éditoriale"
        title="Articles"
        subtitle="Gérez tous les contenus éducatifs et médicaux."
        actionLabel="Nouvel article"
        onAction={() => setModal({ type: 'create' })}
      />
      <DemoNotice />
      <section className="rounded-[18px] border border-border bg-white shadow-card">
        <Tabs
          value={tab}
          onChange={(value) => {
            setTab(value);
            setPage(1);
          }}
          items={articleTabs.map((item) => ({
            ...item,
            count: item.value === 'all' ? articles.length : undefined,
          }))}
        />
        <div className="flex flex-wrap gap-2 p-4">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Rechercher un article..."
          />
          <SelectField
            compact
            label="Catégorie"
            value={category}
            onChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
          >
            <option value="all">Catégorie</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </SelectField>
          <SelectField
            compact
            label="Objectif"
            value={objective}
            onChange={(value) => {
              setObjective(value as 'all' | UserObjective);
              setPage(1);
            }}
          >
            <option value="all">Objectif</option>
            {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <SelectField
            compact
            label="Type"
            value={type}
            onChange={(value) => {
              setType(value as 'all' | ContentType);
              setPage(1);
            }}
          >
            <option value="all">Type</option>
            {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <SelectField
            compact
            label="Accès"
            value={access}
            onChange={(value) => {
              setAccess(value as 'all' | UserPlan);
              setPage(1);
            }}
          >
            <option value="all">Accès</option>
            <option value="FREE">FREE</option>
            <option value="PREMIUM">PREMIUM</option>
          </SelectField>
          <button
            type="button"
            onClick={() => setShowMore((value) => !value)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold ${showMore ? 'border-primary/25 bg-primary-ghost text-primary' : 'border-border bg-white text-foreground hover:bg-muted'}`}
          >
            <Filter size={14} /> Plus de filtres
          </button>
          {(search ||
            category !== 'all' ||
            objective !== 'all' ||
            type !== 'all' ||
            access !== 'all' ||
            statusFilter !== 'all') && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <RotateCcw size={13} /> Réinitialiser
            </button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {showMore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-4 py-3">
                <div className="max-w-52">
                  <SelectField
                    compact
                    label="Statut"
                    value={statusFilter}
                    onChange={(value) => {
                      setStatusFilter(value as 'all' | ArticleStatus);
                      setPage(1);
                    }}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="draft">Brouillon</option>
                    <option value="review">En revue</option>
                    <option value="published">Publié</option>
                    <option value="archived">Archivé</option>
                  </SelectField>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="min-w-0 rounded-[18px] border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#faf8fa] text-[9px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                <th className="w-[290px] px-4 py-3.5">
                  <SortButton
                    label="Article"
                    field="title"
                    activeField={sort}
                    direction={direction}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3.5">Catégorie</th>
                <th className="px-4 py-3.5">Objectif</th>
                <th className="px-4 py-3.5">Accès</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">
                  <SortButton
                    label="Statut"
                    field="status"
                    activeField={sort}
                    direction={direction}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3.5">
                  <SortButton
                    label="Vues"
                    field="views"
                    activeField={sort}
                    direction={direction}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3.5">
                  <SortButton
                    label="Publication"
                    field="publishedAt"
                    activeField={sort}
                    direction={direction}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {visible.map((article) => (
                <tr key={article.id} className="hover:bg-[#fbf9fb]">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-[#eee8f3] text-primary">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-xs font-semibold text-foreground">
                          {article.title}
                        </p>
                        <p className="mt-1 text-[9px] text-muted-foreground">
                          {article.featured ? 'En vedette · ' : ''}
                          {article.readingTime} min
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-[#655f68]">
                    {article.category}
                  </td>
                  <td className="max-w-[170px] px-4 py-3.5 text-[10px] font-medium text-[#655f68]">
                    {OBJECTIVE_LABELS[article.objective]}
                  </td>
                  <td className="px-4 py-3.5">
                    <AccessBadge plan={article.plan} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[10px] font-medium text-[#655f68]">
                    {CONTENT_TYPE_LABELS[article.contentType]}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={article.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold text-foreground">
                    {formatCount(article.views)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[10px] text-muted-foreground">
                    {formatContentDate(article.publishedAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <RowActions label={`Actions pour ${article.title}`}>
                      <ActionButton onClick={() => setModal({ type: 'view', article })}>
                        <Eye size={14} /> Voir
                      </ActionButton>
                      <ActionButton onClick={() => setModal({ type: 'edit', article })}>
                        <Pencil size={14} /> Modifier
                      </ActionButton>
                      <ActionButton
                        onClick={() => {
                          const duplicate = {
                            ...article,
                            id: `article-session-${Date.now()}`,
                            title: `${article.title} — copie`,
                            slug: `${article.slug}-copie`,
                            status: 'draft' as ArticleStatus,
                            publishedAt: undefined,
                            views: 0,
                          };
                          setArticles((current) => [duplicate, ...current]);
                          toast.info('Article dupliqué dans cette session.');
                        }}
                      >
                        <Copy size={14} /> Dupliquer
                      </ActionButton>
                      <ActionButton
                        onClick={() =>
                          updateArticle(
                            article.id,
                            { featured: !article.featured },
                            article.featured
                              ? 'Article retiré de la vedette.'
                              : 'Article mis en vedette.'
                          )
                        }
                      >
                        <Star size={14} />{' '}
                        {article.featured ? 'Retirer de la vedette' : 'Mettre en vedette'}
                      </ActionButton>
                      <ActionButton
                        onClick={() =>
                          updateArticle(
                            article.id,
                            {
                              status: article.status === 'published' ? 'draft' : 'published',
                              publishedAt:
                                article.status === 'published'
                                  ? undefined
                                  : new Date().toISOString(),
                            },
                            article.status === 'published'
                              ? 'Article dépublié.'
                              : 'Article publié dans cette session.'
                          )
                        }
                      >
                        <Send size={14} />{' '}
                        {article.status === 'published' ? 'Dépublier' : 'Publier'}
                      </ActionButton>
                      {article.status !== 'archived' && (
                        <ActionButton onClick={() => setModal({ type: 'archive', article })}>
                          <Archive size={14} /> Archiver
                        </ActionButton>
                      )}
                      <ActionButton danger onClick={() => setModal({ type: 'delete', article })}>
                        <Trash2 size={14} /> Supprimer
                      </ActionButton>
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <EmptyState
              title="Aucun article trouvé"
              description="Modifiez vos critères ou créez un nouvel article."
            />
          )}
        </div>
        <Pagination
          page={safePage}
          total={sorted.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>

      <AnimatePresence>
        {modal?.type === 'create' && (
          <Modal
            wide
            title="Nouvel article"
            subtitle="Créer un contenu éditorial"
            onClose={() => setModal(null)}
          >
            <ArticleForm onCancel={() => setModal(null)} onSave={saveArticle} />
          </Modal>
        )}
        {modal?.type === 'edit' && (
          <Modal
            wide
            title="Modifier l’article"
            subtitle={modal.article.title}
            onClose={() => setModal(null)}
          >
            <ArticleForm
              key={modal.article.id}
              article={modal.article}
              onCancel={() => setModal(null)}
              onSave={saveArticle}
            />
          </Modal>
        )}
        {modal?.type === 'view' && (
          <Modal
            title="Aperçu de l’article"
            subtitle={modal.article.category}
            onClose={() => setModal(null)}
          >
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <AccessBadge plan={modal.article.plan} />
                <StatusBadge status={modal.article.status} />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {modal.article.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {modal.article.shortDescription}
                </p>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Objectif', OBJECTIVE_LABELS[modal.article.objective]],
                  ['Type', CONTENT_TYPE_LABELS[modal.article.contentType]],
                  ['Auteur', modal.article.author],
                  ['Vues', formatCount(modal.article.views)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#f5f2f5] p-3">
                    <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 text-xs font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Modal>
        )}
        {modal?.type === 'archive' && (
          <ConfirmDialog
            title="Archiver l’article ?"
            message={`« ${modal.article.title} » ne sera plus proposé dans les listes actives.`}
            confirmLabel="Archiver"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              updateArticle(modal.article.id, { status: 'archived' }, 'Contenu archivé.');
              setModal(null);
            }}
          />
        )}
        {modal?.type === 'delete' && (
          <ConfirmDialog
            title="Supprimer l’article ?"
            message={`La suppression de « ${modal.article.title} » est limitée à cette session de démonstration.`}
            confirmLabel="Supprimer"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              setArticles((current) =>
                current.filter((article) => article.id !== modal.article.id)
              );
              toast.info('Article supprimé de cette session.');
              setModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
