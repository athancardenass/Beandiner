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
import { dinerBites, type DinerBite } from "./dinerBites";
import {
  allBeverages,
  beverageAddOns,
  beverageSubs,
  type BeverageItem,
  type BeverageModifier,
} from "./beverages";
import {
  CategoryTabs,
  FadeImage,
  PlusIcon,
  StickyMenuBar,
  scrollListIntoView,
  useStickyHeaderOffset,
} from "./ui/menu";

// ↓ UTILITY: Philippine Peso currency formatter
const money = (n: number) => `₱${n.toLocaleString("en-PH")}`;
const beanDinerMapsUrl =
  "https://www.google.com/maps/place/Bean+Diner/@15.8103457,120.4573329,17z/data=!4m14!1m7!3m6!1s0x339149ebf4721bcb:0xff2c7401d69cb887!2sBean+Diner!8m2!3d15.8103457!4d120.4573329!16s%2Fg%2F11vljpcbmt!3m5!1s0x339149ebf4721bcb:0xff2c7401d69cb887!8m2!3d15.8103457!4d120.4573329!16s%2Fg%2F11vljpcbmt?entry=ttu&g_ep=EgoyMDI2MDkyMi4wIKXMDSoASAFQAw%3D%3D";
const wazeUrl = "https://waze.com/ul?q=Bean%20Diner%20Bayambang";
type CheckoutPayment = "cash" | "gcash" | "maya";

const getStoreStatus = () => {
  const parts = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const isOpen = hour >= 10 && hour < 21;

  return {
    isOpen,
    text: isOpen ? "Open Now · Closes 9:00 PM" : "Closed Now · Opens 10:00 AM",
  };
};
// ↓ UTILITY: Relative image path resolvers (supports dev server and file:// protocol)
const image = (name: string) => {
  if (name === "hot") return "./images/optimized/hotroast.webp";
  return `./images/optimized/${name}.webp`;
};
const menuImage = (name: string) => `./images/menu/${name}.webp`;
type AppPage = "home" | "diner-bites" | "beverages";
const pageHref = (page: AppPage, anchor = "") => {
  const url = new URL(window.location.href);
  if (page === "diner-bites") url.searchParams.set("page", "diner-bites");
  else if (page === "beverages") url.searchParams.set("page", "beverages");
  else url.searchParams.delete("page");
  url.hash = anchor;
  return url.href;
};

const clickScrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth";

const handleAnchorLink = (event: MouseEvent<HTMLAnchorElement>) => {
  if (
    event.defaultPrevented || event.button !== 0 || event.metaKey ||
    event.ctrlKey || event.shiftKey || event.altKey
  ) return;
  const url = new URL(event.currentTarget.href);
  const target = document.getElementById(url.hash.slice(1));
  if (!target) return;
  event.preventDefault();
  if (url.href !== window.location.href) window.history.pushState(null, "", url);
  const hadTabIndex = target.hasAttribute("tabindex");
  if (!hadTabIndex) target.tabIndex = -1;
  target.focus({ preventScroll: true });
  if (!hadTabIndex) {
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
  }
  target.scrollIntoView({ behavior: clickScrollBehavior() });
};

