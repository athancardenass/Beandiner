import { useState, type MouseEvent } from "react";
import { foodCategories, type DinerBite } from "./dinerBites";

type DinerBitesPageProps = {
  onAdd: (bite: DinerBite) => void;
  drinksHref: string;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
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
              className="button"
              onClick={() => onAdd(bite)}
              aria-label={`Add ${bite.name} to bag`}
            >
              Add to bag
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function DinerBitesPage({
  onAdd,
  drinksHref,
  onNavigate,
}: DinerBitesPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const displayedCategories =
    activeCategory === "all"
      ? foodCategories
      : foodCategories.filter((cat) => cat.id === activeCategory);

  const totalDishes = foodCategories.reduce(
    (acc, cat) => acc + cat.items.length,
    0
  );

  return (
    <>
      <section className="food-page-hero" aria-labelledby="food-page-title">
        <div className="food-page-hero-inner">
          <h1 id="food-page-title">
            Diner bites &amp; <em>comfort plates.</em>
          </h1>
          <div className="food-page-hero-bottom">
            <p>
              Crispy chicken wings, loaded nachos, freshly pressed croffles, and hearty skillets.
              Student-budget approved, chef-crafted with real flavor.
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

        {/* Category Pills Filter Bar */}
        <div className="food-category-filters" role="tablist" aria-label="Food categories">
          <button
            type="button"
            className={`food-category-pill ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All Bites ({totalDishes})
          </button>
          {foodCategories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              className={`food-category-pill ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name} ({cat.items.length})
            </button>
          ))}
        </div>

        {/* Categories: EXACTLY ONE representative picture per category */}
        <div className="food-categories-container">
          {displayedCategories.map((cat) => (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              className="food-category-block"
              aria-labelledby={`heading-${cat.id}`}
            >
              {/* Dedicated category hero image banner */}
              <div className="food-category-hero-frame">
                <img
                  src={cat.categoryImage}
                  alt={cat.name}
                  className="food-category-hero-image"
                  loading="lazy"
                />
                <div className="food-category-hero-overlay">
                  <span className="eyebrow">{cat.subtitle}</span>
                  <h3 id={`heading-${cat.id}`}>{cat.name}</h3>
                  <p>{cat.description}</p>
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

        <p className="food-page-menu-note">
          Freshly prepared to order on Antonio Luna Street. Dine in or take
          away!
        </p>
      </section>

      <section className="food-page-drinks" aria-labelledby="food-page-drinks-title">
        <h2 id="food-page-drinks-title">
          Something to <em>sip with that?</em>
        </h2>
        <p>Specialty brews, creamy Oatside lattes, and comforting diner sips.</p>
        <a className="button" href={drinksHref} onClick={onNavigate}>
          Explore our drinks
        </a>
      </section>
    </>
  );
}
