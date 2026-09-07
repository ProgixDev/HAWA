'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Copy,
  Download,
  Eye,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Filter,
  Link2,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { CURRENT_ADMIN } from '@/config/admin';
import { contentCategories, mediaAssets } from '@/data/mock/content';
import type { MediaAsset, MediaKind } from '@/types';
import {
  ActionButton,
  ConfirmDialog,
  DemoNotice,
  EmptyState,
  FieldLabel,
  formatContentDate,
  formatFileSize,
  inputClassName,
  Modal,
  PageHeader,
  Pagination,
  RowActions,
  SearchInput,
  SelectField,
  SortButton,
  type SortDirection,
  Tabs,
} from './ContentUI';

type MediaTab = 'all' | 'image' | 'video' | 'document' | 'icon' | 'other';
type MediaSort = 'name' | 'uploadedAt' | 'size';
type MediaModal =
  | { type: 'upload' }
  | { type: 'view' | 'rename' | 'replace' | 'delete'; item: MediaAsset }
  | null;

const KIND_META: Record<MediaKind, { label: string; icon: React.ElementType; style: string }> = {
  image: { label: 'Image', icon: FileImage, style: 'bg-[#eee8f3] text-[#6c587c]' },
  video: { label: 'Vidéo', icon: FileVideo, style: 'bg-[#e8eef5] text-[#526d89]' },
  document: { label: 'Document', icon: FileText, style: 'bg-[#f6eadf] text-[#9a6742]' },
  icon: { label: 'Icône', icon: FileImage, style: 'bg-[#e8f0ed] text-[#527468]' },
  audio: { label: 'Audio', icon: FileAudio, style: 'bg-[#f1ece2] text-[#856d43]' },
  other: { label: 'Autre', icon: File, style: 'bg-[#f1f0f1] text-[#726d73]' },
};

const allowedFiles: Record<string, { mime: string[]; kind: MediaKind }> = {
  jpg: { mime: ['image/jpeg'], kind: 'image' },
  jpeg: { mime: ['image/jpeg'], kind: 'image' },
  png: { mime: ['image/png'], kind: 'image' },
  webp: { mime: ['image/webp'], kind: 'image' },
  svg: { mime: ['image/svg+xml'], kind: 'icon' },
  pdf: { mime: ['application/pdf'], kind: 'document' },
  mp4: { mime: ['video/mp4'], kind: 'video' },
  mp3: { mime: ['audio/mpeg', 'audio/mp3'], kind: 'audio' },
};

const tabs: Array<{ value: MediaTab; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Vidéos' },
  { value: 'document', label: 'Documents' },
  { value: 'icon', label: 'Icônes' },
  { value: 'other', label: 'Autres' },
];

function validateFile(
  file: globalThis.File
): { valid: true; kind: MediaKind } | { valid: false; error: string } {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const rule = allowedFiles[extension];
  if (!rule || !rule.mime.includes(file.type))
    return { valid: false, error: 'Format non pris en charge ou type MIME incohérent.' };
  if (file.size > 25 * 1024 * 1024)
    return { valid: false, error: 'Le fichier dépasse la limite de 25 Mo.' };
  return { valid: true, kind: rule.kind };
}

