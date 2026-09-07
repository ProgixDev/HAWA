'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronRight,
  Eye,
  Flower2,
  HeartPulse,
  Leaf,
  ListOrdered,
  MoonStar,
  Pencil,
  Power,
  ShieldCheck,
  Sparkles,
  Sprout,
  SunMedium,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { contentArticles, contentCategories } from '@/data/mock/content';
import type { ContentCategory } from '@/types';
import {
  ActionButton,
  ConfirmDialog,
  DemoNotice,
  EmptyState,
  FieldLabel,
  inputClassName,
  makeSlug,
  Modal,
  PageHeader,
  RowActions,
  textareaClassName,
} from './ContentUI';

type CategoryDomain = ContentCategory['domain'];
type CategoryModal =
  | { type: 'create' }
  | { type: 'edit' | 'articles' | 'delete'; category: ContentCategory }
  | null;

const CATEGORY_ICONS = {
  CalendarDays,
  Sprout,
  Activity,
  HeartPulse,
  Flower2,
  Sparkles,
  SunMedium,
  Leaf,
  MoonStar,
  ShieldCheck,
};

function CategoryIcon({ category, size = 25 }: { category: ContentCategory; size?: number }) {
  const Icon = CATEGORY_ICONS[category.icon as keyof typeof CATEGORY_ICONS] ?? Leaf;
  return <Icon size={size} strokeWidth={1.65} />;
}

function CategoryForm({
  category,
  existingSlugs,
  initialOrder,
  onCancel,
  onSave,
}: {
  category?: ContentCategory;
  existingSlugs: string[];
  initialOrder: number;
  onCancel: () => void;
  onSave: (category: ContentCategory) => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [domain, setDomain] = useState<CategoryDomain>(category?.domain ?? 'medical');
  const [order, setOrder] = useState(category?.order ?? initialOrder);
  const [icon, setIcon] = useState(category?.icon ?? 'Leaf');
  const [color, setColor] = useState(category?.color ?? '#8e769f');
  const [active, setActive] = useState(category?.active ?? true);
  const [error, setError] = useState('');

  return (
    <form
      className="space-y-5 p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const finalSlug = slug.trim() || makeSlug(name);
        if (existingSlugs.some((item) => item === finalSlug && item !== category?.slug)) {
          setError('Ce slug est déjà utilisé.');
          return;
        }
        onSave({
          id: category?.id ?? `category-session-${Date.now()}`,
          name: name.trim(),
          slug: finalSlug,
          description: description.trim(),
          domain,
          order: Math.max(1, order),
          icon,
          color,
          active,
        });
      }}
    >
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <FieldLabel>Nom</FieldLabel>
          <input
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!category) setSlug(makeSlug(event.target.value));
            }}
            className={inputClassName}
          />
        </label>
        <label>
          <FieldLabel>Slug</FieldLabel>
          <input
            required
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setError('');
            }}
            className={inputClassName}
          />
          {error && <span className="mt-1 block text-[10px] text-danger">{error}</span>}
        </label>
        <label className="sm:col-span-2">
          <FieldLabel>Description</FieldLabel>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={textareaClassName}
          />
        </label>
        <label>
          <FieldLabel>Domaine</FieldLabel>
          <select
            value={domain}
            onChange={(event) => setDomain(event.target.value as CategoryDomain)}
            className={inputClassName}
          >
            <option value="medical">Médical</option>
            <option value="religious">Religieux</option>
          </select>
        </label>
        <label>
          <FieldLabel>Ordre d’affichage</FieldLabel>
          <input
            type="number"
            min={1}
            value={order}
            onChange={(event) => setOrder(Number(event.target.value))}
            className={inputClassName}
          />
        </label>
        <label>
          <FieldLabel>Icône</FieldLabel>
          <select
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            className={inputClassName}
          >
            {Object.keys(CATEGORY_ICONS).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <FieldLabel>Couleur</FieldLabel>
          <div className="flex gap-2">
            <input
              aria-label="Sélectionner la couleur"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-11 w-14 rounded-xl border border-border bg-white p-1.5"
            />
            <input
              value={color}
              onChange={(event) => setColor(event.target.value)}
              pattern="#[0-9A-Fa-f]{6}"
              className={inputClassName}
            />
          </div>
        </label>
      </div>
      <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
          className="rounded border-border text-primary focus:ring-primary/20"
        />
        Catégorie active
      </label>
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
          {category ? 'Enregistrer' : 'Ajouter la catégorie'}
        </button>
      </div>
    </form>
  );
}

