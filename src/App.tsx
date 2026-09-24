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
// ↓ DATA: Six signature drink products for Bean Diner Bayambang
const products: Product[] = [
  {
    id: "latte",
    name: "Iced Spanish Latte",
    short: "Signature Spanish latte",
    note: "Sweet, creamy, and caramel-kissed.",
    description:
      "Our most-loved pour in Bayambang. Double-shot espresso mellowed with sweet condensed milk, silky dairy, and rich caramel notes.",
    price: 145,
    color: "#cee4d9",
    word: "Sweet comfort.",
    ingredients: ["Double espresso", "Condensed milk", "Caramel touch"],
    type: "Coffee",
    badge: "BEST SELLER",
  },
  {
    id: "matcha",
    name: "Bean Diner x Oatside",
    short: "Matcha oat latte",
    note: "Whisked smooth. 100% plant-based.",
    description:
      "Ceremonial green tea matcha whisked to perfection with creamy Oatside oat milk. A velvety smooth, dairy-free everyday escape.",
    price: 165,
    color: "#dce4b8",
    word: "Go a little green.",
    ingredients: ["Ceremonial matcha", "Oatside oat milk", "Clean ice chill"],
    type: "Not coffee",
    badge: "OATSIDE COLLAB",
  },
  {
    id: "coldbrew",
    name: "Benguet Farm Cold Brew",
    short: "Highland single-origin",
    note: "Direct from Benguet & Baguio farms.",
    description:
      "Directly sourced highland Arabica slow-steeped for 18 hours. Clean finish, rich cocoa undertones, and zero bitterness.",
    price: 135,
    color: "#efcebc",
    word: "Stay mellow.",
    ingredients: [
      "Benguet highland beans",
      "18-hr slow steep",
      "Served over ice",
    ],
    type: "Coffee",
    badge: "FARM DIRECT",
  },
  {
    id: "barako",
    name: "Middle East Barista Roast",
    short: "Artisan Americano",
    note: "Crafted by our Middle East-trained barista.",
    description:
      "Full-bodied, deeply aromatic extraction celebrating Middle Eastern specialty coffee techniques and Benguet highland beans.",
    price: 125,
    color: "#e9c3a4",
    word: "Bold & craft.",
    ingredients: [
      "Barista extraction",
      "Thick golden crema",
      "Deep smoky notes",
    ],
    type: "Coffee",
    hot: true,
    badge: "BARISTA CRAFT",
  },
  {
    id: "ube",
    name: "Sweet Strawberry Latte",
    short: "Strawberry milk espresso",
    note: "Coffee that says stay, strawberry that says sweet.",
    description:
      "Real crushed strawberry milk layered under a bold espresso float. A crowd favorite for cozy diner catchups.",
    price: 155,
    color: "#ded4e8",
    word: "Sweet escape.",
    ingredients: [
      "Real strawberry fruit",
      "Velvety fresh milk",
      "Bold espresso float",
    ],
    type: "Not coffee",
    badge: "HOUSE SPECIAL",
  },
  {
    id: "spanish",
    name: "Diner Caramel Macchiato",
    short: "Layered caramel espresso",
    note: "American diner classic comfort.",
    description:
      "Fresh steamed milk and sweet vanilla marked with espresso and drizzled with warm golden butter caramel sauce.",
    price: 155,
    color: "#f2dfb8",
    word: "Warm comfort.",
    ingredients: ["Vanilla cream", "Espresso mark", "Warm caramel drizzle"],
    type: "Coffee",
  },
];
// ↓ DINER BITES: US-trained Chef comfort food favorites
type DinerBite = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  tag: string;
  badge: string;
};

