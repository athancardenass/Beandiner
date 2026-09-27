// ↓ IMPORTS: React 19 hooks and types
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import DinerBitesPage from "./DinerBitesPage";
import { dinerBites, type DinerBite } from "./dinerBites";
// ↓ UTILITY: Philippine Peso currency formatter
const money = (n: number) => `₱${n.toLocaleString("en-PH")}`;
const beanDinerMapsUrl =
  "https://www.google.com/maps/place/Bean+Diner/@15.8103457,120.4573329,17z/data=!4m14!1m7!3m6!1s0x339149ebf4721bcb:0xff2c7401d69cb887!2sBean+Diner!8m2!3d15.8103457!4d120.4573329!16s%2Fg%2F11vljpcbmt!3m5!1s0x339149ebf4721bcb:0xff2c7401d69cb887!8m2!3d15.8103457!4d120.4573329!16s%2Fg%2F11vljpcbmt?entry=ttu&g_ep=EgoyMDI2MDkyMi4wIKXMDSoASAFQAw%3D%3D";
// ↓ UTILITY: Relative image path resolvers (supports dev server and file:// protocol)
const image = (name: string) => {
  if (name === "hot") return "./images/optimized/hotroast.webp";
  return `./images/optimized/${name}.webp`;
};
const menuImage = (name: string) => `./images/menu/${name}.webp`;
const pageHref = (page: "home" | "diner-bites", anchor = "") => {
  const url = new URL(window.location.href);
  if (page === "diner-bites") url.searchParams.set("page", "diner-bites");
  else url.searchParams.delete("page");
  url.hash = anchor;
  return url.href;
};

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
  photo: string;
};
// ↓ DATA: Six signature drink products matching Bean Diner sample photos
const products: Product[] = [
  {
    id: "latte",
    name: "Iced Spanish Latte",
    short: "Signature espresso & fresh milk",
    note: "Double espresso, silky milk, poured over ice.",
    description:
      "Our signature double-shot espresso extraction over chilled fresh milk and crisp ice. The everyday crowd favorite at Antonio Luna Street.",
    price: 145,
    color: "#f2dfb8",
    word: "Daily joy.",
    ingredients: ["Double espresso", "Fresh milk", "Ice chill"],
    type: "Coffee",
    badge: "BEST SELLER",
    photo: "caffe-latte",
  },
  {
    id: "matcha",
    name: "Iced Matcha Latte",
    short: "Ceremonial matcha & creamy milk",
    note: "Whisked smooth. 100% authentic green tea.",
    description:
      "Vibrant ceremonial-grade Japanese matcha whisked smooth and paired with creamy milk (or Oatside oat milk) over ice. Earthy, soothing, and perfectly balanced.",
    price: 165,
    color: "#dce4b8",
    word: "Matcha chill.",
    ingredients: [
      "Ceremonial matcha",
      "Fresh milk / Oatside",
      "Clean ice chill",
    ],
    type: "Not coffee",
    badge: "OATSIDE COLLAB",
    photo: "matcha-latte",
  },
  {
    id: "caramel",
    name: "Iced Caramel Macchiato",
    short: "Caramel syrup, cold milk & espresso",
    note: "Sweet golden caramel meets dark roast.",
    description:
      "Rich amber caramel syrup layered with cold fresh milk, marked with a bold double espresso float and finished with golden drizzle.",
    price: 160,
    color: "#eedec7",
    word: "Caramel swirl.",
    ingredients: ["Dark caramel drizzle", "Chilled milk", "Espresso float"],
    type: "Coffee",
    badge: "HOUSE SPECIAL",
    photo: "caramel-macchiato",
  },
  {
    id: "strawberry",
    name: "Sweet Strawberry Iced Latte",
    short: "Real strawberry fruit & espresso float",
    note: "Coffee that says stay, strawberry that says sweet.",
    description:
      "Real crushed strawberry puree poured with silky milk, topped with a gentle espresso kick. Refreshing, vibrant, and a diner customer favorite.",
    price: 155,
    color: "#fed7d7",
    word: "Berry sweet.",
    ingredients: [
      "Real strawberry fruit",
      "Velvety fresh milk",
      "Bold espresso float",
    ],
    type: "Coffee",
    badge: "CROWD FAVORITE",
    photo: "strawberry-latte",
  },
  {
    id: "chai",
    name: "Iced Milk Tea Chai Latte",
    short: "Spiced artisan black tea blend",
    note: "Warm aromatic spice, served ice-cold.",
    description:
      "Slow-steeped artisan spiced black tea infused with cardamom, cinnamon, and clove, softened with creamy sweetened milk over ice.",
    price: 145,
    color: "#efcebc",
    word: "Spiced chill.",
    ingredients: [
      "Artisan spiced tea",
      "Silky fresh milk",
      "Fragrant cinnamon",
    ],
    type: "Not coffee",
    badge: "BARISTA CRAFT",
    photo: "chai-latte",
  },
  {
    id: "hot",
    name: "Artisan Hot Roast & Latte",
    short: "Middle East barista craft brew",
    note: "Crafted by our Middle East-trained barista.",
    description:
      "Full-bodied, deeply aromatic extraction celebrating Middle Eastern specialty coffee techniques with golden crema and latte art.",
    price: 130,
    color: "#e9c3a4",
    word: "Warm comfort.",
    ingredients: [
      "Artisan roast espresso",
      "Steamed velvety milk",
      "Latte art pour",
    ],
    type: "Coffee",
    hot: true,
    badge: "BARISTA SPECIAL",
    photo: "hot-roast",
  },
];