function CategoryCard({
  category,
  count,
  reorderMode,
  first,
  last,
  onOpen,
  onEdit,
  onToggle,
  onDelete,
  onMove,
}: {
  category: ContentCategory;
  count: number;
  reorderMode: boolean;
  first: boolean;
  last: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <motion.article
      layout
      className="group relative min-h-[154px] rounded-[20px] border border-[#e5dfe8] bg-white p-4 shadow-[0_2px_12px_rgba(67,51,75,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover"
    >
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
        <span className="rounded-full bg-[#f1edf3] px-2.5 py-1 text-[9px] font-semibold text-[#6c587c]">
          {count}
        </span>
        {!reorderMode && (
          <RowActions label={`Gérer ${category.name}`}>
            <ActionButton onClick={onOpen}>
              <Eye size={14} /> Voir les articles
            </ActionButton>
            <ActionButton onClick={onEdit}>
              <Pencil size={14} /> Modifier
            </ActionButton>
            <ActionButton onClick={onToggle}>
              <Power size={14} /> {category.active ? 'Désactiver' : 'Activer'}
            </ActionButton>
            <ActionButton danger onClick={onDelete}>
              <Trash2 size={14} /> Supprimer
            </ActionButton>
          </RowActions>
        )}
      </div>

      <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 text-left">
        <span
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${category.color}18`, color: category.color }}
        >
          <CategoryIcon category={category} />
        </span>
        <span className="min-w-0 flex-1 pr-9">
          <span className="block text-sm font-semibold leading-5 text-foreground">
            {category.name}
          </span>
          <span className="mt-1.5 block text-[10px] text-muted-foreground">
            article{count > 1 ? 's' : ''}
          </span>
          {!category.active && (
            <span className="mt-2 inline-flex rounded-full bg-[#f3f2f3] px-2 py-0.5 text-[9px] font-semibold text-[#777178]">
              Inactive
            </span>
          )}
        </span>
        {!reorderMode && (
          <ChevronRight
            size={17}
            className="absolute bottom-4 right-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          />
        )}
      </button>

      {reorderMode && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Position {category.order}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={first}
              onClick={() => onMove(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={`Monter ${category.name}`}
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              disabled={last}
              onClick={() => onMove(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={`Descendre ${category.name}`}
            >
              <ArrowDown size={14} />
            </button>
          </div>
        </div>
      )}
    </motion.article>
  );
}

function CategorySection({
  title,
  subtitle,
  categories,
  reorderMode,
  onToggleOrder,
  articleCount,
  onOpen,
  onEdit,
  onToggle,
  onDelete,
  onMove,
}: {
  title: string;
  subtitle: string;
  categories: ContentCategory[];
  reorderMode: boolean;
  onToggleOrder: () => void;
  articleCount: (name: string) => number;
  onOpen: (category: ContentCategory) => void;
  onEdit: (category: ContentCategory) => void;
  onToggle: (category: ContentCategory) => void;
  onDelete: (category: ContentCategory) => void;
  onMove: (category: ContentCategory, direction: -1 | 1) => void;
}) {
  return (
    <section className="rounded-[22px] border border-border bg-[#fbf9fb] p-4 shadow-card sm:p-5">
      <header className="flex flex-col gap-3 border-b border-border/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-base font-semibold text-foreground sm:text-lg">
              {title}
            </h2>
            <span className="rounded-full bg-[#ede7f1] px-2.5 py-1 text-[9px] font-bold text-primary">
              {categories.length} catégorie{categories.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onToggleOrder}
          className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-[11px] font-semibold transition-colors ${
            reorderMode
              ? 'border-primary/25 bg-primary-ghost text-primary'
              : 'border-border bg-white text-foreground hover:bg-muted'
          }`}
        >
          <ListOrdered size={14} />
          {reorderMode ? 'Terminer' : 'Gérer l’ordre'}
        </button>
      </header>

      {categories.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              count={articleCount(category.name)}
              reorderMode={reorderMode}
              first={index === 0}
              last={index === categories.length - 1}
              onOpen={() => onOpen(category)}
              onEdit={() => onEdit(category)}
              onToggle={() => onToggle(category)}
              onDelete={() => onDelete(category)}
              onMove={(direction) => onMove(category, direction)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucune catégorie disponible"
          description="Ajoutez une catégorie pour commencer à organiser les contenus."
        />
      )}
    </section>
  );
}

