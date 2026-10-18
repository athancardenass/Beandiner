import { useMemo, useRef, useState } from "react";
import { foodCategories, type DinerBite } from "./dinerBites";
import {
  CategoryTabs,
  FadeImage,
  MenuResultsNote,
  MenuSearch,
  PlusIcon,
  SEARCH_THRESHOLD,
  StickyMenuBar,
  matchesQuery,
  normalizeQuery,
  scrollListIntoView,
} from "./ui/menu";

type DinerBitesPageProps = {
  onAdd: (bite: DinerBite) => void;
};

const money = (amount: number | null) =>
  amount !== null ? `₱${amount.toLocaleString("en-PH")}` : "Price TBD";

function FoodItem({
  bite,
  onAdd,
}: {
  bite: DinerBite;
  onAdd: (bite: DinerBite) => void;
}) {
  return (
    <article className="food-page-item" key={bite.id}>
      <div className="food-page-item-top">
        <span>{bite.badge}</span>
        <span>{bite.tag}</span>
      </div>
      <h3>{bite.name}</h3>
      <span className="food-page-item-subtitle">{bite.subtitle}</span>
      <p>{bite.description}</p>
      <div className="food-page-item-bottom">
        {bite.price === null || bite.sample ? (
          <>
            <strong className="food-page-price-pending">Price TBD</strong>
            <span className="food-page-sample-state">Preview only</span>
          </>
        ) : (
          <>
            <strong>{money(bite.price)}</strong>
            <button
              type="button"
              className="button menu-add-btn"
              onClick={() => onAdd(bite)}
              aria-label={`Add ${bite.name} to bag`}
            >
              <PlusIcon size={14} /> Add to bag
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function DinerBitesPage({
  onAdd,
}: DinerBitesPageProps) {
  const [activeCategory, setActiveCategory] = useState(foodCategories[0].id);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const mobileCategoryTriggerRef = useRef<HTMLButtonElement>(null);

  const totalDishes = foodCategories.reduce(
    (acc, cat) => acc + cat.items.length,
    0,
  );
  const showSearch = totalDishes > SEARCH_THRESHOLD;
  const q = normalizeQuery(query);

  const visibleCategories = useMemo(
    () =>
      foodCategories
        .filter((cat) => cat.id === activeCategory)
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((bite) =>
            matchesQuery(
              q,
              bite.name,
              bite.subtitle,
              bite.description,
              bite.badge,
              bite.tag,
              cat.name,
              ...(bite.options ?? []),
            ),
          ),
        }))
        .filter((cat) => cat.items.length > 0),
    [activeCategory, q],
  );

  const resultCount = visibleCategories.reduce(
    (n, cat) => n + cat.items.length,
    0,
  );

  const tabs = foodCategories.map((cat) => ({
    id: cat.id,
    label: cat.name,
    count: cat.items.length,
  }));
  const mobileFeaturedTabs = tabs.slice(0, 2).map(({ id, label }) => ({
    id,
    label: id === "croffles" ? "Croffles" : label,
  }));
  const moreCategoryTabs = tabs.slice(2);
  const activeCategoryLabel =
    tabs.find((tab) => tab.id === activeCategory)?.label ?? tabs[0].label;
  const mobileCategoryTriggerLabel =
    mobileFeaturedTabs.some((tab) => tab.id === activeCategory)
      ? "Browse categories"
      : activeCategoryLabel;

  const changeCategory = (id: string) => {
    setMobileCategoriesOpen(false);
    setActiveCategory(id);
    requestAnimationFrame(() => scrollListIntoView(listRef.current));
  };

  const changeMobileCategory = (id: string) => {
    changeCategory(id);
    mobileCategoryTriggerRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <section className="food-page-hero" aria-labelledby="food-page-title">
        <FadeImage
          src="./images/optimized/menu-categories/food-menu-overview.webp"
          alt=""
          aria-hidden="true"
          className="food-page-hero-image"
          loading="eager"
        />
        <div className="food-page-hero-inner">
          <h1 id="food-page-title">
            Diner bites &amp; <em>comfort plates.</em>
          </h1>
          <div className="food-page-hero-bottom">
            <p>
              Crispy chicken wings, loaded nachos, freshly pressed croffles, and hearty skillets.
            </p>
            <a className="button food-page-hero-link" href="#food-menu">
              Browse the food menu
            </a>
          </div>
        </div>
      </section>

      <section
        className="food-page-menu"
        id="food-menu"
        aria-labelledby="food-menu-title"
      >
        <div className="food-page-menu-heading">
          <h2 id="food-menu-title">
            Find your <em>comfort.</em>
          </h2>
          <p>
            {totalDishes} chef-prepared dishes across {foodCategories.length} categories,
            crafted fresh to order on Antonio Luna Street.
          </p>
        </div>

        {/* Sticky Toolbar with Search and Category Tabs */}
        <StickyMenuBar label="Food menu controls" className="food-sticky">
          {showSearch && (
            <MenuSearch
              value={query}
              onChange={setQuery}
              label="Search diner bites"
              placeholder="Search this category..."
            />
          )}
          <CategoryTabs
            className="food-category-tabs-desktop"
            tabs={tabs}
            active={activeCategory}
            onChange={changeCategory}
            label="Food categories"
          />
          <div className="food-category-tabs-mobile">
            <CategoryTabs
              className="food-category-tabs-mobile__tabs"
              tabs={mobileFeaturedTabs}
              active={activeCategory}
              onChange={changeCategory}
              label="Featured food categories"
            />
            <button
              type="button"
              className="food-category-disclosure__trigger"
              ref={mobileCategoryTriggerRef}
              aria-expanded={mobileCategoriesOpen}
              aria-controls="food-category-mobile-list"
              aria-label={`Browse categories. Currently browsing ${activeCategoryLabel}`}
              onClick={() => setMobileCategoriesOpen((open) => !open)}
            >
              <span className="food-category-disclosure__trigger-label">
                {mobileCategoryTriggerLabel}
              </span>
            </button>
            <div
              className="food-category-disclosure__panel"
              id="food-category-mobile-list"
              hidden={!mobileCategoriesOpen}
            >
              <p className="food-category-disclosure__current">
                Currently browsing <strong>{activeCategoryLabel}</strong>
              </p>
              <div
                className="food-category-disclosure__list"
                role="group"
                aria-label="More food categories"
              >
                {moreCategoryTabs.map((tab) => {
                  const isActive = tab.id === activeCategory;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      data-tab={tab.id}
                      className={`chip menu-tab${isActive ? " active" : ""}`}
                      aria-pressed={isActive}
                      onClick={() => changeMobileCategory(tab.id)}
                    >
                      <span>{tab.label}</span>
                      {isActive ? (
                        <span className="food-category-current-marker">Selected</span>
                      ) : (
                        <span className="menu-tab-count" aria-label={`${tab.count} items`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </StickyMenuBar>

        <MenuResultsNote query={q ? query : ""} count={resultCount} />

        {/* Categories: EXACTLY ONE representative picture per category */}
        <div className="food-categories-container" ref={listRef}>
          {q && resultCount === 0 && (
            <div className="menu-empty">
              <h3>No matches found.</h3>
              <p>
                Try a different search or clear it to return to the selected category.
              </p>
              <button
                type="button"
                className="button"
                onClick={() => {
                  setQuery("");
                }}
              >
                Clear search
              </button>
            </div>
          )}
          {visibleCategories.map((cat) => (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              className="food-category-block"
              aria-labelledby={`heading-${cat.id}`}
            >
              {/* Dedicated category hero image banner */}
              <div className="food-category-hero-frame">
                <FadeImage
                  src={cat.categoryImage}
                  alt={cat.name}
                  className="food-category-hero-image"
                  loading="lazy"
                />
                <div className="food-category-hero-overlay">
                  <span className="eyebrow">{cat.subtitle}</span>
                  <h3 id={`heading-${cat.id}`} className="category-hero-title">
                    {cat.name}
                  </h3>
                </div>
              </div>

              {/* Category items grid without individual photos */}
              <div className="food-page-grid">
                {cat.items.map((bite) => (
                  <FoodItem bite={bite} onAdd={onAdd} key={bite.id} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