function UploadForm({
  replacement,
  onCancel,
  onSave,
}: {
  replacement?: MediaAsset;
  onCancel: () => void;
  onSave: (asset: MediaAsset) => void;
}) {
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [category, setCategory] = useState(replacement?.category ?? contentCategories[0].name);
  const [error, setError] = useState('');
  return (
    <form
      className="space-y-5 p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!file) {
          setError('Sélectionnez un fichier.');
          return;
        }
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }
        onSave({
          id: replacement?.id ?? `media-session-${Date.now()}`,
          name: file.name,
          kind: validation.kind,
          mimeType: file.type,
          size: file.size,
          category,
          uploadedAt: new Date().toISOString(),
          url: URL.createObjectURL(file),
          uploadedBy: CURRENT_ADMIN.name,
          usedBy: replacement?.usedBy ?? [],
        });
      }}
    >
      <DemoNotice />
      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary-ghost/50 px-6 text-center transition-colors hover:bg-primary-ghost">
        <Upload size={25} className="mb-3 text-primary" />
        <span className="text-xs font-semibold text-foreground">
          {file
            ? file.name
            : replacement
              ? 'Choisir le fichier de remplacement'
              : 'Choisir un fichier'}
        </span>
        <span className="mt-1 text-[10px] leading-5 text-muted-foreground">
          JPG, JPEG, PNG, WEBP, SVG, PDF, MP4 ou MP3 · 25 Mo maximum
        </span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.svg,.pdf,.mp4,.mp3"
          className="sr-only"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
            setError('');
            if (selected) {
              const validation = validateFile(selected);
              if (!validation.valid) setError(validation.error);
            }
          }}
        />
      </label>
      {error && (
        <p className="rounded-xl bg-danger-bg px-3 py-2 text-[11px] text-danger">{error}</p>
      )}
      <SelectField label="Catégorie" value={category} onChange={setCategory}>
        {contentCategories.map((item) => (
          <option key={item.id} value={item.name}>
            {item.name}
          </option>
        ))}
      </SelectField>
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
          {replacement ? 'Remplacer' : 'Ajouter le média'}
        </button>
      </div>
    </form>
  );
}

function MediaPreview({ item, large = false }: { item: MediaAsset; large?: boolean }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  if (item.kind === 'image' || item.kind === 'icon')
    return (
      <div
        role="img"
        aria-label={item.name}
        className={`bg-[#f3f0f3] bg-contain bg-center bg-no-repeat ${large ? 'h-72 rounded-2xl' : 'h-36 w-full'}`}
        style={{ backgroundImage: `url("${item.url}")` }}
      />
    );
  return (
    <div
      className={`flex items-center justify-center ${meta.style} ${large ? 'h-72 rounded-2xl' : 'h-36 w-full'}`}
    >
      <Icon size={large ? 54 : 30} strokeWidth={1.5} />
    </div>
  );
}

