import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import DinerBitesPage from "./DinerBitesPage";
import BeveragesPage from "./BeveragesPage";
import OurStoryPage from "./OurStoryPage";
import { BiteCustomizeModal, ProductModal } from "./components/CustomizationModals";
import { OrderingSteps } from "./components/OrderingSteps";
import { MenuPageDebugOverlay } from "./dev/DebugOverlays";
import { dinerBites, type DinerBite } from "./dinerBites";
import {
  allBeverages,
  beverageAddOns,
  beverageSubs,
  type BeverageItem,
  type BeverageModifier,
} from "./beverages";
import type { CartItem, CheckoutPayment, Product } from "./types";
import { Icon, Ingredient, Logo, Sun } from "./ui/graphics";
import { Modal } from "./ui/Modal";
import {
  FadeImage,
  matchesQuery,
  normalizeQuery,
  PlusIcon,
  useStickyHeaderOffset,
} from "./ui/menu";
import {
  ASAP_TIMING_LABEL,
  CUSTOM_TIMING_LABEL,
  getStoreStatus,
  isPendingOrder,
  ORDER_TIMING_OPTIONS,
  PENDING_ORDER_TTL_MS,
  readPendingOrder,
  validateOrderTiming,
  writePendingOrder,
  type PendingOrder,
} from "./utils/checkout";
import { cartItemSpecs, MAX_CART_QUANTITY, mergeCartItem } from "./utils/cart";
import { copyToClipboard } from "./utils/clipboard";
import { listen } from "./utils/events";
import { FACEBOOK_PAGE_URL, getMessengerUrl, openMessengerOnMobile } from "./utils/messenger";
import {
  clickScrollBehavior,
  isDocumentScrollModeEnabled,
  pageFromSearch,
  pageHref,
  scrollToPageAnchor,
  type AppPage,
} from "./utils/navigation";
import { money, productImage } from "./utils/presentation";
import { getWhatsAppUrl, withOrderRequestStatus, WHATSAPP_URL_LIMIT } from "./utils/whatsapp";

const PAGE_METADATA: Record<AppPage, { title: string; description: string }> = {
  home: {
    title: "Bean Diner | Good Food. Great Coffee. Warm Vibes.",
    description: "Bean Diner in Bayambang, Pangasinan. Founded by a US-trained Chef & Middle East-skilled Barista. Comfort food, Oatside creations, Benguet highland coffee, and warm community vibes.",
  },
  "diner-bites": {
    title: "Diner Bites & Comfort Plates | Bean Diner",
    description: "Crispy chicken wings, loaded nachos, rice plates, pasta, sandwiches, and warm croffles at Bean Diner in Bayambang, Pangasinan.",
  },
  beverages: {
    title: "Artisanal Brews & Specialty Sips | Bean Diner",
    description: "Hot and iced coffee, matcha, chai, milkshakes, and plant-based add-ons at Bean Diner in Bayambang, Pangasinan.",
  },
  "our-story": {
    title: "Our Story | Bean Diner Bayambang",
    description: "Meet the US-trained Chef and Middle East specialty coffee Barista behind Bean Diner in Bayambang, Pangasinan.",
  },
};

const beanDinerMapsUrl =
  "https://www.google.com/maps/place/Bean+Diner/@15.8103457,120.4573329,17z/data=!4m14!1m7!3m6!1s0x339149ebf4721bcb:0xff2c7401d69cb887!2sBean+Diner!8m2!3d15.8103457!4d120.4573329!16s%2Fg%2F11vljpcbmt!3m5!1s0x339149ebf4721bcb:0xff2c7401d69cb887!8m2!3d15.8103457!4d120.4573329!16s%2Fg%2F11vljpcbmt?entry=ttu&g_ep=EgoyMDI2MDkyMi4wIKXMDSoASAFQAw%3D%3D";

const wazeUrl = "https://waze.com/ul?q=Bean%20Diner%20Bayambang";

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

const resolveCartItem = (item: CartItem) => {
  const p = findProduct(item.id);
  const b = dinerBites.find((b) => b.id === item.id);
  const bev = allBeverages.find((bev) => bev.id === item.id);
  const mod = [...beverageAddOns, ...beverageSubs].find((m) => m.id === item.id);
  const title = p ? p.name : b ? b.name : bev ? bev.name : mod ? mod.name : item.name || "Item";
  return { p, bev, mod, title };
};

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
    const { bev, mod, title } = resolveCartItem(item);
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
    const specs = cartItemSpecs(item)
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

function readInitialCart(): CartItem[] {
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
              item.quantity <= MAX_CART_QUANTITY,
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
}

