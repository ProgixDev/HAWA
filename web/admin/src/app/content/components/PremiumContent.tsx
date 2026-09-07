'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  BookOpen,
  Copy,
  Eye,
  FileDown,
  FileText,
  Headphones,
  LayoutTemplate,
  Pencil,
  Play,
  Send,
  Trash2,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { contentCategories, mediaAssets, premiumContents } from '@/data/mock/content';
import type { ArticleStatus, PremiumContentItem, PremiumContentType } from '@/types';
import {
  ActionButton,
  ConfirmDialog,
  DemoNotice,
  EmptyState,
  FieldLabel,
  formatContentDate,
  formatCount,
  inputClassName,
  Modal,
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

type PremiumTab = 'all' | 'article' | 'programme' | 'video' | 'guide' | 'template';
type PremiumSort = 'title' | 'views' | 'updatedAt';
type PremiumModal =
  | { type: 'create' }
  | { type: 'edit' | 'view' | 'delete' | 'archive'; item: PremiumContentItem }
  | null;

const TYPE_META: Record<PremiumContentType, { label: string; icon: React.ElementType }> = {
  article: { label: 'Article Premium', icon: FileText },
  programme: { label: 'Programme', icon: Play },
  guide: { label: 'Guide PDF', icon: BookOpen },
  video: { label: 'Vidéo', icon: Video },
  audio: { label: 'Audio', icon: Headphones },
  template: { label: 'Template', icon: LayoutTemplate },
  resource: { label: 'Ressource', icon: FileDown },
};

const tabs: Array<{ value: PremiumTab; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'article', label: 'Articles' },
  { value: 'programme', label: 'Programmes' },
  { value: 'video', label: 'Vidéos' },
  { value: 'guide', label: 'Guides' },
  { value: 'template', label: 'Templates' },
];

