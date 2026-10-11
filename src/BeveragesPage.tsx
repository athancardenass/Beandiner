import { useMemo, useRef, useState, type MouseEvent } from "react";
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
  foodHref: string;
  signatureHref: string;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
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
  foodHref,
  signatureHref,
  onNavigate,
}: BeveragesPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const totalDrinks = beverageCategories.reduce(
    (acc, cat) => acc + cat.items.length,
    0,
  );
  const showSearch = totalDrinks > SEARCH_THRESHOLD;
  const q = normalizeQuery(query);

  const visibleCategories = useMemo(
    () =>
      beverageCategories
        .filter((cat) => activeCategory === "all" || cat.id === activeCategory)
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((bev) =>
            matchesQuery(q, bev.name, bev.description, bev.badge, cat.name),
          ),
        }))
        .filter((cat) => cat.items.length > 0),
    [activeCategory, q],
  );

  const modifiersInView =
    activeCategory === "all" || activeCategory === "modifiers";
  const addOns = beverageAddOns.filter((m) => matchesQuery(q, m.name));
  const subs = beverageSubs.filter((m) => matchesQuery(q, m.name));
  const showModifiers =
    modifiersInView && (addOns.length > 0 || subs.length > 0);

  const drinkMatches = visibleCategories.reduce(
    (n, cat) => n + cat.items.length,
    0,
  );
  const modifierMatches = showModifiers ? addOns.length + subs.length : 0;
  const resultCount = drinkMatches + modifierMatches;

  const tabs = [
    { id: "all", label: "All drinks", count: totalDrinks },
    ...beverageCategories.map((cat) => ({
      id: cat.id,
      label: ({
        "hot-coffee": "Hot coffee",
        "hot-non-coffee": "Hot non-coffee",
        "over-iced-coffee": "Iced coffee",
        "over-iced-cloudy": "Cloudy coffee",
        "over-iced-matcha": "Iced matcha",
        "over-iced-non-coffee": "Iced non-coffee",
        "over-iced-tea": "Iced tea",
        "iced-blends-coffee": "Coffee blends",
        "iced-blends-non-coffee": "Non-coffee blends",
        "iced-blends-milkshake": "Milkshakes",
      } as Record<string, string>)[cat.id] ?? cat.name,
      count: cat.items.length,
    })),
    {
      id: "modifiers",
      label: "Add-ons & subs",
      count: beverageAddOns.length + beverageSubs.length,
    },
  ];

  const changeCategory = (id: string) => {
    setActiveCategory(id);
    scrollListIntoView(listRef.current);
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
          <div className="bev-page-hero-bottom">
            <p>
              Double-shot espresso extracts, velvety Oatside lattes, creamy cloudy specials,
              freshly shaken teas, and dessert-grade frappes. Crafted fresh on Antonio Luna Street.
            </p>
            <div className="bev-hero-actions">
              <a className="button bev-page-hero-link" href="#drinks-menu">
                Browse beverages menu
              </a>
              <a
                className="button button-outline bev-page-hero-link-alt"
                href={signatureHref}
                onClick={onNavigate}
              >
                Top 6 signatures
              </a>
            </div>
          </div>
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
              onChange={setQuery}
              label="Search beverages"
              placeholder="Search drinks or flavors..."
            />
          )}
          <CategoryTabs
            tabs={tabs}
            active={activeCategory}
            onChange={changeCategory}
            label="Beverage categories"
          />
        </StickyMenuBar>

        <MenuResultsNote query={q ? query : ""} count={resultCount} />

        {/* Categories: EXACTLY ONE representative picture or hero banner per category */}
        <div className="bev-categories-container" ref={listRef}>
          {q && resultCount === 0 && (
            <div className="menu-empty">
              <h3>Nothing on the menu by that name.</h3>
              <p>
                Try a flavor like caramel, matcha or chocolate, or browse every
                category.
              </p>
              <button
                type="button"
                className="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                }}
              >
                Show all drinks
              </button>
            </div>
          )}
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
                }`}
              >
                {cat.categoryImage ? (
                  <FadeImage
                    src={cat.categoryImage}
                    alt={cat.name}
                    className="bev-category-hero-image"
                    loading="lazy"
                  />
                ) : (
                  <div className="bev-category-hero-backdrop" aria-hidden="true">
                    <span className="bev-backdrop-watermark">BEAN DINER</span>
                  </div>
                )}

                <div className="bev-category-hero-overlay">
                  <div className="bev-category-hero-meta">
                    <span className="eyebrow">{cat.subtitle}</span>
                  </div>
                  <h3 id={`bev-heading-${cat.id}`} className="category-hero-title">
                    {cat.name}
                  </h3>
                  <p>{cat.description}</p>
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
                  alt="Coffee with espresso, milk, caramel, honey, cocoa, and cream add-ons"
                  className="bev-category-hero-image"
                  loading="lazy"
                />
                <div className="bev-category-hero-overlay">
                  <div className="bev-category-hero-meta">
                    <span className="eyebrow">BARISTA CUSTOMIZATIONS</span>
                    <span className="bev-category-badge-note">Tailor Your Sip</span>
                  </div>
                  <h3 id="bev-modifiers-heading" className="category-hero-title">
                    Add-Ons &amp; Substitutions
                  </h3>
                  <p>
                    Personalize your cup with extra espresso shots, creamy dessert toppings,
                    rich drizzle sauces, or plant-based dairy-free milk upgrades.
                  </p>
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

        <p className="bev-page-menu-note">
          Espresso pulled fresh with temperature-stable extraction on Gen. Antonio Luna Street.
          Dine-in, pick-up, or door-to-door delivery!
        </p>
      </section>

      {/* Cross-navigation banner to Food Menu */}
      <section className="bev-page-cross" aria-labelledby="bev-cross-title">
        <div className="bev-page-cross-inner">
          <span className="eyebrow">HUNGRY FOR COMFORT BITES?</span>
          <h2 id="bev-cross-title">
            Pair your coffee with <em>comfort plates.</em>
          </h2>
          <p>
            Crispy chicken wings, loaded Mexican nachos, savory skillets, and warm croffles.
          </p>
          <a className="button" href={foodHref} onClick={onNavigate}>
            Browse Diner Bites Menu
          </a>
        </div>
      </section>
    </>
  );
}
