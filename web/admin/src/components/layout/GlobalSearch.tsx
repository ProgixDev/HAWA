'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import {
  buildAdministratorEntries,
  buildArticleEntries,
  buildNotificationEntries,
  buildRoleEntries,
  filterGlobalSearchEntries,
  getStaticSearchEntries,
} from '@/lib/globalSearch';
import { useArticlesSession } from '@/stores/contentArticlesSessionStore';
import { useNotificationsSession } from '@/stores/notificationsSessionStore';
import { useSecuritySession } from '@/stores/securitySessionStore';

// Frontend-only global search over the admin's existing mock/session data —
// no backend, no API. See web/admin/TODO.md §1.2 (Topbar search).
export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const articles = useArticlesSession();
  const campaigns = useNotificationsSession();
  const { administrators, roles } = useSecuritySession();

  // Static entries (users, categories, plans, tickets, ...) are built once at
  // module load; only the three session-backed slices are remapped here, and
  // only when their store actually changes.
  const entries = useMemo(
    () => [
      ...getStaticSearchEntries(),
      ...buildArticleEntries(articles),
      ...buildNotificationEntries(campaigns),
      ...buildAdministratorEntries(administrators),
      ...buildRoleEntries(roles),
    ],
    [articles, campaigns, administrators, roles]
  );

  const groups = useMemo(() => filterGlobalSearchEntries(entries, query), [entries, query]);

  // Flatten with a stable global index so ArrowUp/ArrowDown/Enter can move
  // across group boundaries without an O(n) `indexOf` per row on every render.
  const groupsWithIndex = useMemo(() => {
    let cursor = 0;
    return groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ item, index: cursor++ })),
    }));
  }, [groups]);
  const resultCount = groupsWithIndex.reduce((sum, group) => sum + group.items.length, 0);

  const hasQuery = query.trim().length > 0;
  const showPanel = open && hasQuery;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, resultCount]);

  useEffect(() => {
    if (!showPanel) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showPanel]);

  function goToResult(href: string) {
    router.push(href);
    // The dropdown closes but the query is kept — refining or picking another
    // result for the same search doesn't require retyping it.
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      if (open) setOpen(false);
      return;
    }
    if (!showPanel || resultCount === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % resultCount);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + resultCount) % resultCount);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = groupsWithIndex
        .flatMap((group) => group.items)
        .find((row) => row.index === activeIndex);
      if (target) goToResult(target.item.href);
    }
  }

  return (
    <div ref={containerRef} className="relative hidden md:flex items-center">
      <div className="relative w-[220px]">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none"
        />
        <input
          ref={inputRef}
          // `type="text"`, not `"search"` — the native `search` input clears
          // itself on Escape in Chromium/WebKit, which fights with the
          // deliberate choice below to keep the query after closing the panel.
          // The custom clear button covers what the native affordance would.
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (hasQuery) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher dans l'administration…"
          aria-label="Recherche globale dans l'administration"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="global-search-results"
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full h-9 pl-9 pr-8 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
        />
        {hasQuery && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Effacer la recherche"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          aria-label="Résultats de la recherche"
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-[420px] overflow-y-auto scrollbar-thin bg-card rounded-2xl border border-border shadow-dropdown z-50"
        >
          {resultCount === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">Aucun résultat trouvé</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Essayez avec un autre nom, email ou mot-clé.
              </p>
            </div>
          ) : (
            <div className="py-2">
              {groupsWithIndex.map((group) => {
                return (
                  <div key={group.group} className="px-2 py-1">
                    <p className="px-2 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.groupLabel}
                      {group.totalMatches > group.items.length && (
                        <span className="ml-1 normal-case font-medium text-muted-foreground/70">
                          ({group.totalMatches})
                        </span>
                      )}
                    </p>
                    {group.items.map(({ item, index }) => {
                      const Icon = item.icon;
                      const active = index === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => goToResult(item.href)}
                          className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                            active ? 'bg-primary-ghost/60' : 'hover:bg-muted/50'
                          }`}
                        >
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Icon size={15} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.subtitle}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
