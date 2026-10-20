// ↓ IMPORTS: React 19 hooks and types
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import DinerBitesPage from "./DinerBitesPage";
import BeveragesPage from "./BeveragesPage";
import OurStoryPage from "./OurStoryPage";
import {
  getStoreStatus,
  isPendingOrder,
  PENDING_ORDER_TTL_MS,
  readPendingOrder,
  validateOrderTiming,
  writePendingOrder,
  type PendingOrder,
} from "./utils/checkout";

import { dinerBites, type DinerBite } from "./dinerBites";
import {
  allBeverages,
  beverageAddOns,
  beverageSubs,
  type BeverageItem,
  type BeverageModifier,
} from "./beverages";
import {
  FadeImage,
  matchesQuery,
  normalizeQuery,
  PlusIcon,
  scrollListIntoView,
  useStickyHeaderOffset,
} from "./ui/menu";

// ↓ UTILITY: Philippine Peso currency formatter
const money = (n: number) => `₱${n.toLocaleString("en-PH")}`;
const beanDinerMapsUrl =
  "https://www.google.com/maps/place/Bean+Diner/@15.8103457,120.4573329,17z/data=!4m14!1m7!3m6!1s0x339149ebf4721bcb:0xff2c7401d69cb887!2sBean+Diner!8m2!3d15.8103457!4d120.4573329!16s%2Fg%2F11vljpcbmt!3m5!1s0x339149ebf4721bcb:0xff2c7401d69cb887!8m2!3d15.8103457!4d120.4573329!16s%2Fg%2F11vljpcbmt?entry=ttu&g_ep=EgoyMDI2MDkyMi4wIKXMDSoASAFQAw%3D%3D";
const wazeUrl = "https://waze.com/ul?q=Bean%20Diner%20Bayambang";
type CheckoutPayment = "cash" | "gcash" | "maya";

// ↓ UTILITY: Relative image path resolvers (supports dev server and file:// protocol)
const image = (name: string) => {
  if (name === "hot") return "./images/optimized/hotroast.webp";
  return `./images/optimized/${name}.webp`;
};
type AppPage = "home" | "diner-bites" | "beverages" | "our-story";
const pageFromSearch = (search: string): AppPage => {
  const page = new URLSearchParams(search).get("page");
  return page === "diner-bites" || page === "beverages" || page === "our-story"
    ? page
    : "home";
};
const pageHref = (page: AppPage, anchor = "") => {
  const url = new URL(window.location.href);
  if (page !== "home") url.searchParams.set("page", page);
  else url.searchParams.delete("page");
  url.hash = anchor;
  return url.href;
};

const clickScrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth";


const scrollToPageAnchor = (animate = false) => {
  const anchor = window.location.hash.slice(1);
  const behavior = animate ? clickScrollBehavior() : "instant";
  if (!anchor || anchor === "home" || anchor === "top") {
    window.scrollTo({ top: 0, left: 0, behavior });
  } else {
    if (["drink-menu-products", "signature-drinks", "best-sellers"].includes(anchor)) {
      scrollListIntoView(document.getElementById("drink-menu-products"), behavior);
      return;
    }
    document.getElementById(anchor)?.scrollIntoView({ behavior });
  }
};

// ↓ TYPE: Product data shape
type Product = {
  id: string;
  name: string;
  short: string;
  note: string;
  description: string;
  price: number;
  defaultSize?: string;
  sizePrices?: { size: string; price: number }[];
  color: string;
  word: string;
  ingredients: string[];
  type: "Coffee" | "Not coffee";
  hot?: boolean;
  fixedTemperature?: "Iced" | "Hot";
  allowMilkCustomization?: boolean;
  badge?: string;
  tabLabel?: string;
  photo: string;
};
const productImage = (product: Product) =>
  product.photo.startsWith("./") ? product.photo : image(product.id);
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

type FeaturedDrinkPresentation = {
  menuId: string;
  name?: string;
  short: string;
  note: string;
  color: string;
  word: string;
  ingredients: string[];
  photo: string;
  tabLabel: string;
};
const createFeaturedDrink = ({
  menuId,
  name,
  short,
  note,
  color,
  word,
  ingredients,
  photo,
  tabLabel,
}: FeaturedDrinkPresentation): Product => {
  const menuItem = allBeverages.find((item) => item.id === menuId);
  if (!menuItem) throw new Error(`Missing featured drink in beverages menu: ${menuId}`);
  const sizePrices = Object.entries(menuItem.prices).map(([size, price]) => ({
    size: size.replace(/(\d+)oz/i, "$1 oz"),
    price,
  }));
  const defaultSize = menuItem.defaultSize.replace(/(\d+)oz/i, "$1 oz");

  return {
    id: menuItem.id,
    name: name ?? menuItem.name,
    short,
    note,
    description: menuItem.description,
    price: menuItem.prices[menuItem.defaultSize],
    defaultSize,
    sizePrices,
    color,
    word,
    ingredients,
    type: menuItem.type === "Coffee" ? "Coffee" : "Not coffee",
    hot: menuItem.hot,
    fixedTemperature: "Iced",
    allowMilkCustomization: false,
    badge: menuItem.badge,
    tabLabel,
    photo,
  };
};
const heroSelectorProducts: Product[] = [
  createFeaturedDrink({
    menuId: "butterfly-pea-tea",
    short: "Butterfly pea tea, natural honey & fresh lemon",
    note: "Violet tea brightened with honey and fresh lemon.",
    color: "#e4e0ee",
    word: "Citrus bloom.",
    ingredients: ["Butterfly pea tea", "Natural honey", "Fresh lemon juice"],
    photo: "./images/hero-drinks/drink-01-honey-lemon.webp",
    tabLabel: "Honey Lemon",
  }),
  createFeaturedDrink({
    menuId: "strawberry-milk",
    short: "Real strawberry puree & cold fresh milk",
    note: "Sweet strawberry layered with creamy chilled milk.",
    color: "#f6d9dd",
    word: "Berry cloud.",
    ingredients: ["Real strawberry puree", "Cold fresh milk", "Creamy finish"],
    photo: "./images/hero-drinks/drink-02-strawberry-milk.webp",
    tabLabel: "Strawberry",
  }),
  createFeaturedDrink({
    menuId: "shake-oreo",
    name: "Oreo Milkshake",
    short: "Thick cookies & cream with Oreo pieces",
    note: "A creamy shake packed with dark Oreo cookie crunch.",
    color: "#d8c8ba",
    word: "Cookie crush.",
    ingredients: ["Oreo cookie pieces", "Creamy milkshake", "Dark cookie crunch"],
    photo: "./images/hero-drinks/drink-03-oreo-milkshake.webp",
    tabLabel: "Oreo Shake",
  }),
  createFeaturedDrink({
    menuId: "blend-double-dutch",
    short: "Double chocolate, vanilla bean & espresso",
    note: "A thick chocolate frappe with chips in every sip.",
    color: "#edcbb5",
    word: "Double chocolate.",
    ingredients: ["Double chocolate", "Vanilla bean", "Chocolate chips & espresso"],
    photo: "./images/hero-drinks/drink-04-double-dutch.webp",
    tabLabel: "Double Dutch",
  }),
  createFeaturedDrink({
    menuId: "blend-choco-pistachio",
    short: "Dark chocolate & Mediterranean pistachio",
    note: "A rich chocolate frappe blended with pistachio paste.",
    color: "#e7ccbd",
    word: "Nutty cocoa.",
    ingredients: ["Dark chocolate", "Mediterranean pistachio", "Creamy frappe"],
    photo: "./images/hero-drinks/drink-05-choco-pistachio.webp",
    tabLabel: "Choco Pistachio",
  }),
  createFeaturedDrink({
    menuId: "iced-matcha-latte",
    short: "Ceremonial Japanese matcha & chilled milk",
    note: "Earthy ceremonial matcha whisked smooth over ice.",
    color: "#dce4b8",
    word: "Matcha moment.",
    ingredients: ["Ceremonial green tea", "Chilled milk", "Smooth earthy finish"],
    photo: "./images/hero-drinks/drink-06-matcha-latte.webp",
    tabLabel: "Matcha Latte",
  }),
];
const allProducts = [...products, ...heroSelectorProducts];
const findProduct = (id: string) => allProducts.find((product) => product.id === id);

