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

const CATEGORY_TAB_SELECTOR = ".menu-tab";
const CATEGORY_CLIP_TOLERANCE = 0.5;
const CATEGORY_SCROLL_GUTTER = 4;
const CATEGORY_SCROLL_EDGE_TOLERANCE = 1;

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
  scrollControls = false,
}: {
  tabs: MenuTab[];
  active: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
  scrollControls?: boolean;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ left: false, right: false });

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

  useEffect(() => {
    const container = rail.current;
    if (!container || !scrollControls) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = container.getBoundingClientRect();
        const buttons = container.querySelectorAll<HTMLButtonElement>(CATEGORY_TAB_SELECTOR);
        buttons.forEach((button) => {
          const buttonBounds = button.getBoundingClientRect();
          button.dataset.edgeClipped = String(
            buttonBounds.left < bounds.left - CATEGORY_CLIP_TOLERANCE ||
              buttonBounds.right > bounds.right + CATEGORY_CLIP_TOLERANCE,
          );
        });

        const firstButton = buttons[0];
        const startOffset = firstButton
          ? Math.max(
              0,
              container.scrollLeft + firstButton.getBoundingClientRect().left - bounds.left - CATEGORY_SCROLL_GUTTER,
            )
          : 0;
        const next = {
          left: container.scrollLeft > startOffset + CATEGORY_SCROLL_EDGE_TOLERANCE,
          right: container.scrollLeft + container.clientWidth < container.scrollWidth - CATEGORY_SCROLL_EDGE_TOLERANCE,
        };
        setScrollState((previous) =>
          previous.left === next.left && previous.right === next.right ? previous : next,
        );
      });
    };

    update();
    container.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);
    container.querySelectorAll(CATEGORY_TAB_SELECTOR).forEach((button) => resizeObserver.observe(button));

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, [scrollControls, tabs.length]);

  const scrollToNextCategory = (direction: -1 | 1) => {
    const container = rail.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>(CATEGORY_TAB_SELECTOR));
    const target =
      direction > 0
        ? buttons.find((button) => button.getBoundingClientRect().right > bounds.right - CATEGORY_CLIP_TOLERANCE)
        : [...buttons]
            .reverse()
            .find((button) => button.getBoundingClientRect().left < bounds.left + CATEGORY_CLIP_TOLERANCE);

    if (!target) return;

    const targetLeft =
      container.scrollLeft + target.getBoundingClientRect().left - bounds.left - CATEGORY_SCROLL_GUTTER;
    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  const tabsRail = (
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

  if (!scrollControls) return tabsRail;

  return (
    <div className={`menu-tabs-scroll-frame${className ? ` ${className}-frame` : ""}`}>
      <button
        type="button"
        className="bev-category-scroll-control"
        aria-label={`Scroll ${label.toLowerCase()} left`}
        disabled={!scrollState.left}
        onClick={() => scrollToNextCategory(-1)}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="m10 3-5 5 5 5" />
        </svg>
      </button>
      {tabsRail}
      <button
        type="button"
        className="bev-category-scroll-control"
        aria-label={`Scroll ${label.toLowerCase()} right`}
        disabled={!scrollState.right}
        onClick={() => scrollToNextCategory(1)}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="m6 3 5 5-5 5" />
        </svg>
      </button>
    </div>
  );
}

/* Smooth scroll so list top sits just below the pinned toolbar. */
export function scrollListIntoView(list: HTMLElement | null, behavior?: ScrollBehavior) {
  if (!list) return;
  const bar = document.querySelector<HTMLElement>(".menu-sticky");

  if (!bar) return;
  const stickyTop =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sticky-top")) || 0;
  const target = list.getBoundingClientRect().top + window.scrollY - stickyTop - bar.offsetHeight - 12;
  window.scrollTo({ top: target, behavior: behavior ?? (prefersReducedMotion() ? "auto" : "smooth") });
}

/* Publishes the pinned header height so sticky menu bars stack under it. */
export function useStickyHeaderOffset(stickyEnabled = true) {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".header");
    if (!header) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const pinned = stickyEnabled && getComputedStyle(header).position === "sticky";
      const height = `${pinned ? header.offsetHeight : 0}px`;
      for (const property of ["--sticky-top", "--header-h"]) {
        if (root.style.getPropertyValue(property) !== height) root.style.setProperty(property, height);
      }
    };
    // These values can resize ancestors observed elsewhere. Write outside the
    // ResizeObserver delivery cycle to avoid a WebKit resize-loop warning.
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    observer?.observe(header);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [stickyEnabled]);
}
