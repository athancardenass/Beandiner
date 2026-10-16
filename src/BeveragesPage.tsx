import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  beverageCategories,
  beverageAddOns,
  beverageSubs,
  type BeverageItem,
  type BeverageModifier,
} from "./beverages";
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

type BeveragesPageProps = {
  onAdd: (bev: BeverageItem, size: string, price: number) => void;
  onAddModifier: (mod: BeverageModifier, type: "Add-on" | "Sub") => void;
  signatureSection: ReactNode;
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  signatureCounts: { top6: number; bestSeller: number; matches: number };
};

const money = (amount: number) =>
  amount === 0 ? "FREE" : `₱${amount.toLocaleString("en-PH")}`;

function BeverageCard({
  bev,
  onAdd,
}: {
  bev: BeverageItem;
  onAdd: (bev: BeverageItem, size: string, price: number) => void;
}) {
  const sizeKeys = Object.keys(bev.prices);
  const initialSize = bev.prices[bev.defaultSize] !== undefined
    ? bev.defaultSize
    : sizeKeys[0] ?? "";
  const [selectedSize, setSelectedSize] = useState<string>(initialSize);

  const currentPrice = bev.prices[selectedSize] ?? bev.prices[sizeKeys[0]] ?? 0;

  return (
    <article className="bev-item-card" key={bev.id}>
      <div className="bev-item-top">
        <span className="bev-badge">{bev.badge ?? (bev.hot ? "HOT BREW" : "ICED SIP")}</span>
        <span className="bev-type-tag">{bev.hot ? "Hot" : "Over Iced"}</span>
      </div>

      <h3 className="bev-item-name">{bev.name}</h3>
      <p className="bev-item-desc">{bev.description}</p>

      {/* Size selection selector */}
      {sizeKeys.length > 1 ? (
        <div
          className="bev-size-selector"
          role="radiogroup"
          aria-label={`Select size for ${bev.name}`}
        >
          {sizeKeys.map((size) => {
            const isSelected = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`bev-size-pill ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedSize(size)}
              >
                <span className="bev-size-name">{size}</span>
                <span className="bev-size-cost">{money(bev.prices[size])}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bev-single-size-tag">
          <span className="bev-single-badge">Single Size: {selectedSize}</span>
        </div>
      )}

      <div className="bev-item-bottom">
        <div className="bev-price-block">
          <span className="bev-price-label">Price</span>
          <strong className="bev-price-val">{money(currentPrice)}</strong>
        </div>
        <button
          type="button"
          className="button menu-add-btn"
          onClick={() => onAdd(bev, selectedSize, currentPrice)}
          aria-label={`Add ${bev.name} (${selectedSize}) to bag`}
        >
          <PlusIcon size={14} /> Add to bag
        </button>
      </div>
    </article>
  );
}

export default function BeveragesPage({
  onAdd,
  onAddModifier,
  signatureSection,
  activeCategory,
  onCategoryChange,
  query,
  onQueryChange,
  signatureCounts,
}: BeveragesPageProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const mobileCategoryTriggerRef = useRef<HTMLButtonElement>(null);

  const totalDrinks = beverageCategories.reduce(
    (acc, cat) => acc + cat.items.length,
    0,
  );
  const showSearch = totalDrinks > SEARCH_THRESHOLD;
  const q = normalizeQuery(query);

  const visibleCategories = useMemo(
    () =>
      beverageCategories
        .filter((cat) => q || cat.id === activeCategory)
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((bev) =>
            matchesQuery(q, bev.name, bev.description, bev.badge, cat.name),
          ),
        }))
        .filter((cat) => cat.items.length > 0),
    [activeCategory, q],
  );

  const addOns = beverageAddOns.filter((m) => matchesQuery(q, m.name));
  const subs = beverageSubs.filter((m) => matchesQuery(q, m.name));
  const showModifiers =
    activeCategory === "modifiers" && (addOns.length > 0 || subs.length > 0);

  const drinkMatches = visibleCategories.reduce(
    (n, cat) => n + cat.items.length,
    0,
  );
  const modifierMatches = showModifiers ? addOns.length + subs.length : 0;
  const isSignatureCategory =
    !q && (activeCategory === "top-6" || activeCategory === "best-seller");
  const resultCount = isSignatureCategory
    ? signatureCounts.matches
    : drinkMatches + modifierMatches;

  const tabs = [
    { id: "top-6", label: "Top 6 signatures", count: signatureCounts.top6 },
    { id: "best-seller", label: "Best seller", count: signatureCounts.bestSeller },
    ...beverageCategories.map((cat) => ({
      id: cat.id,
      label: cat.name.replace(/^Hot Beverage - (Hot )?/, "Hot ").replace(" - ", ": "),
      count: cat.items.length,
    })),
    {
      id: "modifiers",
      label: "Add-ons & subs",
      count: beverageAddOns.length + beverageSubs.length,
    },
  ];
  const mobileFeaturedTabs = [
    { id: tabs[0].id, label: "Top 6" },
    { id: tabs[1].id, label: tabs[1].label },
  ];
  const moreCategoryTabs = tabs.slice(2);
  const activeCategoryLabel =
    tabs.find((tab) => tab.id === activeCategory)?.label ?? tabs[0].label;
  const mobileCategoryTriggerLabel =
    activeCategory === "top-6" || activeCategory === "best-seller"
      ? "Browse categories"
      : activeCategoryLabel;

  const changeCategory = (id: string) => {
    setMobileCategoriesOpen(false);
    onCategoryChange(id);
    requestAnimationFrame(() => scrollListIntoView(listRef.current));
  };

  const changeMobileCategory = (id: string) => {
    changeCategory(id);
    mobileCategoryTriggerRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      {/* ↓ BEVERAGE PAGE HERO */}
      <section className="bev-page-hero" aria-labelledby="bev-page-title">
        <div className="bev-page-hero-inner">
          <span className="eyebrow">
            ✦ THIRD-WAVE ESPRESSO &amp; ARTISANAL CREATIONS
          </span>
          <h1 id="bev-page-title">
            Artisanal brews &amp; <em>specialty sips.</em>
          </h1>
        </div>
      </section>

      {/* ↓ BEVERAGES MENU SECTION */}
      <section
        className="bev-page-menu"
        id="drinks-menu"
        aria-labelledby="drinks-menu-title"
      >
        <div className="bev-page-menu-heading">
          <span className="eyebrow">COMPLETE BEVERAGES DIRECTORY</span>
          <h2 id="drinks-menu-title">
            Discover your <em>daily cup.</em>
          </h2>
          <p>
            {totalDrinks} handcrafted drinks across {beverageCategories.length} categories,
            plus artisanal add-ons and plant-based milk substitutions.
          </p>
        </div>

        {/* Sticky Toolbar with Search and Category Tabs */}
        <StickyMenuBar label="Beverage menu controls" className="bev-sticky">
          {showSearch && (
            <MenuSearch
              value={query}
              onChange={onQueryChange}
              label="Search beverages"
              placeholder="Search all drinks or flavors..."
            />
          )}
          <CategoryTabs
            className="bev-category-tabs-desktop"
            tabs={tabs}
            active={activeCategory}
            onChange={changeCategory}
            label="Beverage categories"
            scrollControls
          />
          <div className="bev-category-tabs-mobile">
            <CategoryTabs
              className="bev-category-tabs-mobile__tabs"
              tabs={mobileFeaturedTabs}
              active={activeCategory}
              onChange={changeCategory}
              label="Featured beverage categories"
            />
            <button
              type="button"
              className="bev-category-disclosure__trigger"
              ref={mobileCategoryTriggerRef}
              aria-expanded={mobileCategoriesOpen}
              aria-controls="bev-category-mobile-list"
              aria-label={`Browse categories. Currently browsing ${activeCategoryLabel}`}
              onClick={() => setMobileCategoriesOpen((open) => !open)}
            >
              <span className="bev-category-disclosure__trigger-label">
                {mobileCategoryTriggerLabel}
              </span>
            </button>
            <div
              className="bev-category-disclosure__panel"
              id="bev-category-mobile-list"
              hidden={!mobileCategoriesOpen}
            >
              <p className="bev-category-disclosure__current">
                Currently browsing <strong>{activeCategoryLabel}</strong>
              </p>
              <div
                className="bev-category-disclosure__list"
                role="group"
                aria-label="More beverage categories"
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
                        <span className="bev-category-current-marker">Selected</span>
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

        {/* Categories: EXACTLY ONE representative picture or hero banner per category */}
        <div className="bev-categories-container" id="drink-menu-products" ref={listRef}>
          <div id="best-sellers" aria-hidden="true" />
          {q && resultCount === 0 && (
            <div className="menu-empty">
              <h3>No matches found.</h3>
              <p>Try another search or clear it to browse the menu.</p>
              <button
                type="button"
                className="button"
                onClick={() => {
                  onQueryChange("");
                }}
              >
                Clear search
              </button>
            </div>
          )}
          {isSignatureCategory && signatureCounts.matches > 0 && signatureSection}
          {visibleCategories.map((cat) => (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              className="bev-category-block"
              aria-labelledby={`bev-heading-${cat.id}`}
            >
              {/* Category hero frame banner (one picture per category) */}
              <div
                className={`bev-category-hero-frame ${
                  cat.categoryImage ? "has-image" : "no-image"
                } bev-categorized-hero`}
              >
                {cat.categoryImage ? (
                  <div className="bev-category-hero-visual">
                    <FadeImage
                      src={cat.categoryImage}
                      alt={cat.name}
                      className="bev-category-hero-image"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="bev-category-hero-backdrop" aria-hidden="true">
                    <span className="bev-backdrop-watermark">BEAN DINER</span>
                  </div>
                )}

                <div className="bev-category-hero-overlay">
                  <h3 id={`bev-heading-${cat.id}`} className="category-hero-title">
                    {cat.name}
                  </h3>
                </div>
              </div>

              {/* Items grid for this category */}
              <div className="bev-page-grid">
                {cat.items.map((bev) => (
                  <BeverageCard bev={bev} onAdd={onAdd} key={bev.id} />
                ))}
              </div>
            </section>
          ))}

          {/* Add-Ons & Substitutions Dedicated Block */}
          {showModifiers && (
            <section
              id="cat-modifiers"
              className="bev-category-block bev-modifiers-section"
              aria-labelledby="bev-modifiers-heading"
            >
              <div className="bev-category-hero-frame has-image bev-modifiers-hero">
                <FadeImage
                  src="./images/optimized/beverage-addons.webp"
                  alt="Bean Diner drink lineup beneath the Bean Diner wall sign"
                  className="bev-category-hero-image"
                  loading="lazy"
                />
                <div className="bev-category-hero-overlay">
                  <h3 id="bev-modifiers-heading" className="category-hero-title">
                    Add-Ons &amp; Substitutions
                  </h3>
                </div>
              </div>

              <div className="bev-modifiers-container">
                {/* Add-Ons Column */}
                <div className="bev-modifier-card">
                  <div className="bev-modifier-card-header">
                    <h4>Beverage Add-Ons</h4>
                    <span className="bev-modifier-count">{addOns.length} options</span>
                  </div>
                  <ul className="bev-modifier-list">
                    {addOns.map((addon) => (
                      <li key={addon.id} className="bev-modifier-row">
                        <div className="bev-modifier-info">
                          <span className="bev-modifier-name">{addon.name}</span>
                          <span className="bev-modifier-price">{money(addon.price)}</span>
                        </div>
                        <button
                          type="button"
                          className="button button-small bev-modifier-add menu-add-btn"
                          onClick={() => onAddModifier(addon, "Add-on")}
                          aria-label={`Add ${addon.name} to bag`}
                        >
                          <PlusIcon size={13} /> Add
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Substitutions Column */}
                <div className="bev-modifier-card">
                  <div className="bev-modifier-card-header">
                    <h4>Substitutions (Subs)</h4>
                    <span className="bev-modifier-count">{subs.length} options</span>
                  </div>
                  <ul className="bev-modifier-list">
                    {subs.map((sub) => (
                      <li key={sub.id} className="bev-modifier-row">
                        <div className="bev-modifier-info">
                          <span className="bev-modifier-name">{sub.name}</span>
                          <span className="bev-modifier-price">{money(sub.price)}</span>
                        </div>
                        <button
                          type="button"
                          className="button button-small bev-modifier-add menu-add-btn"
                          onClick={() => onAddModifier(sub, "Sub")}
                          aria-label={`Add substitution ${sub.name} to bag`}
                        >
                          <PlusIcon size={13} /> Add
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </>
  );
}
