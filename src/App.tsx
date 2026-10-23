import { copyToClipboard } from "./utils/clipboard";
// ↓ IMPORTS: React 19 hooks and types
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
import { isSafariBrowser, shouldUseDocumentScrollMode } from "./ui/browser";
import { getWhatsAppUrl, withOrderRequestStatus, WHATSAPP_URL_LIMIT } from "./utils/whatsapp";

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

const isDocumentScrollModeEnabled = () =>
  shouldUseDocumentScrollMode(
    window.location.search,
    isSafariBrowser(),
    navigator.maxTouchPoints > 0 || "ontouchstart" in window,
  );


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
// ↓ HELPER: Prepare a complete order request for WhatsApp.
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

  return withOrderRequestStatus([
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
    .join("\n"));
};

// Footer Messenger contact destination.
const MESSENGER_PAGE_ID = "100959311683531";

// Meta short link supports Messenger app handoff and a web fallback.
const getMessengerUrl = () =>
  `https://m.me/${MESSENGER_PAGE_ID}`;

let cancelMessengerHandoff: (() => void) | undefined;

const openMessengerOnMobile = (event: MouseEvent<HTMLAnchorElement>) => {
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  if (!mobile || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  cancelMessengerHandoff?.();
  const webUrl = event.currentTarget.href;
  const cleanup = () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", cleanup);
    cancelMessengerHandoff = undefined;
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") cleanup();
  };
  const timer = window.setTimeout(() => {
    cleanup();
    if (document.visibilityState === "visible") window.location.assign(webUrl);
  }, 2500);
  cancelMessengerHandoff = cleanup;
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", cleanup);
  // Launch synchronously during the tap so the browser retains user activation.
  window.location.assign(`fb-messenger://user-thread/${MESSENGER_PAGE_ID}`);
};

const FACEBOOK_PAGE_URL = "https://www.facebook.com/beandiner";

