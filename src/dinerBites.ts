export type DinerBite = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number | null;
  tag: string;
  badge: string;
  sample?: boolean;
  options?: string[];
  optionLabel?: string;
};

export type FoodCategory = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  categoryImage: string;
  items: DinerBite[];
};

export const foodCategories: FoodCategory[] = [
  {
    "id": "croffles",
    "name": "Croffle (Croissant Waffle)",
    "subtitle": "FRESHLY PRESSED CROISSANT WAFFLES",
    "description": "Golden flaky butter croissants iron-pressed to order, finished with premium glazes and artisanal toppings.",
    "categoryImage": "./images/croffle-bean-diner.png",
    "items": [
      {
        "id": "plain-croffle",
        "name": "Plain",
        "subtitle": "CLASSIC BUTTER FLAKE",
        "description": "Pure butter croissant pressed golden and flaky with caramelized sugar crust.",
        "price": 90,
        "tag": "ORIGINAL",
        "badge": "CLASSIC"
      },
      {
        "id": "chocolate-croffle",
        "name": "Chocolate",
        "subtitle": "RICH BELGIAN DRIZZLE",
        "description": "Dark Belgian chocolate ganache drizzle with crispy cocoa crumbles.",
        "price": 120,
        "tag": "SWEET BITE",
        "badge": "BEST SELLER"
      },
      {
        "id": "white-choco-almond",
        "name": "White Chocolate Almond",
        "subtitle": "SILKY WHITE & NUTS",
        "description": "Creamy white chocolate glaze topped with roasted sliced California almonds.",
        "price": 140,
        "tag": "ARTISANAL",
        "badge": "POPULAR"
      },
      {
        "id": "matcha-croffle",
        "name": "Matcha",
        "subtitle": "CEREMONIAL GREEN TEA",
        "description": "Authentic Japanese ceremonial matcha glaze with toasted sesame finish.",
        "price": 130,
        "tag": "MATCHA CRAFT",
        "badge": "SPECIALTY"
      },
      {
        "id": "nutella-almond-croffle",
        "name": "Nutella Almond",
        "subtitle": "HAZELNUT CRUNCH",
        "description": "Rich Italian Nutella spread layered with crunchy roasted almonds.",
        "price": 140,
        "tag": "CROWD FAVORITE",
        "badge": "CHEF'S PICK"
      },
      {
        "id": "biscoff-caramel-croffle",
        "name": "Biscoff Caramel",
        "subtitle": "LOTUS CRUMBLE & CARAMEL",
        "description": "Warm Lotus Biscoff spread, crushed spiced cookie crumbs, and sea salt caramel swirl.",
        "price": 150,
        "tag": "SIGNATURE",
        "badge": "BEST SELLER"
      },
      {
        "id": "oreo-chocolate-croffle",
        "name": "Oreo Chocolate",
        "subtitle": "COOKIES & CREME",
        "description": "Cookies and cream crumbles over rich chocolate drizzle.",
        "price": 140,
        "tag": "SWEET CRUNCH",
        "badge": "POPULAR"
      },
      {
        "id": "pistachio-croffle",
        "name": "Pistachio",
        "subtitle": "MEDITERRANEAN NUT CR\u00c9ME",
        "description": "Roasted pistachio butter drizzle topped with crushed green pistachio nuts.",
        "price": 150,
        "tag": "PREMIUM",
        "badge": "NEW SPECIAL"
      }
    ]
  },
  {
    "id": "appetizers",
    "name": "Appetizer",
    "subtitle": "CRISPY BITES & SHARING PLATTERS",
    "description": "Chef-crafted chicken wings, loaded nachos, and savory comfort sides cooked fresh for the table.",
    "categoryImage": "./images/crispy-bites-sharing-platter.png",
    "items": [
      {
        "id": "quesadilla",
        "name": "Quesadilla (Beef / Chicken)",
        "subtitle": "CHOICE OF BEEF OR CHICKEN",
        "description": "Toasted flour tortilla packed with melted cheese and seasoned meat, served with salsa.",
        "price": 195,
        "tag": "MELTY COMFORT",
        "badge": "POPULAR",
        "options": ["Beef", "Chicken"],
        "optionLabel": "Choose filling"
      },
      {
        "id": "sweet-spicy-tofu",
        "name": "Sweet N' Spicy Tofu",
        "subtitle": "CRISPY TOFU BITES",
        "description": "Crispy fried tofu cubes tossed in sweet chili soy glaze with scallions and sesame.",
        "price": 160,
        "tag": "SAVORY SNACK",
        "badge": "CRISPY"
      },
      {
        "id": "chicken-nuggets",
        "name": "Chicken Nuggets",
        "subtitle": "HOMESTYLE BREADED",
        "description": "Golden all-white chicken breast nuggets fried crunchy with dipping sauce.",
        "price": 150,
        "tag": "FINGER FOOD",
        "badge": "CLASSIC"
      },
      {
        "id": "mexican-nachos",
        "name": "Mexican Nachos",
        "subtitle": "CHEF'S SHARING PLATTER",
        "description": "Stone-ground corn chips piled high with seasoned beef, melted queso, salsa, and jalape\u00f1os.",
        "price": 245,
        "tag": "PERFECT TO SHARE",
        "badge": "SHARING PLATTER"
      },
      {
        "id": "calamari",
        "name": "Calamari",
        "subtitle": "TENDER SQUID RINGS",
        "description": "Flash-fried seasoned squid rings served with garlic aioli and lemon wedge.",
        "price": 220,
        "tag": "SEAFOOD BITE",
        "badge": "POPULAR"
      },
      {
        "id": "onion-rings",
        "name": "Onion Rings",
        "subtitle": "CRUNCHY BATTERED",
        "description": "Jumbo sweet onion rings dredged in spiced batter, fried golden with BBQ dip.",
        "price": 195,
        "tag": "SIDE CRUNCH",
        "badge": "CRISPY"
      },
      {
        "id": "fish-chips",
        "name": "Fish & Chips",
        "subtitle": "GOLDEN BATTERED FISH",
        "description": "Crispy battered white fish fillets served with seasoned fries and tartar dip.",
        "price": 235,
        "tag": "DINER CLASSIC",
        "badge": "HOUSE SPECIAL"
      },
      {
        "id": "savory-fries",
        "name": "Savory Fries",
        "subtitle": "HERB & PAPRIKA SEASONED",
        "description": "Skin-on potato fries tossed in smoked paprika, garlic salt, and herbs.",
        "price": 170,
        "tag": "POTATO CRUNCH",
        "badge": "POPULAR"
      },
      {
        "id": "potato-feast",
        "name": "Potato Feast",
        "subtitle": "LOADED POTATO PLATTER",
        "description": "Generous loaded potato platter with melted cheese, bacon bits, and herb dips.",
        "price": 230,
        "tag": "SHARING FEAST",
        "badge": "SIGNATURE"
      },
      {
        "id": "potato-fries-flavored",
        "name": "Potato Fries (Cheese / BBQ / Sour Cream)",
        "subtitle": "CHOICE OF CHEESE, BBQ, OR SOUR CREAM",
        "description": "Freshly fried potato fries generously dusted in your choice of flavor seasoning.",
        "price": 160,
        "tag": "FLAVORED FRIES",
        "badge": "BEST VALUE",
        "options": ["Cheese", "BBQ", "Sour Cream"],
        "optionLabel": "Choose flavor seasoning"
      },
      {
        "id": "chicken-wings",
        "name": "Chicken Wings (Soy Garlic / Salted Egg / Sriracha / Buffalo / Yangnyeom)",
        "subtitle": "CHOICE OF 5 CHEF GLAZES",
        "description": "Crispy double-dredged chicken wings tossed in your choice of signature handcrafted sauce.",
        "price": 230,
        "tag": "DINER HERO",
        "badge": "BEST SELLER",
        "options": ["Soy Garlic", "Salted Egg", "Sriracha", "Buffalo", "Yangnyeom"],
        "optionLabel": "Choose signature glaze"
      }
    ]
  },
  {
    "id": "rice-plates",
    "name": "Rice Plate",
    "subtitle": "HEARTY DINER COMFORT MAINS",
    "description": "Filipino comfort staples and savory diner plates served hot with garlic or jasmine rice and egg.",
    "categoryImage": "./images/rice-plate-bean-diner.png",
    "items": [
      {
        "id": "bd-crispy-chicken",
        "name": "BD Crispy Chicken",
        "subtitle": "SIGNATURE FRIED CHICKEN",
        "description": "Crispy fried chicken leg quarter with rich savory country gravy and steaming garlic rice.",
        "price": 230,
        "tag": "HOUSE MAJESTY",
        "badge": "BEST SELLER"
      },
      {
        "id": "burger-steak",
        "name": "Burger Steak",
        "subtitle": "PURE BEEF PATTIES",
        "description": "Pan-seared ground beef patties smothered in rich mushroom pepper gravy with rice.",
        "price": 215,
        "tag": "DINER CLASSIC",
        "badge": "COMFORT"
      },
      {
        "id": "sweet-sour",
        "name": "Sweet & Sour (Fish / Chicken)",
        "subtitle": "CHOICE OF CRISPY FISH OR CHICKEN",
        "description": "Crispy bites wok-tossed in sweet and sour bell pepper pineapple reduction with rice.",
        "price": 195,
        "tag": "WOK COMFORT",
        "badge": "POPULAR",
        "options": ["Fish", "Chicken"],
        "optionLabel": "Choose protein"
      },
      {
        "id": "creamy-gravy-tenders",
        "name": "Creamy Gravy Tenders",
        "subtitle": "CRISPY BONELESS TENDERS",
        "description": "Golden fried chicken tenders over buttered garlic rice with house country gravy.",
        "price": 195,
        "tag": "STUDENT FAVORITE",
        "badge": "VALUE MEAL"
      },
      {
        "id": "beef-caldereta",
        "name": "Beef Caldereta",
        "subtitle": "SLOW-BRAISED BEEF BRISKET",
        "description": "Tender beef stewed low and slow in a rich spiced tomato liver gravy with potatoes.",
        "price": 230,
        "tag": "HERITAGE COMFORT",
        "badge": "HOUSE SPECIAL"
      },
      {
        "id": "fried-bangus-egg",
        "name": "Fried Bangus w/ Egg",
        "subtitle": "MARINATED MILKFISH BELLY",
        "description": "Crispy fried boneless milkfish belly served with sunny-side-up egg and garlic rice.",
        "price": 220,
        "tag": "TRADITIONAL",
        "badge": "LOCAL FAVORITE"
      },
      {
        "id": "beef-tapa-egg",
        "name": "Beef Tapa with w/ Egg",
        "subtitle": "MARINATED SWEET-SAVORY SIRLOIN",
        "description": "Tender cured beef tapa slices paired with sunny-side-up fried egg and sinangag.",
        "price": 220,
        "tag": "ALL-DAY DINER",
        "badge": "POPULAR"
      },
      {
        "id": "chicken-barbecue",
        "name": "Chicken Barbecue",
        "subtitle": "SWEET-SMOKY SKEWER GLAZE",
        "description": "Grilled chicken glazed in traditional sweet-savory Filipino barbecue marinade with rice.",
        "price": 230,
        "tag": "GRILLED FAVORITE",
        "badge": "NEW SPECIAL"
      }
    ]
  },
  {
    "id": "rice-bowls",
    "name": "Rice Bowl",
    "subtitle": "SAVORY SKILLET DONBURI BOWLS",
    "description": "Japanese-inspired donburi rice bowls and Asian comfort skillets packed with umami flavor.",
    "categoryImage": "./images/rice-bowl-donburi-bean-diner.png",
    "items": [
      {
        "id": "teriyaki-chicken-katsu",
        "name": "Teriyaki Chicken Katsu",
        "subtitle": "PANKO CRUSTED CUTLET",
        "description": "Crispy panko chicken cutlet with sweet teriyaki glaze and sesame over rice.",
        "price": 165,
        "tag": "STUDENT BUDGET",
        "badge": "BEST VALUE"
      },
      {
        "id": "korean-beef-mushroom",
        "name": "Korean Beef Mushroom",
        "subtitle": "SOY-GARLIC UMAMI SKILLET",
        "description": "Tender beef slices saut\u00e9ed with fresh button mushrooms in sweet garlic soy sauce.",
        "price": 195,
        "tag": "SAVORY SKILLET",
        "badge": "CHEF'S PICK"
      },
      {
        "id": "katsudon",
        "name": "Katsudon",
        "subtitle": "SIMMERED EGG & DASHI",
        "description": "Crispy chicken katsu simmered with eggs and sweet white onions in seasoned dashi.",
        "price": 195,
        "tag": "DONBURI CLASSIC",
        "badge": "POPULAR"
      },
      {
        "id": "garlic-parmesan-chicken-bowl",
        "name": "Garlic Parmesan Chicken",
        "subtitle": "ROASTED GARLIC BUTTER",
        "description": "Crispy chicken bites coated in roasted garlic butter and shaved aged Parmesan over rice.",
        "price": 220,
        "tag": "RICE BOWL",
        "badge": "SIGNATURE"
      }
    ]
  },
  {
    "id": "salads",
    "name": "Salad",
    "subtitle": "CRISP GREENS & CHEF DRESSINGS",
    "description": "Garden-fresh romaine lettuce, artisanal dressings, and protein-packed crunch.",
    "categoryImage": "./images/crisp-greens-salad-bean-diner.png",
    "items": [
      {
        "id": "chicken-caesar-salad",
        "name": "Chicken Caesar",
        "subtitle": "PARMESAN & HERB CROUTONS",
        "description": "Crisp romaine lettuce tossed in creamy garlic Caesar dressing, grilled chicken, and Parmesan.",
        "price": 230,
        "tag": "CLASSIC GREENS",
        "badge": "HEALTHY BITE"
      },
      {
        "id": "asian-salad",
        "name": "Asian Salad",
        "subtitle": "SESAME GINGER VINAIGRETTE",
        "description": "Fresh mixed greens, shredded carrots, crispy wonton strips, and toasted sesame dressing.",
        "price": 230,
        "tag": "CRUNCHY GREENS",
        "badge": "REFRESHING"
      }
    ]
  },
  {
    "id": "pastas",
    "name": "Pasta",
    "subtitle": "ARTISANAL CREAM, PESTO & WOK NOODLES",
    "description": "Hand-tossed pastas in rich cream sauces, fragrant sweet basil pestos, and savory wok noodles.",
    "categoryImage": "./images/optimized/pasta-beandiner.png",
    "items": [
      {
        "id": "chicken-alfredo-pasta",
        "name": "Chicken Alfredo",
        "subtitle": "CLASSIC PARMESAN CREAM",
        "description": "Fettuccine pasta in rich garlic heavy cream sauce with grilled chicken breast.",
        "price": 220,
        "tag": "CLASSIC PASTA",
        "badge": "BEST SELLER"
      },
      {
        "id": "truffle-mushroom-pasta",
        "name": "Truffle Mushroom",
        "subtitle": "WHITE TRUFFLE ESSENCE",
        "description": "Fettuccine pasta in decadent white truffle cream with saut\u00e9ed shiitake and button mushrooms.",
        "price": 230,
        "tag": "SIGNATURE",
        "badge": "CHEF'S PICK"
      },
      {
        "id": "buffalo-mac-cheese",
        "name": "Buffalo Mac N' Cheese",
        "subtitle": "BAKED FOUR-CHEESE SKILLET",
        "description": "Baked elbow macaroni in rich cheddar sauce topped with spicy buffalo chicken bites.",
        "price": 205,
        "tag": "CHEESY SKILLET",
        "badge": "HOT & CHEESY"
      },
      {
        "id": "pad-thai-noodles",
        "name": "Pad Thai",
        "subtitle": "TAMARIND RICE NOODLES",
        "description": "Stir-fried flat rice noodles with egg, tofu, bean sprouts, crushed peanuts, and lime.",
        "price": 205,
        "tag": "BANGKOK STYLE",
        "badge": "POPULAR"
      },
      {
        "id": "shrimp-red-pesto",
        "name": "Shrimp Red Pesto",
        "subtitle": "SUN-DRIED TOMATO PESTO",
        "description": "Pasta tossed in vibrant sun-dried red tomato pesto with tender saut\u00e9ed shrimp.",
        "price": 210,
        "tag": "SEAFOOD PASTA",
        "badge": "HOUSE SPECIAL"
      },
      {
        "id": "chicken-pesto-base",
        "name": "Chicken Pesto (Oil base / Cream base)",
        "subtitle": "CHOICE OF OIL BASE OR CREAM BASE",
        "description": "Fragrant Genovese sweet basil pesto with grilled chicken and aged shaved Parmesan.",
        "price": 230,
        "tag": "PESTO CRAFT",
        "badge": "POPULAR",
        "options": ["Oil base", "Cream base"],
        "optionLabel": "Choose pasta base"
      },
      {
        "id": "chow-mein",
        "name": "Chow Mein",
        "subtitle": "WOK-FRIED EGG NOODLES",
        "description": "Savory stir-fried egg noodles with crisp garden vegetables and tender chicken slices.",
        "price": 200,
        "tag": "SAVORY NOODLES",
        "badge": "COMFORT"
      },
      {
        "id": "charlie-chan-noodles",
        "name": "Charlie Chan",
        "subtitle": "SWEET, SPICY & PEANUT REDUCTION",
        "description": "Oriental stir-fried noodles with chicken, mushrooms, and spicy peanut chili sauce.",
        "price": 200,
        "tag": "SPICY CRAVING",
        "badge": "CROWD FAVORITE"
      }
    ]
  },
  {
    "id": "sandwiches",
    "name": "Sandwich (w/ seasoned fries)",
    "subtitle": "HANDCRAFTED WRAPS & TRIPLE-DECKER TOASTS",
    "description": "Served hot with a side of crispy seasoned diner fries.",
    "categoryImage": "./images/sandwich-fries-bean-diner.png",
    "items": [
      {
        "id": "chicken-caesar-wrap",
        "name": "Chicken Caesar Wrap",
        "subtitle": "SERVED W/ SEASONED FRIES",
        "description": "Grilled chicken, romaine lettuce, Parmesan, and Caesar dressing wrapped in warm tortilla.",
        "price": 230,
        "tag": "FRESH ROLL",
        "badge": "POPULAR"
      },
      {
        "id": "burger-wrap",
        "name": "Burger Wrap",
        "subtitle": "SERVED W/ SEASONED FRIES",
        "description": "Seasoned ground beef patty, melted cheese, pickles, and diner burger sauce in grilled wrap.",
        "price": 220,
        "tag": "HEARTY WRAP",
        "badge": "DINER SPECIAL"
      },
      {
        "id": "grilled-double-cheese",
        "name": "Grilled Double Cheese",
        "subtitle": "SERVED W/ SEASONED FRIES",
        "description": "Griddled sourdough packed with melted cheddar and stretchy mozzarella cheese.",
        "price": 170,
        "tag": "MELTY TOAST",
        "badge": "COMFORT"
      },
      {
        "id": "clubhouse-sandwich",
        "name": "Clubhouse",
        "subtitle": "SERVED W/ SEASONED FRIES",
        "description": "Triple-decker toasted bread with smoked ham, chicken salad, egg, cheese, and tomatoes.",
        "price": 230,
        "tag": "TRIPLE DECKER",
        "badge": "CLASSIC"
      }
    ]
  },
  {
    "id": "add-ons",
    "name": "Food Add-Ons",
    "subtitle": "EXTRA SIDES, RICE & HANDCRAFTED DIPS",
    "description": "Complement your meal with steaming rice, extra protein, or handcrafted dipping sauces.",
    "categoryImage": "./images/food-add-ons-bean-diner.png",
    "items": [
      {
        "id": "addon-rice",
        "name": "Rice",
        "subtitle": "STEAMED JASMINE RICE",
        "description": "Steaming hot cup of white jasmine rice.",
        "price": 35,
        "tag": "SIDE",
        "badge": "ADD-ON"
      },
      {
        "id": "addon-garlic-rice",
        "name": "Garlic Rice",
        "subtitle": "TOASTED GARLIC SINANGAG",
        "description": "Fragrant fried rice loaded with toasted golden garlic crisps.",
        "price": 45,
        "tag": "SIDE",
        "badge": "ADD-ON"
      },
      {
        "id": "addon-hash-brown",
        "name": "Hash Brown",
        "subtitle": "CRISPY POTATO PATTY",
        "description": "Golden fried shredded potato patty with crispy exterior.",
        "price": 45,
        "tag": "SIDE",
        "badge": "ADD-ON"
      },
      {
        "id": "addon-egg",
        "name": "Egg",
        "subtitle": "SUNNY SIDE UP OR SCRAMBLED",
        "description": "Fresh farm egg cooked to your preference.",
        "price": 35,
        "tag": "PROTEIN",
        "badge": "ADD-ON",
        "options": ["Sunny Side Up", "Scrambled"],
        "optionLabel": "Egg preparation style"
      },
      {
        "id": "addon-garlic-aioli",
        "name": "Garlic Aioli",
        "subtitle": "HOUSE DIPPING SAUCE",
        "description": "Creamy garlic mayonnaise dip with fresh herbs.",
        "price": 40,
        "tag": "SAUCE",
        "badge": "DIP"
      },
      {
        "id": "addon-sriracha",
        "name": "Sriracha",
        "subtitle": "SPICY CHILI SAUCE",
        "description": "Spicy tangy chili pepper sauce.",
        "price": 20,
        "tag": "SAUCE",
        "badge": "DIP"
      },
      {
        "id": "addon-sriracha-aioli",
        "name": "Sriracha Aioli",
        "subtitle": "CREAMY SPICY MAYO",
        "description": "Spicy sriracha blended with smooth creamy aioli.",
        "price": 40,
        "tag": "SAUCE",
        "badge": "DIP"
      },
      {
        "id": "addon-honey-bbq",
        "name": "Honey BBQ Sauce",
        "subtitle": "SWEET & SMOKY GLAZE",
        "description": "Rich sweet honey barbecue dipping sauce.",
        "price": 40,
        "tag": "SAUCE",
        "badge": "DIP"
      }
    ]
  }
];

export const dinerBites: DinerBite[] = foodCategories.flatMap((cat) => cat.items);
