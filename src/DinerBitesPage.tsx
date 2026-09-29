import type { MouseEvent } from "react";
import { dinerBites, type DinerBite } from "./dinerBites";

type DinerBitesPageProps = {
  onAdd: (bite: DinerBite) => void;
  drinksHref: string;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
};

const money = (amount: number) => `₱${amount.toLocaleString("en-PH")}`;
const pricedBites = dinerBites.filter((bite) => !bite.sample);
const sampleBites = dinerBites.filter((bite) => bite.sample);

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
  return (
    <>
      <section className="food-page-hero" aria-labelledby="food-page-title">
        <div className="food-page-hero-inner">
          <h1 id="food-page-title">
            Diner bites &amp; <em>comfort plates.</em>
          </h1>
          <div className="food-page-hero-bottom">
            <p>
              Crispy chicken wings, loaded nachos, and savory skillets.
              Student-budget approved, chef-crafted with real flavor.
            </p>
            <a className="button food-page-hero-link" href="#food-menu">
              Browse the food menu
            </a>
          </div>
        </div>
      </section>

      <section className="food-page-menu" id="food-menu" aria-labelledby="food-menu-title">
        <div className="food-page-menu-heading">
          <h2 id="food-menu-title">
            Find your <em>comfort.</em>
          </h2>
          <p>
            The {pricedBites.length} priced dishes below can be added to your
            bag for pickup.
          </p>
        </div>

        <div className="food-page-grid">
          {pricedBites.map((bite) => (
            <FoodItem bite={bite} onAdd={onAdd} key={bite.id} />
          ))}
        </div>

        <p className="food-page-menu-note">
          Freshly prepared to order on Antonio Luna Street. Dine in or take
          away!
        </p>
      </section>

      <section
        className="food-page-samples"
        aria-labelledby="food-page-samples-title"
      >
        <div className="food-page-samples-heading">
          <h2 id="food-page-samples-title">
            More bites to <em>imagine.</em>
          </h2>
          <p>
            {sampleBites.length} sample menu ideas for this page. Prices and
            availability have not been set, so these items cannot be ordered
            yet.
          </p>
        </div>
        <div className="food-page-grid food-page-sample-grid">
          {sampleBites.map((bite) => (
            <FoodItem bite={bite} onAdd={onAdd} key={bite.id} />
          ))}
        </div>
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
