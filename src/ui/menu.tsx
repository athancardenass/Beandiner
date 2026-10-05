import {
  useEffect,
  useId,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* Menus longer than this get a search field. */
export const SEARCH_THRESHOLD = 15;

export const normalizeQuery = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const matchesQuery = (query: string, ...fields: (string | null | undefined)[]) =>
  !query || fields.some((field) => field && normalizeQuery(field).includes(query));

export function MenuSearch({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
}) {
  const id = useId();
  return (
    <div className={`menu-search${value ? " has-value" : ""}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <SearchIcon />
      <input
        id={id}
        type="search"
        inputMode="search"
        autoComplete="off"
        enterKeyHint="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            onChange("");
          }
        }}
      />
      {value && (
        <button
          type="button"
          className="menu-search-clear"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export function MenuResultsNote({
  query,
  count,
}: {
  query: string;
  count: number;
}) {
  const trimmed = query.trim();
  if (!trimmed) return null;
  return (
    <p className="menu-results" aria-live="polite" aria-atomic="true">
      {count === 0
        ? `No matches for "${trimmed}"`
        : `${count} ${count === 1 ? "match" : "matches"} for "${trimmed}"`}
    </p>
  );
}

/* Image that fades in from a tinted placeholder once decoded. Width/height or a
   sized parent must reserve space so nothing shifts while it loads. */
export function FadeImage({
  className = "",
  onLoad,
  onError,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      decoding="async"
      {...props}
      ref={(el) => {
        if (el && !loaded && el.complete && el.naturalWidth > 0) setLoaded(true);
      }}
      className={`fade-img${loaded ? " is-loaded" : ""}${className ? ` ${className}` : ""}`}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        setLoaded(true);
        onError?.(event);
      }}
    />
  );
}

export function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

/* Sticky toolbar that gains a hairline and shadow once it is pinned. */
export function StickyMenuBar({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      const top =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--sticky-top"),
        ) || 0;
      setStuck(node.getBoundingClientRect().top < top);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <>
      <div ref={sentinel} className="menu-sticky-sentinel" aria-hidden="true" />
      <div
        role="region"
        aria-label={label}
        className={`menu-sticky${stuck ? " is-stuck" : ""}${className ? ` ${className}` : ""}`}
      >
        {children}
      </div>
    </>
  );
}

export type MenuTab = { id: string; label: string; count?: number };

/* Horizontal category tabs. Buttons use aria-pressed because they filter one
   shared list instead of swapping tab panels. */
export function CategoryTabs({
  tabs,
  active,
  onChange,
  label,
  className = "",
}: {
  tabs: MenuTab[];
  active: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const button = rail.current?.querySelector<HTMLButtonElement>(
      `[data-tab="${CSS.escape(active)}"]`,
    );
    const container = rail.current;
    if (!button || !container) return;
    const left = button.offsetLeft - container.clientWidth / 2 + button.clientWidth / 2;
    container.scrollTo({
      left: Math.max(0, left),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <div ref={rail} className={`menu-tabs${className ? ` ${className}` : ""}`} role="group" aria-label={label}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            data-tab={tab.id}
            className={`menu-tab${isActive ? " active" : ""}`}
            aria-pressed={isActive}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="menu-tab-count" aria-label={`${tab.count} items`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* Smooth scroll so list top sits just below the pinned toolbar. */
export function scrollListIntoView(list: HTMLElement | null) {
  if (!list) return;
  const bar = document.querySelector<HTMLElement>(".menu-sticky");

  if (!bar) return;
  const stickyTop =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sticky-top")) || 0;
  const target = list.getBoundingClientRect().top + window.scrollY - stickyTop - bar.offsetHeight - 12;
  window.scrollTo({ top: target, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

/* Publishes the pinned header height (mobile only, where the header is sticky)
   so menu bars stack under it instead of sliding beneath. */
export function useStickyHeaderOffset() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".header");
    if (!header) return;
    const root = document.documentElement;
    const update = () => {
      const pinned = getComputedStyle(header).position === "sticky";
      root.style.setProperty("--sticky-top", pinned ? `${header.offsetHeight}px` : "0px");
    };
    update();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(header);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
}
