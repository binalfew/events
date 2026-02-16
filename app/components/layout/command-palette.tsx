import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  CalendarDays,
  FileText,
  Loader2,
  Search,
  Settings,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import type { SearchResults } from "~/services/search.server";

// ─── Types ───────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResultItem {
  id: string;
  type: "participant" | "event" | "form" | "action" | "recent";
  label: string;
  description?: string;
  href: string;
  icon: React.ReactNode;
}

// ─── Constants ───────────────────────────────────────────

const RECENT_SEARCHES_KEY = "global-search-recent";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;

const QUICK_ACTIONS: SearchResultItem[] = [
  {
    id: "action-events",
    type: "action",
    label: "Go to Events",
    href: "/admin/events",
    icon: <CalendarDays className="size-4" />,
  },
  {
    id: "action-participants",
    type: "action",
    label: "Go to Participants",
    href: "/admin/participants",
    icon: <Users className="size-4" />,
  },
  {
    id: "action-settings",
    type: "action",
    label: "Go to Settings",
    href: "/admin/settings",
    icon: <Settings className="size-4" />,
  },
];

// ─── Helpers ─────────────────────────────────────────────

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // localStorage may be unavailable
  }
}

function mapResults(data: SearchResults): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  for (const p of data.participants) {
    items.push({
      id: `participant-${p.id}`,
      type: "participant",
      label: `${p.firstName} ${p.lastName}`,
      description: `${p.registrationCode} · ${p.eventName}`,
      href: `/admin/events/${encodeURIComponent(p.id)}`,
      icon: <Users className="size-4" />,
    });
  }

  for (const e of data.events) {
    items.push({
      id: `event-${e.id}`,
      type: "event",
      label: e.name,
      description: e.status,
      href: `/admin/events/${e.id}`,
      icon: <CalendarDays className="size-4" />,
    });
  }

  for (const f of data.forms) {
    items.push({
      id: `form-${f.id}`,
      type: "form",
      label: f.name,
      description: f.eventName,
      href: `/admin/events/forms`,
      icon: <FileText className="size-4" />,
    });
  }

  return items;
}

// ─── Component ───────────────────────────────────────────

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const abortRef = useRef<AbortController>(null);

  // Load recent searches when dialog opens
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      // Focus input after dialog animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Fetch search results with debounce
  const fetchResults = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const json = await res.json();
        setResults(mapResults(json.data));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    fetchResults(value);
  };

  const selectItem = (item: SearchResultItem) => {
    if (query.trim().length >= 2) {
      addRecentSearch(query.trim());
    }
    onOpenChange(false);
    navigate(item.href);
  };

  const handleRecentClick = (recent: string) => {
    setQuery(recent);
    setSelectedIndex(0);
    fetchResults(recent);
  };

  // Build the displayable items list
  const showResults = query.length >= 2;
  const displayItems = showResults ? results : QUICK_ACTIONS;

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-result-item]");
    items[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        setSelectedIndex((i) => (i < displayItems.length - 1 ? i + 1 : 0));
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : displayItems.length - 1));
        break;
      }
      case "Enter": {
        e.preventDefault();
        const item = displayItems[selectedIndex];
        if (item) selectItem(item);
        break;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[20%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Search</DialogTitle>

        {/* Search input */}
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search participants, events, forms..."
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>

        {/* Results area */}
        <div ref={listRef} className="max-h-[300px] overflow-y-auto p-2">
          {/* Recent searches (when query is empty) */}
          {!showResults && recentSearches.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="size-3" />
                Recent Searches
              </div>
              {recentSearches.map((recent) => (
                <button
                  key={recent}
                  type="button"
                  onClick={() => handleRecentClick(recent)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Search className="size-3 text-muted-foreground" />
                  <span>{recent}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick actions or search results */}
          {!showResults && (
            <div>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Quick Actions
              </div>
              {QUICK_ACTIONS.map((action, index) => (
                <button
                  key={action.id}
                  type="button"
                  data-result-item
                  onClick={() => selectItem(action)}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
                    selectedIndex === index ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                  }`}
                >
                  <span className="text-muted-foreground">{action.icon}</span>
                  <span className="flex-1 text-left">{action.label}</span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {showResults && results.length > 0 && (
            <div>
              {/* Group: Participants */}
              {results.filter((r) => r.type === "participant").length > 0 && (
                <div className="mb-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    <Users className="size-3" />
                    Participants
                  </div>
                  {results
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.type === "participant")
                    .map(({ item, index }) => (
                      <button
                        key={item.id}
                        type="button"
                        data-result-item
                        onClick={() => selectItem(item)}
                        className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
                          selectedIndex === index
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        <span className="text-muted-foreground">{item.icon}</span>
                        <span className="flex-1 text-left">
                          <span className="font-medium">{item.label}</span>
                          {item.description && (
                            <span className="ml-2 text-muted-foreground">{item.description}</span>
                          )}
                        </span>
                      </button>
                    ))}
                </div>
              )}

              {/* Group: Events */}
              {results.filter((r) => r.type === "event").length > 0 && (
                <div className="mb-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="size-3" />
                    Events
                  </div>
                  {results
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.type === "event")
                    .map(({ item, index }) => (
                      <button
                        key={item.id}
                        type="button"
                        data-result-item
                        onClick={() => selectItem(item)}
                        className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
                          selectedIndex === index
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        <span className="text-muted-foreground">{item.icon}</span>
                        <span className="flex-1 text-left">
                          <span className="font-medium">{item.label}</span>
                          {item.description && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.description}
                            </Badge>
                          )}
                        </span>
                      </button>
                    ))}
                </div>
              )}

              {/* Group: Forms */}
              {results.filter((r) => r.type === "form").length > 0 && (
                <div className="mb-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    <FileText className="size-3" />
                    Forms
                  </div>
                  {results
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.type === "form")
                    .map(({ item, index }) => (
                      <button
                        key={item.id}
                        type="button"
                        data-result-item
                        onClick={() => selectItem(item)}
                        className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
                          selectedIndex === index
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        <span className="text-muted-foreground">{item.icon}</span>
                        <span className="flex-1 text-left">
                          <span className="font-medium">{item.label}</span>
                          {item.description && (
                            <span className="ml-2 text-muted-foreground">{item.description}</span>
                          )}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {showResults && !loading && results.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
            <span>Navigate</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
            <span>Open</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