const dinerBites: DinerBite[] = [
  {
    id: "honey-butter-wings",
    name: "Honey Butter Wings",
    subtitle: "2PC CRISPY CHICKEN WINGS",
    description:
      "Golden fried chicken wings glazed in our US chef's signature sweet honey butter. Crispy, savory, and student-budget approved.",
    price: 99,
    tag: "STUDENT BUDGET ₱99",
    badge: "BESTSELLER",
  },
  {
    id: "snow-cheese-wings",
    name: "Snow Cheese Wings",
    subtitle: "2PC CRISPY CHICKEN WINGS",
    description:
      "Crunchy double-dredged chicken wings dusted generously in sweet-savory snow cheese seasoning. Irresistibly addictive.",
    price: 99,
    tag: "STUDENT BUDGET ₱99",
    badge: "CHEF'S PICK",
  },
  {
    id: "mexican-nachos",
    name: "Loaded Mexican Nachos",
    subtitle: "CHEF'S SHARING PLATTER",
    description:
      "Crisp stone-ground corn chips piled high with seasoned savory beans, warm melted queso, diced salsa, and jalapeños.",
    price: 180,
    tag: "PERFECT TO SHARE",
    badge: "NEW & IMPROVED",
  },
  {
    id: "korean-beef-mushroom",
    name: "Korean Beef Mushroom",
    subtitle: "SAVORY COMFORT SKILLET",
    description:
      "Tender beef slices sautéed with fresh button mushrooms in a sweet-garlic umami soy reduction. Warm comfort on a plate.",
    price: 210,
    tag: "HEARTY DINER PLATE",
    badge: "US CHEF CRAFT",
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
  name?: string;
  isFood?: boolean;
};
// ↓ HELPER: Send formatted order to Bean Diner Facebook Messenger
const sendToMessenger = (
  items: CartItem[],
  customerName: string = "",
  totalAmount: number,
  bundleDiscount: number = 0,
) => {
  const lines = items.map((item) => {
    const p = products.find((p) => p.id === item.id);
    const b = dinerBites.find((b) => b.id === item.id);
    const title = p ? p.name : b ? b.name : item.name || "Item";
    const specs = item.isFood
      ? "Chef's Comfort Kitchen Plate"
      : `${item.size}, ${item.temperature}${
          p && !["barako", "coldbrew"].includes(p.id)
            ? `, ${item.milk} milk`
            : ""
        }`;
    return `• ${item.quantity}x ${title} (${specs}) - ${money(
      item.price * item.quantity,
    )}`;
  });

  const message = [
    `Hello Bean Diner Bayambang! I would like to place an order:`,
    ``,
    ...lines,
    ``,
    bundleDiscount > 0 ? `Bundle Discount: -${money(bundleDiscount)}` : null,
    `Total: ${money(totalAmount)}`,
    customerName ? `Name: ${customerName}` : null,
    `Pickup Location: Bean Diner · Gen. Antonio Luna St., Zone 2, Bayambang, Pangasinan`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message);
    }
  } catch {
    /* clipboard fallback */
  }

  window.open("https://m.me/beandiner", "_blank", "noopener,noreferrer");
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
// ↓ LOGO COMPONENT: Bean Diner brand mark with coffee bean spark
function Logo({ footer = false }: { footer?: boolean }) {
  return (
    <a
      href="#home"
      className={`logo ${footer ? "footer-logo" : ""}`}
      aria-label="Bean Diner home"
    >
      bean diner<span className="logo-spark">☕</span>
      {!footer && <small>BAYAMBANG</small>}
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
        <button
          type="button"
          className="button button-messenger-direct"
          onClick={() => {
            const singleItem: CartItem = {
              key: `${product.id}-${size}-${milk}-${temperature}`,
              id: product.id,
              size,
              milk,
              temperature,
              quantity,
              price,
            };
            sendToMessenger([singleItem], "", price * quantity, 0);
            onClose();
          }}
        >
          Message Bean Diner on Facebook to Order 💬
        </button>
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
      aria-label="Explore the six Bean Diner drinks"
    >
      <div
        ref={stage}
        className="story-stage"
        style={{ backgroundColor: product.color }}
      >
        <div className="story-top">
          <span className="eyebrow">CRAFTED FOR EVERY KIND OF MOOD</span>
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
                  ? "Spanish Latte"
                  : p.id === "coldbrew"
                    ? "Cold Brew"
                    : p.id === "matcha"
                      ? "Oatside"
                      : p.id === "barako"
                        ? "Barista Roast"
                        : p.id === "ube"
                          ? "Strawberry"
                          : "Caramel"}
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
  // ↓ CART STATE: Persisted to localStorage with backwards compatibility
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("beandiner-bag-v2") ||
          localStorage.getItem("saya-bag") ||
          "[]",
      );
      return Array.isArray(value)
        ? value.filter(
            (item: CartItem) =>
              (products.some((p) => p.id === item.id) ||
                dinerBites.some((b) => b.id === item.id)) &&
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
      localStorage.setItem("beandiner-bag-v2", JSON.stringify(cart));
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
    setToast("Freshly brewed, added to your bag.");
  };

  // ↓ ADD DINER BITE: Add comfort food item directly to bag
  const addBite = (bite: DinerBite) => {
    const item: CartItem = {
      key: `bite-${bite.id}`,
      id: bite.id,
      name: bite.name,
      size: "Plate",
      milk: "None",
      temperature: "Hot & Fresh",
      quantity: 1,
      price: bite.price,
      isFood: true,
    };
    setCart((current) => {
      const existing = current.find((i) => i.key === item.key);
      return existing
        ? current.map((i) =>
            i.key === item.key
              ? { ...i, quantity: Math.min(20, i.quantity + 1) }
              : i,
          )
        : [...current, item];
    });
    setReceipt(false);
    setBagOpen(true);
    setToast(`${bite.name} added to your bag.`);
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
        GOOD FOOD. GREAT COFFEE. <span>Two Iced Spanish Lattes for ₱250.</span>
        <a href="#together">
          Make it a coffee date <span>↗</span>
        </a>
      </div>
      {/* ↓ HEADER: Logo, navigation, order button, bag */}
      <header className="header" id="home">
        <Logo />
        <nav aria-label="Main navigation" className="header-nav">
          <a href="#menu" className="nav-item">
            <span className="nav-num">01</span>
            <span className="nav-label">Our drinks</span>
          </a>
          <a href="#bites" className="nav-item">
            <span className="nav-num">02</span>
            <span className="nav-label">Diner bites</span>
            <span className="nav-badge">₱99</span>
          </a>
          <a href="#story" className="nav-item">
            <span className="nav-num">03</span>
            <span className="nav-label">Our story</span>
          </a>
          <a href="#together" className="nav-item nav-together">
            <span className="nav-num">04</span>
            <span className="nav-label">Better together</span>
            <span className="nav-coffee">☕</span>
          </a>
          <a
            href="https://www.facebook.com/beandiner"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-fb-pill"
          >
            <span className="fb-dot" />
            <span className="fb-text">Facebook</span>
            <span className="fb-arrow">↗</span>
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
              <span className="tiny-star">☕</span> GEN. ANTONIO LUNA ST. ·
              BAYAMBANG, PANGASINAN
            </span>
            <h1>
              Good food.
              <br />
              Great coffee.
            </h1>
          </div>
          <div className="hero-copy">
            <p>
              Founded by a Chef trained in the US and a Barista skilled in the
              Middle East.
              <br />
              Where the food heals and the coffee understands you.
            </p>
            <div className="hero-ctas">
              <a className="button" href="#menu">
                Order for pickup <Icon name="arrow" />
              </a>
              <a className="text-link" href="#bites">
                Diner comfort bites <span>↘</span>
              </a>
            </div>
          </div>
          <div className="hero-product-wrap">
            <img
              className="hero-product"
              src={image("latte")}
              alt="Bean Diner signature Iced Spanish Latte with espresso, condensed milk, and caramel"
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
                  BREWED FOR WARM VIBES · BEAN DINER BAYAMBANG ·{" "}
                </textPath>
              </text>
            </svg>
            <Sun />
          </div>
          <div className="hero-scribble">
            <span className="handwritten">
              where food heals,
              <br />
              coffee understands.
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
              <span className="eyebrow">BAYAMBANG BEST SELLER</span>
              <p>
                Iced Spanish Latte <span>₱145</span>
              </p>
            </div>
          </div>
          <a className="scroll-cue" href="#flavors">
            <span>↓</span> A good day starts with a scroll
          </a>
          <div className="hero-bottom-note">
            WHERE THE FOOD HEALS &amp; THE COFFEE UNDERSTANDS
          </div>
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
          <span>Where the food heals</span>
          <Sun />
          <span>Good food, great coffee</span>
          <Sun />
          <span>Warm community vibes</span>
          <Sun />
          <span>Bayambang, Pangasinan</span>
          <Sun />
        </div>
        {/* ↓ SCROLL STORY: Interactive product showcase */}
        <ScrollStory onSelect={setSelected} />
        {/* ↓ MENU SECTION: Product grid with filters */}
        <section id="menu" className="menu-section">
          <div className="menu-heading reveal">
            <span className="eyebrow">FRESHLY BREWED IN BAYAMBANG</span>
            <h2>
              What's your <span className="serif-italic">order?</span>
            </h2>
            <p>
              Specialty brews, creamy Oatside lattes, and comforting diner sips.
            </p>
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
            <span className="menu-size">SERVED IN 16 OZ WITH ICE</span>
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
                      ? "spanish!"
                      : p.id === "spanish"
                        ? "caramel!"
                        : p.id === "ube"
                          ? "sweet!"
                          : p.id === "barako"
                            ? "bold!"
                            : p.id === "matcha"
                              ? "oatside!"
                              : "mellow!"}
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
            Every cup crafted with Benguet highland beans and creamy Oatside oat
            milk. Ask our barista about custom sweetness!
          </p>
        </section>
        {/* ↓ DINER BITES SECTION: US-Trained Chef comfort kitchen plates */}
        <section id="bites" className="menu-section bites-section">
          <div className="menu-heading reveal">
            <span className="eyebrow">US-TRAINED CHEF'S COMFORT KITCHEN</span>
            <h2>
              Diner bites &amp;{" "}
              <span className="serif-italic">comfort plates.</span>
            </h2>
            <p>
              Crispy chicken wings, loaded nachos, and savory skillets.
              <br />
              Student-budget approved, chef-crafted with real flavor.
            </p>
          </div>
          <div className="product-grid bites-grid">
            {dinerBites.map((bite) => (
              <article className="product-card bite-card" key={bite.id}>
                <div className="bite-top-badge">
                  <span className="product-badge">{bite.badge}</span>
                  <span className="bite-subtag">{bite.tag}</span>
                </div>
                <div className="bite-card-body">
                  <h3>{bite.name}</h3>
                  <span className="bite-subheading">{bite.subtitle}</span>
                  <p>{bite.description}</p>
                </div>
                <div className="bite-card-footer">
                  <strong>{money(bite.price)}</strong>
                  <button
                    className="button button-small"
                    onClick={() => addBite(bite)}
                    aria-label={`Add ${bite.name} to bag`}
                  >
                    Add to bag <Icon name="plus" size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <p className="menu-footnote">
            Freshly prepared to order on Antonio Luna Street. Dine in or take
            away!
          </p>
        </section>
        {/* ↓ BRAND STORY: Editorial photo + brand narrative */}
        <section className="brand-story" id="story">
          <div className="brand-photo reveal">
            <img
              src={image("merienda")}
              alt="Two friends sharing Bean Diner iced coffee and comfort food on a café table"
              loading="lazy"
              width="1000"
              height="750"
            />
            <span className="photo-note handwritten">
              where the food heals, the coffee understands
            </span>
          </div>
          <div className="brand-copy reveal">
            <span className="eyebrow">
              TWO CRAFTS. ONE COMMUNITY. BAYAMBANG, PANGASINAN.
            </span>
            <h2>
              Not just coffee.
              <br />A true <em>diner home.</em>
            </h2>
            <p>
              Bean Diner was founded by a Chef trained in the culinary kitchens
              of the US and a Barista skilled in the specialty coffee culture of
              the Middle East.
            </p>
            <p>
              Right here on Gen. Antonio Luna Street in Bayambang, we bring
              together honest comfort food—from our ₱99 student-budget honey
              butter wings to loaded Mexican nachos—with specialty third-wave
              coffee brewed from Benguet highland farms and creamy Oatside oat
              milk.
            </p>
            <span className="brand-signature handwritten">
              Tara, kain at kape tayo.
            </span>
            <Sun />
          </div>
        </section>
        {/* ↓ TOGETHER SECTION: Two-cup bundle offer */}
        <section className="together-section" id="together">
          <Ingredient kind="bean" className="offer-bean" />
          <div className="offer-copy reveal">
            <span className="eyebrow">
              STUDENTS, FRIENDS &amp; COFFEE LOVERS
            </span>
            <h2>
              Good things
              <br />
              come in <em>twos.</em>
            </h2>
            <p>
              Study sessions, afternoon catchups, or cozy diner merienda on
              Antonio Luna Street.
              <br />
              Two signature Iced Spanish Lattes, one friendly price.
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
              Two 16 oz signature Iced Spanish Lattes with regular milk.
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
          <span className="eyebrow">YOUR TABLE IS WAITING IN BAYAMBANG</span>
          <h2>
            Same corner.
            <br />
            <em>Another cup?</em>
          </h2>
          <a href="#menu" className="button">
            Explore the menu <Icon name="arrow" />
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
            Good food. Great coffee.
            <br />
            Founded by a US Chef &amp; Middle East Barista.
            <br />
            Gen. Antonio Luna Street, Zone 2, Bayambang, Pangasinan.
          </p>
          <div className="footer-links">
            <a href="#menu">Our drinks ↗</a>
            <a href="#bites">Diner bites ↗</a>
            <a href="#story">Our story ↗</a>
            <a
              href="https://www.facebook.com/beandiner"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook Page ↗
            </a>
          </div>
          <a href="#home" className="back-top">
            BACK TO THE TOP <span>↑</span>
          </a>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} BEAN DINER BAYAMBANG. ALL RIGHTS
            RESERVED.
          </span>
          <span>Mon–Fri 9:00 AM – 10:00 PM · Sat–Sun 11:00 AM – 10:00 PM</span>
          <span>
            Gen. Antonio Luna St., Bayambang, Pangasinan · 0915 399 5000
          </span>
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
          label="Your order bag"
          className="bag-modal"
          onClose={() => setBagOpen(false)}
        >
          <div className="bag-content">
            <span className="eyebrow">BEAN DINER · BAYAMBANG</span>
            <h2>{receipt ? "Order sent to Messenger!" : "Your order bag."}</h2>
            {receipt ? (
              <div className="receipt">
                <Sun />
                <h3>Order sent to Facebook!</h3>
                <p>
                  Your complete order details have been copied to your
                  clipboard, and Bean Diner's Messenger chat has been opened.
                  Simply paste into the chat to finalize your pickup!
                </p>
                <a
                  className="button button-messenger-checkout"
                  href="https://m.me/beandiner"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", justifyContent: "center" }}
                >
                  Open Messenger Chat Again 💬
                </a>
                <button
                  className="button"
                  style={{ marginTop: "12px" }}
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
                <h3>Your bag is currently empty.</h3>
                <p>
                  There's a delicious cup or diner bite with your name on it.
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
                  Explore the menu <Icon name="arrow" />
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => {
                    const p = products.find((p) => p.id === item.id);
                    const b = dinerBites.find((b) => b.id === item.id);
                    const title = p ? p.name : b ? b.name : item.name || "Item";
                    const desc = item.isFood
                      ? `${item.size} / ${item.temperature}`
                      : `${item.size} / ${item.temperature}${
                          p && !["barako", "coldbrew"].includes(p.id)
                            ? ` / ${item.milk} milk`
                            : ""
                        }`;
                    return (
                      <div className="cart-item" key={item.key}>
                        {p ? (
                          <img
                            src={image(p.id)}
                            alt={p.short}
                            style={{ background: p.color }}
                          />
                        ) : (
                          <div
                            className="cart-food-icon"
                            style={{ background: "#f2dfb8" }}
                          >
                            🍗
                          </div>
                        )}
                        <div>
                          <h3>{title}</h3>
                          <p>{desc}</p>
                          <div className="cart-item-bottom">
                            <div className="quantity">
                              <button
                                aria-label={`Remove one ${title}`}
                                onClick={() => changeQuantity(item.key, -1)}
                              >
                                <Icon name="minus" size={14} />
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                aria-label={`Add one ${title}`}
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
                    const form = e.currentTarget;
                    const nameInput = form.elements.namedItem(
                      "name",
                    ) as HTMLInputElement;
                    const customerName = nameInput?.value || "";
                    sendToMessenger(
                      cart,
                      customerName,
                      subtotal - discount,
                      discount,
                    );
                    setReceipt(true);
                    setCart([]);
                  }}
                >
                  <label htmlFor="order-name">Your name for pickup</label>
                  <input
                    id="order-name"
                    name="name"
                    autoComplete="given-name"
                    placeholder="Enter your name (e.g. Karl)"
                    required
                    maxLength={50}
                  />
                  <button
                    className="button button-messenger-checkout"
                    type="submit"
                  >
                    Send Order to Facebook Messenger 💬
                  </button>
                  <small>
                    Copies your order summary &amp; opens Bean Diner's Messenger
                    automatically!
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
          <nav className="mobile-nav-list">
            {[
              {
                num: "01",
                label: "Our drinks",
                sub: "Benguet highland coffee & Oatside lattes",
                href: "#menu",
              },
              {
                num: "02",
                label: "Diner bites",
                sub: "₱99 crispy wings & comfort plates",
                badge: "₱99 WINGS",
                href: "#bites",
              },
              {
                num: "03",
                label: "Our story",
                sub: "US Chef & Middle East Barista roots",
                href: "#story",
              },
              {
                num: "04",
                label: "Better together ☕",
                sub: "Two-cup coffee date bundle for ₱250",
                badge: "SAVE ₱40",
                href: "#together",
              },
              {
                num: "05",
                label: "Facebook Page ↗",
                sub: "Community updates & direct messages",
                href: "https://www.facebook.com/beandiner",
                isExternal: true,
              },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                target={item.isExternal ? "_blank" : undefined}
                rel={item.isExternal ? "noopener noreferrer" : undefined}
                onClick={() => setNavOpen(false)}
                className={`mobile-nav-item ${item.isExternal ? "mobile-nav-fb" : ""}`}
              >
                <div className="mobile-nav-meta">
                  <span className="mobile-nav-num">{item.num}</span>
                  <div className="mobile-nav-titles">
                    <div className="mobile-nav-heading">
                      <span className="mobile-nav-label">{item.label}</span>
                      {item.badge && (
                        <span className="mobile-nav-badge">{item.badge}</span>
                      )}
                    </div>
                    <span className="mobile-nav-sub">{item.sub}</span>
                  </div>
                </div>
                <span className="mobile-nav-arrow">
                  <Icon name="arrow" size={18} />
                </span>
              </a>
            ))}
          </nav>
          <div className="mobile-nav-footer">
            <span className="handwritten">Tara, kain at kape tayo.</span>
            <small>Gen. Antonio Luna St., Bayambang · Open daily</small>
          </div>
        </Modal>
      )}
      {/* ↓ FLOATING MESSENGER BUTTON: Direct chat with Bean Diner */}
      <a
        href="https://m.me/beandiner"
        target="_blank"
        rel="noopener noreferrer"
        className="floating-messenger"
        aria-label="Chat with Bean Diner on Facebook Messenger"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.02l-.65 2.45a.75.75 0 0 0 .97.9l2.84-1.22c.96.28 1.97.43 3 .43 5.52 0 10-4.03 10-9s-4.48-9-10-9zm1.06 12.15-2.58-2.75-5.04 2.75 5.54-5.88 2.64 2.75 4.98-2.75-5.54 5.88z" />
        </svg>
        <span>Message Us</span>
      </a>
    </>
  );
}
export default App;