const spanishLatte = products.find((product) => product.id === "latte")!;
const spanishLatteBundlePrice = 250;
const spanishLatteBundleSavings =
  spanishLatte.price * 2 - spanishLatteBundlePrice;
// ↓ TYPE: Shopping cart item shape
type CartItem = {
  key: string;
  id: string;
  size?: string;
  milk?: string;
  temperature?: string;
  sweetness?: string;
  iceLevel?: string;
  quantity: number;
  price: number;
  name?: string;
  isFood?: boolean;
};
// ↓ HELPER: Send formatted order to Bean Diner Facebook Messenger
const formatOrderMessage = (
  items: CartItem[],
  customerName: string = "",
  totalAmount: number,
  bundleDiscount: number = 0,
) => {
  const lines = items.map((item) => {
    const p = products.find((p) => p.id === item.id);
    const b = dinerBites.find((b) => b.id === item.id);
    const title = p ? p.name : b ? b.name : item.name || "Item";
    if (item.isFood) {
      return `• ${item.quantity}x ${title} (Chef's Comfort Kitchen Plate) - ${money(
        item.price * item.quantity,
      )}`;
    }
    const specs = [
      item.size,
      item.temperature,
      item.sweetness,
      item.temperature === "Iced" ? item.iceLevel : null,
      item.milk && item.milk !== "Regular" ? `${item.milk} milk` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `• ${item.quantity}x ${title} (${specs}) - ${money(
      item.price * item.quantity,
    )}`;
  });

  return [
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
};

// ↓ BULLETPROOF CLIPBOARD COPY: Synchronous execCommand + Async navigator.clipboard
const copyToClipboard = (text: string): boolean => {
  let copied = false;

  // 1. Synchronous fallback first: Executes immediately inside the user click gesture
  // This bypasses browser permissions/shields (Brave, Safari) that block async clipboard API
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    copied = document.execCommand("copy");
    document.body.removeChild(textarea);
  } catch {
    /* fallback handled below */
  }

  // 2. Also trigger modern async navigator.clipboard as backup
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text).catch(() => {});
    copied = true;
  }

  return copied;
};

// ↓ MESSENGER URL: Device-aware destination
// Mobile uses m.me shortlink to deep-link to the Messenger app
// Desktop MUST use facebook.com/messages/t/ because standalone messenger.com rejects Page inboxes with "This content isn't available right now"
const getMessengerUrl = () => {
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  if (isMobile) {
    return "https://m.me/100959311683531";
  }
  return "https://www.facebook.com/messages/t/100959311683531";
};