const scrollToPageAnchor = (animate = false) => {
  const anchor = window.location.hash.slice(1);
  const behavior = animate ? clickScrollBehavior() : "instant";
  if (!anchor || anchor === "home" || anchor === "top") {
    window.scrollTo({ top: 0, left: 0, behavior });
  } else {
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
  note?: string;
};
// ↓ HELPER: Send formatted order to Bean Diner Facebook Messenger
const formatOrderMessage = (
  items: CartItem[],
  customerName: string,
  customerPhone: string,
  totalAmount: number,
  bundleDiscount: number = 0,
  orderType: "pickup" | "dine-in" | "delivery" = "pickup",
  extraInfo: string = "",
  payment: CheckoutPayment = "gcash",
  pickupTime: string = "",
  orderNote: string = "",
) => {
  const lines = items.map((item) => {
    const p = products.find((p) => p.id === item.id);
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
    bundleDiscount > 0 ? `Bundle Discount: -${money(bundleDiscount)}` : null,
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
    if (!el.open) {
      try {
        el.showModal();
      } catch {
        /* Dialog already open */
      }
    }
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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
      if (el.open) el.close();
      document.body.style.overflow = oldOverflow;
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
  bagOfferCups,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
  bagOfferCups: number;
}) {
  const isIcedDrink = product.name.toLowerCase().includes("iced");
  const isHotDrink = product.name.toLowerCase().includes("hot");
  const [size, setSize] = useState("16 oz");
  const [milk, setMilk] = useState("Regular");
  const [temperature, setTemperature] = useState(
    isIcedDrink ? "Iced" : isHotDrink ? "Hot" : product.hot ? "Hot" : "Iced"
  );
  const [sweetness, setSweetness] = useState("100% Sweet");
  const [iceLevel, setIceLevel] = useState("Regular Ice");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const hasMilk = true;
  const price =
    product.price + (size === "22 oz" ? 30 : 0) + (milk === "Oat" ? 35 : 0);

  // Offer hint mirrors the cart rule: latte, 16 oz, regular milk, iced.
  const isOfferDrink = product.id === spanishLatte.id;
  const qualifies =
    isOfferDrink && size === "16 oz" && milk === "Regular" && temperature === "Iced";
  const cupsAfterAdd = bagOfferCups + (qualifies ? quantity : 0);
  const offerHint = !isOfferDrink
    ? ""
    : !qualifies
      ? `Two-cup offer (2 for ${money(spanishLatteBundlePrice)}) needs 16 oz, regular milk, iced.`
      : cupsAfterAdd >= 2
        ? `Two-cup offer applies: save ${money(spanishLatteBundleSavings * Math.floor(cupsAfterAdd / 2))} at checkout.`
        : `Add one more cup for 2 for ${money(spanishLatteBundlePrice)}.`;

  return (
    <Modal
      onClose={onClose}
      label={`Customize ${product.name}`}
      className="product-modal"
    >
      <div className="customize-image" style={{ background: product.color }}>
        <img src={image(product.id)} alt="" />
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
          <p className="customize-price">{money(product.price)}</p>
        </div>
        <p className="customize-desc">{product.description}</p>

        {!isIcedDrink && !isHotDrink && (
          <Segmented
            legend="Hot or iced"
            name="temperature"
            value={temperature}
            onChange={setTemperature}
            options={[
              { value: "Iced", label: "Iced" },
              { value: "Hot", label: "Hot" },
            ]}
          />
        )}
        {(isIcedDrink || isHotDrink) && (
          <p className="customize-fixed">
            {isIcedDrink ? "Served iced" : "Served hot"}
          </p>
        )}

        <Segmented
          legend="Size"
          name="size"
          value={size}
          onChange={setSize}
          options={[
            { value: "16 oz", label: "16 oz" },
            { value: "22 oz", label: "22 oz", extra: "+₱30" },
          ]}
        />

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
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. separate syrup"
            maxLength={120}
          />
        </div>

        <p
          className={`offer-hint${qualifies ? " is-on" : ""}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {offerHint}
        </p>

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
          behavior: "instant",
        });
      }
    }
  }, [active]);
  useEffect(() => {
    const el = section.current!;
    const stageEl = stage.current!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const cups = Array.from(stageEl.querySelectorAll<HTMLElement>(".story-product"));
    const bean = stageEl.querySelector<HTMLElement>(".story-bean");
    const ice = stageEl.querySelector<HTMLElement>(".story-ice");
    const leaf = stageEl.querySelector<HTMLElement>(".story-leaf");
    let sectionTop = 0;
    let sectionHeight = 0;
    let viewportHeight = innerHeight;
    let previousProgress = -1;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = sectionTop - scrollY;
      if (top + sectionHeight < 0 || top > viewportHeight) return;
      const p = Math.max(
        0,
        Math.min(5, (-top / Math.max(1, sectionHeight - viewportHeight)) * 5),
      );
      if (p === previousProgress) return;
      previousProgress = p;
      const index = Math.round(p);
      if (index !== activeRef.current) {
        activeRef.current = index;
        setActive(index);
      }
      const reduced = media.matches;
      cups.forEach((cup, i) => {
        const d = i - p;
        const opacity = `${Math.max(0, 1 - Math.abs(d) * 1.35)}`;
        const promotion = !reduced && opacity !== "0" ? "transform, opacity" : "auto";
        if (cup.style.willChange !== promotion) cup.style.willChange = promotion;
        if (cup.style.opacity !== opacity) cup.style.opacity = opacity;
        if (reduced) cup.style.transform = "none";
        else if (opacity !== "0") {
          cup.style.transform = `translate3d(${d * 90}%,${Math.abs(d) * 28}%,0) rotate(${d * 27 - 5}deg) scale(${1 - Math.min(Math.abs(d) * 0.15, 0.35)})`;
        }
      });
      if (bean) bean.style.transform = reduced ? "none" : `translate3d(${p * -10}px,0,0) rotate(${p * 100}deg)`;
      if (ice) ice.style.transform = reduced ? "none" : `translate3d(0,${p * 10}px,0) rotate(${p * 65}deg)`;
      if (leaf) leaf.style.transform = reduced ? "none" : `rotate(${p * -35}deg)`;
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      sectionTop = el.getBoundingClientRect().top + scrollY;
      sectionHeight = el.offsetHeight;
      viewportHeight = innerHeight;
      request();
    };
    const motionChanged = () => {
      previousProgress = -1;
      request();
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
    resizeObserver.observe(document.body);
    const heroElement = document.querySelector(".hero");
    if (heroElement) resizeObserver.observe(heroElement);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", measure);
    media.addEventListener("change", motionChanged);
    measure();
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", measure);
      media.removeEventListener("change", motionChanged);
      resizeObserver.disconnect();
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
      behavior: clickScrollBehavior(),
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
          <a className="text-link" href="#menu" onClick={handleAnchorLink}>
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
  useStickyHeaderOffset();
  const [currentPage, setCurrentPage] = useState<AppPage>(() => {
    const p = new URLSearchParams(window.location.search).get("page");
    if (p === "diner-bites") return "diner-bites";
    if (p === "beverages") return "beverages";
    return "home";
  });
  const isFoodPage = currentPage === "diner-bites";
  const isBeveragesPage = currentPage === "beverages";
  const navigationFrame = useRef(0);
  const foodHref = pageHref("diner-bites");
  const beveragesHref = pageHref("beverages");
  const homeHref = (anchor: string) => pageHref("home", anchor);
  const [selected, setSelected] = useState<Product | null>(null);
  const [customizingBite, setCustomizingBite] = useState<DinerBite | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [filter, setFilter] = useState("All drinks");
  const [receipt, setReceipt] = useState(false);
  const [toast, setToast] = useState("");
  const [lastOrder, setLastOrder] = useState("");
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
  const [checkoutPickupTime, setCheckoutPickupTime] = useState("ASAP (~15-20 mins)");
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const showNameError = focusedField !== "name" && Boolean(checkoutErrors.name);
  const showPhoneError = focusedField !== "phone" && Boolean(checkoutErrors.phone);
  const showAddressError = focusedField !== "address" && Boolean(checkoutErrors.address);
  const showTimeError = focusedField !== "customTime" && Boolean(checkoutErrors.time);
  const scrollToTop = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: clickScrollBehavior() });
  };
  const handlePageLink = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey
    ) return;
    event.preventDefault();
    const url = new URL(event.currentTarget.href);
    if (url.href !== window.location.href) {
      window.history.pushState(null, "", url);
    }
    const pageParam = url.searchParams.get("page");
    if (pageParam === "diner-bites") setCurrentPage("diner-bites");
    else if (pageParam === "beverages") setCurrentPage("beverages");
    else setCurrentPage("home");
    setNavOpen(false);
    cancelAnimationFrame(navigationFrame.current);
    navigationFrame.current = requestAnimationFrame(() => scrollToPageAnchor(true));
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
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.title = isFoodPage
      ? "Diner Bites & Comfort Plates | Bean Diner"
      : isBeveragesPage
      ? "Artisanal Brews & Specialty Sips | Bean Diner"
      : "Bean Diner | Good Food. Great Coffee. Warm Vibes.";
    const description = isFoodPage
      ? "Crispy chicken wings, loaded nachos, rice plates, pasta, sandwiches, and warm croffles at Bean Diner in Bayambang, Pangasinan."
      : isBeveragesPage
      ? "Hot and iced coffee, matcha, chai, milkshakes, and plant-based add-ons at Bean Diner in Bayambang, Pangasinan."
      : "Bean Diner in Bayambang, Pangasinan. Founded by a US-trained Chef & Middle East-skilled Barista. Comfort food, Oatside creations, Benguet highland coffee, and warm community vibes.";
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [isFoodPage, isBeveragesPage]);
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
      const pageParam = new URLSearchParams(window.location.search).get("page");
      if (pageParam === "diner-bites") setCurrentPage("diner-bites");
      else if (pageParam === "beverages") setCurrentPage("beverages");
      else setCurrentPage("home");
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
    const heading = hero.current?.querySelector<HTMLElement>("h1");
    const cup = hero.current?.querySelector<HTMLElement>(".hero-product-wrap");
    let viewportHeight = innerHeight;
    let maxScroll = 1;
    const paint = () => {
      frame = 0;
      const y = scrollY;
      if (reduced.matches) {
        if (heading) heading.style.transform = "none";
        if (cup) cup.style.transform = "none";
      } else if (y < viewportHeight * 1.5) {
        if (heading) heading.style.transform = `translate3d(${y * -0.08}px,${y * -0.06}px,0)`;
        if (cup) cup.style.transform = `translate3d(${y * 0.1}px,${y * -0.12}px,0) rotate(${y * 0.017}deg)`;
      }
      if (progress.current)
        progress.current.style.transform = `scaleX(${Math.min(1, Math.max(0, y / maxScroll))})`;
    };
    const handle = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const measure = () => {
      viewportHeight = innerHeight;
      maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
      handle();
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", measure);
    reduced.addEventListener("change", handle);
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
      resizeObserver.disconnect();
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
    document
      .querySelector(isFoodPage ? "#food-menu" : "#menu")
      ?.scrollIntoView({ behavior: clickScrollBehavior() });
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
        <span className="announcement-brand">GOOD FOOD. GREAT COFFEE.</span>
        <span className="announcement-promo">
          Two Iced Spanish Lattes for {money(spanishLatteBundlePrice)}.
        </span>
        <a href={homeHref("together")} onClick={handlePageLink}>
          Make it a coffee date <span>↗</span>
        </a>
        <span
          className={`store-status-badge announcement-store-status ${storeStatus.isOpen ? "is-open" : "is-closed"}`}
          role="status"
        >
          <span className="store-status-dot" aria-hidden="true" />
          {storeStatus.text}
        </span>
      </div>
      {/* ↓ HEADER: Logo, navigation, order button, bag */}
      <header className="header" id="home">
        <Logo href={homeHref("home")} onClick={handlePageLink} />
        <nav aria-label="Main navigation" className="header-nav">
          <a
            href={beveragesHref}
            onClick={handlePageLink}
            className="nav-item"
            aria-current={isBeveragesPage ? "page" : undefined}
          >
            <span className="nav-num">01</span>
            <span className="nav-label">Beverages menu</span>
            <span className="nav-badge">60+</span>
          </a>
          <a
            href={foodHref}
            onClick={handlePageLink}
            className="nav-item"
            aria-current={isFoodPage ? "page" : undefined}
          >
            <span className="nav-num">02</span>
            <span className="nav-label">Diner bites</span>
            <span className="nav-badge">₱99</span>
          </a>
          <a href={homeHref("menu")} onClick={handlePageLink} className="nav-item">
            <span className="nav-num">03</span>
            <span className="nav-label">Top 6 signatures</span>
          </a>
          <a href={homeHref("story")} onClick={handlePageLink} className="nav-item">
            <span className="nav-num">04</span>
            <span className="nav-label">Our story</span>
          </a>
          <a href={homeHref("together")} onClick={handlePageLink} className="nav-item nav-together">
            <span className="nav-num">05</span>
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
            href={isFoodPage ? "#food-menu" : isBeveragesPage ? "#drinks-menu" : "#menu"}
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
            key={`header-bag-${bagBump}`}
            className={`bag-button ${bagBump > 0 ? "bag-bump-animate" : ""}`}
            aria-label={`Open bag, ${cartCount} items`}
            onClick={() => {
              setBagOpen(true);
              setReceipt(false);
              setCheckoutStep("bag");
            }}
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
      </header>
      <main id="main">
        {isFoodPage ? (
          <DinerBitesPage
            onAdd={addBite}
            drinksHref={beveragesHref}
            onNavigate={handlePageLink}
          />
        ) : isBeveragesPage ? (
          <BeveragesPage
            onAdd={addBeverage}
            onAddModifier={addModifier}
            foodHref={foodHref}
            signatureHref={homeHref("menu")}
            onNavigate={handlePageLink}
          />
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
                  } else handleAnchorLink(e);
                }}
              >
                Order for pickup <Icon name="arrow" />
              </a>
              <a className="text-link" href={foodHref} onClick={handlePageLink}>
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
          <a className="scroll-cue" href="#flavors" onClick={handleAnchorLink}>
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
              fill="var(--cream, #FFF0D6)"
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
          <section className="social-ordering-guide" aria-labelledby="social-ordering-title">
            <h3 id="social-ordering-title">How Social Ordering Works</h3>
            <OrderingSteps />
          </section>
          <StickyMenuBar label="Signature drink filters" className="home-sticky">
            <div className="menu-toolbar-signature-row">
              <CategoryTabs
                tabs={[
                  { id: "All drinks", label: "All drinks", count: 6 },
                  { id: "Best sellers", label: "Best sellers", count: 3 },
                  { id: "Coffee", label: "Coffee", count: 4 },
                  { id: "Not coffee", label: "Not coffee", count: 2 },
                ]}
                active={filter}
                onChange={(tabId) => {
                  setFilter(tabId as any);
                  requestAnimationFrame(() =>
                    scrollListIntoView(document.getElementById("drink-menu-products")),
                  );
                }}
                label="Filter drinks"
              />
              <span className="menu-size">SIGNATURE 16 OZ CUPS</span>
            </div>
          </StickyMenuBar>
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
                  <FadeImage
                    src={image(p.id)}
                    alt={p.name}
                    loading="lazy"
                    width={300}
                    height={420}
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
          <div className="bites-preview-link">
            <a className="button button-outline" href={beveragesHref} onClick={handlePageLink}>
              Explore beverages menu (60+ brews) <Icon name="arrow" size={18} />
            </a>
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
                  <span className="bite-subheading">{bite.subtitle}</span>
                  <h3>{bite.name}</h3>
                  <p>{bite.description}</p>
                </div>
                <div className="bite-card-footer">
                  <div className="bite-price-block">
                    <span className="bite-price-label">Price</span>
                    <strong>
                      {bite.price === null ? "Price TBD" : money(bite.price)}
                    </strong>
                  </div>
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
            <a className="button" href={foodHref} onClick={handlePageLink}>
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
              Good coffee tastes better when it’s shared. Tara, kape tayo sa Bean Diner.
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
          <a href="#menu" className="button" onClick={handleAnchorLink}>
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
                <small>60+ artisanal brews</small>
              </a>
              <a href={foodHref} onClick={handlePageLink} className="footer-pill">
                <span>Diner bites</span>
                <small>₱99 wings & comfort</small>
              </a>
              <a href={homeHref("menu")} onClick={handlePageLink} className="footer-pill">
                <span>Top 6 signatures</span>
                <small>Bestsellers & lattes</small>
              </a>
              <a href={homeHref("story")} onClick={handlePageLink} className="footer-pill">
                <span>Our story</span>
                <small>Two crafts, one home</small>
              </a>
              <a
                href={getMessengerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-pill footer-pill-fb"
                onClick={(e) => {
                  if (isMobileDevice() && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    openMessengerApp();
                  }
                }}
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
        <span>Message Us</span>
      </a>

      </footer>
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
          bagOfferCups={eligible}
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
                  onClick={() => setBagOpen(false)}
                >
                  + Order More / Browse Menu
                </button>
                <div className="cart-items">
                  {cart.map((item) => {
                    const p = products.find((p) => p.id === item.id);
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
                            src={image(p.id)}
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
                    <strong aria-live="polite">{money(subtotal - discount)}</strong>
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
                    className="checkout-form checkout-form-compact"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      const currentAddressErr = validateDeliveryAddress(checkoutExtra, checkoutOrderType);
                      const currentNameErr = validateCustomerName(checkoutName);
                      const currentPhoneErr = validateCustomerPhone(checkoutPhone);
                      const currentTimeErr =
                        checkoutPickupTime === "Custom time" && !checkoutCustomTime.trim()
                          ? "Please specify your preferred time"
                          : null;

                      setCheckoutErrors({
                        name: currentNameErr,
                        phone: currentPhoneErr,
                        address: currentAddressErr,
                        time: currentTimeErr,
                      });
                      setFocusedField(null);

                      if (currentAddressErr) {
                        document.getElementById("checkout-address")?.focus();
                        return;
                      }
                      if (currentNameErr) {
                        document.getElementById("order-name")?.focus();
                        return;
                      }
                      if (currentTimeErr) {
                        document.getElementById("checkout-custom-time")?.focus();
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
                        subtotal - discount,
                        discount,
                        checkoutOrderType,
                        checkoutExtra.trim(),
                        checkoutPayment,
                        resolvedTiming,
                        checkoutNote.trim(),
                      );
                      copyToClipboard(msg);
                      setLastOrder(msg);
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
                    {/* Customer Name */}
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
                        name="name"
                        className={showNameError ? "input-error" : ""}
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        onFocus={() => {
                          setFocusedField("name");
                          setCheckoutErrors((prev) => ({ ...prev, name: null }));
                        }}
                        onBlur={() => {
                          setFocusedField(null);
                          setCheckoutErrors((prev) => ({
                            ...prev,
                            name: validateCustomerName(checkoutName),
                          }));
                        }}
                        aria-invalid={showNameError ? "true" : "false"}
                        aria-describedby={showNameError ? "order-name-error" : undefined}
                        autoComplete="name"
                        placeholder="e.g. Karl Santos"
                        maxLength={50}
                      />
                      {showNameError && (
                        <span id="order-name-error" className="form-field-error" role="alert">
                          <Icon name="alert-circle" size={14} /> {checkoutErrors.name}
                        </span>
                      )}
                    </div>

                    {/* Pickup / Preferred Time */}
                    <fieldset className="checkout-fieldset">
                      <legend>Pickup / Preferred timing</legend>
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
                            name="customTime"
                            className={showTimeError ? "input-error" : ""}
                            placeholder="e.g. 2:45 PM or 5:30 PM"
                            value={checkoutCustomTime}
                            onChange={(e) => {
                              setCheckoutCustomTime(e.target.value);
                              setCheckoutErrors((prev) => ({ ...prev, time: null }));
                            }}
                            onFocus={() => {
                              setFocusedField("customTime");
                              setCheckoutErrors((prev) => ({ ...prev, time: null }));
                            }}
                            onBlur={() => {
                              setFocusedField(null);
                              if (!checkoutCustomTime.trim()) {
                                setCheckoutErrors((prev) => ({
                                  ...prev,
                                  time: "Please specify your preferred time",
                                }));
                              }
                            }}
                            aria-invalid={showTimeError ? "true" : "false"}
                            aria-describedby={showTimeError ? "checkout-time-error" : undefined}
                            maxLength={30}
                          />
                          {showTimeError && (
                            <span id="checkout-time-error" className="form-field-error" role="alert">
                              <Icon name="alert-circle" size={14} /> {checkoutErrors.time}
                            </span>
                          )}
                        </div>
                      )}
                    </fieldset>

                    {/* Order Note */}
                    <div className="form-group">
                      <label htmlFor="order-note">
                        Order note / special request <small>(optional)</small>
                      </label>
                      <input
                        id="order-note"
                        name="note"
                        placeholder="e.g. separate syrup, extra napkins, less sweet"
                        value={checkoutNote}
                        onChange={(e) => setCheckoutNote(e.target.value)}
                        maxLength={140}
                      />
                    </div>

                    {/* Order Type */}
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
                          name="table"
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
                        <input
                          id="checkout-address"
                          name="address"
                          className={showAddressError ? "input-error" : ""}
                          placeholder="Street, Barangay, and Landmark in Bayambang"
                          value={checkoutExtra}
                          onChange={(e) => setCheckoutExtra(e.target.value)}
                          onFocus={() => {
                            setFocusedField("address");
                            setCheckoutErrors((prev) => ({ ...prev, address: null }));
                          }}
                          onBlur={() => {
                            setFocusedField(null);
                            setCheckoutErrors((prev) => ({
                              ...prev,
                              address: validateDeliveryAddress(checkoutExtra, checkoutOrderType),
                            }));
                          }}
                          aria-invalid={showAddressError ? "true" : "false"}
                          aria-describedby={showAddressError ? "checkout-address-error" : undefined}
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

                    {/* Contact Number */}
                    <div className="form-group">
                      <label htmlFor="order-phone">
                        Contact number <span className="required-star">*</span>
                      </label>
                      <input
                        id="order-phone"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        className={showPhoneError ? "input-error" : ""}
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(formatPhoneNumber(e.target.value))}
                        onFocus={() => {
                          setFocusedField("phone");
                          setCheckoutErrors((prev) => ({ ...prev, phone: null }));
                        }}
                        onBlur={() => {
                          setFocusedField(null);
                          setCheckoutErrors((prev) => ({
                            ...prev,
                            phone: validateCustomerPhone(checkoutPhone),
                          }));
                        }}
                        aria-invalid={showPhoneError ? "true" : "false"}
                        aria-describedby={showPhoneError ? "order-phone-error" : undefined}
                        autoComplete="tel"
                        placeholder="09XX-XXX-XXXX"
                        maxLength={20}
                      />
                      {showPhoneError && (
                        <span id="order-phone-error" className="form-field-error" role="alert">
                          <Icon name="alert-circle" size={14} /> {checkoutErrors.phone}
                        </span>
                      )}
                    </div>

                    {/* Payment Method */}
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

                    {/* Prominent Send Order via Messenger button */}
                    <div className="checkout-actions-block">
                      <button
                        className="button button-messenger-checkout prominent"
                        type="submit"
                      >
                        Send order via Messenger <Icon name="arrow" size={17} />
                      </button>
                      <small className="checkout-actions-hint">
                        Copies your order summary and guides you to Facebook Messenger to confirm with our crew.
                      </small>
                    </div>
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
                        const p = products.find((p) => p.id === item.id);
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
                      {discount > 0 && (
                        <div className="checkout-summary-row savings">
                          <span>Coffee-date savings</span>
                          <span>−{money(discount)}</span>
                        </div>
                      )}
                      <div className="checkout-summary-row total">
                        <span>Total</span>
                        <strong aria-live="polite">{money(subtotal - discount)}</strong>
                      </div>
                    </div>

                    <div className="checkout-summary-badge">
                      <Icon name="check" size={14} />
                      <span>Bayambang crew confirms orders live in Messenger</span>
                    </div>
                  </div>
                </aside>
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
            href={homeHref("home")}
            onClick={handlePageLink}
          />
          <nav className="mobile-nav-list">
            {[
              {
                num: "01",
                label: "Beverages menu (60+)",
                sub: "Espresso, matcha, teas & cold frappes",
                badge: "60+ BREWS",
                href: beveragesHref,
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
                label: "Top 6 signatures",
                sub: "Benguet highland coffee & Oatside lattes",
                href: homeHref("menu"),
              },
              {
                num: "04",
                label: "Our story",
                sub: "US Chef & Middle East Barista roots",
                href: homeHref("story"),
              },
              {
                num: "05",
                label: "Better together",
                sub:
                  "Two-cup coffee date bundle for " +
                  money(spanishLatteBundlePrice),
                badge: "SAVE " + money(spanishLatteBundleSavings),
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
                onClick={item.isExternal ? () => setNavOpen(false) : handlePageLink}
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
      {cart.length > 0 && (
        <button
          type="button"
          key={`float-bag-${bagBump}`}
          className={`floating-bag-bubble ${bagBump > 0 ? "bag-bump-animate" : ""}`}
          onClick={() => {
            setReceipt(false);
            setBagOpen(true);
            setCheckoutStep("bag");
          }}
          aria-label={`View order bag with ${cartCount} items`}
        >
          <span className="floating-bag-badge">{cartCount}</span>
          <span className="floating-bag-text">View Order Bag</span>
          <span className="floating-bag-price">{money(subtotal - discount)}</span>
        </button>
      )}
    </>
  );
}
export default App;