function observeReveals() {
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
  return () => observer.disconnect();
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
    }
  }, [receipt, lastOrder, docScrollMode]);
  useEffect(() => {
    if (receipt && lastOrder) {
      void (async () => {
        const copied = await copyToClipboard(lastOrder);
        if (!copied) setToast("If copying was blocked, select and copy the order summary below.");
      })();
    }
  }, [receipt, lastOrder, docScrollMode]);
  const [storeStatus, setStoreStatus] = useState(getStoreStatus);
  const [checkoutStep, setCheckoutStep] = useState<"bag" | "details">("bag");
  const bagContentRef = useRef<HTMLDivElement>(null);
  const orderTypeScrollTopRef = useRef<number | null>(null);
  const [checkoutPickupTime, setCheckoutPickupTime] = useState(() =>
    validateOrderTiming(ASAP_TIMING_LABEL, "") ? CUSTOM_TIMING_LABEL : ASAP_TIMING_LABEL,
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
  const [cart, setCart] = useState<CartItem[]>(readInitialCart);
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
    const stopRememberingPlaybackTime = listen(video, "timeupdate", rememberPlaybackTime);

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
    const removePlaybackListeners = [
      listen(reducedMotion, "change", syncPlayback),
      listen(document, "visibilitychange", syncPlayback),
      listen(window, "pageshow", syncPlayback),
      listen(window, "online", recoverPlayback),
      listen(document, "pointerdown", syncPlayback, { passive: true }),
      listen(document, "keydown", syncPlayback),
      listen(video, "canplay", syncPlayback),
    ];
    const recoveryTimer = window.setInterval(recoverPlayback, 4000);
    return () => {
      disposed = true;
      window.clearInterval(recoveryTimer);
      rememberPlaybackTime();
      observer.disconnect();
      removePlaybackListeners.forEach((remove) => remove());
      stopRememberingPlaybackTime();
      video.pause();
    };
  }, [currentPage]);
  useEffect(() => {
    const page = isFoodPage
      ? "diner-bites"
      : isBeveragesPage
      ? "beverages"
      : isStoryPage
      ? "our-story"
      : "home";
    const { title, description } = PAGE_METADATA[page];
    document.title = title;
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [isFoodPage, isBeveragesPage, isStoryPage]);
  useEffect(() => {
    const updateStoreStatus = () => setStoreStatus(getStoreStatus());
    const interval = window.setInterval(updateStoreStatus, 60_000);
    const stopUpdatingStoreStatus = listen(document, "visibilitychange", updateStoreStatus);
    return () => {
      window.clearInterval(interval);
      stopUpdatingStoreStatus();
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
    const stopSyncingLocation = listen(window, "popstate", syncLocation);
    return () => {
      stopSyncingLocation();
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
    const removeScrollListeners = [
      listen(window, "scroll", handle, { passive: true }),
      listen(window, "resize", measure),
      listen(reduced, "change", handle),
      listen(coarsePointer, "change", handle),
    ];
    measure();
    const stopObservingReveals = observeReveals();
    return () => {
      removeScrollListeners.forEach((remove) => remove());
      resizeObserver.disconnect();
      heroVisibility?.disconnect();
      cancelAnimationFrame(frame);
      stopObservingReveals();
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
    setCart((current) => mergeCartItem(current, item));
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
    setCart((current) => mergeCartItem(current, item));
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
    setCart((current) => pairItems.reduce(mergeCartItem, current));
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
            ? { ...i, quantity: Math.min(MAX_CART_QUANTITY, i.quantity + difference) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  const submitCheckout = async (e: FormEvent<HTMLFormElement>) => {
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

    const firstInvalidField = [
      { error: currentAddressErr, id: "checkout-address" },
      { error: currentNameErr, id: "order-name" },
      { error: currentTimeErr, id: checkoutPickupTime === CUSTOM_TIMING_LABEL ? "checkout-custom-time" : "checkout-timing" },
      { error: currentPhoneErr, id: "order-phone" },
    ].find(({ error }) => error);
    if (firstInvalidField) {
      document.getElementById(firstInvalidField.id)?.focus();
      return;
    }

    const customerName = checkoutName.trim();
    const customerPhone = checkoutPhone.trim();
    const resolvedTiming =
      checkoutPickupTime === CUSTOM_TIMING_LABEL
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
  };
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
                    const { p, bev, mod, title } = resolveCartItem(item);
                    const desc = item.isFood
                      ? item.size && item.size !== "Plate"
                        ? `Flavor: ${item.size}`
                        : "Chef's Comfort Kitchen Plate"
                      : bev
                        ? `${item.size || bev.defaultSize} · ${bev.hot ? "Hot" : "Over Iced"}`
                        : mod
                          ? "Barista Customization"
                          : cartItemSpecs(item)
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
                                disabled={item.quantity >= MAX_CART_QUANTITY}
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
                    onSubmit={submitCheckout}
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
                          {ORDER_TIMING_OPTIONS.map(({ label: timeOption }) => (
                            <label
                              key={timeOption}
                              className={checkoutPickupTime === timeOption ? "selected" : ""}
                            >
                              <input
                                type="radio"
                                name="checkoutPickupTime"
                                checked={checkoutPickupTime === timeOption}
                                disabled={timeOption !== CUSTOM_TIMING_LABEL && Boolean(validateOrderTiming(timeOption, ""))}
                                onChange={() => {
                                  setCheckoutPickupTime(timeOption);
                                  setCheckoutErrors((prev) => ({ ...prev, time: null }));
                                }}
                              />
                              <span>{timeOption}</span>
                            </label>
                          ))}
                        </div>
                        {checkoutPickupTime === CUSTOM_TIMING_LABEL && (
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
                                  time: validateOrderTiming(CUSTOM_TIMING_LABEL, e.target.value),
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
                        const { title } = resolveCartItem(item);
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
