// ↓ IMPORTS: React 19 hooks and types
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
// ↓ UTILITY: Philippine Peso currency formatter
const money = (n: number) => `₱${n.toLocaleString("en-PH")}`;
// ↓ UTILITY: Optimized image path resolver
const image = (name: string) => `/images/optimized/${name}.webp`;
// ↓ TYPE: Product data shape
type Product = {
  id: string;
  name: string;
  short: string;
  note: string;
  description: string;
  price: number;
  color: string;
  word: string;
  ingredients: string[];
  type: "Coffee" | "Not coffee";
  hot?: boolean;
  badge?: string;
};
// ↓ DATA: Six signature drink products
const products: Product[] = [
  {
    id: "latte",
    name: "The Daily Saya",
    short: "Signature iced latte",
    note: "Your everyday, made a little better.",
    description:
      "A bold espresso hug, mellowed with cold milk and poured over ice. Simple things, done really well.",
    price: 145,
    color: "#cee4d9",
    word: "Everyday happy.",
    ingredients: ["Double espresso", "Fresh milk", "A whole lot of ice"],
    type: "Coffee",
    badge: "HOUSE FAVORITE",
  },
  {
    id: "spanish",
    name: "Sweet Like Sunday",
    short: "Spanish latte",
    note: "Slow down. Sweeten things up.",
    description:
      "Rich espresso meets velvety milk and a little condensed-milk magic. All the feeling of a slow Sunday.",
    price: 165,
    color: "#f2dfb8",
    word: "Sweet escape.",
    ingredients: ["Double espresso", "Fresh milk", "Condensed milk"],
    type: "Coffee",
    badge: "BEST SELLER",
  },
  {
    id: "ube",
    name: "Ube, Baby",
    short: "Ube coffee latte",
    note: "A little local love. A lot of purple.",
    description:
      "Earthy ube, creamy milk, and a bold espresso finish. A familiar Filipino favorite with a coffee-shop crush.",
    price: 185,
    color: "#ded4e8",
    word: "Purple mood.",
    ingredients: ["Double espresso", "Ube cream", "Fresh milk"],
    type: "Coffee",
    badge: "SAYA SPECIAL",
  },
  {
    id: "barako",
    name: "Gising, Gising!",
    short: "Kapeng Barako",
    note: "For the beautifully bold.",
    description:
      "A full-bodied, aromatic cup inspired by the Filipino ritual of kapeng barako. No fuss. Just a proper wake-up.",
    price: 115,
    color: "#e9c3a4",
    word: "Rise & shine.",
    ingredients: ["Barako-style coffee", "Hot water", "Big morning energy"],
    type: "Coffee",
    hot: true,
  },
  {
    id: "matcha",
    name: "Matcha Mood",
    short: "Iced matcha latte",
    note: "Your greener kind of pick-me-up.",
    description:
      "Vibrant, earthy matcha whisked smooth and layered over chilled milk. Mellow, creamy, and very much your mood.",
    price: 175,
    color: "#dce4b8",
    word: "Go a little green.",
    ingredients: ["Matcha powder", "Fresh milk", "A whole lot of ice"],
    type: "Not coffee",
  },
  {
    id: "coldbrew",
    name: "Easy Does It",
    short: "Slow-steeped cold brew",
    note: "Less rush. More good stuff.",
    description:
      "Slow-steeped coffee, served black over ice. Smooth, refreshing, and ready to take the scenic route with you.",
    price: 135,
    color: "#efcebc",
    word: "Stay mellow.",
    ingredients: [
      "Slow-steeped coffee",
      "Filtered water",
      "A whole lot of ice",
    ],
    type: "Coffee",
  },
];
// ↓ TYPE: Shopping cart item shape
type CartItem = {
  key: string;
  id: string;
  size: string;
  milk: string;
  temperature: string;
  quantity: number;
  price: number;
};
// ↓ ICON COMPONENT: SVG icon set (arrow, bag, close, menu, plus, minus, play, check)
function Icon({
  name,
  size = 20,
}: {
  name:
    "arrow" | "bag" | "close" | "menu" | "plus" | "minus" | "play" | "check";
  size?: number;
}) {
  const paths = {
    arrow: (
      <>
        <path d="M4 12h15M13 6l6 6-6 6" />
      </>
    ),
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    menu: <path d="M4 8h16M4 16h16" />,
    plus: <path d="M5 12h14M12 5v14" />,
    minus: <path d="M5 12h14" />,
    play: <path d="m9 5 11 7-11 7Z" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
// ↓ LOGO COMPONENT: Saya Coffee brand mark with spark symbol
function Logo({ footer = false }: { footer?: boolean }) {
  return (
    <a
      href="#home"
      className={`logo ${footer ? "footer-logo" : ""}`}
      aria-label="Saya Coffee home"
    >
      saya<span className="logo-spark">✳</span>
      {!footer && <small>COFFEE</small>}
    </a>
  );
}
// ↓ INGREDIENT COMPONENT: Floating decorative ingredient images
function Ingredient({
  kind,
  className = "",
  style,
}: {
  kind: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={image(kind)}
      alt=""
      aria-hidden="true"
      className={`ingredient ${className}`}
      style={style}
      width="200"
      height="200"
    />
  );
}
// ↓ SUN COMPONENT: Animated sun SVG with rays and face
function Sun({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`sun ${className}`}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} d="M50 4v10" transform={`rotate(${i * 22.5} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="28" />
        <path d="M37 51c4 14 23 14 27 0M40 41v4M60 41v4" />
      </g>
    </svg>
  );
}
// ↓ MODAL COMPONENT: Base dialog with backdrop and close button
function Modal({
  children,
  onClose,
  label,
  className = "",
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const previous = document.activeElement as HTMLElement;
    el.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`modal ${className}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
        {children}
      </div>
    </dialog>
  );
}
// ↓ PRODUCT MODAL: Customize drink size, milk, temperature, quantity
function ProductModal({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
  const [size, setSize] = useState("16 oz");
  const [milk, setMilk] = useState("Regular");
  const [temperature, setTemperature] = useState(product.hot ? "Hot" : "Iced");
  const [quantity, setQuantity] = useState(1);
  const hasMilk = !["barako", "coldbrew"].includes(product.id);
  const price =
    product.price + (size === "22 oz" ? 30 : 0) + (milk === "Oat" ? 35 : 0);
  return (
    <Modal
      onClose={onClose}
      label={`Customize ${product.name}`}
      className="product-modal"
    >
      <div className="customize-image" style={{ background: product.color }}>
        <span className="eyebrow">YOUR NEXT HAPPY PLACE</span>
        <img src={image(product.id)} alt={product.short} />
        <Sun />
      </div>
      <form
        className="customize-form"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd({
            key: `${product.id}-${size}-${milk}-${temperature}`,
            id: product.id,
            size,
            milk,
            temperature,
            quantity,
            price,
          });
        }}
      >
        <span className="eyebrow">{product.short}</span>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <span className="availability">Available in our demo menu</span>
        <fieldset>
          <legend>Make it your size</legend>
          <div className="choice-row">
            {["16 oz", "22 oz"].map((v) => (
              <label className={size === v ? "selected" : ""} key={v}>
                <input
                  type="radio"
                  name="size"
                  checked={size === v}
                  onChange={() => setSize(v)}
                />
                {v}
                {v === "22 oz" && <small> +₱30</small>}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Hot or iced?</legend>
          <div className="choice-row">
            {(product.id === "coldbrew" ? ["Iced"] : ["Iced", "Hot"]).map(
              (v) => (
                <label className={temperature === v ? "selected" : ""} key={v}>
                  <input
                    type="radio"
                    name="temperature"
                    checked={temperature === v}
                    onChange={() => setTemperature(v)}
                  />
                  {v}
                </label>
              ),
            )}
          </div>
        </fieldset>
        {hasMilk && (
          <fieldset>
            <legend>Your milk</legend>
            <div className="choice-row">
              {["Regular", "Oat"].map((v) => (
                <label className={milk === v ? "selected" : ""} key={v}>
                  <input
                    type="radio"
                    name="milk"
                    checked={milk === v}
                    onChange={() => setMilk(v)}
                  />
                  {v}
                  {v === "Oat" && <small> +₱35</small>}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <small className="allergen">
          {hasMilk
            ? "Contains milk. Oat option available; shared preparation equipment."
            : "Contains caffeine. Prepared using shared equipment."}
        </small>
        <div className="add-row">
          <div className="quantity">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              disabled={quantity === 1}
            >
              <Icon name="minus" size={16} />
            </button>
            <output>{quantity}</output>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              aria-label="Increase quantity"
              disabled={quantity === 20}
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
          <button className="button" type="submit">
            Add to bag <span>{money(price * quantity)}</span>
            <Icon name="bag" size={18} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
// ↓ SCROLL STORY: Horizontal scroll-driven product showcase
function ScrollStory({ onSelect }: { onSelect: (p: Product) => void }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  useEffect(() => {
    const el = section.current!;
    const stageEl = stage.current!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const p = Math.max(
        0,
        Math.min(
          5,
          (-rect.top / Math.max(1, el.offsetHeight - innerHeight)) * 5,
        ),
      );
      const index = Math.round(p);
      if (index !== activeRef.current) {
        activeRef.current = index;
        setActive(index);
      }
      stageEl.style.setProperty("--progress", `${p}`);
      stageEl
        .querySelectorAll<HTMLElement>(".story-product")
        .forEach((cup, i) => {
          const d = i - p;
          const reduced = media.matches;
          cup.style.transform = reduced
            ? "none"
            : `translate3d(${d * 90}%,${Math.abs(d) * 28}%,0) rotate(${d * 27 - 5}deg) scale(${1 - Math.min(Math.abs(d) * 0.15, 0.35)})`;
          cup.style.opacity = `${Math.max(0, 1 - Math.abs(d) * 1.35)}`;
        });
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      cancelAnimationFrame(frame);
    };
  }, []);
  const goTo = (index: number) => {
    const el = section.current!;
    const y =
      el.getBoundingClientRect().top +
      scrollY +
      ((el.offsetHeight - innerHeight) * index) / 5;
    window.scrollTo({
      top: y + 1,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  const product = products[active];
  return (
    <section
      className="scroll-story"
      ref={section}
      id="flavors"
      aria-label="Explore the six Saya flavors"
    >
      <div
        ref={stage}
        className="story-stage"
        style={{ backgroundColor: product.color }}
      >
        <div className="story-top">
          <span className="eyebrow">A CUP FOR EVERY KIND OF DAY</span>
          <a className="text-link" href="#menu">
            Skip to the menu <Icon name="arrow" size={18} />
          </a>
        </div>
        <span className="story-giant" key={product.word} aria-hidden="true">
          {product.word}
        </span>
        <div className="story-copy" key={product.id}>
          <span className="eyebrow">{product.short}</span>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <div className="story-details">
            <span>{money(product.price)}</span>
            <small>{product.hot ? "HOT" : "ICED"} / 16 OZ</small>
          </div>
          <button className="button" onClick={() => onSelect(product)}>
            This is my cup <Icon name="plus" size={18} />
          </button>
        </div>
        <div className="story-art">
          {products.map((p, i) => (
            <img
              key={p.id}
              src={image(p.id)}
              className="story-product"
              style={{ opacity: i === 0 ? 1 : 0 }}
              alt={active === i ? p.short : ""}
              aria-hidden={active !== i}
              loading="lazy"
              width="500"
              height="700"
            />
          ))}
          <Ingredient kind="bean" className="story-bean" />
          <Ingredient kind="ice" className="story-ice" />
          <Ingredient kind="leaf" className="story-leaf" />
        </div>
        <div className="ingredient-notes" key={`${product.id}-notes`}>
          <span className="handwritten">the good stuff</span>
          {product.ingredients.map((ingredient, i) => (
            <div key={ingredient}>
              <span>0{i + 1}</span>
              {ingredient}
            </div>
          ))}
        </div>
        <div className="story-navigation">
          <div className="story-count">
            <span>0{active + 1}</span> / 06
          </div>
          <div className="flavor-tabs" aria-label="Select a flavor">
            {products.map((p, i) => (
              <button
                key={p.id}
                onClick={() => goTo(i)}
                className={active === i ? "active" : ""}
                aria-label={`Explore ${p.name}`}
                aria-pressed={active === i}
              >
                <span />
                {p.id === "latte"
                  ? "Signature"
                  : p.id === "coldbrew"
                    ? "Cold brew"
                    : p.id.charAt(0).toUpperCase() + p.id.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="icon-button next-flavor"
            aria-label="Next flavor"
            onClick={() => goTo((active + 1) % 6)}
          >
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    </section>
  );
}
// ↓ APP COMPONENT: Root component with state, cart, and all sections
function App() {
  const [selected, setSelected] = useState<Product | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [filter, setFilter] = useState("All drinks");
  const [receipt, setReceipt] = useState(false);
  const [toast, setToast] = useState("");
  // ↓ CART STATE: Persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem("saya-bag") || "[]");
      return Array.isArray(value)
        ? value.filter(
            (item: CartItem) =>
              products.some((p) => p.id === item.id) &&
              typeof item.key === "string" &&
              Number.isFinite(item.price) &&
              item.price > 0 &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0 &&
              item.quantity <= 20,
          )
        : [];
    } catch {
      return [];
    }
  });
  const hero = useRef<HTMLElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  // ↓ CART PERSISTENCE: Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("saya-bag", JSON.stringify(cart));
    } catch {
      /* Private browsing keeps the current session functional. */
    }
  }, [cart]);
  // ↓ TOAST TIMER: Auto-dismiss toast after 3.2s
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(id);
  }, [toast]);
  // ↓ SCROLL EFFECTS: Hero parallax, progress bar, reveal-on-scroll
  useEffect(() => {
    let frame = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const paint = () => {
      frame = 0;
      const y = scrollY;
      if (hero.current && !reduced.matches && y < innerHeight * 1.5)
        hero.current.style.setProperty("--scroll", `${y}`);
      if (progress.current)
        progress.current.style.transform = `scaleX(${y / Math.max(1, document.documentElement.scrollHeight - innerHeight)})`;
    };
    const handle = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    window.addEventListener("scroll", handle, { passive: true });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => {
      window.removeEventListener("scroll", handle);
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
  // ↓ ADD TO CART: Merge duplicates, open bag, show toast
  const add = (item: CartItem) => {
    setCart((current) => {
      const existing = current.find((i) => i.key === item.key);
      return existing
        ? current.map((i) =>
            i.key === item.key
              ? { ...i, quantity: Math.min(20, i.quantity + item.quantity) }
              : i,
          )
        : [...current, item];
    });
    setSelected(null);
    setReceipt(false);
    setBagOpen(true);
    setToast("A little happy, added to your bag.");
  };
  const quantity = cart.reduce((n, i) => n + i.quantity, 0);
  const subtotal = cart.reduce((n, i) => n + i.price * i.quantity, 0);
  // ↓ BUNDLE DISCOUNT: Two Daily Sayas for ₱250 (save ₱40 per pair)
  const eligible = cart
    .filter(
      (i) =>
        i.id === "latte" &&
        i.size === "16 oz" &&
        i.milk === "Regular" &&
        i.temperature === "Iced",
    )
    .reduce((n, i) => n + i.quantity, 0);
  const discount = Math.floor(eligible / 2) * 40;
  const changeQuantity = (key: string, difference: number) =>
    setCart((items) =>
      items
        .map((i) =>
          i.key === key
            ? { ...i, quantity: Math.min(20, i.quantity + difference) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  // ↓ PRODUCT FILTER: All drinks, Best sellers, Coffee, Not coffee
  const visibleProducts = products.filter(
    (p) =>
      filter === "All drinks" ||
      (filter === "Best sellers" ? !!p.badge : p.type === filter),
  );
  return (
    <>
      {/* ↓ PAGE PROGRESS: Fixed top scroll indicator */}
      <div className="page-progress" ref={progress} />
      {/* ↓ SKIP LINK: Accessibility skip-to-content */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {/* ↓ ANNOUNCEMENT BAR: Promotional banner */}
      <div className="announcement">
        GOOD COFFEE. BETTER TOGETHER. <span>Two Daily Sayas for ₱250.</span>
        <a href="#together">
          Make it a coffee date <span>↗</span>
        </a>
      </div>
      {/* ↓ HEADER: Logo, navigation, order button, bag */}
      <header className="header" id="home">
        <Logo />
        <nav aria-label="Main navigation">
          <a href="#menu">Our coffee</a>
          <a href="#story">The Saya feeling</a>
          <a href="#together">
            Better together <span className="nav-star">✳</span>
          </a>
        </nav>
        <div className="header-actions">
          <a className="button header-order" href="#menu">
            Order now <Icon name="arrow" size={17} />
          </a>
          <button
            className="bag-button"
            aria-label={`Open bag, ${quantity} items`}
            onClick={() => {
              setBagOpen(true);
              setReceipt(false);
            }}
          >
            <Icon name="bag" />
            <span>{quantity}</span>
          </button>
          <button
            className="icon-button mobile-menu"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>
      <main id="main">
        {/* ↓ HERO SECTION: Main landing area with floating cup animation */}
        <section className="hero" ref={hero}>
          <div className="hero-oval" />
          <div className="hero-heading">
            <span className="eyebrow">
              <span className="tiny-star">✳</span> A LITTLE FILIPINO. A LOT OF
              HAPPY.
            </span>
            <h1>
              Good days.
              <br />
              Great coffee.
            </h1>
          </div>
          <div className="hero-copy">
            <p>
              Big on flavor. Rooted in familiar.
              <br />
              Your daily dose of <em>saya</em>, one cup at a time.
            </p>
            <div className="hero-ctas">
              <a className="button" href="#menu">
                Find your happy <Icon name="arrow" />
              </a>
              <a className="text-link" href="#flavors">
                Explore the flavors <span>↘</span>
              </a>
            </div>
          </div>
          <div className="hero-product-wrap">
            <img
              className="hero-product"
              src={image("latte")}
              alt="Saya signature iced latte with espresso, creamy milk, and ice"
              fetchPriority="high"
              width="500"
              height="700"
            />
          </div>
          <div className="happy-stamp">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <path
                  id="stamp-circle"
                  d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0"
                />
              </defs>
              <text>
                <textPath href="#stamp-circle" textLength="274">
                  BREWED FOR THE GOOD DAYS · SAYA COFFEE ·{" "}
                </textPath>
              </text>
            </svg>
            <Sun />
          </div>
          <div className="hero-scribble">
            <span className="handwritten">
              sip, smile,
              <br />
              repeat.
            </span>
            <svg viewBox="0 0 100 70" fill="none" aria-hidden="true">
              <path
                d="M84 6C83 45 47 65 13 36m1 0 3 18M13 36l21 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <Ingredient kind="bean" className="hero-bean bean-one" />
          <Ingredient kind="bean" className="hero-bean bean-two" />
          <Ingredient kind="bean" className="hero-bean bean-three" />
          <Ingredient kind="leaf" className="hero-leaf" />
          <Ingredient kind="ice" className="hero-ice ice-one" />
          <Ingredient kind="ice" className="hero-ice ice-two" />
          <span className="drawn-spark spark-one" aria-hidden="true">
            ✧
          </span>
          <span className="drawn-spark spark-two" aria-hidden="true">
            ✧
          </span>
          <div className="hero-product-caption">
            <span className="caption-line" />
            <div>
              <span className="eyebrow">MEET YOUR NEW DAILY</span>
              <p>
                The Daily Saya <span>₱145</span>
              </p>
            </div>
          </div>
          <a className="scroll-cue" href="#flavors">
            <span>↓</span> A good day starts with a scroll
          </a>
          <div className="hero-bottom-note">HAPPINESS, SERVED ICED.</div>
          <svg
            className="hero-wave"
            viewBox="0 0 1440 65"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 31C220 80 380 0 690 26s510 66 750-7v46H0Z"
              fill="#fbf5e9"
            />
          </svg>
        </section>
        {/* ↓ MANIFESTO STRIP: Brand tagline marquee */}
        <div className="manifesto-strip">
          <span>Made for your everyday</span>
          <Sun />
          <span>A little cup of happy</span>
          <Sun />
          <span>Good coffee, good company</span>
          <Sun />
        </div>
        {/* ↓ SCROLL STORY: Interactive product showcase */}
        <ScrollStory onSelect={setSelected} />
        {/* ↓ MENU SECTION: Product grid with filters */}
        <section id="menu" className="menu-section">
          <div className="menu-heading reveal">
            <span className="eyebrow">FIND YOUR EVERYDAY FAVORITE</span>
            <h2>
              What's your <span className="serif-italic">happy?</span>
            </h2>
            <p>Six little reasons to look forward to your day.</p>
          </div>
          <div className="menu-toolbar">
            <div className="menu-filters" aria-label="Filter drinks">
              {["All drinks", "Best sellers", "Coffee", "Not coffee"].map(
                (f) => (
                  <button
                    key={f}
                    className={filter === f ? "active" : ""}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>
            <span className="menu-size">A GOOD PLACE TO START: 16 OZ</span>
          </div>
          <div className="product-grid">
            {visibleProducts.map((p) => (
              <article className="product-card" key={p.id}>
                <button
                  className="product-image-button"
                  onClick={() => setSelected(p)}
                  aria-label={`Customize ${p.name}`}
                  style={{ backgroundColor: p.color }}
                >
                  {p.badge && <span className="product-badge">{p.badge}</span>}
                  <span className="product-art-word" aria-hidden="true">
                    {p.id === "latte"
                      ? "daily"
                      : p.id === "spanish"
                        ? "sweet"
                        : p.id === "ube"
                          ? "ube!"
                          : p.id === "barako"
                            ? "gising!"
                            : p.id === "matcha"
                              ? "mood"
                              : "easy"}
                  </span>
                  <img
                    src={image(p.id)}
                    alt={p.short}
                    loading="lazy"
                    width="300"
                    height="420"
                  />
                  <span className="product-add">
                    <Icon name="plus" size={22} />
                  </span>
                </button>
                <div className="product-card-title">
                  <h3>
                    <button onClick={() => setSelected(p)}>{p.name}</button>
                  </h3>
                  <span>{money(p.price)}</span>
                </div>
                <p>
                  {p.short}
                  <span>{p.hot ? "HOT" : "ICED"} / 16 OZ</span>
                </p>
              </article>
            ))}
          </div>
          <p className="menu-footnote">
            Your cup, your way. Go large or swap to oat milk when you order.
          </p>
        </section>
        {/* ↓ BRAND STORY: Editorial photo + brand narrative */}
        <section className="brand-story" id="story">
          <div className="brand-photo reveal">
            <img
              src={image("merienda")}
              alt="Two friends sharing Saya iced coffee and pandesal on a mint café table"
              loading="lazy"
              width="1000"
              height="750"
            />
            <span className="photo-note handwritten">
              a little pause. a little saya.
            </span>
          </div>
          <div className="brand-copy reveal">
            <span className="eyebrow">MORE THAN A COFFEE BREAK</span>
            <h2>
              A little pause.
              <br />A lot of <em>saya.</em>
            </h2>
            <p>
              In Filipino, <em>saya</em> means happiness. We think it lives in
              the little things. Your first sip. A familiar face. An afternoon
              that turns into a good conversation.
            </p>
            <p>
              So we're making room for more of it. Thoughtful coffee, playful
              flavors, and a little local love. For the everyday moments worth
              slowing down for.
            </p>
            <span className="brand-signature handwritten">
              Tara, kape tayo.
            </span>
            <Sun />
          </div>
        </section>
        {/* ↓ TOGETHER SECTION: Two-cup bundle offer */}
        <section className="together-section" id="together">
          <Ingredient kind="bean" className="offer-bean" />
          <div className="offer-copy reveal">
            <span className="eyebrow">THE COFFEE DATE IS ON</span>
            <h2>
              Good things
              <br />
              come in <em>twos.</em>
            </h2>
            <p>
              Your favorite person. Your favorite coffee.
              <br />
              Two signature iced lattes, one happy little price.
            </p>
            <div className="offer-price">
              2 cups. ₱250. <span>Usually ₱290</span>
            </div>
            <button
              className="button"
              onClick={() =>
                add({
                  key: "latte-16 oz-Regular-Iced",
                  id: "latte",
                  size: "16 oz",
                  milk: "Regular",
                  temperature: "Iced",
                  quantity: 2,
                  price: 145,
                })
              }
            >
              Make it a coffee date <Icon name="arrow" />
            </button>
            <small>
              Two 16 oz Daily Saya iced lattes with regular milk.
              <br />
              Bundle savings applied automatically in your bag.
            </small>
          </div>
          <div className="offer-art">
            <span className="offer-orbit" />
            <img
              className="offer-cup cup-left"
              src={image("latte")}
              alt="First signature iced latte in the two-cup bundle"
              loading="lazy"
              width="400"
              height="600"
            />
            <img
              className="offer-cup cup-right"
              src={image("latte")}
              alt="Second signature iced latte in the two-cup bundle"
              loading="lazy"
              width="400"
              height="600"
            />
            <div className="offer-sticker">
              YOU + ME
              <br />
              <span>+ coffee</span>
            </div>
            <span className="drawn-spark offer-spark">✧</span>
          </div>
        </section>
        {/* ↓ FINAL CTA: Closing call-to-action */}
        <section className="final-cta">
          <span className="eyebrow">
            THERE'S ALWAYS ROOM FOR A LITTLE HAPPY
          </span>
          <h2>
            Same time.
            <br />
            <em>Another cup?</em>
          </h2>
          <a href="#menu" className="button">
            Order your happy <Icon name="arrow" />
          </a>
          <Ingredient kind="cherry" className="final-cherry" />
          <Ingredient kind="leaf" className="final-leaf" />
          <Sun />
        </section>
      </main>
      {/* ↓ FOOTER: Logo, links, back-to-top */}
      <footer>
        <div className="footer-top">
          <Logo footer />
          <p>
            A little Filipino.
            <br />A lot of happy.
          </p>
          <div className="footer-links">
            <a href="#menu">Our coffee ↗</a>
            <a href="#story">Our story ↗</a>
            <a href="#together">Coffee for two ↗</a>
          </div>
          <a href="#home" className="back-top">
            BACK TO THE GOOD STUFF <span>↑</span>
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SAYA COFFEE</span>
          <span>Made with a little local love.</span>
          <span>Fictional brand concept. Demo orders only.</span>
        </div>
      </footer>
      {/* ↓ TOAST: Add-to-bag confirmation */}
      {toast && (
        <div role="status" className="toast">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}
      {/* ↓ PRODUCT MODAL: Customize selected drink */}
      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onAdd={add}
        />
      )}
      {/* ↓ BAG MODAL: Shopping cart drawer */}
      {bagOpen && (
        <Modal
          label="Your coffee bag"
          className="bag-modal"
          onClose={() => setBagOpen(false)}
        >
          <div className="bag-content">
            <span className="eyebrow">A LITTLE HAPPY, TO GO</span>
            <h2>{receipt ? "Happy looks good on you." : "Your coffee bag."}</h2>
            {receipt ? (
              <div className="receipt">
                <Sun />
                <h3>You're on the list.</h3>
                <p>
                  Your demo order has been created. This is a fictional coffee
                  shop, so no payment was taken and no drinks will be prepared.
                </p>
                <button
                  className="button"
                  onClick={() => {
                    setBagOpen(false);
                    document
                      .querySelector("#menu")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Find another favorite <Icon name="arrow" />
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="empty-bag">
                <Sun />
                <h3>A little empty. A lot of possibility.</h3>
                <p>There's a happy little cup with your name on it.</p>
                <button
                  className="button"
                  onClick={() => {
                    setBagOpen(false);
                    document
                      .querySelector("#menu")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Explore the menu <Icon name="arrow" />
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => {
                    const p = products.find((p) => p.id === item.id)!;
                    return (
                      <div className="cart-item" key={item.key}>
                        <img
                          src={image(p.id)}
                          alt={p.short}
                          style={{ background: p.color }}
                        />
                        <div>
                          <h3>{p.name}</h3>
                          <p>
                            {item.size} / {item.temperature}
                            {!["barako", "coldbrew"].includes(p.id) &&
                              ` / ${item.milk} milk`}
                          </p>
                          <div className="cart-item-bottom">
                            <div className="quantity">
                              <button
                                aria-label={`Remove one ${p.name}`}
                                onClick={() => changeQuantity(item.key, -1)}
                              >
                                <Icon name="minus" size={14} />
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                aria-label={`Add one ${p.name}`}
                                onClick={() => changeQuantity(item.key, 1)}
                                disabled={item.quantity >= 20}
                              >
                                <Icon name="plus" size={14} />
                              </button>
                            </div>
                            <strong>{money(item.price * item.quantity)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {discount > 0 && (
                  <div className="bundle-note">
                    <Icon name="check" size={17} />
                    Better together! Your coffee-date savings are in.
                  </div>
                )}
                <div className="cart-totals">
                  <div>
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div>
                      <span>Coffee-date savings</span>
                      <span>−{money(discount)}</span>
                    </div>
                  )}
                  <div className="cart-total">
                    <span>Total</span>
                    <strong>{money(subtotal - discount)}</strong>
                  </div>
                </div>
                <form
                  className="checkout-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setReceipt(true);
                    setCart([]);
                  }}
                >
                  <label htmlFor="order-name">A name for your cup</label>
                  <input
                    id="order-name"
                    name="name"
                    autoComplete="given-name"
                    placeholder="Your first name"
                    required
                    maxLength={50}
                  />
                  <button className="button" type="submit">
                    Place demo order <Icon name="arrow" />
                  </button>
                  <small>
                    This is a concept store. No payment or real fulfillment.
                  </small>
                </form>
                <button
                  className="continue-shopping text-link"
                  onClick={() => setBagOpen(false)}
                >
                  Keep exploring
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
      {/* ↓ NAV MODAL: Mobile navigation drawer */}
      {navOpen && (
        <Modal
          onClose={() => setNavOpen(false)}
          label="Navigation"
          className="nav-modal"
        >
          <Logo />
          <nav>
            {[
              ["Our coffee", "#menu"],
              ["The Saya feeling", "#story"],
              ["Better together", "#together"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setNavOpen(false)}>
                {label}
                <Icon name="arrow" />
              </a>
            ))}
          </nav>
          <span className="handwritten">Tara, kape tayo.</span>
        </Modal>
      )}
    </>
  );
}
export default App;