export default function CategoriesContent() {
  const [categories, setCategories] = useState(contentCategories);
  const [reorderDomain, setReorderDomain] = useState<CategoryDomain | null>(null);
  const [modal, setModal] = useState<CategoryModal>(null);

  const groupedCategories = useMemo(
    () => ({
      medical: categories
        .filter((category) => category.domain === 'medical')
        .sort((first, second) => first.order - second.order),
      religious: categories
        .filter((category) => category.domain === 'religious')
        .sort((first, second) => first.order - second.order),
    }),
    [categories]
  );

  const articleCount = (name: string) =>
    contentArticles.filter((article) => article.category === name).length;

  const saveCategory = (category: ContentCategory) => {
    const exists = categories.some((item) => item.id === category.id);
    setCategories((current) =>
      exists
        ? current.map((item) => (item.id === category.id ? category : item))
        : [...current, category]
    );
    toast.info(
      exists ? 'Catégorie mise à jour dans cette session.' : 'Catégorie ajoutée dans cette session.'
    );
    setModal(null);
  };

  const toggleCategory = (category: ContentCategory) => {
    setCategories((current) =>
      current.map((item) => (item.id === category.id ? { ...item, active: !item.active } : item))
    );
    toast.info(category.active ? 'Catégorie désactivée.' : 'Catégorie activée.');
  };

  const moveCategory = (category: ContentCategory, direction: -1 | 1) => {
    setCategories((current) => {
      const domainItems = current
        .filter((item) => item.domain === category.domain)
        .sort((first, second) => first.order - second.order);
      const index = domainItems.findIndex((item) => item.id === category.id);
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= domainItems.length) return current;
      [domainItems[index], domainItems[targetIndex]] = [
        domainItems[targetIndex],
        domainItems[index],
      ];
      const orderById = new Map(domainItems.map((item, itemIndex) => [item.id, itemIndex + 1]));
      return current.map((item) =>
        item.domain === category.domain
          ? { ...item, order: orderById.get(item.id) ?? item.order }
          : item
      );
    });
  };

  const sectionProps = (domain: CategoryDomain) => ({
    categories: groupedCategories[domain],
    reorderMode: reorderDomain === domain,
    onToggleOrder: () => setReorderDomain((current) => (current === domain ? null : domain)),
    articleCount,
    onOpen: (category: ContentCategory) => setModal({ type: 'articles', category }),
    onEdit: (category: ContentCategory) => setModal({ type: 'edit', category }),
    onToggle: toggleCategory,
    onDelete: (category: ContentCategory) => setModal({ type: 'delete', category }),
    onMove: moveCategory,
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Organisation éditoriale"
        title="Catégories"
        subtitle="Organisez les catégories de contenu de l’application."
        actionLabel="Ajouter une catégorie"
        onAction={() => setModal({ type: 'create' })}
      />

      <DemoNotice />

      <CategorySection
        title="Catégories médicales"
        subtitle="Contenus éducatifs et informations médicales sur la santé des femmes."
        {...sectionProps('medical')}
      />

      <CategorySection
        title="Catégorie religieuse"
        subtitle="Contenus religieux liés au cycle et à la pratique religieuse."
        {...sectionProps('religious')}
      />

      <aside className="flex items-start gap-3 rounded-[18px] border border-[#ddd2e5] bg-[#f4eff6] px-4 py-4 text-[#665173]">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/75 text-sm">
          i
        </span>
        <p className="text-xs leading-5">
          Les catégories médicales et religieuses sont séparées afin de garder une organisation
          claire des contenus dans l’administration.
        </p>
      </aside>

      <AnimatePresence>
        {modal?.type === 'create' && (
          <Modal title="Ajouter une catégorie" onClose={() => setModal(null)}>
            <CategoryForm
              existingSlugs={categories.map((item) => item.slug)}
              initialOrder={groupedCategories.medical.length + 1}
              onCancel={() => setModal(null)}
              onSave={saveCategory}
            />
          </Modal>
        )}

        {modal?.type === 'edit' && (
          <Modal
            title="Modifier la catégorie"
            subtitle={modal.category.name}
            onClose={() => setModal(null)}
          >
            <CategoryForm
              key={modal.category.id}
              category={modal.category}
              existingSlugs={categories.map((item) => item.slug)}
              initialOrder={modal.category.order}
              onCancel={() => setModal(null)}
              onSave={saveCategory}
            />
          </Modal>
        )}

        {modal?.type === 'articles' && (
          <Modal
            title={modal.category.name}
            subtitle={`${articleCount(modal.category.name)} article(s) associé(s)`}
            onClose={() => setModal(null)}
          >
            <div className="space-y-2 p-5 sm:p-6">
              {contentArticles
                .filter((article) => article.category === modal.category.name)
                .map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-3"
                  >
                    <span className="text-xs font-medium text-foreground">{article.title}</span>
                    <span className="shrink-0 text-[9px] uppercase tracking-wider text-muted-foreground">
                      {article.status}
                    </span>
                  </div>
                ))}
              {articleCount(modal.category.name) === 0 && (
                <EmptyState
                  title="Aucun article"
                  description="Cette catégorie n’est utilisée par aucun article."
                />
              )}
            </div>
          </Modal>
        )}

        {modal?.type === 'delete' && (
          <ConfirmDialog
            title="Supprimer la catégorie ?"
            message={
              articleCount(modal.category.name)
                ? `Cette catégorie est liée à ${articleCount(modal.category.name)} article(s). Elle ne peut pas être supprimée avant leur réaffectation.`
                : `La suppression de « ${modal.category.name} » est limitée à cette session.`
            }
            confirmLabel={articleCount(modal.category.name) ? 'Compris' : 'Supprimer'}
            onCancel={() => setModal(null)}
            onConfirm={() => {
              if (!articleCount(modal.category.name)) {
                setCategories((current) => current.filter((item) => item.id !== modal.category.id));
                toast.info('Catégorie supprimée de cette session.');
              }
              setModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