function PremiumForm({
  item,
  onCancel,
  onSave,
}: {
  item?: PremiumContentItem;
  onCancel: () => void;
  onSave: (item: PremiumContentItem) => void;
}) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [type, setType] = useState<PremiumContentType>(item?.type ?? 'article');
  const [category, setCategory] = useState(item?.category ?? contentCategories[0].name);
  const [status, setStatus] = useState<ArticleStatus>(item?.status ?? 'draft');
  const [mediaId, setMediaId] = useState(item?.mediaId ?? '');
  return (
    <form
      className="space-y-5 p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          id: item?.id ?? `premium-session-${Date.now()}`,
          title: title.trim(),
          description: description.trim(),
          type,
          category,
          status,
          mediaId: mediaId || undefined,
          views: item?.views ?? 0,
          updatedAt: new Date().toISOString(),
        });
      }}
    >
      <DemoNotice />
      <label>
        <FieldLabel>Titre</FieldLabel>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClassName}
        />
      </label>
      <label>
        <FieldLabel>Description</FieldLabel>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={textareaClassName}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Type"
          value={type}
          onChange={(value) => setType(value as PremiumContentType)}
        >
          {Object.entries(TYPE_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Catégorie" value={category} onChange={setCategory}>
          {contentCategories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
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
        <SelectField label="Média associé" value={mediaId} onChange={setMediaId}>
          <option value="">Aucun média</option>
          {mediaAssets.map((media) => (
            <option key={media.id} value={media.id}>
              {media.name}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="rounded-xl bg-[#eee8f3] px-3.5 py-3 text-[11px] text-[#6c587c]">
        L’accès Premium est appliqué automatiquement à ce contenu.
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-border bg-white px-4 text-xs font-semibold hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="h-10 rounded-xl bg-primary px-5 text-xs font-semibold text-white hover:opacity-90"
        >
          {item ? 'Enregistrer' : 'Ajouter le contenu'}
        </button>
      </div>
    </form>
  );
}

export default function PremiumContent() {
  const [items, setItems] = useState(premiumContents);
  const [tab, setTab] = useState<PremiumTab>('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState<'all' | PremiumContentType>('all');
  const [status, setStatus] = useState<'all' | ArticleStatus>('all');
  const [sort, setSort] = useState<PremiumSort>('updatedAt');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState<PremiumModal>(null);
  const categories = Array.from(new Set(items.map((item) => item.category))).sort();
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr');
    return items.filter(
      (item) =>
        (tab === 'all' || item.type === tab) &&
        (!query ||
          `${item.title} ${item.description} ${item.category}`
            .toLocaleLowerCase('fr')
            .includes(query)) &&
        (category === 'all' || item.category === category) &&
        (type === 'all' || item.type === type) &&
        (status === 'all' || item.status === status)
    );
  }, [category, items, search, status, tab, type]);
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const multiplier = direction === 'asc' ? 1 : -1;
        if (sort === 'title') return a.title.localeCompare(b.title, 'fr') * multiplier;
        if (sort === 'views') return (a.views - b.views) * multiplier;
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * multiplier;
      }),
    [direction, filtered, sort]
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)));
  const visible = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const handleSort = (field: PremiumSort) => {
    if (sort === field) setDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(field);
      setDirection('asc');
    }
  };
  const save = (item: PremiumContentItem) => {
    const exists = items.some((entry) => entry.id === item.id);
    setItems((current) =>
      exists ? current.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...current]
    );
    toast.info(
      exists
        ? 'Contenu Premium mis à jour dans cette session.'
        : 'Contenu Premium ajouté dans cette session.'
    );
    setModal(null);
  };
  const update = (id: string, changes: Partial<PremiumContentItem>, message: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item
      )
    );
    toast.info(message);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Bibliothèque réservée"
        title="Contenus Premium"
        subtitle="Gérez les articles, programmes et ressources réservés aux abonnées Premium."
        actionLabel="Ajouter un contenu"
        onAction={() => setModal({ type: 'create' })}
      />
      <DemoNotice />
      <section className="rounded-[18px] border border-border bg-white shadow-card">
        <Tabs
          comfortable
          value={tab}
          onChange={(value) => {
            setTab(value);
            setPage(1);
          }}
          items={tabs}
        />
        <div className="flex flex-wrap gap-2 p-4">
          <SearchInput
            comfortable
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Rechercher un contenu..."
          />
          <SelectField
            compact
            comfortable
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
            comfortable
            label="Type"
            value={type}
            onChange={(value) => {
              setType(value as 'all' | PremiumContentType);
              setPage(1);
            }}
          >
            <option value="all">Type</option>
            {Object.entries(TYPE_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            compact
            comfortable
            label="Statut"
            value={status}
            onChange={(value) => {
              setStatus(value as 'all' | ArticleStatus);
              setPage(1);
            }}
          >
            <option value="all">Statut</option>
            <option value="published">Publié</option>
            <option value="draft">Brouillon</option>
            <option value="review">En revue</option>
            <option value="archived">Archivé</option>
          </SelectField>
        </div>
      </section>
      <section className="min-w-0 rounded-[18px] border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[7%]" />
              <col className="w-[10%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-[#faf8fa] text-[11px] font-semibold uppercase tracking-[0.065em] text-muted-foreground">
                <th className="px-4 py-4">
                  <SortButton
                    label="Titre"
                    field="title"
                    activeField={sort}
                    direction={direction}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Catégorie</th>
                <th className="px-4 py-4">Accès</th>
                <th className="px-4 py-4">Statut</th>
                <th className="px-4 py-4">
                  <SortButton
                    label="Vues"
                    field="views"
                    activeField={sort}
                    direction={direction}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-4">
                  <SortButton
                    label="Date"
                    field="updatedAt"
                    activeField={sort}
                    direction={direction}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {visible.map((item) => {
                const TypeIcon = TYPE_META[item.type].icon;
                return (
                  <tr key={item.id} className="hover:bg-[#fbf9fb]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eee8f3] text-primary">
                          <TypeIcon size={17} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold leading-5 text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-1 truncate text-xs leading-4 text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[13px] font-medium text-[#655f68]">
                      {TYPE_META[item.type].label}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[13px] text-[#655f68]">
                      {item.category}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-[#eee8f3] px-2.5 py-1 text-[11px] font-bold tracking-wider text-[#6c587c]">
                        PREMIUM
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} comfortable />
                    </td>
                    <td className="px-4 py-4 text-[13px] font-semibold text-foreground">
                      {formatCount(item.views)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[13px] text-muted-foreground">
                      {formatContentDate(item.updatedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <RowActions label={`Actions pour ${item.title}`}>
                        <ActionButton onClick={() => setModal({ type: 'view', item })}>
                          <Eye size={14} /> Voir
                        </ActionButton>
                        <ActionButton onClick={() => setModal({ type: 'edit', item })}>
                          <Pencil size={14} /> Modifier
                        </ActionButton>
                        <ActionButton
                          onClick={() =>
                            update(
                              item.id,
                              { status: item.status === 'published' ? 'draft' : 'published' },
                              item.status === 'published'
                                ? 'Contenu dépublié.'
                                : 'Contenu publié dans cette session.'
                            )
                          }
                        >
                          <Send size={14} /> {item.status === 'published' ? 'Dépublier' : 'Publier'}
                        </ActionButton>
                        <ActionButton
                          onClick={() => {
                            setItems((current) => [
                              {
                                ...item,
                                id: `premium-session-${Date.now()}`,
                                title: `${item.title} — copie`,
                                status: 'draft',
                                views: 0,
                              },
                              ...current,
                            ]);
                            toast.info('Contenu dupliqué dans cette session.');
                          }}
                        >
                          <Copy size={14} /> Dupliquer
                        </ActionButton>
                        {item.status !== 'archived' && (
                          <ActionButton onClick={() => setModal({ type: 'archive', item })}>
                            <Archive size={14} /> Archiver
                          </ActionButton>
                        )}
                        <ActionButton danger onClick={() => setModal({ type: 'delete', item })}>
                          <Trash2 size={14} /> Supprimer
                        </ActionButton>
                      </RowActions>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visible.length && (
            <EmptyState
              title="Aucun contenu Premium trouvé"
              description="Ajustez les filtres ou ajoutez un nouveau contenu réservé."
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
          <Modal title="Ajouter un contenu Premium" onClose={() => setModal(null)}>
            <PremiumForm onCancel={() => setModal(null)} onSave={save} />
          </Modal>
        )}
        {modal?.type === 'edit' && (
          <Modal
            title="Modifier le contenu"
            subtitle={modal.item.title}
            onClose={() => setModal(null)}
          >
            <PremiumForm
              key={modal.item.id}
              item={modal.item}
              onCancel={() => setModal(null)}
              onSave={save}
            />
          </Modal>
        )}
        {modal?.type === 'view' && (
          <Modal
            title="Détails du contenu Premium"
            subtitle={TYPE_META[modal.item.type].label}
            onClose={() => setModal(null)}
          >
            <div className="space-y-4 p-5 sm:p-6">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {modal.item.title}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">{modal.item.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#eee8f3] px-3 py-1 text-[10px] font-bold text-primary">
                  PREMIUM
                </span>
                <StatusBadge status={modal.item.status} />
              </div>
            </div>
          </Modal>
        )}
        {modal?.type === 'archive' && (
          <ConfirmDialog
            title="Archiver ce contenu ?"
            message={`« ${modal.item.title} » ne sera plus visible dans la bibliothèque active.`}
            confirmLabel="Archiver"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              update(modal.item.id, { status: 'archived' }, 'Contenu archivé.');
              setModal(null);
            }}
          />
        )}
        {modal?.type === 'delete' && (
          <ConfirmDialog
            title="Supprimer ce contenu ?"
            message={`La suppression de « ${modal.item.title} » est limitée à cette session.`}
            confirmLabel="Supprimer"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              setItems((current) => current.filter((item) => item.id !== modal.item.id));
              toast.info('Contenu supprimé de cette session.');
              setModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