function OrderingSteps({ handoff = false }: { handoff?: boolean }) {
  const steps = handoff
    ? [
        ["Review Order", "Check the items, contact details, and timing below"],
        ["Open WhatsApp", "Your message is prefilled. For long orders, copy and paste the summary"],
        ["Send Request", "Tap Send in WhatsApp, then wait for our crew to confirm your order"],
      ]
    : [
        ["Choose Your Sips & Bites", "Explore signature iced roasts and comfort kitchen plates"],
        ["Pick Order Mode", "For pick up, Dine in with table #, or Door to door delivery"],
        ["Send on WhatsApp", "Send your formatted order request and wait for our crew to confirm"],
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
// DEBUG-TEMP: Device-only readout for the Order Bag surface under iOS Safari chrome.
const BagModalDebugOverlay = import.meta.env.DEV ? function BagModalDebugOverlay() {
  const [snapshot, setSnapshot] = useState("");

  useEffect(() => {
    const dialog = document.querySelector<HTMLDialogElement>("dialog.bag-modal");
    if (!dialog) return;
    const viewport = window.visualViewport;
    const layoutProbe = document.createElement("div");
    const dynamicProbe = document.createElement("div");
    for (const [probe, height] of [[layoutProbe, "100lvh"], [dynamicProbe, "100dvh"]] as const) {
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = `position:fixed;top:0;left:0;width:0;height:${height};visibility:hidden;pointer-events:none;z-index:-1`;
      document.body.append(probe);
    }
    const update = () => {
      const content = dialog.querySelector<HTMLElement>(".bag-content");
      const stickyCta = dialog.querySelector<HTMLElement>(
        ".button-proceed-checkout, .button-whatsapp-checkout",
      );
      const dialogRect = dialog.getBoundingClientRect();
      const contentRect = content?.getBoundingClientRect();
      const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      const bottomPoint = Math.max(0, Math.min(window.innerHeight - 1, viewportBottom - 2));
      const bottomElement = document.elementFromPoint(Math.max(0, window.innerWidth / 2), bottomPoint);
      const describeElement = (element: Element | null) => {
        if (!element) return "none";
        const id = element.id ? `#${element.id}` : "";
        const classes = typeof element.className === "string"
          ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((name) => `.${name}`).join("")
          : "";
        const text = (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
        return `${element.tagName.toLowerCase()}${id}${classes}${text ? ` “${text}”` : ""}`;
      };
      const dialogStyle = getComputedStyle(dialog);
      const contentStyle = content ? getComputedStyle(content) : null;
      const rootStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      const ctaRect = stickyCta?.getBoundingClientRect();
      const contentMaxScroll = content ? Math.max(0, content.scrollHeight - content.clientHeight) : 0;
      const docScrollMode = dialog.classList.contains("docscroll-mode");
      const next = [
        "DEBUG-TEMP · Order Bag / Safari pill",
        `mode: ${docScrollMode ? "document scroll" : "fixed sheet"} · document scrollHeight: ${document.documentElement.scrollHeight}`,
        `vv: ${viewport?.height.toFixed(1) ?? "n/a"} · offset: ${viewport?.offsetTop.toFixed(1) ?? "n/a"} · inner: ${window.innerHeight} · lv/dv: ${layoutProbe.getBoundingClientRect().height.toFixed(1)}/${dynamicProbe.getBoundingClientRect().height.toFixed(1)}`,
        `scrollY: ${window.scrollY} · body lock: ${bodyStyle.position === "fixed" ? "on" : "off"} · browser: ${document.documentElement.dataset.browserFamily ?? "?"}`,
        `dialog top/bottom/height: ${dialogRect.top.toFixed(1)} / ${dialogRect.bottom.toFixed(1)} / ${dialogRect.height.toFixed(1)}`,
        `content top/bottom/height: ${contentRect?.top.toFixed(1) ?? "n/a"} / ${contentRect?.bottom.toFixed(1) ?? "n/a"} / ${contentRect?.height.toFixed(1) ?? "n/a"}`,
        `content scroll: ${content?.scrollTop.toFixed(1) ?? "n/a"} / ${contentMaxScroll.toFixed(1)} max · padding-bottom: ${contentStyle?.paddingBottom ?? "n/a"}`,
        `CTA rect top/bottom/height: ${ctaRect?.top.toFixed(1) ?? "n/a"} / ${ctaRect?.bottom.toFixed(1) ?? "n/a"} / ${ctaRect?.height.toFixed(1) ?? "n/a"} · under vv edge: ${describeElement(bottomElement)}`,
        `sheet: ${dialogStyle.position} · ${dialogStyle.height} · ${dialogStyle.backgroundColor}`,
        `html/body: ${rootStyle.backgroundColor} / ${bodyStyle.backgroundColor} · theme: ${document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content ?? "none"}`,
      ].join("\n");
      setSnapshot((current) => current === next ? current : next);
    };

    update();
    const interval = window.setInterval(update, 250);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      window.clearInterval(interval);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      layoutProbe.remove();
      dynamicProbe.remove();
    };
  }, []);

  return <pre className="bag-modal-debug-overlay" aria-hidden="true">{snapshot}</pre>;
} : () => null;

// DEBUG-TEMP: Read-only page geometry for comparing menu content under Safari chrome.
const MenuPageDebugOverlay = import.meta.env.DEV ? function MenuPageDebugOverlay({ page }: { page: "diner-bites" | "beverages" }) {
  const [snapshot, setSnapshot] = useState("");

  useEffect(() => {
    const viewport = window.visualViewport;
    const describeElement = (element: Element | null) => {
      if (!element) return "none";
      const id = element.id ? `#${element.id}` : "";
      const classes = typeof element.className === "string"
        ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((name) => `.${name}`).join("")
        : "";
      const style = getComputedStyle(element);
      return `${element.tagName.toLowerCase()}${id}${classes} bg:${style.backgroundColor}`;
    };
    const update = () => {
      const main = document.querySelector<HTMLElement>("main#main");
      const mainRect = main?.getBoundingClientRect();
      const rootStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      const pointY = Math.max(0, Math.min(window.innerHeight - 1, (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 2));
      const bottomElement = document.elementFromPoint(window.innerWidth / 2, pointY);
      const edgeStyle = getComputedStyle(document.body, "::after");
      const next = [
        "DEBUG-TEMP · Menu / Safari pill",
        `edge sampling: ${edgeStyle.content === '""' ? "on" : "off"} · filter: ${edgeStyle.backdropFilter || edgeStyle.getPropertyValue("-webkit-backdrop-filter") || "none"}`,
        `page: ${page} · viewport-fit: ${document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content.includes("viewport-fit=cover") ? "cover" : "default"}`,
        `vv height/offset: ${viewport?.height.toFixed(1) ?? "n/a"} / ${viewport?.offsetTop.toFixed(1) ?? "n/a"} · innerHeight: ${window.innerHeight} · screen: ${window.screen.height}`,
        `scrollY: ${window.scrollY} · document scrollHeight: ${document.documentElement.scrollHeight} · scrollingElement: ${document.scrollingElement?.tagName.toLowerCase() ?? "none"}`,
        `main rect top/bottom/height: ${mainRect?.top.toFixed(1) ?? "n/a"} / ${mainRect?.bottom.toFixed(1) ?? "n/a"} / ${mainRect?.height.toFixed(1) ?? "n/a"}`,
        `html/body/main bg: ${rootStyle.backgroundColor} / ${bodyStyle.backgroundColor} / ${main ? getComputedStyle(main).backgroundColor : "n/a"}`,
        `element at viewport bottom: ${describeElement(bottomElement)}`,
      ].join("\n");
      setSnapshot((current) => current === next ? current : next);
    };

    update();
    const interval = window.setInterval(update, 250);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.clearInterval(interval);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [page]);

  return <pre className="bag-modal-debug-overlay" aria-hidden="true">{snapshot}</pre>;
} : () => null;

if (import.meta.env.DEV) {
  void import("./debug-overlays.css");
}

function Modal({
  children,
  onClose,
  label,
  className = "",
  documentScrollPosition = null,
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
  documentScrollPosition?: { x: number; y: number } | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const docScrollPositionRef = useRef<{ x: number; y: number } | null>(documentScrollPosition);
  onCloseRef.current = onClose;
  const isBagModal = className.split(/\s+/).includes("bag-modal");
  const docScrollMode = isBagModal && isDocumentScrollModeEnabled();
  const showBagDebug = import.meta.env.DEV && isBagModal && new URLSearchParams(window.location.search).get("debug") === "1";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !docScrollMode) return;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    if (!root) return;

    const previous = document.activeElement as HTMLElement | null;
    if (!docScrollPositionRef.current) {
      docScrollPositionRef.current = documentScrollPosition ?? { x: window.scrollX, y: window.scrollY };
    }
    const { x: pageScrollX, y: pageScrollY } = docScrollPositionRef.current;
    const hadHtmlClass = html.classList.contains("docscroll-order-flow");
    const hadBodyClass = body.classList.contains("docscroll-order-flow");
    const previousHtmlBackground = html.style.backgroundColor;
    const previousBodyBackground = body.style.backgroundColor;
    const previousRootBackground = root.style.backgroundColor;
    const previousRootDisplay = root.style.display;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousThemeColor = themeColor?.getAttribute("content") ?? null;
    const sheetSurface = getComputedStyle(el).backgroundColor || "#FFFFFF";

    el.classList.add("docscroll-mode");
    html.classList.add("docscroll-order-flow");
    body.classList.add("docscroll-order-flow");
    html.style.backgroundColor = sheetSurface;
    body.style.backgroundColor = sheetSurface;
    root.style.backgroundColor = sheetSurface;
    root.style.display = "none";
    if (themeColor) themeColor.setAttribute("content", sheetSurface);
    el.setAttribute("open", "");
    window.scrollTo(0, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      el.removeAttribute("open");
      el.classList.remove("docscroll-mode");
      if (!hadHtmlClass) html.classList.remove("docscroll-order-flow");
      if (!hadBodyClass) body.classList.remove("docscroll-order-flow");
      html.style.backgroundColor = previousHtmlBackground;
      body.style.backgroundColor = previousBodyBackground;
      root.style.backgroundColor = previousRootBackground;
      root.style.display = previousRootDisplay;
      if (themeColor) {
        if (previousThemeColor === null) themeColor.removeAttribute("content");
        else themeColor.setAttribute("content", previousThemeColor);
      }
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      window.scrollTo(pageScrollX, pageScrollY);
    };
  }, [docScrollMode]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (docScrollMode) return;
    const previous = document.activeElement as HTMLElement | null;
    const isBagModal = el.matches(".bag-modal");
    const isTopSixProductModal = el.matches(".product-modal:not(.bite-customize-modal)");
    const isIOSSafariBagModal = isBagModal && document.documentElement.dataset.browserFamily === "safari" &&
      (navigator.maxTouchPoints > 0 || "ontouchstart" in window);
    const shouldFreezePageBackground = (isBagModal || isTopSixProductModal) &&
      (navigator.maxTouchPoints > 0 || "ontouchstart" in window);
    const pageScrollX = window.scrollX;
    const pageScrollY = window.scrollY;
    const viewport = (isBagModal || isTopSixProductModal) ? window.visualViewport : null;
    let maxViewportHeight = viewport?.height ?? 0;
    let viewportOrientation = window.innerWidth >= window.innerHeight ? "landscape" : "portrait";
    const layoutViewportProbe = isIOSSafariBagModal ? document.createElement("div") : null;
    if (layoutViewportProbe) {
      layoutViewportProbe.setAttribute("aria-hidden", "true");
      layoutViewportProbe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none;z-index:-1";
      document.body.append(layoutViewportProbe);
    }
    let revealFocusedFieldFrame = 0;
    let bagPagePanFrame = 0;
    let bagViewportRefreshTimers: number[] = [];
    let bagKeyboardCloseTimer: number | null = null;
    let bagFieldRevealTimer: number | null = null;
    const clearFormModalViewport = () => {
      el.classList.remove("is-keyboard-open");
      el.classList.remove("is-ios-full-layout");
      el.style.removeProperty("--modal-viewport-height");
      if (isBagModal) el.style.removeProperty("--modal-layout-height");
      if (isBagModal) el.style.removeProperty("--modal-viewport-top");
      if (isBagModal) el.style.removeProperty("--modal-sheet-height");
      if (isBagModal) el.style.removeProperty("--modal-keyboard-overlap");
      el.style.removeProperty("--modal-viewport-bottom-inset");
    };
    const isEditableBagField = (active: HTMLElement) =>
      active.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, select');
    const revealFocusedProductField = () => {
      if ((!isBagModal && !isTopSixProductModal) || !el.classList.contains("is-keyboard-open") || !viewport) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !el.contains(active)) return;
      if (isBagModal && !isEditableBagField(active)) return;

      const scrollable = isBagModal ? el.querySelector<HTMLElement>(".bag-content") ?? el : el;
      const fieldRect = active.getBoundingClientRect();
      const modalRect = el.getBoundingClientRect();
      const scrollableRect = scrollable.getBoundingClientRect();
      const visibleTop = isBagModal
        ? Math.max(viewport.offsetTop, modalRect.top, scrollableRect.top) + 16
        : Math.max(viewport.offsetTop, modalRect.top) + 16;
      const bottomPadding = isBagModal ? 12 : 16;
      const visibleBottom = isBagModal
        ? Math.min(viewport.offsetTop + viewport.height, modalRect.bottom, scrollableRect.bottom) - bottomPadding
        : Math.min(viewport.offsetTop + viewport.height, modalRect.bottom) - bottomPadding;
      if (fieldRect.top < visibleTop) {
        scrollable.scrollTop -= visibleTop - fieldRect.top;
      } else if (fieldRect.bottom > visibleBottom) {
        scrollable.scrollTop += fieldRect.bottom - visibleBottom;
      }
    };
    const queueRevealFocusedProductField = () => {
      if ((!isBagModal && !isTopSixProductModal) || revealFocusedFieldFrame) return;
      revealFocusedFieldFrame = window.requestAnimationFrame(() => {
        revealFocusedFieldFrame = 0;
        revealFocusedProductField();
      });
    };
    const queueBagFocusedFieldReveal = () => {
      if (!isBagModal) return;
      if (bagFieldRevealTimer !== null) {
        window.clearTimeout(bagFieldRevealTimer);
        bagFieldRevealTimer = null;
      }
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !el.contains(active) || !isEditableBagField(active)) return;
      bagFieldRevealTimer = window.setTimeout(() => {
        bagFieldRevealTimer = null;
        revealFocusedProductField();
      }, 300);
    };
    const updateFormModalViewport = () => {
      if ((!isBagModal && !isTopSixProductModal) || !viewport) return;
      const viewportHeight = isBagModal ? viewport.height : 0;
      const viewportTop = isBagModal ? viewport.offsetTop : 0;
      if (isBagModal) {
        const nextOrientation = window.innerWidth >= window.innerHeight ? "landscape" : "portrait";
        if (nextOrientation !== viewportOrientation) {
          viewportOrientation = nextOrientation;
          maxViewportHeight = 0;
        }
        maxViewportHeight = Math.max(
          maxViewportHeight,
          viewportHeight,
          window.innerHeight,
          document.documentElement.clientHeight,
          layoutViewportProbe?.getBoundingClientRect().height ?? 0,
        );
      }
      const keyboardOpen = isBagModal
        ? viewportHeight < maxViewportHeight - 120
        : viewport.height < window.innerHeight - 120;
      if (!keyboardOpen) {
        if (isBagModal && el.classList.contains("is-keyboard-open")) {
          if (bagKeyboardCloseTimer === null) {
            bagKeyboardCloseTimer = window.setTimeout(() => {
              bagKeyboardCloseTimer = null;
              if (viewport.height >= maxViewportHeight - 120) clearFormModalViewport();
            }, 300);
          }
          return;
        }
        clearFormModalViewport();
        return;
      }

      if (bagKeyboardCloseTimer !== null) {
        window.clearTimeout(bagKeyboardCloseTimer);
        bagKeyboardCloseTimer = null;
      }
      if (isBagModal) {
        if (isIOSSafariBagModal) {
          const layoutHeight = Math.max(
            window.innerHeight,
            document.documentElement.clientHeight,
            maxViewportHeight,
            layoutViewportProbe?.getBoundingClientRect().height ?? 0,
          );
          el.classList.add("is-ios-full-layout");
          el.style.setProperty("--modal-layout-height", `${Math.floor(layoutHeight)}px`);
          el.style.setProperty("--modal-viewport-height", `${Math.max(0, Math.floor(viewportHeight))}px`);
          el.style.setProperty("--modal-viewport-top", `${Math.round(viewportTop)}px`);
          el.style.setProperty("--modal-sheet-height", `${Math.floor(layoutHeight)}px`);
          el.style.setProperty(
            "--modal-keyboard-overlap",
            `${Math.max(0, Math.ceil(layoutHeight - viewportHeight - viewportTop))}px`,
          );
        } else {
          const dialogTop = Math.round(viewportTop);
          const dialogHeight = Math.max(0, Math.floor(viewportHeight));
          el.style.setProperty("--modal-viewport-height", `${dialogHeight}px`);
          el.style.setProperty("--modal-viewport-top", `${dialogTop}px`);
          el.style.setProperty("--modal-sheet-height", `${dialogHeight}px`);
          el.style.setProperty(
            "--modal-keyboard-overlap",
            `${Math.max(0, Math.ceil(dialogTop + dialogHeight - viewportTop - viewportHeight))}px`,
          );
        }
        el.style.removeProperty("--modal-viewport-bottom-inset");
      } else {
        const viewportBottom = viewport.offsetTop + viewport.height;
        el.style.setProperty(
          "--modal-viewport-height",
          `${Math.max(0, Math.floor(viewport.height) - 1)}px`,
        );
        el.style.setProperty(
          "--modal-viewport-bottom-inset",
          `${Math.max(0, Math.ceil(window.innerHeight - viewportBottom))}px`,
        );
      }
      el.classList.add("is-keyboard-open");
      if (isTopSixProductModal) queueRevealFocusedProductField();
    };
    const handleBagPagePan = () => {
      if (!isBagModal || !shouldFreezePageBackground || bagPagePanFrame || (window.scrollX === 0 && window.scrollY === 0)) return;
      bagPagePanFrame = window.requestAnimationFrame(() => {
        bagPagePanFrame = 0;
        if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
        updateFormModalViewport();
        queueBagFocusedFieldReveal();
      });
    };
    const handleBagViewportChange = () => {
      updateFormModalViewport();
      handleBagPagePan();
      queueBagFocusedFieldReveal();
    };
    const handleFormModalViewportChange = isBagModal ? handleBagViewportChange : updateFormModalViewport;
    const scheduleBagViewportRefresh = () => {
      if (!isBagModal) return;
      bagViewportRefreshTimers.forEach((timer) => window.clearTimeout(timer));
      bagViewportRefreshTimers = [];
      updateFormModalViewport();
      for (const delay of [100, 300]) {
        const timer = window.setTimeout(() => {
          bagViewportRefreshTimers = bagViewportRefreshTimers.filter((pending) => pending !== timer);
          updateFormModalViewport();
        }, delay);
        bagViewportRefreshTimers.push(timer);
      }
    };
    const handleBagFocusIn = () => {
      if (bagKeyboardCloseTimer !== null) {
        window.clearTimeout(bagKeyboardCloseTimer);
        bagKeyboardCloseTimer = null;
      }
      scheduleBagViewportRefresh();
      queueBagFocusedFieldReveal();
    };
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
      overscrollBehavior: body.style.overscrollBehavior,
    };
    const oldRootOverflow = root.style.overflow;
    const oldRootOverscrollBehavior = root.style.overscrollBehavior;
    body.style.overflow = "hidden";
    if (shouldFreezePageBackground) {
      // iOS Safari can still scroll the page behind form modals when body overflow is hidden.
      root.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `${-pageScrollY}px`;
      body.style.left = `${-pageScrollX}px`;
      body.style.width = "100%";
      if (isBagModal) {
        root.style.overscrollBehavior = "none";
        body.style.overscrollBehavior = "none";
        window.scrollTo(0, 0);
      }
    }
    updateFormModalViewport();
    viewport?.addEventListener("resize", handleFormModalViewportChange);
    if (isTopSixProductModal) viewport?.addEventListener("scroll", updateFormModalViewport);
    if (isBagModal) viewport?.addEventListener("scroll", handleBagViewportChange);
    window.addEventListener("resize", handleFormModalViewportChange);
    if (isBagModal) window.addEventListener("scroll", handleBagViewportChange, { passive: true });
    if (isTopSixProductModal) el.addEventListener("focusin", queueRevealFocusedProductField);
    if (isBagModal) el.addEventListener("focusin", handleBagFocusIn);
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
      if (isTopSixProductModal) el.removeEventListener("focusin", queueRevealFocusedProductField);
      if (isBagModal) el.removeEventListener("focusin", handleBagFocusIn);
      viewport?.removeEventListener("resize", handleFormModalViewportChange);
      if (isTopSixProductModal) viewport?.removeEventListener("scroll", updateFormModalViewport);
      if (isBagModal) viewport?.removeEventListener("scroll", handleBagViewportChange);
      window.removeEventListener("resize", handleFormModalViewportChange);
      if (isBagModal) window.removeEventListener("scroll", handleBagViewportChange);
      if (revealFocusedFieldFrame) window.cancelAnimationFrame(revealFocusedFieldFrame);
      if (bagPagePanFrame) window.cancelAnimationFrame(bagPagePanFrame);
      bagViewportRefreshTimers.forEach((timer) => window.clearTimeout(timer));
      if (bagKeyboardCloseTimer !== null) window.clearTimeout(bagKeyboardCloseTimer);
      if (bagFieldRevealTimer !== null) window.clearTimeout(bagFieldRevealTimer);
      layoutViewportProbe?.remove();
      el.classList.remove("is-keyboard-open");
      el.classList.remove("is-ios-full-layout");
      el.style.removeProperty("--modal-viewport-height");
      el.style.removeProperty("--modal-layout-height");
      el.style.removeProperty("--modal-viewport-top");
      el.style.removeProperty("--modal-sheet-height");
      el.style.removeProperty("--modal-keyboard-overlap");
      el.style.removeProperty("--modal-viewport-bottom-inset");
      if (el.open) el.close();
      body.style.overflow = oldBodyStyles.overflow;
      if (shouldFreezePageBackground) {
        body.style.position = oldBodyStyles.position;
        body.style.top = oldBodyStyles.top;
        body.style.left = oldBodyStyles.left;
        body.style.width = oldBodyStyles.width;
        body.style.overscrollBehavior = oldBodyStyles.overscrollBehavior;
        root.style.overflow = oldRootOverflow;
        root.style.overscrollBehavior = oldRootOverscrollBehavior;
        window.scrollTo(pageScrollX, pageScrollY);
      }
      if (previous && typeof previous.focus === "function") {
        previous.focus();
      }
    };
  }, [docScrollMode]);

  const dialog = (
    <dialog
      ref={ref}
      aria-label={label}
      aria-modal={docScrollMode ? undefined : "true"}
      className={`modal ${className}${docScrollMode ? " docscroll-mode" : ""}`}
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
      {import.meta.env.DEV && showBagDebug && <BagModalDebugOverlay />}
    </dialog>
  );
  return docScrollMode ? createPortal(dialog, document.body) : dialog;
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
  const docScrollMode = isDocumentScrollModeEnabled();
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
  const bagBackgroundScrollRef = useRef<{ x: number; y: number } | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [beverageCategory, setBeverageCategory] = useState("top-6");
  const [beverageQuery, setBeverageQuery] = useState("");
  const [receipt, setReceipt] = useState(false);
  const [toast, setToast] = useState("");
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(readPendingOrder);
  const lastOrder = pendingOrder?.message ? withOrderRequestStatus(pendingOrder.message) : "";
  const whatsappOrderUrl = getWhatsAppUrl(lastOrder);
  const orderNeedsCopy = whatsappOrderUrl.length > WHATSAPP_URL_LIMIT;
  const whatsappSendUrl = orderNeedsCopy ? getWhatsAppUrl() : whatsappOrderUrl;
  const whatsappWebUrl = getWhatsAppUrl(orderNeedsCopy ? "" : lastOrder, true);
  const copyOrderRequest = async () => {
    const copied = await copyToClipboard(lastOrder);
    setToast(copied
      ? "Order request copied. Paste it into WhatsApp and tap Send."
      : "If copying was blocked, select and copy the order summary below.");
  };
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
    if (docScrollMode) bagBackgroundScrollRef.current = { x: window.scrollX, y: window.scrollY };
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
      if (docScrollMode) window.scrollTo(0, 0);
      else bagHeadingRef.current?.closest("dialog")?.scrollTo({ top: 0 });
      if (lastOrder) {
        void (async () => {
          const copied = await copyToClipboard(lastOrder);
          if (!copied) setToast("If copying was blocked, select and copy the order summary below.");
        })();
      }
    }
  }, [receipt, lastOrder, docScrollMode]);
  const [storeStatus, setStoreStatus] = useState(getStoreStatus);
  const [checkoutStep, setCheckoutStep] = useState<"bag" | "details">("bag");
  const bagContentRef = useRef<HTMLDivElement>(null);
  const orderTypeScrollTopRef = useRef<number | null>(null);
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
  useLayoutEffect(() => {
    if (docScrollMode) window.scrollTo(0, 0);
    else if (checkoutStep === "details" && bagContentRef.current) bagContentRef.current.scrollTop = 0;
  }, [checkoutStep, docScrollMode]);
  useLayoutEffect(() => {
    const scrollTop = orderTypeScrollTopRef.current;
    orderTypeScrollTopRef.current = null;
    if (scrollTop === null) return;
    if (docScrollMode) window.scrollTo(0, scrollTop);
    else if (bagContentRef.current) bagContentRef.current.scrollTop = scrollTop;
  }, [checkoutOrderType, docScrollMode]);
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
            <em>Another bite?</em>
          </h2>
          <a href={foodHref} className="button" onClick={handlePageLink}>
            Explore the menu <Icon name="arrow" />
          </a>
          <Ingredient kind="leaf" className="final-leaf" />
          <Sun />
        </section>
          </>
        )}
      </main>
      {import.meta.env.DEV && new URLSearchParams(window.location.search).get("debug") === "1" && !bagOpen && (isFoodPage || isBeveragesPage) && (
        <MenuPageDebugOverlay page={isFoodPage ? "diner-bites" : "beverages"} />
      )}
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

        <div className="footer-top-action">
          <a href="#top" className="back-top-pill" aria-label="Back to top" onClick={scrollToTop}>
            Back to top <Icon name="arrow" size={17} />
          </a>
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
          <nav className="footer-social-links" aria-label="Bean Diner social channels">
            {/* Brand glyphs: Simple Icons (CC0), https://simpleicons.org/ */}
            <a href={FACEBOOK_PAGE_URL} target="_blank" rel="noopener noreferrer" aria-label="Bean Diner on Facebook">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#0866FF" aria-hidden="true">
                <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
              </svg>
            </a>
            <a href={"https://instagram.com/bean.diner"} target="_blank" rel="noopener noreferrer" aria-label="Bean Diner on Instagram">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="url(#footer-instagram-color)" aria-hidden="true">
                  <defs>
                    <linearGradient id="footer-instagram-color" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FEDA75" />
                      <stop offset="30%" stopColor="#FA7E1E" />
                      <stop offset="55%" stopColor="#D62976" />
                      <stop offset="80%" stopColor="#962FBF" />
                      <stop offset="100%" stopColor="#4F5BD5" />
                    </linearGradient>
                  </defs>
                <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
              </svg>
            </a>
            <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" aria-label="Bean Diner on WhatsApp">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#25D366" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </a>
            <a href={getMessengerUrl()} onClick={openMessengerOnMobile} target="_blank" rel="noopener noreferrer" aria-label="Bean Diner on Messenger">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="url(#footer-messenger-color)" aria-hidden="true">
                  <defs>
                    <linearGradient id="footer-messenger-color" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0099FF" />
                      <stop offset="50%" stopColor="#A033FF" />
                      <stop offset="100%" stopColor="#FF5280" />
                    </linearGradient>
                  </defs>
                <path d="M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13" />
              </svg>
            </a>
          </nav>
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
          documentScrollPosition={bagBackgroundScrollRef.current}
          onClose={() => {
            bagBackgroundScrollRef.current = null;
            setBagOpen(false);
            setReceipt(false);
          }}
        >
          <div className="bag-content" ref={bagContentRef}>
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
                    <span className="receipt-status-pill">Request ready</span>
                  </div>

                  <div className="receipt-perforation" aria-hidden="true" />

                  <p className="receipt-intro">
                    Review your order request, then tap Send in WhatsApp. Your order is only confirmed when our crew confirms it.
                  </p>

                  <OrderingSteps handoff />

                  {/* Summary Box */}
                  {lastOrder && (
                    <div className="receipt-summary-box">
                      <div className="receipt-summary-box-top">
                        <span className="receipt-box-label">Order request for WhatsApp</span>
                        <button
                          type="button"
                          className="receipt-copy-pill"
                          onClick={copyOrderRequest}
                        >
                          <Icon name="check" size={13} /> Copy order
                        </button>
                      </div>
                      <pre className="receipt-summary-text">{lastOrder}</pre>
                    </div>
                  )}

                  <div className="receipt-actions-group">
                    {orderNeedsCopy && (
                      <>
                        <p className="whatsapp-length-warning" id="whatsapp-length-warning" role="status">
                          This request is too long for a WhatsApp link. Copy your order, open WhatsApp, paste it into the chat, then tap Send.
                        </p>
                        <button type="button" className="button button-whatsapp-order prominent" onClick={copyOrderRequest}>Copy order</button>
                      </>
                    )}
                    <a href={whatsappSendUrl} target="_blank" rel="noopener noreferrer"
                      className={orderNeedsCopy ? "button button-whatsapp-web" : "button button-whatsapp-order prominent"}
                      aria-describedby={orderNeedsCopy ? "whatsapp-length-warning" : undefined}>
                      {orderNeedsCopy ? "Open WhatsApp" : "Send order on WhatsApp"}
                    </a>
                    <a href={whatsappWebUrl} target="_blank" rel="noopener noreferrer" className="button button-whatsapp-web">Use WhatsApp Web</a>
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
                    onSubmit={async (e) => {
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
                      const copied = await copyToClipboard(msg);
                      setPendingOrder({ message: msg, createdAt: Date.now() });
                      setToast(copied
                        ? "Order request ready. Review it before sending on WhatsApp."
                        : "If copying was blocked, select and copy the order summary below.");
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
                          {([
                            { id: "pickup", label: "For pick up" },
                            { id: "dine-in", label: "Dine in" },
                            { id: "delivery", label: "Door to door" },
                          ] satisfies { id: typeof checkoutOrderType; label: string }[]).map((t) => (
                            <label
                              className={checkoutOrderType === t.id ? "selected" : ""}
                              key={t.id}
                              onPointerDown={(event) => {
                                const input = event.currentTarget.querySelector("input");
                                orderTypeScrollTopRef.current = input?.checked
                                  ? null
                                  : docScrollMode
                                    ? window.scrollY
                                    : bagContentRef.current?.scrollTop ?? null;
                              }}
                            >
                              <input
                                type="radio"
                                name="checkoutOrderType"
                                checked={checkoutOrderType === t.id}
                                onChange={() => {
                                  setCheckoutOrderType(t.id);
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
                          <small id="delivery-arrangements-note">Delivery arrangements are confirmed in WhatsApp.</small>
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
                            <label htmlFor="checkout-custom-time">Choose time today:</label>
                            <input
                              id="checkout-custom-time"
                              type="time"
                              autoComplete="off"
                              className={showTimeError ? "input-error" : ""}
                              min="10:00"
                              max="20:59"
                              step="60"
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
                        <textarea
                          id="order-note"
                          name="order-note"
                          rows={1}
                          autoComplete="off"
                          inputMode="text"
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
                      <span>Bayambang crew confirms order requests in WhatsApp</span>
                    </div>
                  </div>
                </aside>
                <div className="checkout-actions-block">
                  <button
                    className="button button-whatsapp-checkout prominent"
                    type="submit"
                    form="checkout-order-form"
                  >
                    Review order <Icon name="arrow" size={17} />
                  </button>
                  <small className="checkout-actions-hint">
                    Review your request, then send it in WhatsApp for crew confirmation.
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

            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={isStoryPage && item.href === storyHref ? "page" : undefined}
                onClick={handlePageLink}
                className="mobile-nav-item"
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