// Open external URL with webview/Electron fallback
const openExternalUrl = (url: string) => {
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

const sendToMessenger = (
  items: CartItem[],
  customerName: string = "",
  totalAmount: number,
  bundleDiscount: number = 0,
) => {
  const message = formatOrderMessage(items, customerName, totalAmount, bundleDiscount);
  copyToClipboard(message);
  openExternalUrl(getMessengerUrl());
  return message;
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
function Logo({
  footer = false,
  href = "#top",
  onClick,
}: {
  footer?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`logo ${footer ? "footer-logo" : ""}`}
      aria-label="Bean Diner home"
    >
      bean diner<span className="logo-spark">✦</span>
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
  onDirectOrder,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
  onDirectOrder?: (msg: string) => void;
}) {
  const [size, setSize] = useState("16 oz");
  const [milk, setMilk] = useState("Regular");
  const [temperature, setTemperature] = useState(product.hot ? "Hot" : "Iced");
  const [sweetness, setSweetness] = useState("100% Sweet");
  const [iceLevel, setIceLevel] = useState("Regular Ice");
  const [quantity, setQuantity] = useState(1);
  const hasMilk = true;
  const price =
    product.price + (size === "22 oz" ? 30 : 0) + (milk === "Oat" ? 35 : 0);
  return (
    <Modal
      onClose={onClose}
      label={`Customize ${product.name}`}
      className="product-modal"
    >
      <div className="customize-image" style={{ background: product.color }}>
        <span className="eyebrow">BEAN DINER SPECIALTY</span>
        <img src={image(product.id)} alt={product.name} />
        <Sun />
      </div>
      <form
        className="customize-form"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd({
            key: `${product.id}-${size}-${milk}-${temperature}-${sweetness}-${iceLevel}`,
            id: product.id,
            size,
            milk,
            temperature,
            sweetness,
            iceLevel,
            quantity,
            price,
            name: product.name,
          });
        }}
      >
        <span className="eyebrow">{product.short}</span>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <span className="availability">
          Available at Antonio Luna St., Bayambang
        </span>
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
            {(product.hot ? ["Hot", "Iced"] : ["Iced", "Hot"]).map((v) => (
              <label className={temperature === v ? "selected" : ""} key={v}>
                <input
                  type="radio"
                  name="temperature"
                  checked={temperature === v}
                  onChange={() => setTemperature(v)}
                />
                {v}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Sweetness Preference */}
        <fieldset>
          <legend>Sweetness level</legend>
          <div className="choice-row">
            {["100% Sweet", "70% Sweet", "50% Sweet", "No Sugar"].map((v) => (
              <label className={sweetness === v ? "selected" : ""} key={v}>
                <input
                  type="radio"
                  name="sweetness"
                  checked={sweetness === v}
                  onChange={() => setSweetness(v)}
                />
                {v}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Ice Level Preference */}
        {temperature === "Iced" && (
          <fieldset>
            <legend>Ice level</legend>
            <div className="choice-row">
              {["Regular Ice", "Less Ice"].map((v) => (
                <label className={iceLevel === v ? "selected" : ""} key={v}>
                  <input
                    type="radio"
                    name="iceLevel"
                    checked={iceLevel === v}
                    onChange={() => setIceLevel(v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </fieldset>
        )}

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
          Handcrafted fresh upon order at our Bayambang diner.
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
        <a
          href={getMessengerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="button button-messenger-direct"
          style={{ textDecoration: "none", textAlign: "center", display: "flex", justifyContent: "center" }}
          onClick={() => {
            const singleItem: CartItem = {
              key: `${product.id}-${size}-${milk}-${temperature}-${sweetness}-${iceLevel}`,
              id: product.id,
              size,
              milk,
              temperature,
              sweetness,
              iceLevel,
              quantity,
              price,
              name: product.name,
            };
            const msg = formatOrderMessage([singleItem], "", price * quantity, 0);
            copyToClipboard(msg);
            onDirectOrder?.(msg);
            setTimeout(() => onClose(), 150);
          }}
        >
          Order Now via Messenger ↗
        </a>
      </form>
    </Modal>
  );
}
// ↓ SCROLL STORY: Horizontal scroll-driven product showcase
function ScrollStory({ onSelect }: { onSelect: (p: Product) => void }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const previousActive = useRef(active);
  useEffect(() => {
    if (previousActive.current === active) return;
    previousActive.current = active;
    const container = tabsRef.current;
    if (!container) return;
    // Only scroll tabs horizontally on mobile viewports where overflow exists
    if (container.scrollWidth > container.clientWidth) {
      const activeBtn = container.querySelector<HTMLButtonElement>("button.active");
      if (activeBtn) {
        const targetScroll =
          activeBtn.offsetLeft -
          container.clientWidth / 2 +
          activeBtn.clientWidth / 2;
        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: "smooth",
        });
      }
    }
  }, [active]);
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
      stageEl.scrollLeft = 0;
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
          <div className="story-action-row">
            <div className="story-details">
              <span>{money(product.price)}</span>
              <small>{product.hot ? "HOT" : "ICED"} / 16 OZ</small>
            </div>
            <button className="button" onClick={() => onSelect(product)}>
              This is my cup <Icon name="plus" size={18} />
            </button>
          </div>
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
          <div className="flavor-tabs" ref={tabsRef} role="group" aria-label="Select a flavor">
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
                  : p.id === "matcha"
                    ? "Matcha Latte"
                    : p.id === "caramel"
                      ? "Caramel Macchiato"
                      : p.id === "strawberry"
                        ? "Strawberry Latte"
                        : p.id === "chai"
                          ? "Chai Latte"
                          : "Hot Roast"}
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
  const isFoodPage =
    new URLSearchParams(window.location.search).get("page") === "diner-bites";
  const foodHref = pageHref("diner-bites");
  const homeHref = (anchor: string) => pageHref("home", anchor);
  const [selected, setSelected] = useState<Product | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [filter, setFilter] = useState("All drinks");
  const [receipt, setReceipt] = useState(false);
  const [toast, setToast] = useState("");
  const [lastOrder, setLastOrder] = useState("");
  const scrollToTop = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };
  // ↓ CART STATE: Persisted to localStorage with backwards compatibility
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("beandiner-bag-v2") ||
          localStorage.getItem("saya-bag") ||
          "[]",
      );
      return Array.isArray(value)
        ? value
            .filter(
              (item: CartItem) =>
                (products.some((p) => p.id === item.id) ||
                  dinerBites.some(
                    (b) => b.id === item.id && !b.sample && b.price !== null,
                  )) &&
                typeof item.key === "string" &&
                Number.isFinite(item.price) &&
                item.price > 0 &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0 &&
                item.quantity <= 20,
            )
            .map((item: CartItem) =>
              item.id === "latte" &&
              item.name === "Classic Iced Caffe Latte"
                ? {
                    ...item,
                    name: spanishLatte.name,
                    price: item.price + 5,
                  }
                : item,
            )
        : [];
    } catch {
      return [];
    }
  });
  const hero = useRef<HTMLElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.title = isFoodPage
      ? "Diner Bites & Comfort Plates | Bean Diner"
      : "Bean Diner | Good Food. Great Coffee. Warm Vibes.";
  }, [isFoodPage]);
  // ↓ HASH SCROLL ON MOUNT
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash !== "#home" && hash !== "#top") {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }
    }
  }, []);
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
    document.documentElement.classList.add("js-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "100px" },
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
    if (bite.sample || bite.price === null) return;
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
  // ↓ BUNDLE DISCOUNT: Two Iced Spanish Lattes for ₱250
  const eligible = cart
    .filter(
      (i) =>
        i.id === "latte" &&
        i.size === "16 oz" &&
        i.milk === "Regular" &&
        i.temperature === "Iced",
    )
    .reduce((n, i) => n + i.quantity, 0);
  const discount = Math.floor(eligible / 2) * spanishLatteBundleSavings;
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
  const scrollToMenu = () => {
    document
      .querySelector(isFoodPage ? "#food-menu" : "#menu")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  // ↓ PRODUCT FILTER: All drinks, Best sellers, Coffee, Not coffee
  const visibleProducts = products.filter(
    (p) =>
      filter === "All drinks" ||
      (filter === "Best sellers" ? !!p.badge : p.type === filter),
  );
  return (
    <>
      <div
        id="top"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
      {/* ↓ PAGE PROGRESS: Fixed top scroll indicator */}
      <div className="page-progress" ref={progress} />
      {/* ↓ SKIP LINK: Accessibility skip-to-content */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {/* ↓ ANNOUNCEMENT BAR: Promotional banner */}
      <div className="announcement">
        GOOD FOOD. GREAT COFFEE.{" "}
        <span>
          Two Iced Spanish Lattes for {money(spanishLatteBundlePrice)}.
        </span>
        <a href={homeHref("together")}>
          Make it a coffee date <span>↗</span>
        </a>
      </div>
      {/* ↓ HEADER: Logo, navigation, order button, bag */}
      <header className="header" id="home">
        <Logo href={homeHref("home")} onClick={scrollToTop} />
        <nav aria-label="Main navigation" className="header-nav">
          <a href={homeHref("menu")} className="nav-item">
            <span className="nav-num">01</span>
            <span className="nav-label">Our drinks</span>
          </a>
          <a
            href={foodHref}
            className="nav-item"
            aria-current={isFoodPage ? "page" : undefined}
          >
            <span className="nav-num">02</span>
            <span className="nav-label">Diner bites</span>
            <span className="nav-badge">₱99</span>
          </a>
          <a href={homeHref("story")} className="nav-item">
            <span className="nav-num">03</span>
            <span className="nav-label">Our story</span>
          </a>
          <a href={homeHref("together")} className="nav-item nav-together">
            <span className="nav-num">04</span>
            <span className="nav-label">Better together</span>
            <span className="nav-coffee">✦</span>
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
          <a
            className="button header-order"
            href={isFoodPage ? "#food-menu" : "#menu"}
            onClick={(e) => {
              if (cart.length > 0) {
                e.preventDefault();
                setBagOpen(true);
                setReceipt(false);
              }
            }}
          >
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
            aria-expanded={navOpen}
            aria-haspopup="dialog"
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>
      <main id="main">
        {isFoodPage ? (
          <DinerBitesPage onAdd={addBite} drinksHref={homeHref("menu")} />
        ) : (
          <>
        {/* ↓ HERO SECTION: Main landing area with floating cup animation */}
        <section className="hero" ref={hero}>
          <div className="hero-oval" />
          <div className="hero-heading">
            <span className="eyebrow">
              <span className="tiny-star">✦</span> GEN. ANTONIO LUNA ST. ·
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
              Authentic diner comfort food &amp; specialty coffee on Antonio Luna Street.
            </p>
            <div className="hero-ctas">
              <a
                className="button"
                href="#menu"
                onClick={(e) => {
                  if (cart.length > 0) {
                    e.preventDefault();
                    setBagOpen(true);
                    setReceipt(false);
                  }
                }}
              >
                Order for pickup <Icon name="arrow" />
              </a>
              <a className="text-link" href={foodHref}>
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
            <span className="scribble-star">✦</span>
            <span className="handwritten">
              where food heals,
              <br />
              coffee understands.
            </span>
            <svg viewBox="0 0 100 70" fill="none" aria-hidden="true">
              <path
                d="M84 6C83 45 47 65 13 36m1 0 3 18M13 36l21 2"
                stroke="currentColor"
                strokeWidth="2.2"
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
                {spanishLatte.name} <span>{money(spanishLatte.price)}</span>
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
            <div
              className="menu-filters"
              role="group"
              aria-label="Filter drinks"
            >
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
            <span className="menu-size">SIGNATURE 16 OZ CUPS</span>
          </div>
          <div className="product-grid" id="drink-menu-products">
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
                      : p.id === "matcha"
                        ? "matcha!"
                        : p.id === "caramel"
                          ? "caramel!"
                          : p.id === "strawberry"
                            ? "berry!"
                            : p.id === "chai"
                              ? "chai!"
                              : "roast!"}
                  </span>
                  <img
                    src={image(p.id)}
                    alt={p.name}
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
          <div className="product-grid bites-grid bites-preview-grid">
            {dinerBites.slice(0, 2).map((bite) => (
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
                  <strong>
                    {bite.price === null ? "Price TBD" : money(bite.price)}
                  </strong>
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
          <div className="bites-preview-link">
            <a className="button" href={foodHref}>
              Explore all diner bites <Icon name="arrow" size={18} />
            </a>
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
              src={menuImage("diner-showcase")}
              alt="Refreshing Bean Diner signature ice drinks served at Bayambang café"
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
              2 cups. {money(spanishLatteBundlePrice)}.{" "}
              <span>Usually {money(spanishLatte.price * 2)}</span>
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
                  price: spanishLatte.price,
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
              alt="First iced Spanish Latte in the two-cup bundle"
              loading="lazy"
              width="400"
              height="600"
            />
            <img
              className="offer-cup cup-right"
              src={image("latte")}
              alt="Second iced Spanish Latte in the two-cup bundle"
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
          </>
        )}
      </main>
      {/* ↓ FOOTER: Elevated artisanal diner footer */}
      <footer className="footer-artisanal">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <Logo footer href={homeHref("home")} onClick={scrollToTop} />
            <p className="footer-tagline">
              <span className="handwritten">
                where food heals, coffee understands.
              </span>
              <br />
              Founded in Bayambang, Pangasinan by a US-trained culinary Chef and
              a Middle East specialty coffee Barista.
            </p>
            <div className="footer-founder-chips">
              <span className="founder-chip">US Culinary Kitchens</span>
              <span className="founder-chip">Middle East Barista</span>
              <span className="founder-chip">Benguet 100% Arabica</span>
            </div>
          </div>

          <div className="footer-nav-col">
            <span className="footer-heading">EXPLORE THE DINER</span>
            <div className="footer-pill-links">
              <a href={homeHref("menu")} className="footer-pill">
                <span>Our drinks</span>
                <small>Bestsellers & lattes</small>
              </a>
              <a href={foodHref} className="footer-pill">
                <span>Diner bites</span>
                <small>₱99 wings & comfort</small>
              </a>
              <a href={homeHref("story")} className="footer-pill">
                <span>Our story</span>
                <small>Two crafts, one home</small>
              </a>
              <a
                href={getMessengerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-pill footer-pill-fb"
              >
                <span>Chat on Messenger</span>
                <small>Order & table inquiry</small>
              </a>
            </div>
          </div>

          <div className="footer-info-col">
            <span className="footer-heading">VISIT OUR TABLE</span>
            <div className="footer-info-card">
              <div className="info-row">
                <span className="info-dot" />
                <div>
                  <strong>Bean Diner Bayambang</strong>
                  <p>Gen. Antonio Luna Street, Zone 2, Bayambang, Pangasinan</p>
                </div>
              </div>
              <div className="info-row">
                <span className="info-dot" />
                <div>
                  <strong>Diner Hours</strong>
                  <p>
                    Mon–Fri: 9:00 AM – 10:00 PM
                    <br />
                    Sat–Sun: 11:00 AM – 10:00 PM
                  </p>
                </div>
              </div>
              <div className="info-row">
                <span className="info-dot" />
                <div>
                  <strong>Phone / Inquiries</strong>
                  <p>
                    <a href="tel:09153995000" className="phone-link">
                      0915 399 5000
                    </a>
                  </p>
                </div>
              </div>
              <div className="footer-actions">
                <a
                  href={beanDinerMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button footer-map-btn"
                >
                  Open in Maps ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-copy">
            <span>
              © {new Date().getFullYear()} BEAN DINER BAYAMBANG. ALL RIGHTS
              RESERVED.
            </span>
            <span className="footer-subcopy">
              Handcrafted with care for Pangasinan students & coffee lovers.
            </span>
          </div>
          <span className="footer-closing handwritten">
            Tara, kain at kape tayo.
          </span>
          <a href="#top" className="back-top-pill" onClick={scrollToTop}>
            Back to top <span>↑</span>
          </a>
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
          onDirectOrder={(msg) => {
            setLastOrder(msg);
            setToast("✓ Order details copied to clipboard! Paste in Messenger.");
          }}
        />
      )}
      {/* ↓ BAG MODAL: Shopping cart drawer */}
      {bagOpen && (
        <Modal
          label="Your order bag"
          className="bag-modal"
          onClose={() => {
            setBagOpen(false);
            setReceipt(false);
          }}
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
                {/* ↓ BORDERED CLIPBOARD CARD */}
                <div className="receipt-clipboard-card">
                  <div className="clipboard-card-header">
                    <span className="clipboard-card-title">
                      📋 Order Summary for Messenger
                    </span>
                    <span className="clipboard-badge">✓ Ready to send</span>
                  </div>

                  {lastOrder && (
                    <div className="clipboard-preview-box">
                      {lastOrder}
                    </div>
                  )}

                  <a
                    href={getMessengerUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-copy-messenger"
                    style={{ textDecoration: "none" }}
                    onClick={() => {
                      if (lastOrder) {
                        copyToClipboard(lastOrder);
                        setToast("✓ Order details copied! Opening Messenger...");
                      }
                    }}
                  >
                    <span>📋</span> (Copy this and open Messenger ↗)
                  </a>
                </div>

                <button
                  className="button button-continue-shopping"
                  onClick={() => {
                    setBagOpen(false);
                    setReceipt(false);
                    scrollToMenu();
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
                    scrollToMenu();
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
                      ? "Chef's Comfort Kitchen Plate"
                      : [
                          item.size,
                          item.temperature,
                          item.sweetness,
                          item.temperature === "Iced" ? item.iceLevel : null,
                          item.milk && item.milk !== "Regular"
                            ? `${item.milk} milk`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ");
                    return (
                      <div className="cart-item" key={item.key}>
                        {p ? (
                          <img
                            src={image(p.id)}
                            alt={p.name}
                            style={{ background: p.color }}
                          />
                        ) : (
                          <div
                            className="cart-food-icon"
                            style={{
                              background: "#f2dfb8",
                              fontSize: "10px",
                              fontWeight: "800",
                              letterSpacing: "0.5px",
                            }}
                          >
                            BITE
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
                    const msg = sendToMessenger(
                      cart,
                      customerName,
                      subtotal - discount,
                      discount,
                    );
                    setLastOrder(msg);
                    setToast(
                      "✓ Order details copied to clipboard! Paste into Messenger.",
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
                    Send Order to Facebook Messenger
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
          <Logo
            href={homeHref("home")}
            onClick={(e) => {
              setNavOpen(false);
              scrollToTop(e);
            }}
          />
          <nav className="mobile-nav-list">
            {[
              {
                num: "01",
                label: "Our drinks",
                sub: "Benguet highland coffee & Oatside lattes",
                href: homeHref("menu"),
              },
              {
                num: "02",
                label: "Diner bites",
                sub: "₱99 crispy wings & comfort plates",
                badge: "₱99 WINGS",
                href: foodHref,
              },
              {
                num: "03",
                label: "Our story",
                sub: "US Chef & Middle East Barista roots",
                href: homeHref("story"),
              },
              {
                num: "04",
                label: "Better together",
                sub:
                  "Two-cup coffee date bundle for " +
                  money(spanishLatteBundlePrice),
                badge: "SAVE " + money(spanishLatteBundleSavings),
                href: homeHref("together"),
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
        href={getMessengerUrl()}
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
