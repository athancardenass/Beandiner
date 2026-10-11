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
    <div className={`search menu-search${value ? " has-value" : ""}`}>
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
    const root = document.documentElement;
    let observer: IntersectionObserver | null = null;
    let rootMargin = "";
    let active = true;
    const update = () => {
      if (!active) return;
      const style = getComputedStyle(root);
      const top =
        parseFloat(
          style.getPropertyValue("--header-h") || style.getPropertyValue("--sticky-top"),
        ) || 0;
      // Include below-fold positions so direct scroll jumps still cross the threshold.
      const nextMargin = `-${top + 1}px 0px ${root.scrollHeight}px 0px`;
      if (observer && nextMargin === rootMargin) return;
      observer?.disconnect();
      rootMargin = nextMargin;
      const nextObserver = new IntersectionObserver(
        ([entry]) => {
          if (!active || observer !== nextObserver) return;
          setStuck(entry.boundingClientRect.top < (entry.rootBounds?.top ?? top + 1));
        },
        { rootMargin, threshold: 1 },
      );
      observer = nextObserver;
      observer.observe(node);
    };
    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(root);
    const styleObserver = new MutationObserver(update);
    styleObserver.observe(root, { attributes: true, attributeFilter: ["style"] });
    window.addEventListener("resize", update);
    return () => {
      active = false;
      observer?.disconnect();
      resizeObserver.disconnect();
      styleObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <div ref={sentinel} className="menu-sticky-sentinel" aria-hidden="true" />
      <div
        role="region"
        aria-label={label}
        className={`menu-toolbar menu-sticky${stuck ? " is-stuck" : ""}${className ? ` ${className}` : ""}`}
      >
        <div className="menu-toolbar__inner">{children}</div>
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
    <div ref={rail} className={`chips menu-tabs${className ? ` ${className}` : ""}`} role="group" aria-label={label}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            data-tab={tab.id}
            className={`chip menu-tab${isActive ? " active" : ""}`}
            aria-pressed={isActive}
            onClick={() => onChange(tab.id)}
          >
            {isActive && <svg className="menu-tab-selected" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6" /></svg>}
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
      const h = pinned ? header.offsetHeight : 0;
      root.style.setProperty("--sticky-top", `${h}px`);
      root.style.setProperty("--header-h", `${h}px`);
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