export default function MediaContent() {
  const [items, setItems] = useState(mediaAssets);
  const [tab, setTab] = useState<MediaTab>('all');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<'all' | MediaKind>('all');
  const [category, setCategory] = useState('all');
  const [size, setSize] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [usage, setUsage] = useState<'all' | 'used' | 'unused'>('all');
  const [showMore, setShowMore] = useState(false);
  const [sort, setSort] = useState<MediaSort>('uploadedAt');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState<MediaModal>(null);
  const categories = Array.from(new Set(items.map((item) => item.category))).sort();
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr');
    return items.filter(
      (item) =>
        (tab === 'all' ||
          (tab === 'other' ? item.kind === 'audio' || item.kind === 'other' : item.kind === tab)) &&
        (!query ||
          `${item.name} ${item.category} ${item.mimeType}`
            .toLocaleLowerCase('fr')
            .includes(query)) &&
        (kind === 'all' || item.kind === kind) &&
        (category === 'all' || item.category === category) &&
        (size === 'all' ||
          (size === 'small' && item.size < 500 * 1024) ||
          (size === 'medium' && item.size >= 500 * 1024 && item.size < 5 * 1024 * 1024) ||
          (size === 'large' && item.size >= 5 * 1024 * 1024)) &&
        (usage === 'all' || (usage === 'used' ? item.usedBy.length > 0 : item.usedBy.length === 0))
    );
  }, [category, items, kind, search, size, tab, usage]);
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const multiplier = direction === 'asc' ? 1 : -1;
        if (sort === 'name') return a.name.localeCompare(b.name, 'fr') * multiplier;
        if (sort === 'size') return (a.size - b.size) * multiplier;
        return (new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()) * multiplier;
      }),
    [direction, filtered, sort]
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)));
  const visible = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const handleSort = (field: MediaSort) => {
    if (sort === field) setDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(field);
      setDirection('asc');
    }
    setPage(1);
  };
  const saveUpload = (asset: MediaAsset) => {
    const replacement = items.find((item) => item.id === asset.id);
    if (replacement?.url.startsWith('blob:')) URL.revokeObjectURL(replacement.url);
    setItems((current) =>
      replacement
        ? current.map((item) => (item.id === asset.id ? asset : item))
        : [asset, ...current]
    );
    toast.info(
      replacement ? 'Média remplacé dans cette session.' : 'Média ajouté dans cette session.'
    );
    setModal(null);
  };
  const download = (item: MediaAsset) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const copyUrl = async (item: MediaAsset) => {
    try {
      const url = item.url.startsWith('blob:') ? item.url : `${window.location.origin}${item.url}`;
      await navigator.clipboard.writeText(url);
      toast.success('URL copiée.');
    } catch {
      toast.error('Impossible de copier l’URL.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Bibliothèque de fichiers"
        title="Médias"
        subtitle="Gérez toutes les images, vidéos et fichiers utilisés dans vos contenus."
        actionLabel="Ajouter un média"
        onAction={() => setModal({ type: 'upload' })}
      />
      <DemoNotice />
      <section className="rounded-[18px] border border-border bg-white shadow-card">
        <Tabs
          value={tab}
          onChange={(value) => {
            setTab(value);
            setPage(1);
          }}
          items={tabs}
        />
        <div className="flex flex-wrap gap-2 p-4">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Rechercher un média..."
          />
          <SelectField
            compact
            label="Type"
            value={kind}
            onChange={(value) => {
              setKind(value as 'all' | MediaKind);
              setPage(1);
            }}
          >
            <option value="all">Type</option>
            {Object.entries(KIND_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </SelectField>
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
            label="Taille"
            value={size}
            onChange={(value) => {
              setSize(value as typeof size);
              setPage(1);
            }}
          >
            <option value="all">Taille</option>
            <option value="small">Moins de 500 Ko</option>
            <option value="medium">500 Ko à 5 Mo</option>
            <option value="large">Plus de 5 Mo</option>
          </SelectField>
          <button
            type="button"
            onClick={() => setShowMore((value) => !value)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold ${showMore ? 'border-primary/25 bg-primary-ghost text-primary' : 'border-border bg-white text-foreground hover:bg-muted'}`}
          >
            <Filter size={14} /> Plus de filtres
          </button>
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
                    label="Utilisation"
                    value={usage}
                    onChange={(value) => setUsage(value as typeof usage)}
                  >
                    <option value="all">Toutes les utilisations</option>
                    <option value="used">Utilisés</option>
                    <option value="unused">Non utilisés</option>
                  </SelectField>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      <section className="rounded-[18px] border border-border bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground">{sorted.length}</strong> média(s)
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Trier :{' '}
            <SortButton
              label="Nom"
              field="name"
              activeField={sort}
              direction={direction}
              onSort={handleSort}
            />
            <SortButton
              label="Date"
              field="uploadedAt"
              activeField={sort}
              direction={direction}
              onSort={handleSort}
            />
            <SortButton
              label="Taille"
              field="size"
              activeField={sort}
              direction={direction}
              onSort={handleSort}
            />
          </div>
        </div>
        {visible.length ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visible.map((item) => {
              const meta = KIND_META[item.kind];
              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-[#fcfbfa] transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <button
                    type="button"
                    onClick={() => setModal({ type: 'view', item })}
                    className="block w-full overflow-hidden text-left"
                  >
                    <MediaPreview item={item} />
                  </button>
                  <div className="flex items-start gap-3 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {meta.label} · {formatFileSize(item.size)}
                      </p>
                      {item.dimensions && (
                        <p className="mt-0.5 text-[9px] text-muted-foreground/80">
                          {item.dimensions}
                        </p>
                      )}
                    </div>
                    <RowActions label={`Actions pour ${item.name}`}>
                      <ActionButton onClick={() => setModal({ type: 'view', item })}>
                        <Eye size={14} /> Voir
                      </ActionButton>
                      <ActionButton onClick={() => void copyUrl(item)}>
                        <Copy size={14} /> Copier l’URL
                      </ActionButton>
                      <ActionButton onClick={() => download(item)}>
                        <Download size={14} /> Télécharger
                      </ActionButton>
                      <ActionButton onClick={() => setModal({ type: 'rename', item })}>
                        <Pencil size={14} /> Renommer
                      </ActionButton>
                      <ActionButton onClick={() => setModal({ type: 'replace', item })}>
                        <RefreshCw size={14} /> Remplacer
                      </ActionButton>
                      <ActionButton onClick={() => setModal({ type: 'view', item })}>
                        <Link2 size={14} /> Voir les utilisations
                      </ActionButton>
                      <ActionButton danger onClick={() => setModal({ type: 'delete', item })}>
                        <Trash2 size={14} /> Supprimer
                      </ActionButton>
                    </RowActions>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Aucun média trouvé"
            description="Ajustez les filtres ou ajoutez un nouveau fichier à la bibliothèque."
          />
        )}
        <Pagination
          page={safePage}
          total={sorted.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </section>
      <AnimatePresence>
        {modal?.type === 'upload' && (
          <Modal
            title="Ajouter un média"
            subtitle="Importer un fichier dans la bibliothèque"
            onClose={() => setModal(null)}
          >
            <UploadForm onCancel={() => setModal(null)} onSave={saveUpload} />
          </Modal>
        )}
        {modal?.type === 'replace' && (
          <Modal
            title="Remplacer le média"
            subtitle={modal.item.name}
            onClose={() => setModal(null)}
          >
            <UploadForm
              replacement={modal.item}
              onCancel={() => setModal(null)}
              onSave={saveUpload}
            />
          </Modal>
        )}
        {modal?.type === 'view' && (
          <Modal title="Détails du média" subtitle={modal.item.name} onClose={() => setModal(null)}>
            <div className="space-y-5 p-5 sm:p-6">
              <MediaPreview item={modal.item} large />
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Type', `${KIND_META[modal.item.kind].label} · ${modal.item.mimeType}`],
                  ['Taille', formatFileSize(modal.item.size)],
                  ['Dimensions', modal.item.dimensions ?? '—'],
                  ['Durée', modal.item.duration ?? '—'],
                  ['Ajouté le', formatContentDate(modal.item.uploadedAt)],
                  ['Ajouté par', modal.item.uploadedBy],
                  ['Chemin', modal.item.url],
                  [
                    'Utilisé dans',
                    modal.item.usedBy.length ? modal.item.usedBy.join(', ') : 'Aucune utilisation',
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#f5f2f5] p-3">
                    <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 break-all text-[11px] font-medium text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Modal>
        )}
        {modal?.type === 'rename' && (
          <Modal
            title="Renommer le média"
            subtitle={modal.item.name}
            onClose={() => setModal(null)}
          >
            <form
              className="space-y-5 p-5 sm:p-6"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const name = String(form.get('name') ?? '').trim();
                if (!name) return;
                setItems((current) =>
                  current.map((item) => (item.id === modal.item.id ? { ...item, name } : item))
                );
                toast.info('Média renommé dans cette session.');
                setModal(null);
              }}
            >
              <DemoNotice />
              <label>
                <FieldLabel>Nouveau nom</FieldLabel>
                <input
                  name="name"
                  required
                  defaultValue={modal.item.name}
                  className={inputClassName}
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="h-10 rounded-xl border border-border bg-white px-4 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-primary px-5 text-xs font-semibold text-white"
                >
                  Renommer
                </button>
              </div>
            </form>
          </Modal>
        )}
        {modal?.type === 'delete' && (
          <ConfirmDialog
            title="Supprimer ce média ?"
            message={
              modal.item.usedBy.length
                ? `Attention : « ${modal.item.name} » est utilisé dans ${modal.item.usedBy.join(', ')}. Sa suppression de cette session peut laisser ces contenus sans média.`
                : `« ${modal.item.name} » n’est référencé par aucun contenu. La suppression reste limitée à cette session.`
            }
            confirmLabel="Supprimer"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              if (modal.item.url.startsWith('blob:')) URL.revokeObjectURL(modal.item.url);
              setItems((current) => current.filter((item) => item.id !== modal.item.id));
              toast.info('Média supprimé de cette session.');
              setModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