const spanishLatte = products.find((product) => product.id === "latte")!;
const coffeeDateSaltedCaramel = allBeverages.find(
  (beverage) => beverage.id === "iced-salted-caramel",
)!;
const coffeeDateMatcha = allBeverages.find(
  (beverage) => beverage.id === "iced-matcha-latte",
)!;
const coffeeDatePairSize = "16oz";
const coffeeDatePairSizeLabel = "16 oz";
const coffeeDatePairPrice =
  coffeeDateSaltedCaramel.prices[coffeeDatePairSize] +
  coffeeDateMatcha.prices[coffeeDatePairSize];
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
  note?: string;
};
// ↓ HELPER: Send formatted order to Bean Diner Facebook Messenger
const formatOrderMessage = (
  items: CartItem[],
  customerName: string,
  customerPhone: string,
  totalAmount: number,
  orderType: "pickup" | "dine-in" | "delivery" = "pickup",
  extraInfo: string = "",
  payment: CheckoutPayment = "gcash",
  pickupTime: string = "",
  orderNote: string = "",
) => {
  const lines = items.map((item) => {
    const p = findProduct(item.id);
    const b = dinerBites.find((b) => b.id === item.id);
    const bev = allBeverages.find((bev) => bev.id === item.id);
    const mod = [...beverageAddOns, ...beverageSubs].find((m) => m.id === item.id);
    const title = p ? p.name : b ? b.name : bev ? bev.name : mod ? mod.name : item.name || "Item";
    const noteSuffix = item.note?.trim()
      ? ` - Note: "${item.note.trim()}"`
      : "";
    if (item.isFood) {
      const displayTitle = item.name || title;
      return `• ${item.quantity}x ${displayTitle}${noteSuffix} - ${money(
          item.price * item.quantity,
        )}`;
    }
    if (bev) {
      return `• ${item.quantity}x ${title} (${item.size || bev.defaultSize}, ${bev.hot ? "Hot" : "Over Iced"})${noteSuffix} - ${money(
          item.price * item.quantity,
        )}`;
    }
    if (mod) {
      return `• ${item.quantity}x ${title} (Customization)${noteSuffix} - ${money(
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
    return `• ${item.quantity}x ${title} (${specs})${noteSuffix} - ${money(
        item.price * item.quantity,
      )}`;
  });

  let orderTypeLine = "Order Type: For pick up\nPickup Location: Bean Diner · Gen. Antonio Luna St., Zone 2, Bayambang, Pangasinan";
  if (orderType === "dine-in") {
    const tableStr = extraInfo.replace(/^table\s*/i, "").trim();
    orderTypeLine = `Order Type: Dine in${tableStr ? ` (Table ${tableStr})` : ""}`;
  } else if (orderType === "delivery") {
    orderTypeLine = `Order Type: Door to door (Delivery)${extraInfo ? `\nDelivery Address: ${extraInfo}` : ""}`;
  }

  const timingLine = pickupTime ? `Preferred Timing: ${pickupTime}` : null;
  const noteLine = orderNote?.trim() ? `Order Note: "${orderNote.trim()}"` : null;

  return [
    `Hello Bean Diner Bayambang! I would like to place an order:`,
    ``,
    ...lines,
    ``,
    orderTypeLine,
    timingLine,
    `Payment: ${payment === "gcash" ? "GCash" : payment === "maya" ? "Maya" : "Cash upon pickup/delivery"}`,
    `Total: ${money(totalAmount)}`,
    customerName ? `Name: ${customerName}` : null,
    customerPhone ? `Contact: ${customerPhone}` : null,
    noteLine,
  ]
    .filter(Boolean)
    .join("\n");
};

// ↓ BULLETPROOF CLIPBOARD COPY: Synchronous execCommand inside active modal/container + Async navigator.clipboard
const copyToClipboard = (text: string): boolean => {
  if (!text) return false;
  let copied = false;

  // 1. Synchronous fallback: Executes immediately inside the user click/submit gesture.
  // Critical fix: When dialog.showModal() is active, elements appended to document.body
  // are marked inert by the browser, which silently breaks textarea.focus() and selection!
  // Appending inside dialog[open] ensures the element is in the active focusable subtree.
  try {
    const container =
      document.querySelector<HTMLElement>("dialog[open]") ||
      document.body;

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "absolute";
    textarea.style.left = "0";
    textarea.style.top = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.padding = "0";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.background = "transparent";
    textarea.style.color = "transparent";
    textarea.style.opacity = "0.01";
    textarea.style.pointerEvents = "none";
    textarea.style.zIndex = "-1";
    textarea.style.fontSize = "16px";
    textarea.setAttribute("readonly", "");

    container.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    copied = document.execCommand("copy");
    container.removeChild(textarea);
  } catch {
    /* fallback handled below */
  }

  // 2. Also trigger modern async navigator.clipboard as backup when available & allowed
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        copied = true;
      })
      .catch(() => {});
  }

  return copied;
};

// ↓ MESSENGER URL: Universal Mobile App Deep Link & Desktop Messenger Destination
const MESSENGER_PAGE_ID = "100959311683531";

const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
};

// Every anchor keeps a safe web destination for new-tab and modified clicks.
const getMessengerUrl = () =>
  `https://www.facebook.com/messages/t/${MESSENGER_PAGE_ID}`;

const FACEBOOK_PAGE_URL = "https://www.facebook.com/beandiner";

let cancelMessengerFallback: (() => void) | undefined;

// Only the native scheme may leave this tab. Web destinations always open separately.
const openMessengerApp = () => {
  cancelMessengerFallback?.();
  if (isMobileDevice()) {
    const appUrl = `fb-messenger://user-thread/${MESSENGER_PAGE_ID}`;
    const cleanup = () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", cleanup);
      cancelMessengerFallback = undefined;
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") cleanup();
    };
    const timer = window.setTimeout(() => {
      cleanup();
      if (document.visibilityState === "visible") {
        // If a browser blocks delayed popups, the receipt also offers a direct web link.
        window.open(getMessengerUrl(), "_blank", "noopener,noreferrer");
      }
    }, 1500);
    cancelMessengerFallback = cleanup;
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", cleanup);
    window.location.href = appUrl;
  } else {
    window.open(getMessengerUrl(), "_blank", "noopener,noreferrer");
  }
};

function OrderingSteps({ handoff = false }: { handoff?: boolean }) {
  const steps = handoff
    ? [
        ["Order Copied", "Details are saved to your clipboard"],
        ["Open Chat", "Tap the button below to launch Messenger"],
        ["Paste & Send", "Long-press the chat bar, tap Paste, and send"],
      ]
    : [
        ["Choose Your Sips & Bites", "Explore signature iced roasts and comfort kitchen plates"],
        ["Pick Order Mode", "For pick up, Dine in with table #, or Door to door delivery"],
        ["Paste in Messenger", "Your order is auto-formatted; paste to chat with our crew"],
      ];

  return (
    <ol className={`ordering-steps${handoff ? " ordering-steps-handoff" : ""}`} aria-label={handoff ? "Send your order in three steps" : "How social ordering works"}>
      {steps.map(([title, description], index) => (
        <li key={title}>
          <span className="ordering-step-number" aria-hidden="true">{index + 1}</span>
          <div>
            <h3><span className="sr-only">{index + 1}. </span>{title}</h3>
            <p>{description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
// ↓ ICON COMPONENT: SVG icon set (arrow, bag, close, menu, plus, minus, play, check)
function Icon({
  name,
  size = 20,
}: {
  name:
    "arrow" | "bag" | "close" | "menu" | "plus" | "minus" | "play" | "check" | "alert-circle";
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
    "alert-circle": (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
      </>
    ),
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
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`logo ${footer ? "footer-logo" : ""}`}
      aria-label="Bean Diner home"
    >
      <div className="logo-badge-frame">
        <img
          src="./images/bean_diner_logo_transparent.png"
          alt="Bean Diner Logo"
          className="logo-badge-img"
          width="42"
          height="42"
        />
      </div>
      <div className="logo-brand-copy">
        <span className="logo-title">bean diner</span>
        {!footer && <small className="logo-location">BAYAMBANG</small>}
      </div>
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
// ↓ MODAL COMPONENT: Base dialog with backdrop, focus trap, Esc-to-close, and return focus
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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    const isBagModal = el.matches(".bag-modal");
    const shouldFreezeBagBackground = isBagModal &&
      (navigator.maxTouchPoints > 0 || "ontouchstart" in window);
    const pageScrollX = window.scrollX;
    const pageScrollY = window.scrollY;
    if (!el.open) {
      try {
        el.showModal();
      } catch {
        /* Dialog already open */
      }
    }
    const body = document.body;
    const root = document.documentElement;
    const oldBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
    };
    const oldRootOverflow = root.style.overflow;
    body.style.overflow = "hidden";
    if (shouldFreezeBagBackground) {
      // iOS Safari can still scroll the page behind a modal when body overflow is hidden.
      root.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `${-pageScrollY}px`;
      body.style.left = `${-pageScrollX}px`;
      body.style.width = "100%";
    }
    const viewport = window.visualViewport;
    let viewportFrame = 0;
    let keyboardOpen = false;
    const updateBagViewport = () => {
      if (!el.matches(".bag-modal")) return;
      const height = viewport?.height ?? innerHeight;
      const viewportTop = Math.floor(viewport?.offsetTop ?? 0);
      const viewportBottom = Math.ceil(viewportTop + height);
      // Leave one CSS pixel for Safari's fractional visual viewport rounding.
      el.style.setProperty("--bag-viewport-height", `${Math.max(0, Math.floor(height) - 1)}px`);
      const nextKeyboardOpen = Boolean(viewport && height < innerHeight - 120);
      el.style.setProperty(
        "--bag-viewport-top",
        `${nextKeyboardOpen ? viewportTop : 0}px`,
      );
      el.classList.toggle("is-keyboard-open", nextKeyboardOpen);
      const dialogBottom = Math.min(viewportBottom, Math.ceil(el.getBoundingClientRect().bottom));
      el.style.setProperty("--bag-dialog-bottom", `${Math.max(0, dialogBottom)}px`);
      el.style.setProperty("--bag-viewport-bottom", `${Math.max(0, viewportBottom)}px`);
      if (nextKeyboardOpen && !keyboardOpen) {
        cancelAnimationFrame(viewportFrame);
        viewportFrame = requestAnimationFrame(() => {
          const activeElement = document.activeElement;
          if (el.open && activeElement instanceof HTMLElement && el.contains(activeElement)) {
            activeElement.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
        });
      }
      keyboardOpen = nextKeyboardOpen;
    };
    updateBagViewport();
    viewport?.addEventListener("resize", updateBagViewport);
    viewport?.addEventListener("scroll", updateBagViewport);
    window.addEventListener("resize", updateBagViewport);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((n) => n.offsetParent !== null);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    el.addEventListener("keydown", handleKeyDown);

    return () => {
      el.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(viewportFrame);
      viewport?.removeEventListener("resize", updateBagViewport);
      viewport?.removeEventListener("scroll", updateBagViewport);
      window.removeEventListener("resize", updateBagViewport);
      el.classList.remove("is-keyboard-open");
      el.style.removeProperty("--bag-viewport-height");
      el.style.removeProperty("--bag-viewport-top");
      el.style.removeProperty("--bag-dialog-bottom");
      el.style.removeProperty("--bag-viewport-bottom");
      if (el.open) el.close();
      body.style.overflow = oldBodyStyles.overflow;
      if (shouldFreezeBagBackground) {
        body.style.position = oldBodyStyles.position;
        body.style.top = oldBodyStyles.top;
        body.style.left = oldBodyStyles.left;
        body.style.width = oldBodyStyles.width;
        root.style.overflow = oldRootOverflow;
        window.scrollTo(pageScrollX, pageScrollY);
      }
      if (previous && typeof previous.focus === "function") {
        previous.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      aria-modal="true"
      className={`modal ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
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
// ↓ SEGMENTED: Radio group styled as a segmented control (arrow keys move selection)
function Segmented({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string; extra?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="segmented">
      <legend>{legend}</legend>
      <div className="segmented-track" style={{ "--seg-count": options.length } as CSSProperties}>
        {options.map((o) => (
          <label key={o.value} className={value === o.value ? "selected" : ""}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
            {o.extra && <small>{o.extra}</small>}
          </label>
        ))}
      </div>
    </fieldset>
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
  const isIcedDrink = product.fixedTemperature === "Iced" || product.name.toLowerCase().includes("iced");
  const isHotDrink = product.fixedTemperature === "Hot" || product.name.toLowerCase().includes("hot");
  const fixedTemperature = product.fixedTemperature ?? (isIcedDrink ? "Iced" : isHotDrink ? "Hot" : product.hot ? "Hot" : undefined);
  const sizeOptions = product.sizePrices ?? [
    { size: "16 oz", price: product.price },
    { size: "22 oz", price: product.price + 30 },
  ];
  const [size, setSize] = useState(product.defaultSize ?? sizeOptions[0].size);
  const [milk, setMilk] = useState("Regular");
  const [temperature, setTemperature] = useState(
    fixedTemperature ?? "Iced"
  );
  const [sweetness, setSweetness] = useState("100% Sweet");
  const [iceLevel, setIceLevel] = useState("Regular Ice");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const hasMilk = product.allowMilkCustomization ?? true;
  const price =
    (sizeOptions.find((option) => option.size === size)?.price ?? product.price) +
    (hasMilk && milk === "Oat" ? 35 : 0);

  return (
    <Modal
      onClose={onClose}
      label={`Customize ${product.name}`}
      className="product-modal"
    >
      <div className="customize-image" style={{ background: product.color }}>
        <img src={productImage(product)} alt="" />
      </div>
      <form
        className="customize-form"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmedNote = note.trim();
          onAdd({
            key: `${product.id}-${size}-${milk}-${temperature}-${sweetness}-${iceLevel}${trimmedNote ? `-${trimmedNote}` : ""}`,
            id: product.id,
            size,
            milk,
            temperature,
            sweetness,
            iceLevel,
            quantity,
            price,
            name: product.name,
            note: trimmedNote || undefined,
          });
          onClose();
        }}
      >
        <div className="customize-head">
          <h2>{product.name}</h2>
          <p className="customize-price">{money(price)}</p>
        </div>
        <p className="customize-desc">{product.description}</p>

        {!fixedTemperature && (
          <Segmented
            legend="Hot or iced"
            name="temperature"
            value={temperature}
            onChange={(value) => {
              if (value === "Hot" || value === "Iced") setTemperature(value);
            }}
            options={[
              { value: "Iced", label: "Iced" },
              { value: "Hot", label: "Hot" },
            ]}
          />
        )}
        {fixedTemperature && (
          <p className="customize-fixed">
            {fixedTemperature === "Iced" ? "Served iced" : "Served hot"}
          </p>
        )}

        {sizeOptions.length > 1 ? (
          <Segmented
            legend="Size"
            name="size"
            value={size}
            onChange={setSize}
            options={sizeOptions.map((option, index) => ({
              value: option.size,
              label: option.size,
              extra:
                index > 0 && option.price > sizeOptions[0].price
                  ? `+${money(option.price - sizeOptions[0].price)}`
                  : undefined,
            }))}
          />
        ) : (
          <p className="customize-fixed">Size: {sizeOptions[0].size}</p>
        )}

        {hasMilk && (
          <Segmented
            legend="Milk"
            name="milk"
            value={milk}
            onChange={setMilk}
            options={[
              { value: "Regular", label: "Regular" },
              { value: "Oat", label: "Oat", extra: "+₱35" },
            ]}
          />
        )}

        <Segmented
          legend="Sweetness"
          name="sweetness"
          value={sweetness}
          onChange={setSweetness}
          options={[
            { value: "100% Sweet", label: "100%" },
            { value: "70% Sweet", label: "70%" },
            { value: "50% Sweet", label: "50%" },
            { value: "No Sugar", label: "None" },
          ]}
        />

        {temperature === "Iced" && (
          <Segmented
            legend="Ice"
            name="iceLevel"
            value={iceLevel}
            onChange={setIceLevel}
            options={[
              { value: "Regular Ice", label: "Regular" },
              { value: "Less Ice", label: "Less" },
            ]}
          />
        )}

        <div className="item-note-field">
          <label htmlFor="item-note">Note for the barista (optional)</label>
          <input
            id="item-note"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. separate syrup"
            maxLength={120}
          />
        </div>

        <div className="add-row">
          <div className="quantity" role="group" aria-label="Quantity">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              disabled={quantity === 1}
            >
              <Icon name="minus" size={16} />
            </button>
            <output aria-live="polite">{quantity}</output>
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
            Add {quantity > 1 ? `${quantity} ` : ""}to bag
            <span className="add-row-price" aria-live="polite">
              {money(price * quantity)}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
// ↓ APP COMPONENT: Root component with state, cart, and all sections
// ↓ DINER BITE CUSTOMIZE MODAL: Flavor / glaze / option selection dialog
function BiteCustomizeModal({
  bite,
  onClose,
  onAdd,
}: {
  bite: DinerBite;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
  const [selectedOption, setSelectedOption] = useState<string>(
    bite.options?.[0] || "",
  );
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const cleanName = bite.name.replace(/\s*\([^)]*\)/g, "").trim();
  const price = bite.price || 0;

  return (
    <Modal
      onClose={onClose}
      label={`Customize ${cleanName}`}
      className="product-modal bite-customize-modal"
    >
      <div className="customize-image bite-modal-header-hero">
        <span className="eyebrow">{bite.tag}</span>
        <h3 className="bite-modal-hero-title">{cleanName}</h3>
        <span className="bite-modal-badge">{bite.badge}</span>
      </div>
      <form
        className="customize-form"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmedNote = note.trim();
          onAdd({
            key: `bite-${bite.id}-${selectedOption}${trimmedNote ? `-${trimmedNote}` : ""}`,
            id: bite.id,
            name: `${cleanName} (${selectedOption})`,
            size: selectedOption,
            temperature: "Hot & Fresh",
            quantity,
            price,
            isFood: true,
            note: trimmedNote || undefined,
          });
          onClose();
        }}
      >
        <span className="eyebrow">{bite.subtitle}</span>
        <h2>{cleanName}</h2>
        <p>{bite.description}</p>
        <span className="availability">
          Freshly cooked to order at Antonio Luna St., Bayambang
        </span>

        {/* Flavor / Option choices */}
        {bite.options && bite.options.length > 0 && (
          <Segmented
            legend={bite.optionLabel || "Select your flavor"}
            name="bite-option"
            value={selectedOption}
            onChange={setSelectedOption}
            options={bite.options.map((opt) => ({ value: opt, label: opt }))}
          />
        )}

        {/* Special Instructions Note */}
        <div className="item-note-field">
          <label htmlFor="bite-item-note">
            Special instructions / requests (optional)
          </label>
          <input
            id="bite-item-note"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Extra crispy, dip on the side, less seasoning..."
            maxLength={120}
          />
        </div>

        <div className="add-row">
          <div className="quantity" role="group" aria-label="Quantity">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Icon name="minus" size={16} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              disabled={quantity >= 20}
              aria-label="Increase quantity"
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
          <button className="button" type="submit">
            Add {quantity > 1 ? `${quantity} ` : ""}to bag
            <span className="add-row-price" aria-live="polite">
              {money(price * quantity)}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(() => pageFromSearch(window.location.search));
  const isFoodPage = currentPage === "diner-bites";
  const isBeveragesPage = currentPage === "beverages";
  const isStoryPage = currentPage === "our-story";
  useStickyHeaderOffset(!isFoodPage && !isBeveragesPage);
  const navigationFrame = useRef(0);
  const foodHref = pageHref("diner-bites");
  const beveragesHref = pageHref("beverages");
  const storyHref = pageHref("our-story");
  const signatureHref = pageHref("beverages", "drink-menu-products");
  const bestSellersHref = pageHref("beverages", "best-sellers");
  const homeHref = (anchor: string) => pageHref("home", anchor);
  const [selected, setSelected] = useState<Product | null>(null);
  const [customizingBite, setCustomizingBite] = useState<DinerBite | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [beverageCategory, setBeverageCategory] = useState("top-6");
  const [beverageQuery, setBeverageQuery] = useState("");
  const [receipt, setReceipt] = useState(false);
  const [toast, setToast] = useState("");
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(readPendingOrder);
  const lastOrder = pendingOrder?.message ?? "";
  useEffect(() => {
    writePendingOrder(pendingOrder);
    if (!pendingOrder) return;
    const timeout = window.setTimeout(() => {
      setPendingOrder(null);
      setReceipt(false);
    }, Math.max(0, pendingOrder.createdAt + PENDING_ORDER_TTL_MS - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [pendingOrder]);
  const openOrderBag = () => {
    const saved = isPendingOrder(pendingOrder) ? pendingOrder : null;
    if (!saved && pendingOrder) setPendingOrder(null);
    setReceipt(cart.length === 0 && Boolean(saved));
    setCheckoutStep("bag");
    setBagOpen(true);
  };
  const bagHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (receipt) {
      bagHeadingRef.current?.focus({ preventScroll: true });
      bagHeadingRef.current?.closest("dialog")?.scrollTo({ top: 0 });
      if (lastOrder) {
        copyToClipboard(lastOrder);
      }
    }
  }, [receipt, lastOrder]);
  const [storeStatus, setStoreStatus] = useState(getStoreStatus);
  const [checkoutStep, setCheckoutStep] = useState<"bag" | "details">("bag");
  const [checkoutPickupTime, setCheckoutPickupTime] = useState(() =>
    validateOrderTiming("ASAP (~15-20 mins)", "") ? "Custom time" : "ASAP (~15-20 mins)",
  );
  const [checkoutCustomTime, setCheckoutCustomTime] = useState("");
  const [checkoutNote, setCheckoutNote] = useState("");
  const [checkoutOrderType, setCheckoutOrderType] = useState<"pickup" | "dine-in" | "delivery">("pickup");
  const [checkoutExtra, setCheckoutExtra] = useState("");
  const [checkoutPayment, setCheckoutPayment] = useState<CheckoutPayment>("gcash");
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutErrors, setCheckoutErrors] = useState<{
    name?: string | null;
    phone?: string | null;
    address?: string | null;
    time?: string | null;
  }>({});

  const formatPhoneNumber = (val: string) => {
    let cleaned = val.replace(/\D/g, "");
    if (cleaned.startsWith("63") && cleaned.length > 2) {
      cleaned = "0" + cleaned.slice(2);
    }
    cleaned = cleaned.slice(0, 11);

    if (cleaned.length <= 4) {
      return cleaned;
    }
    if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  };

  const validateCustomerName = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return "Please enter your name";
    if (trimmed.length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed))
      return "Name can only contain letters, spaces, hyphens, and apostrophes";
    return null;
  };

  const validateCustomerPhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) return "Please enter your contact number";
    if (!(digits.length === 11 && digits.startsWith("09")))
      return "Please enter an 11-digit mobile number (e.g. 09XX-XXX-XXXX)";
    return null;
  };

  const validateDeliveryAddress = (val: string, orderType: string) => {
    if (orderType !== "delivery") return null;
    const trimmed = val.trim();
    if (!trimmed) return "Please enter your delivery address & landmark";
    if (trimmed.length < 8)
      return "Address must be at least 8 characters with street, barangay & landmark";
    return null;
  };

  const showNameError = Boolean(checkoutErrors.name);
  const showPhoneError = Boolean(checkoutErrors.phone);
  const showAddressError = Boolean(checkoutErrors.address);
  const showTimeError = Boolean(checkoutErrors.time);
  const scrollToTop = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: clickScrollBehavior() });
  };
  const navigateToUrl = (url: URL) => {
    if (pageFromSearch(url.search) === "beverages") {
      if (url.hash === "#best-sellers") {
        setBeverageCategory("best-seller");
        setBeverageQuery("");
      } else if (!isBeveragesPage || ["#drink-menu-products", "#signature-drinks"].includes(url.hash)) {
        setBeverageCategory("top-6");
        setBeverageQuery("");
      }
    }
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
    setCurrentPage(pageFromSearch(url.search));
    setNavOpen(false);
    cancelAnimationFrame(navigationFrame.current);
    navigationFrame.current = requestAnimationFrame(() => scrollToPageAnchor(true));
  };
  const handlePageLink = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey
    ) return;
    event.preventDefault();
    navigateToUrl(new URL(event.currentTarget.href));
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
                (!!findProduct(item.id) ||
                  dinerBites.some(
                    (b) => b.id === item.id && !b.sample && b.price !== null,
                  ) ||
                  allBeverages.some((b) => b.id === item.id) ||
                  beverageAddOns.some((m) => m.id === item.id) ||
                  beverageSubs.some((m) => m.id === item.id)) &&
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
  const videoHero = useRef<HTMLVideoElement>(null);
  const videoPlaybackTime = useRef(0);
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const video = videoHero.current;
    if (!video) return;

    if (videoPlaybackTime.current > 0) {
      video.currentTime = videoPlaybackTime.current;
    }
    const rememberPlaybackTime = () => {
      if (Number.isFinite(video.currentTime)) {
        videoPlaybackTime.current = video.currentTime;
      }
    };
    video.addEventListener("timeupdate", rememberPlaybackTime);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isVisible = false;
    let disposed = false;
    let lastTime = video.currentTime;
    let stalledSince = 0;
    let reloaded = false;
    const syncPlayback = () => {
      if (disposed) return;
      if (reducedMotion.matches || !isVisible || document.hidden) {
        video.pause();
        stalledSince = 0;
        return;
      }
      if (video.paused) void video.play().catch(() => {
        // Autoplay can be denied until the next user gesture.
      });
    };
    const recoverPlayback = () => {
      if (disposed || document.hidden || !isVisible || reducedMotion.matches) return;
      if (video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        stalledSince = 0;
        reloaded = false;
      } else if (!video.seeking) {
        stalledSince ||= performance.now();
        if (!reloaded && performance.now() - stalledSince >= 12000) {
          reloaded = true;
          video.load();
        }
      }
      syncPlayback();
    };
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.05 });

    observer.observe(video);
    reducedMotion.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    window.addEventListener("pageshow", syncPlayback);
    window.addEventListener("online", recoverPlayback);
    document.addEventListener("pointerdown", syncPlayback, { passive: true });
    document.addEventListener("keydown", syncPlayback);
    video.addEventListener("canplay", syncPlayback);
    const recoveryTimer = window.setInterval(recoverPlayback, 4000);
    return () => {
      disposed = true;
      window.clearInterval(recoveryTimer);
      rememberPlaybackTime();
      observer.disconnect();
      reducedMotion.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      window.removeEventListener("pageshow", syncPlayback);
      window.removeEventListener("online", recoverPlayback);
      document.removeEventListener("pointerdown", syncPlayback);
      document.removeEventListener("keydown", syncPlayback);
      video.removeEventListener("canplay", syncPlayback);
      video.removeEventListener("timeupdate", rememberPlaybackTime);
      video.pause();
    };
  }, [currentPage]);
  useEffect(() => {
    document.title = isFoodPage
      ? "Diner Bites & Comfort Plates | Bean Diner"
      : isBeveragesPage
      ? "Artisanal Brews & Specialty Sips | Bean Diner"
      : isStoryPage
      ? "Our Story | Bean Diner Bayambang"
      : "Bean Diner | Good Food. Great Coffee. Warm Vibes.";
    const description = isFoodPage
      ? "Crispy chicken wings, loaded nachos, rice plates, pasta, sandwiches, and warm croffles at Bean Diner in Bayambang, Pangasinan."
      : isBeveragesPage
      ? "Hot and iced coffee, matcha, chai, milkshakes, and plant-based add-ons at Bean Diner in Bayambang, Pangasinan."
      : isStoryPage
      ? "Meet the US-trained Chef and Middle East specialty coffee Barista behind Bean Diner in Bayambang, Pangasinan."
      : "Bean Diner in Bayambang, Pangasinan. Founded by a US-trained Chef & Middle East-skilled Barista. Comfort food, Oatside creations, Benguet highland coffee, and warm community vibes.";
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [isFoodPage, isBeveragesPage, isStoryPage]);
  useEffect(() => {
    const updateStoreStatus = () => setStoreStatus(getStoreStatus());
    const interval = window.setInterval(updateStoreStatus, 60_000);
    document.addEventListener("visibilitychange", updateStoreStatus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", updateStoreStatus);
    };
  }, []);
  // Keep browser history and in-page anchors in sync without remounting the cart.
  useEffect(() => {
    const syncLocation = () => {
      setCurrentPage(pageFromSearch(window.location.search));
      if (pageFromSearch(window.location.search) === "beverages") {
        setBeverageCategory(window.location.hash === "#best-sellers" ? "best-seller" : "top-6");
        setBeverageQuery("");
      }
      setNavOpen(false);
      cancelAnimationFrame(navigationFrame.current);
      navigationFrame.current = requestAnimationFrame(() => scrollToPageAnchor());
    };
    syncLocation();
    window.addEventListener("popstate", syncLocation);
    return () => {
      window.removeEventListener("popstate", syncLocation);
      cancelAnimationFrame(navigationFrame.current);
    };
  }, []);
  // ↓ CART PERSISTENCE: Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("beandiner-bag-v2", JSON.stringify(cart));
    } catch {
      /* Private browsing keeps the current session functional. */
    }
  }, [cart]);
  // ↓ TOAST TIMER: Auto-dismiss toast (longer when Undo is offered)
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => {
      setToast("");
      setUndoCart(null);
    }, toast.startsWith("Added ") ? 6000 : 3200);
    return () => clearTimeout(id);
  }, [toast]);
  // ↓ SCROLL EFFECTS: Hero parallax, progress bar, reveal-on-scroll
  useEffect(() => {
    let frame = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = matchMedia("(pointer: coarse)");
    const heroSection = hero.current;
    const heading = hero.current?.querySelector<HTMLElement>("h2");
    const cup = hero.current?.querySelector<HTMLElement>(".hero-product-wrap");
    let viewportHeight = innerHeight;
    let snapOffset = Number.parseFloat(
      getComputedStyle(document.documentElement).scrollPaddingTop,
    ) || 0;
    let maxScroll = 1;
    const heroVisibility = heroSection ? new IntersectionObserver(([entry]) => {
      heroSection.classList.toggle("is-in-view", entry.isIntersecting);
      if (entry.isIntersecting) heroSection.classList.add("has-entered");
    }, { threshold: 0.05 }) : null;
    if (heroSection) heroVisibility?.observe(heroSection);
    const paint = () => {
      frame = 0;
      const sectionTop = heroSection?.getBoundingClientRect().top ?? viewportHeight;
      const parallax = Math.min(1, Math.max(0, (snapOffset - sectionTop) / viewportHeight));
      if (reduced.matches || coarsePointer.matches) {
        heading?.style.removeProperty("translate");
        if (cup) cup.style.transform = "none";
      } else {
        if (heading)
          heading.style.setProperty(
            "translate",
            `${parallax * -8}px ${parallax * -16}px`,
          );
        if (cup) cup.style.transform = `translate3d(${parallax * 16}px,${parallax * -24}px,0) rotate(${parallax * 3}deg)`;
      }
      const scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      if (progress.current)
        progress.current.style.transform = `scaleX(${scrollProgress})`;
    };
    const handle = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const measure = () => {
      viewportHeight = innerHeight;
      snapOffset = Number.parseFloat(
        getComputedStyle(document.documentElement).scrollPaddingTop,
      ) || 0;
      maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
      handle();
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", measure);
    reduced.addEventListener("change", handle);
    coarsePointer.addEventListener("change", handle);
    measure();
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
      window.removeEventListener("resize", measure);
      reduced.removeEventListener("change", handle);
      coarsePointer.removeEventListener("change", handle);
      resizeObserver.disconnect();
      heroVisibility?.disconnect();
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [currentPage]);
  // ↓ ADD FEEDBACK: Bump bag icon, toast "Added <item>" with Undo snapshot
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const [undoCart, setUndoCart] = useState<CartItem[] | null>(null);
  const [bagBump, setBagBump] = useState(0);
  const announceAdd = (name: string) => {
    setUndoCart([...cartRef.current]);
    setBagBump((n) => n + 1);
    setToast(`Added ${name.replace(/\s*\([^)]*\)\s*$/, "")}`);
  };
  const undoAdd = () => {
    if (undoCart) {
      setCart(undoCart);
      setToast("Item removed from bag.");
    }
    setUndoCart(null);
  };
  // ↓ ADD TO CART: Merge duplicates, show toast
  const add = (item: CartItem) => {
    announceAdd(item.name || "item");
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
  };

  // ↓ ADD DINER BITE: Add comfort food item (or open customization if flavored)
  const addBite = (bite: DinerBite) => {
    if (bite.sample || bite.price === null) return;
    if (bite.options && bite.options.length > 0) {
      setCustomizingBite(bite);
      return;
    }
    const cleanName = bite.name.replace(/\s*\([^)]*\)/g, "").trim();
    const item: CartItem = {
      key: `bite-${bite.id}`,
      id: bite.id,
      name: cleanName,
      size: "Plate",
      milk: "None",
      temperature: "Hot & Fresh",
      quantity: 1,
      price: bite.price,
      isFood: true,
    };
    announceAdd(cleanName);
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
  };

  // ↓ ADD BEVERAGE: Add coffee / drink item from dedicated beverages page
  const addBeverage = (
    bev: BeverageItem,
    size: string,
    price: number,
  ) => {
    const item: CartItem = {
      key: `bev-${bev.id}-${size}`,
      id: bev.id,
      name: `${bev.name} (${size})`,
      size: size,
      temperature: bev.hot ? "Hot" : "Over Iced",
      quantity: 1,
      price: price,
      isFood: false,
    };
    add(item);
  };

  const addCoffeeDatePair = () => {
    const pairItems: CartItem[] = [
      coffeeDateSaltedCaramel,
      coffeeDateMatcha,
    ].map((beverage) => ({
      key: `bev-${beverage.id}-${coffeeDatePairSize}`,
      id: beverage.id,
      name: `${beverage.name} (${coffeeDatePairSizeLabel})`,
      size: coffeeDatePairSize,
      temperature: "Over Iced",
      quantity: 1,
      price: beverage.prices[coffeeDatePairSize],
      isFood: false,
    }));

    announceAdd("Salted Caramel + Matcha coffee date");
    setCart((current) =>
      pairItems.reduce((items, item) => {
        const existing = items.find((candidate) => candidate.key === item.key);
        return existing
          ? items.map((candidate) =>
              candidate.key === item.key
                ? {
                    ...candidate,
                    quantity: Math.min(20, candidate.quantity + item.quantity),
                  }
                : candidate,
            )
          : [...items, item];
      }, current),
    );
    setSelected(null);
    setReceipt(false);
  };

  // ↓ ADD MODIFIER: Add add-on or milk substitution to bag
  const addModifier = (mod: BeverageModifier, type: "Add-on" | "Sub") => {
    const item: CartItem = {
      key: `mod-${mod.id}`,
      id: mod.id,
      name: `${mod.name} (${type})`,
      size: "Customization",
      quantity: 1,
      price: mod.price,
      isFood: false,
    };
    add(item);
  };
  const cartCount = cart.reduce((n, i) => n + i.quantity, 0);
  const subtotal = cart.reduce((n, i) => n + i.price * i.quantity, 0);
  const removeItem = (key: string) =>
    setCart((items) => items.filter((item) => item.key !== key));
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
    navigateToUrl(new URL(pageHref(isFoodPage ? "diner-bites" : "beverages", isFoodPage ? "food-menu" : "drinks-menu")));
  };
  // ↓ PRODUCT FILTER: Top 6, Best seller
  const isFeaturedBestSeller = (product: Product) =>
    ["BEST SELLER", "POPULAR", "FAVORITE"].includes(product.badge ?? "");
  const visibleProducts = heroSelectorProducts.filter(
    (p) =>
      (beverageCategory !== "best-seller" || isFeaturedBestSeller(p)) &&
      matchesQuery(normalizeQuery(beverageQuery), p.name, p.short, p.badge),
  );
  const signatureSection = (
        <section id="signature-drinks" className="signature-menu-section" aria-labelledby="signature-menu-title">
          <div className="menu-heading">
            <h3 id="signature-menu-title">
              {beverageCategory === "best-seller" ? "Best seller" : "Top 6"}{" "}
              <span className="serif-italic">signatures.</span>
            </h3>
            <p>
              Specialty brews, creamy Oatside lattes, and comforting diner sips.
            </p>
          </div>
          <div className="product-grid">
            {visibleProducts.map((p) => (
              <article className="product-card" key={p.id}>
                <button
                  className="product-image-button"
                  style={{ backgroundColor: p.color }}
                  onClick={() => setSelected(p)}
                  aria-label={`Customize ${p.name}`}
                >
                  {p.badge && <span className="product-badge">{p.badge}</span>}
                  <span className="product-art-word" aria-hidden="true">
                    {p.word.split(" ")[0].toLowerCase()}!
                  </span>
                  <FadeImage
                    src={productImage(p)}
                    alt={p.name}
                    loading="lazy"
                    width={300}
                    height={420}
                  />
                </button>
                <div className="product-card-title">
                  <h3>
                    <button onClick={() => setSelected(p)}>{p.name}</button>
                  </h3>
                  <span>{money(p.price)}</span>
                </div>
                <p>
                  {p.short}
                  <span>
                    {p.fixedTemperature ?? (p.hot ? "Hot" : "Iced")} / {p.defaultSize ?? "16 oz"}
                  </span>
                </p>
                <div className="product-card-actions">
                  <button
                    type="button"
                    className="button menu-add-btn"
                    onClick={() => setSelected(p)}
                    aria-label={`Customize ${p.name}`}
                  >
                    <PlusIcon size={14} /> Add
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
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
      {/* ↓ HEADER: Logo, navigation, order button, bag */}
      <header
        className={`header${isFoodPage || isBeveragesPage ? " header-menu-page" : ""}`}
        id="home"
      >
        <nav aria-label="Main navigation" className="header-nav header-nav-left">
          <a
            href={beveragesHref}
            onClick={handlePageLink}
            className="nav-item"
            aria-current={isBeveragesPage ? "page" : undefined}
          >
            <span className="nav-label">Menu</span>
          </a>
          <a
            href={foodHref}
            onClick={handlePageLink}
            className="nav-item"
            aria-current={isFoodPage ? "page" : undefined}
          >
            <span className="nav-label">Diner bites</span>
          </a>
          <a href={bestSellersHref} onClick={handlePageLink} className="nav-item">
            <span className="nav-label">Best sellers</span>
          </a>
        </nav>
        <Logo href={pageHref("home")} onClick={handlePageLink} />
        <div className="header-right">
          <nav aria-label="About and offers" className="header-nav header-nav-right">
            <a href={storyHref} onClick={handlePageLink} className="nav-item" aria-current={isStoryPage ? "page" : undefined}>
              <span className="nav-label">Our story</span>
            </a>
            <a href={homeHref("together")} onClick={handlePageLink} className="nav-item nav-together">
              <span className="nav-label">Better together</span>
            </a>
            <a
              href="https://www.facebook.com/beandiner"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-fb-icon"
              aria-label="Visit Bean Diner on Facebook"
              title="Facebook"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.36 21v-8.2h2.76l.41-3.2h-3.17V7.56c0-.93.26-1.57 1.59-1.57h1.7V3.12C16.35 3.04 15.16 3 13.79 3c-2.86 0-4.81 1.75-4.81 4.97V9.6H6v3.2h2.98V21h4.38Z" />
              </svg>
            </a>
          </nav>
          <div className="header-actions">
            <button
              key={`header-bag-${bagBump}`}
              className={`bag-button ${bagBump > 0 ? "bag-bump-animate" : ""}`}
              aria-label={`Open bag, ${cartCount} items`}
              onClick={openOrderBag}
            >
              <Icon name="bag" />
              <span>{cartCount}</span>
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
        </div>
      </header>
      <main id="main">
        {isFoodPage ? (
          <DinerBitesPage
            onAdd={addBite}
          />
        ) : isBeveragesPage ? (
          <BeveragesPage
            onAdd={addBeverage}
            onAddModifier={addModifier}
            signatureSection={signatureSection}
            activeCategory={beverageCategory}
            onCategoryChange={setBeverageCategory}
            query={beverageQuery}
            onQueryChange={setBeverageQuery}
            signatureCounts={{
              top6: heroSelectorProducts.length,
              bestSeller: heroSelectorProducts.filter(isFeaturedBestSeller).length,
              matches: visibleProducts.length,
            }}
          />
        ) : isStoryPage ? (
          <OurStoryPage />
        ) : (
          <>
        <section className="video-hero" aria-labelledby="video-hero-title">
          <video
            ref={videoHero}
            className="video-hero-media"
            poster="./images/bean-diner-video-poster.webp"
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src="./videos/bean-diner-hero-mobile-720.mp4" media="(max-width: 820px)" type="video/mp4" />
            <source src="./videos/bean-diner-hero-desktop-1080.mp4" type="video/mp4" />
          </video>
          <div className="video-hero-content">
            <h1 id="video-hero-title">
              Good Coffee,
              <br />
              Good Days.
            </h1>
            <p>
              Every day deserves a good cup of coffee. At Bean Diner, we make every sip worth enjoying.
            </p>
          </div>
          <a
            className="video-hero-scroll"
            href="#drink-hero"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById("drink-hero")?.scrollIntoView({
                behavior: clickScrollBehavior(),
              });
            }}
          >
            <span>Scroll to discover</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 4v15m0 0 6-6m-6 6-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </section>
        {/* ↓ DRINK HERO: Existing signature drink section */}
        <section id="drink-hero" className="hero" ref={hero}>
          <div className="hero-oval" />
          <div className="hero-heading">
            <div className="hero-heading-copy">
              <span className="eyebrow">
                <span className="tiny-star">✦</span> GEN. ANTONIO LUNA ST. ·
                BAYAMBANG, PANGASINAN
              </span>
              <h2>
                Good food.
                <br />
                Great coffee.
              </h2>
            </div>
            <a
              className="button hero-order-cta"
              href={beveragesHref}
              onClick={handlePageLink}
            >
              Order now <Icon name="arrow" size={17} />
            </a>
          </div>
          <div className="hero-product-wrap">
            <img
              className="hero-product"
              src="./images/hero-drinks/salted-caramel-macchiato-header.webp"
              alt="Bean Diner Iced Salted Caramel Macchiato with sea salt caramel, chilled milk, and espresso"
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
          <svg
            className="hero-wave"
            viewBox="0 0 1440 65"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 31C220 80 380 0 690 26s510 66 750-7v46H0Z"
              fill="var(--surface-dark, #121212)"
            />
          </svg>
        </section>
        {/* ↓ TOGETHER SECTION: Salted Caramel + Matcha pair */}
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
              Salted Caramel Macchiato + Matcha Latte, together for one price.
            </p>
            <div className="offer-price">
              {money(coffeeDatePairPrice)}
            </div>
            <button
              className="button"
              onClick={addCoffeeDatePair}
            >
              Make it a coffee date <Icon name="arrow" />
            </button>
            <small>
              One 16 oz Salted Caramel Macchiato + one 16 oz Matcha Latte.
            </small>
          </div>
          <div className="offer-art">
            <span className="offer-orbit" />
            <img
              className="offer-cup cup-left"
              src="./images/hero-drinks/salted-caramel-macchiato-header.webp"
              alt="16 oz Iced Salted Caramel Macchiato"
              loading="lazy"
              width="400"
              height="600"
            />
            <img
              className="offer-cup cup-right"
              src="./images/hero-drinks/drink-06-matcha-latte.webp"
              alt="16 oz Iced Matcha Latte"
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
          <a href={beveragesHref} className="button" onClick={handlePageLink}>
            Explore the menu <Icon name="arrow" />
          </a>
          <Ingredient kind="leaf" className="final-leaf" />
          <Sun />
        </section>
          </>
        )}
      </main>
      {/* ↓ FOOTER: Elevated artisanal diner footer */}
      {!isFoodPage && !isBeveragesPage && !isStoryPage && (
      <footer className="footer-artisanal">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <Logo footer href={homeHref("home")} onClick={handlePageLink} />
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
              <a href={beveragesHref} onClick={handlePageLink} className="footer-pill">
                <span>Beverages menu</span>
              </a>
              <a href={foodHref} onClick={handlePageLink} className="footer-pill">
                <span>Diner bites</span>
              </a>
              <a href={signatureHref} onClick={handlePageLink} className="footer-pill">
                <span>Top 6 signatures</span>
                <small>Bestsellers & lattes</small>
              </a>
              <a href={storyHref} onClick={handlePageLink} className="footer-pill" aria-current={isStoryPage ? "page" : undefined}>
                <span>Our story</span>
                <small>Two crafts, one home</small>
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
                    Daily: 10:00 AM – 9:00 PM
                  </p>
                  <span
                    className={`store-status-badge footer-store-status ${storeStatus.isOpen ? "is-open" : "is-closed"}`}
                    role="status"
                  >
                    <span className="store-status-dot" aria-hidden="true" />
                    {storeStatus.text}
                  </span>
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
              <div className="footer-actions footer-directions">
                <a
                  href={beanDinerMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button footer-map-btn"
                >
                  Google Maps ↗
                </a>
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button footer-map-btn"
                >
                  Waze ↗
                </a>
              </div>
            </div>
          </div>
        </div>

      {/* ↓ FOOTER MESSENGER BUTTON: Direct chat with Bean Diner */}
      <a
        href={getMessengerUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="footer-messenger"
        aria-label="Chat with Bean Diner on Facebook Messenger"
        onClick={(e) => {
          if (isMobileDevice() && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            openMessengerApp();
          }
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.02l-.65 2.45a.75.75 0 0 0 .97.9l2.84-1.22c.96.28 1.97.43 3 .43 5.52 0 10-4.03 10-9s-4.48-9-10-9zm1.06 12.15-2.58-2.75-5.04 2.75 5.54-5.88 2.64 2.75 4.98-2.75-5.54 5.88z" />
        </svg>
        <span>Chat with us on Messenger</span>
      </a>


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
      )}
      {/* ↓ TOAST: Add-to-bag confirmation with Undo */}
      {toast && (
        <div role="status" className="toast toast-with-undo" aria-live="polite">
          <div className="toast-message">
            <Icon name="check" size={17} />
            <span>{toast}</span>
          </div>
          {undoCart && (
            <button
              type="button"
              className="toast-undo-btn"
              onClick={undoAdd}
              aria-label="Undo adding item to bag"
            >
              Undo
            </button>
          )}
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
      {customizingBite && (
        <BiteCustomizeModal
          bite={customizingBite}
          onClose={() => setCustomizingBite(null)}
          onAdd={add}
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
            <h2 ref={bagHeadingRef} tabIndex={receipt ? -1 : undefined}>
              {receipt
                ? "Your order is ready to send."
                : checkoutStep === "details"
                  ? "Checkout Details"
                  : "Your Order Bag"}
            </h2>

            {!receipt && pendingOrder && (
              <button
                type="button"
                className="button"
                onClick={() => {
                  if (isPendingOrder(pendingOrder)) setReceipt(true);
                  else setPendingOrder(null);
                }}
              >
                View pending order summary
              </button>
            )}

            {/* Step indicator (Bag, Details, Send) */}
            <nav className="checkout-step-nav" aria-label="Checkout progress">
              <ol className="checkout-steps">
                <li
                  className={`checkout-step-item ${
                    receipt
                      ? "is-complete"
                      : checkoutStep === "bag"
                        ? "is-active"
                        : "is-complete"
                  }`}
                >
                  <button
                    type="button"
                    className="checkout-step-btn"
                    onClick={() => {
                      if (!receipt && cart.length > 0) setCheckoutStep("bag");
                    }}
                    disabled={receipt || checkoutStep === "bag"}
                    aria-current={!receipt && checkoutStep === "bag" ? "step" : undefined}
                  >
                    <span className="checkout-step-num">1</span>
                    <span className="checkout-step-label">Bag</span>
                  </button>
                </li>
                <li className="checkout-step-divider" aria-hidden="true">
                  <Icon name="arrow" size={13} />
                </li>
                <li
                  className={`checkout-step-item ${
                    receipt
                      ? "is-complete"
                      : checkoutStep === "details"
                        ? "is-active"
                        : ""
                  }`}
                >
                  <button
                    type="button"
                    className="checkout-step-btn"
                    onClick={() => {
                      if (!receipt && cart.length > 0) setCheckoutStep("details");
                    }}
                    disabled={receipt || cart.length === 0 || checkoutStep === "details"}
                    aria-current={!receipt && checkoutStep === "details" ? "step" : undefined}
                  >
                    <span className="checkout-step-num">2</span>
                    <span className="checkout-step-label">Details</span>
                  </button>
                </li>
                <li className="checkout-step-divider" aria-hidden="true">
                  <Icon name="arrow" size={13} />
                </li>
                <li
                  className={`checkout-step-item ${
                    receipt ? "is-active" : ""
                  }`}
                >
                  <span
                    className="checkout-step-btn"
                    aria-current={receipt ? "step" : undefined}
                  >
                    <span className="checkout-step-num">3</span>
                    <span className="checkout-step-label">Send</span>
                  </span>
                </li>
              </ol>
            </nav>

            {receipt ? (
              <div className="receipt">
                <div className="receipt-diner-ticket">
                  {/* Ticket Header */}
                  <div className="receipt-ticket-header">
                    <div className="receipt-brand-meta">
                      <img
                        src="./favicon-badge.png"
                        alt="Bean Diner"
                        className="receipt-brand-seal"
                        width="36"
                        height="36"
                      />
                      <div className="receipt-brand-text">
                        <strong className="receipt-brand-name">Bean Diner Bayambang</strong>
                        <span className="receipt-brand-sub">Gen. Antonio Luna Street · Official Order Ticket</span>
                      </div>
                    </div>
                    <span className="receipt-status-pill">Ready to send</span>
                  </div>

                  <div className="receipt-perforation" aria-hidden="true" />

                  <p className="receipt-intro">
                    Your order summary is ready and copied to your clipboard. Follow the 3 steps below and send it to our team in Messenger.
                  </p>

                  <OrderingSteps handoff />

                  {/* Summary Box */}
                  {lastOrder && (
                    <div className="receipt-summary-box">
                      <div className="receipt-summary-box-top">
                        <span className="receipt-box-label">Order Summary for Messenger</span>
                        <button
                          type="button"
                          className="receipt-copy-pill"
                          onClick={() => {
                            copyToClipboard(lastOrder);
                            setToast("✓ Order details copied to clipboard!");
                          }}
                        >
                          <Icon name="check" size={13} /> Copy Text
                        </button>
                      </div>
                      <pre className="receipt-summary-text">{lastOrder}</pre>
                    </div>
                  )}

                  <div className="receipt-actions-group">
                    <a
                      href={getMessengerUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-copy-messenger prominent"
                      onClick={(e) => {
                        if (lastOrder) {
                          copyToClipboard(lastOrder);
                          setToast("✓ Order details copied! Opening Messenger...");
                        }
                        if (isMobileDevice() && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                          e.preventDefault();
                          openMessengerApp();
                        }
                      }}
                    >
                      Copy Order &amp; Open Messenger ↗
                    </a>
                    <a
                      href={FACEBOOK_PAGE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-facebook-fallback"
                      onClick={() => {
                        if (lastOrder) {
                          copyToClipboard(lastOrder);
                          setToast("✓ Order details copied! Opening Facebook Page...");
                        }
                      }}
                    >
                      Open Bean Diner Facebook Page Directly ↗
                    </a>
                  </div>
                </div>

                <button
                  className="button button-continue-shopping"
                  onClick={() => {
                    setBagOpen(false);
                    setReceipt(false);
                    setCheckoutStep("bag");
                    scrollToMenu();
                  }}
                >
                  Back to Menu / Order More <Icon name="arrow" />
                </button>
                <button
                  type="button"
                  className="button button-continue-shopping"
                  onClick={() => {
                    setPendingOrder(null);
                    setReceipt(false);
                    setCheckoutStep("bag");
                  }}
                >
                  Clear pending order summary
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
            ) : checkoutStep === "bag" ? (
              <>
                <button
                  type="button"
                  className="button button-order-more"
                  onClick={() => {
                    setBagOpen(false);
                    scrollToMenu();
                  }}
                >
                  + Order More / Browse Menu
                </button>
                <div className="cart-items">
                  {cart.map((item) => {
                    const p = findProduct(item.id);
                    const b = dinerBites.find((b) => b.id === item.id);
                    const bev = allBeverages.find((bev) => bev.id === item.id);
                    const mod = [...beverageAddOns, ...beverageSubs].find((m) => m.id === item.id);
                    const title = p ? p.name : b ? b.name : bev ? bev.name : mod ? mod.name : item.name || "Item";
                    const desc = item.isFood
                      ? item.size && item.size !== "Plate"
                        ? `Flavor: ${item.size}`
                        : "Chef's Comfort Kitchen Plate"
                      : bev
                        ? `${item.size || bev.defaultSize} · ${bev.hot ? "Hot" : "Over Iced"}`
                        : mod
                          ? "Barista Customization"
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
                            src={productImage(p)}
                            alt={p.name}
                            style={{ background: p.color }}
                          />
                        ) : (
                          <div
                            className="cart-food-icon"
                            style={{
                              background: item.isFood ? "var(--pine, #D49E77)" : "var(--black, #121212)",
                              color: item.isFood ? "var(--black, #121212)" : "var(--cream, #FFF0D6)",
                              fontSize: "10px",
                              fontWeight: "800",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.isFood ? "BITE" : "SIP"}
                          </div>
                        )}
                        <div>
                          <h3>{title}</h3>
                          <p>{desc}</p>
                          {item.note?.trim() && (
                            <p className="cart-item-note">
                              Note: "{item.note.trim()}"
                            </p>
                          )}
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
                          <button
                            type="button"
                            className="cart-item-remove"
                            onClick={() => removeItem(item.key)}
                            aria-label={`Remove ${title} from bag`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="cart-totals">
                  <div>
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div className="cart-total">
                    <span>Total</span>
                    <strong aria-live="polite">{money(subtotal)}</strong>
                  </div>
                </div>
                <div className="bag-actions-bar">
                  <button
                    type="button"
                    className="button button-proceed-checkout"
                    onClick={() => setCheckoutStep("details")}
                  >
                    Proceed to Details <Icon name="arrow" size={17} />
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Details - Single compact form with visible order summary alongside */
              <div className="checkout-split-layout">
                <div className="checkout-form-column">
                  <div className="checkout-step-header">
                    <button
                      type="button"
                      className="button-back-to-bag"
                      onClick={() => setCheckoutStep("bag")}
                    >
                      <span className="icon-back-arrow" aria-hidden="true">
                        <Icon name="arrow" size={13} />
                      </span>
                      Back to Bag
                    </button>
                    <span className="checkout-form-title">Order Information</span>
                  </div>

                  <form
                    id="checkout-order-form"
                    className="checkout-form checkout-form-compact"
                    autoComplete="off"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      const currentAddressErr = validateDeliveryAddress(checkoutExtra, checkoutOrderType);
                      const currentNameErr = validateCustomerName(checkoutName);
                      const currentPhoneErr = validateCustomerPhone(checkoutPhone);
                      const currentTimeErr = validateOrderTiming(checkoutPickupTime, checkoutCustomTime);

                      setCheckoutErrors({
                        name: currentNameErr,
                        phone: currentPhoneErr,
                        address: currentAddressErr,
                        time: currentTimeErr,
                      });

                      if (currentAddressErr) {
                        document.getElementById("checkout-address")?.focus();
                        return;
                      }
                      if (currentNameErr) {
                        document.getElementById("order-name")?.focus();
                        return;
                      }
                      if (currentTimeErr) {
                        document.getElementById(
                          checkoutPickupTime === "Custom time" ? "checkout-custom-time" : "checkout-timing",
                        )?.focus();
                        return;
                      }
                      if (currentPhoneErr) {
                        document.getElementById("order-phone")?.focus();
                        return;
                      }

                      const customerName = checkoutName.trim();
                      const customerPhone = checkoutPhone.trim();
                      const resolvedTiming =
                        checkoutPickupTime === "Custom time"
                          ? checkoutCustomTime.trim()
                          : checkoutPickupTime;

                      const msg = formatOrderMessage(
                        cart,
                        customerName,
                        customerPhone,
                        subtotal,
                        checkoutOrderType,
                        checkoutExtra.trim(),
                        checkoutPayment,
                        resolvedTiming,
                        checkoutNote.trim(),
                      );
                      copyToClipboard(msg);
                      setPendingOrder({ message: msg, createdAt: Date.now() });
                      setToast("Order copied! Follow the guide below to send.");
                      setReceipt(true);
                      setCart([]);
                      setCheckoutName("");
                      setCheckoutPhone("");
                      setCheckoutExtra("");
                      setCheckoutNote("");
                      setCheckoutCustomTime("");
                      setCheckoutErrors({});
                    }}
                  >
                    <div className="checkout-form-section">
                      <fieldset className="checkout-fieldset">
                        <legend>Order type</legend>
                        <div className="choice-row order-type-row">
                          {[
                            { id: "pickup", label: "For pick up" },
                            { id: "dine-in", label: "Dine in" },
                            { id: "delivery", label: "Door to door" },
                          ].map((t) => (
                            <label
                              className={checkoutOrderType === t.id ? "selected" : ""}
                              key={t.id}
                            >
                              <input
                                type="radio"
                                name="checkoutOrderType"
                                checked={checkoutOrderType === t.id}
                                onChange={() => {
                                  setCheckoutOrderType(t.id as any);
                                  setCheckoutExtra("");
                                  setCheckoutErrors((prev) => ({ ...prev, address: null }));
                                }}
                              />
                              <span>{t.label}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      {checkoutOrderType === "dine-in" && (
                        <div className="order-extra-field">
                          <label htmlFor="checkout-table">Table number (if seated):</label>
                          <input
                            id="checkout-table"
                            autoComplete="off"
                            placeholder="e.g. Table 4"
                            value={checkoutExtra}
                            onChange={(e) => setCheckoutExtra(e.target.value)}
                            maxLength={20}
                          />
                        </div>
                      )}

                      {checkoutOrderType === "delivery" && (
                        <div className="order-extra-field">
                          <label htmlFor="checkout-address">Delivery address &amp; landmark:</label>
                          <small id="delivery-arrangements-note">Delivery arrangements are confirmed in Messenger.</small>
                          <input
                            id="checkout-address"
                            autoComplete="off"
                            className={showAddressError ? "input-error" : ""}
                            placeholder="Street, Barangay, and Landmark in Bayambang"
                            value={checkoutExtra}
                            onChange={(e) => {
                              const address = e.target.value;
                              setCheckoutExtra(address);
                              setCheckoutErrors((prev) => ({
                                ...prev,
                                address: validateDeliveryAddress(address, checkoutOrderType),
                              }));
                            }}
                            aria-invalid={showAddressError ? "true" : "false"}
                            aria-describedby={`delivery-arrangements-note${showAddressError ? " checkout-address-error" : ""}`}
                            maxLength={150}
                          />
                          {showAddressError && (
                            <span id="checkout-address-error" className="form-field-error" role="alert">
                              <Icon name="alert-circle" size={14} /> {checkoutErrors.address}
                            </span>
                          )}
                        </div>
                      )}

                      {checkoutOrderType === "pickup" && (
                        <div className="pickup-notice">
                          <small>Pickup: Bean Diner · Gen. Antonio Luna St., Zone 2, Bayambang</small>
                        </div>
                      )}
                    </div>

                    <section className="checkout-form-section" aria-labelledby="checkout-contact-heading">
                      <h3 className="checkout-section-heading" id="checkout-contact-heading">Contact details</h3>
                      <div className="form-group">
                        <label htmlFor="order-name">
                          {checkoutOrderType === "dine-in"
                            ? "Your name for table service"
                            : checkoutOrderType === "delivery"
                              ? "Recipient name for delivery"
                              : "Your name for pickup"}
                          <span className="required-star"> *</span>
                        </label>
                        <input
                          id="order-name"
                          type="text"
                          className={showNameError ? "input-error" : ""}
                          value={checkoutName}
                          onChange={(e) => {
                            const name = e.target.value;
                            setCheckoutName(name);
                            setCheckoutErrors((prev) => ({
                              ...prev,
                              name: validateCustomerName(name),
                            }));
                          }}
                          aria-invalid={showNameError ? "true" : "false"}
                          aria-describedby={showNameError ? "order-name-error" : undefined}
                          autoComplete="off"
                          placeholder="e.g. Karl Santos"
                          maxLength={50}
                        />
                        {showNameError && (
                          <span id="order-name-error" className="form-field-error" role="alert">
                            <Icon name="alert-circle" size={14} /> {checkoutErrors.name}
                          </span>
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="order-phone">
                          Contact number <span className="required-star">*</span>
                        </label>
                        <input
                          id="order-phone"
                          type="text"
                          inputMode="numeric"
                          className={showPhoneError ? "input-error" : ""}
                          value={checkoutPhone}
                          onChange={(e) => {
                            const phone = formatPhoneNumber(e.target.value);
                            setCheckoutPhone(phone);
                            setCheckoutErrors((prev) => ({
                              ...prev,
                              phone: validateCustomerPhone(phone),
                            }));
                          }}
                          aria-invalid={showPhoneError ? "true" : "false"}
                          aria-describedby={showPhoneError ? "order-phone-error" : undefined}
                          autoComplete="off"
                          placeholder="09XX-XXX-XXXX"
                          maxLength={20}
                        />
                        {showPhoneError && (
                          <span id="order-phone-error" className="form-field-error" role="alert">
                            <Icon name="alert-circle" size={14} /> {checkoutErrors.phone}
                          </span>
                        )}
                      </div>
                    </section>

                    <div className="checkout-form-section">
                      <fieldset
                        className="checkout-fieldset"
                        id="checkout-timing"
                        tabIndex={-1}
                        aria-describedby={showTimeError ? "checkout-time-error" : undefined}
                      >
                        <legend>Pickup / Preferred timing</legend>
                        {!storeStatus.isOpen && <small role="status">{storeStatus.text}</small>}
                        <div className="timing-choice-row">
                          {[
                            "ASAP (~15-20 mins)",
                            "In 30 mins",
                            "In 1 hour",
                            "Custom time",
                          ].map((timeOption) => (
                            <label
                              key={timeOption}
                              className={checkoutPickupTime === timeOption ? "selected" : ""}
                            >
                              <input
                                type="radio"
                                name="checkoutPickupTime"
                                checked={checkoutPickupTime === timeOption}
                                disabled={timeOption !== "Custom time" && Boolean(validateOrderTiming(timeOption, ""))}
                                onChange={() => {
                                  setCheckoutPickupTime(timeOption);
                                  setCheckoutErrors((prev) => ({ ...prev, time: null }));
                                }}
                              />
                              <span>{timeOption}</span>
                            </label>
                          ))}
                        </div>
                        {checkoutPickupTime === "Custom time" && (
                          <div className="custom-time-field">
                            <label htmlFor="checkout-custom-time">Specify time today:</label>
                            <input
                              id="checkout-custom-time"
                              type="text"
                              autoComplete="off"
                              className={showTimeError ? "input-error" : ""}
                              placeholder="e.g. 2:45 PM or 5:30 PM"
                              value={checkoutCustomTime}
                              onChange={(e) => {
                                setCheckoutCustomTime(e.target.value);
                                setCheckoutErrors((prev) => ({
                                  ...prev,
                                  time: validateOrderTiming("Custom time", e.target.value),
                                }));
                              }}
                              aria-invalid={showTimeError ? "true" : "false"}
                              aria-describedby={showTimeError ? "checkout-time-error" : undefined}
                              maxLength={30}
                            />
                          </div>
                        )}
                        {showTimeError && (
                          <span id="checkout-time-error" className="form-field-error" role="alert">
                            <Icon name="alert-circle" size={14} /> {checkoutErrors.time}
                          </span>
                        )}
                      </fieldset>
                    </div>

                    <div className="checkout-form-section">
                      <fieldset className="checkout-payment-fieldset">
                        <legend>Payment method</legend>
                        <div className="payment-choice-row">
                          {([
                            { id: "gcash", label: "GCash" },
                            { id: "maya", label: "Maya" },
                            { id: "cash", label: "Cash" },
                          ] as const).map((payment) => (
                            <label
                              className={checkoutPayment === payment.id ? "selected" : ""}
                              key={payment.id}
                            >
                              <input
                                type="radio"
                                name="checkoutPayment"
                                value={payment.id}
                                checked={checkoutPayment === payment.id}
                                onChange={() => setCheckoutPayment(payment.id)}
                              />
                              <span>{payment.label}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>

                    <section className="checkout-form-section checkout-form-section-note" aria-labelledby="checkout-note-label">
                      <div className="form-group">
                        <label className="checkout-note-label" id="checkout-note-label" htmlFor="order-note">
                          Order note / special request <small>(optional)</small>
                        </label>
                        <input
                          id="order-note"
                          type="text"
                          autoComplete="off"
                          placeholder="e.g. separate syrup, extra napkins, less sweet"
                          value={checkoutNote}
                          onChange={(e) => setCheckoutNote(e.target.value)}
                          maxLength={140}
                        />
                      </div>
                    </section>

                  </form>
                </div>

                {/* Visible Order Summary alongside form */}
                <aside className="checkout-summary-column" aria-label="Visible Order Summary">
                  <div className="checkout-summary-card">
                    <div className="checkout-summary-header">
                      <h3>Order Summary</h3>
                      <button
                        type="button"
                        className="checkout-summary-edit-btn"
                        onClick={() => setCheckoutStep("bag")}
                      >
                        Edit bag
                      </button>
                    </div>

                    <div className="checkout-summary-items">
                      {cart.map((item) => {
                        const p = findProduct(item.id);
                        const b = dinerBites.find((b) => b.id === item.id);
                        const bev = allBeverages.find((bev) => bev.id === item.id);
                        const mod = [...beverageAddOns, ...beverageSubs].find((m) => m.id === item.id);
                        const title = p ? p.name : b ? b.name : bev ? bev.name : mod ? mod.name : item.name || "Item";
                        return (
                          <div key={item.key} className="checkout-summary-item">
                            <div className="checkout-summary-item-left">
                              <span className="checkout-summary-qty">{item.quantity}×</span>
                              <div className="checkout-summary-meta">
                                <span className="checkout-summary-name">{title}</span>
                                <span className="checkout-summary-spec">
                                  {item.isFood
                                    ? item.size || "Plate"
                                    : [item.size, item.temperature, item.sweetness].filter(Boolean).join(" · ")}
                                </span>
                              </div>
                            </div>
                            <span className="checkout-summary-price">{money(item.price * item.quantity)}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="checkout-summary-totals">
                      <div className="checkout-summary-row">
                        <span>Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})</span>
                        <span>{money(subtotal)}</span>
                      </div>
                      <div className="checkout-summary-row total">
                        <span>Total</span>
                        <strong aria-live="polite">{money(subtotal)}</strong>
                      </div>
                    </div>

                    <div className="checkout-summary-badge">
                      <Icon name="check" size={14} />
                      <span>Bayambang crew confirms orders live in Messenger</span>
                    </div>
                  </div>
                </aside>
                <div className="checkout-actions-block">
                  <button
                    className="button button-messenger-checkout prominent"
                    type="submit"
                    form="checkout-order-form"
                  >
                    Send order via Messenger <Icon name="arrow" size={17} />
                  </button>
                  <small className="checkout-actions-hint">
                    Copies your order summary and guides you to Facebook Messenger to confirm with our crew.
                  </small>
                </div>
              </div>
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
            href={pageHref("home")}
            onClick={handlePageLink}
          />
          <nav className="mobile-nav-list">
            {[
              {
                num: "01",
                label: "Beverages menu",
                sub: "Espresso, matcha, teas & cold frappes",
                href: beveragesHref,
              },
              {
                num: "02",
                label: "Diner bites",
                href: foodHref,
              },
              {
                num: "03",
                label: "Top 6 signatures",
                sub: "Benguet highland coffee & Oatside lattes",
                href: signatureHref,
              },
              {
                num: "04",
                label: "Our story",
                sub: "US Chef & Middle East Barista roots",
                href: storyHref,
              },
              {
                num: "05",
                label: "Better together",
                sub:
                  "Salted Caramel + Matcha for " +
                  money(coffeeDatePairPrice),
                href: homeHref("together"),
              },
              {
                num: "06",
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
                aria-current={isStoryPage && item.href === storyHref ? "page" : undefined}
                onClick={item.isExternal ? () => setNavOpen(false) : handlePageLink}
                className={`mobile-nav-item ${item.isExternal ? "mobile-nav-fb" : ""}`}
              >
                <div className="mobile-nav-meta">
                  <span className="mobile-nav-num">{item.num}</span>
                  <div className="mobile-nav-titles">
                    <div className="mobile-nav-heading">
                      <span className="mobile-nav-label">{item.label}</span>
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
      {cart.length > 0 && (
        <button
          type="button"
          key={`float-bag-${bagBump}`}
          className={`floating-bag-bubble ${bagBump > 0 ? "bag-bump-animate" : ""}`}
          onClick={openOrderBag}
          aria-label={`View order bag with ${cartCount} items`}
        >
          <span className="floating-bag-surface">
            <span className="floating-bag-badge">{cartCount}</span>
            <span className="floating-bag-text">View Order Bag</span>
            <span className="floating-bag-price">{money(subtotal)}</span>
          </span>
        </button>
      )}
    </>
  );
}
export default App;
