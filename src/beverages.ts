export type BeverageItem = {
  id: string;
  name: string;
  prices: { [size: string]: number };
  defaultSize: string;
  type: string;
  hot?: boolean;
  description: string;
  badge?: string;
};

export type BeverageCategory = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  categoryImage?: string;
  items: BeverageItem[];
};

export type BeverageModifier = {
  id: string;
  name: string;
  price: number;
};

export const beverageCategories: BeverageCategory[] = [
  {
    "id": "hot-coffee",
    "name": "Hot Beverage - Coffee Base",
    "subtitle": "STEAMING FRESHLY EXTRACTED BREWS",
    "description": "Bold espresso extractions served steaming hot with silky textured milk.",
    "items": [
      {
        "id": "hot-americano",
        "name": "Americano",
        "prices": {
          "8oz": 90,
          "12oz": 110
        },
        "defaultSize": "8oz",
        "type": "Coffee",
        "hot": true,
        "description": "Bold espresso shots topped with hot mineral water.",
        "badge": "CLASSIC"
      },
      {
        "id": "hot-cafe-latte",
        "name": "Cafe Latte",
        "prices": {
          "8oz": 110,
          "12oz": 130
        },
        "defaultSize": "8oz",
        "type": "Coffee",
        "hot": true,
        "description": "Smooth espresso balanced with steamed milk and a light layer of microfoam.",
        "badge": "POPULAR"
      },
      {
        "id": "hot-cappuccino",
        "name": "Cappuccino",
        "prices": {
          "8oz": 110,
          "12oz": 130
        },
        "defaultSize": "8oz",
        "type": "Coffee",
        "hot": true,
        "description": "Equal parts rich espresso, silky steamed milk, and airy thick foam.",
        "badge": "FAVORITE"
      },
      {
        "id": "hot-mocha",
        "name": "Mocha",
        "prices": {
          "12oz": 150
        },
        "defaultSize": "12oz",
        "type": "Coffee",
        "hot": true,
        "description": "Espresso and dark Dutch chocolate blended with hot steamed milk.",
        "badge": "SWEET ROAST"
      },
      {
        "id": "hot-white-mocha",
        "name": "White Mocha",
        "prices": {
          "12oz": 150
        },
        "defaultSize": "12oz",
        "type": "Coffee",
        "hot": true,
        "description": "Rich espresso combined with decadent white chocolate and velvety milk.",
        "badge": "POPULAR"
      },
      {
        "id": "hot-caramel-macchiato",
        "name": "Caramel Macchiato",
        "prices": {
          "12oz": 170
        },
        "defaultSize": "12oz",
        "type": "Coffee",
        "hot": true,
        "description": "Steamed milk marked with bold espresso, vanilla, and caramel drizzle.",
        "badge": "SIGNATURE"
      },
      {
        "id": "hot-salted-caramel",
        "name": "Salted Caramel Macchiato",
        "prices": {
          "12oz": 170
        },
        "defaultSize": "12oz",
        "type": "Coffee",
        "hot": true,
        "description": "Sea salt caramel syrup layered with steamed milk and bold espresso float.",
        "badge": "HOUSE SPECIAL"
      },
      {
        "id": "hot-spanish-latte",
        "name": "Spanish Latte",
        "prices": {
          "12oz": 150
        },
        "defaultSize": "12oz",
        "type": "Coffee",
        "hot": true,
        "description": "Sweet condensed milk and hot steamed fresh milk pulled with double espresso.",
        "badge": "BEST SELLER"
      }
    ]
  },
  {
    "id": "hot-non-coffee",
    "name": "Hot Beverage - Hot Non-Coffee",
    "subtitle": "WARMING INFUSIONS & COMFORT CUPS",
    "description": "Cozy teas and rich soothing warm beverages made with natural botanicals.",
    "items": [
      {
        "id": "hot-matcha-latte",
        "name": "Matcha Latte",
        "prices": {
          "12oz": 170
        },
        "defaultSize": "12oz",
        "type": "Not coffee",
        "hot": true,
        "description": "Authentic Japanese green tea whisked hot with velvety steamed milk.",
        "badge": "CEREMONIAL"
      },
      {
        "id": "hot-chocolate",
        "name": "Hot Chocolate",
        "prices": {
          "12oz": 130
        },
        "defaultSize": "12oz",
        "type": "Not coffee",
        "hot": true,
        "description": "Decadent melted cocoa and warm fresh milk for the ultimate rainy day comfort.",
        "badge": "COMFORT"
      },
      {
        "id": "hot-chamomile-tea",
        "name": "Chamomile Tea",
        "prices": {
          "8oz": 65,
          "12oz": 80
        },
        "defaultSize": "8oz",
        "type": "Tea",
        "hot": true,
        "description": "Calming floral infusion of whole chamomile blossoms.",
        "badge": "HERBAL"
      },
      {
        "id": "hot-english-tea",
        "name": "English Tea",
        "prices": {
          "8oz": 65,
          "12oz": 80
        },
        "defaultSize": "8oz",
        "type": "Tea",
        "hot": true,
        "description": "Classic robust English breakfast black tea infusion.",
        "badge": "CLASSIC"
      },
      {
        "id": "hot-green-tea",
        "name": "Green Tea",
        "prices": {
          "8oz": 65,
          "12oz": 80
        },
        "defaultSize": "8oz",
        "type": "Tea",
        "hot": true,
        "description": "Antioxidant-rich gentle steamed green tea leaves.",
        "badge": "CLEAN"
      },
      {
        "id": "hot-earl-grey",
        "name": "Earl Grey",
        "prices": {
          "8oz": 65,
          "12oz": 80
        },
        "defaultSize": "8oz",
        "type": "Tea",
        "hot": true,
        "description": "Fragrant black tea scented with oil of natural bergamot citrus.",
        "badge": "FRAGRANT"
      },
      {
        "id": "hot-lemon-ginger",
        "name": "Lemon Ginger",
        "prices": {
          "8oz": 65,
          "12oz": 80
        },
        "defaultSize": "8oz",
        "type": "Tea",
        "hot": true,
        "description": "Zesty lemon and warming spicy ginger root infusion.",
        "badge": "SOOTHING"
      }
    ]
  },
  {
    "id": "over-iced-coffee",
    "name": "Over Iced - Coffee Base Latte",
    "subtitle": "CHILLED ESPRESSO FAVORITES",
    "description": "Double espresso pulled over chilled fresh milk and crisp ice cubes.",
    "items": [
      {
        "id": "iced-americano",
        "name": "Americano",
        "prices": {
          "16oz": 130,
          "22oz": 140
        },
        "defaultSize": "16oz",
        "type": "Coffee",
        "description": "Double shot espresso over cold water and dense ice.",
        "badge": "CLASSIC"
      },
      {
        "id": "iced-cafe-latte",
        "name": "Cafe Latte",
        "prices": {
          "16oz": 140,
          "22oz": 150
        },
        "defaultSize": "16oz",
        "type": "Coffee",
        "description": "Espresso and chilled fresh milk poured over ice.",
        "badge": "POPULAR"
      },
      {
        "id": "iced-mocha",
        "name": "Mocha",
        "prices": {
          "16oz": 160,
          "22oz": 180
        },
        "defaultSize": "16oz",
        "type": "Coffee",
        "description": "Dark Dutch chocolate and chilled espresso milk over ice.",
        "badge": "FAVORITE"
      },
      {
        "id": "iced-white-mocha",
        "name": "White Mocha",
        "prices": {
          "16oz": 180,
          "22oz": 190
        },
        "defaultSize": "16oz",
        "type": "Coffee",
        "description": "Sweet white chocolate ganache with iced espresso and milk.",
        "badge": "POPULAR"
      },
      {
        "id": "iced-caramel-macchiato",
        "name": "Caramel Macchiato",
        "prices": {
          "16oz": 180,
          "22oz": 190
        },
        "defaultSize": "16oz",
        "type": "Coffee",
        "description": "Vanilla-infused cold milk marked with espresso float and caramel drizzle.",
        "badge": "HOUSE SPECIAL"
      },
      {
        "id": "iced-salted-caramel",
        "name": "Salted Caramel Macchiato",
        "prices": {
          "16oz": 180,
          "22oz": 190
        },
        "defaultSize": "16oz",
        "type": "Coffee",
        "description": "Sea salt caramel syrup with chilled milk and espresso kick.",
        "badge": "FAVORITE"
      },
      {
        "id": "iced-spanish-latte",
        "name": "Spanish Latte",
        "prices": {
          "16oz": 160,
          "22oz": 170
        },
        "defaultSize": "16oz",
        "type": "Coffee",
        "description": "Signature crowd-favorite iced latte sweetened with condensed milk.",
        "badge": "BEST SELLER"
      },
      {
        "id": "iced-spanish-oat",
        "name": "Spanish Oat Latte",
        "prices": {
          "16oz": 185,
          "22oz": 195
        },
        "defaultSize": "16oz",
        "type": "Coffee",
        "description": "Spanish latte crafted with 100% creamy Oatside oatmilk.",
        "badge": "OATSIDE COLLAB"
      },
      {
        "id": "iced-toffee-oat",
        "name": "Toffee Oat Latte",
        "prices": {
          "16oz": 185,
          "22oz": 195
        },
        "defaultSize": "16oz",
        "type": "Coffee",
        "description": "Buttery English toffee notes blended with iced Oatside oatmilk and espresso.",
        "badge": "SIGNATURE"
      },
      {
        "id": "iced-pistachio-latte",
        "name": "Pistachio Latte",
        "prices": {
          "22oz": 200
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "Nutty roasted pistachio syrup with iced milk and double espresso.",
        "badge": "NEW SPECIAL"
      }
    ]
  },
  {
    "id": "over-iced-cloudy",
    "name": "Over Iced - Cloudy Coffee",
    "subtitle": "VELVETY COLD FOAM & SWEET CR\u00c8MES",
    "description": "Rich coffee drinks crowned with a thick, cloud-like cold cream topping.",
    "items": [
      {
        "id": "pistachio-creme",
        "name": "Pistachio Cr\u00e8me",
        "prices": {
          "22oz": 200
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "Iced coffee topped with decadent sweet pistachio cloud cream.",
        "badge": "SPECIALTY"
      },
      {
        "id": "sea-salt-creme",
        "name": "Sea Salt Cr\u00e8me",
        "prices": {
          "22oz": 195
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "Bold iced brew layered under fluffy, savory sea salt cold foam.",
        "badge": "BEST SELLER"
      },
      {
        "id": "white-mocha-creme",
        "name": "White Mocha Cr\u00e8me",
        "prices": {
          "22oz": 195
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "White chocolate iced latte topped with sweet vanilla cloud froth.",
        "badge": "SWEET CLOUD"
      },
      {
        "id": "biscoff-latte",
        "name": "Biscoff Latte",
        "prices": {
          "22oz": 195
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "Iced latte infused with Lotus Biscoff cookie spread and crushed biscuits.",
        "badge": "FAVORITE"
      },
      {
        "id": "chocolate-ash-mocha",
        "name": "Chocolate Ash Mocha",
        "prices": {
          "22oz": 195
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "Dark activated cocoa ash mocha with chilled milk and cold cream.",
        "badge": "HOUSE SPECIAL"
      }
    ]
  },
  {
    "id": "over-iced-matcha",
    "name": "Over Iced - Matcha Mania",
    "subtitle": "AUTHENTIC JAPANESE GREEN TEA",
    "description": "Pure ceremonial matcha whisked smooth over chilled milks and fruit purees.",
    "items": [
      {
        "id": "iced-matcha-latte",
        "name": "Matcha Latte",
        "prices": {
          "16oz": 170,
          "22oz": 180
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Ceremonial green tea whisked with silky chilled milk over ice.",
        "badge": "BEST SELLER"
      },
      {
        "id": "iced-matcha-oat",
        "name": "Matcha Oat Latte",
        "prices": {
          "16oz": 190,
          "22oz": 200
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Matcha latte crafted with rich, naturally sweet Oatside oatmilk.",
        "badge": "OATSIDE COLLAB"
      },
      {
        "id": "dirty-matcha",
        "name": "Dirty Matcha w/ Coffee",
        "prices": {
          "16oz": 180,
          "22oz": 190
        },
        "defaultSize": "16oz",
        "type": "Coffee",
        "description": "Matcha latte marked with a bold shot of dark roasted espresso.",
        "badge": "BARISTA CRAFT"
      },
      {
        "id": "banana-matcha",
        "name": "Banana Matcha",
        "prices": {
          "16oz": 180,
          "22oz": 190
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Sweet creamy banana fruit milk layered under vivid green matcha.",
        "badge": "FRUITY MATCH"
      },
      {
        "id": "sea-salt-matcha",
        "name": "Sea Salt Cr\u00e8me Matcha",
        "prices": {
          "16oz": 185,
          "22oz": 195
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Iced matcha latte crowned with savory whipped sea salt cream.",
        "badge": "HOUSE SPECIAL"
      },
      {
        "id": "strawberry-matcha",
        "name": "Strawberry Matcha",
        "prices": {
          "16oz": 180,
          "22oz": 190
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Real strawberry compote layered with cold milk and ceremonial matcha.",
        "badge": "CROWD FAVORITE"
      }
    ]
  },
  {
    "id": "over-iced-non-coffee",
    "name": "Over Iced - Non-Coffee Latte",
    "subtitle": "CREAMY FRUIT & CHOCOLATE MILKS",
    "description": "Comforting caffeine-free milk drinks crafted with real fruit purees and caramels.",
    "items": [
      {
        "id": "strawberry-milk",
        "name": "Strawberry Milk",
        "prices": {
          "16oz": 160,
          "22oz": 170
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Real strawberry puree layered with cold sweetened fresh milk.",
        "badge": "FRUITY"
      },
      {
        "id": "blueberry-milk",
        "name": "Blueberry Milk",
        "prices": {
          "16oz": 160,
          "22oz": 170
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Rich wild blueberry fruit reduction poured with velvety cold milk.",
        "badge": "POPULAR"
      },
      {
        "id": "milky-caramel",
        "name": "Milky Caramel",
        "prices": {
          "16oz": 160,
          "22oz": 170
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Golden buttery caramel swirled through chilled vanilla milk.",
        "badge": "SWEET SIP"
      },
      {
        "id": "milky-chocolate",
        "name": "Milky Chocolate",
        "prices": {
          "16oz": 160,
          "22oz": 170
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Rich Dutch cocoa ganache blended with creamy fresh milk over ice.",
        "badge": "CHOCO COMFORT"
      }
    ]
  },
  {
    "id": "over-iced-tea",
    "name": "Over Iced - Iced Tea",
    "subtitle": "NATURAL BOTANICAL FRUIT TEAS",
    "description": "Light, crisp, and revitalizing shaken iced teas brewed from natural botanicals.",
    "items": [
      {
        "id": "peach-mango-tea",
        "name": "Peach Mango Iced Tea",
        "prices": {
          "22oz": 165
        },
        "defaultSize": "22oz",
        "type": "Tea",
        "description": "Tropical peach and sweet mango black tea shaken with crushed ice.",
        "badge": "REFRESHING"
      },
      {
        "id": "raspberry-tea",
        "name": "Raspberry Iced Tea",
        "prices": {
          "22oz": 165
        },
        "defaultSize": "22oz",
        "type": "Tea",
        "description": "Tart and sweet red raspberry infusion shaken over ice.",
        "badge": "FRUITY"
      },
      {
        "id": "butterfly-pea-tea",
        "name": "Honey Lemon Butterfly Pea",
        "prices": {
          "22oz": 165
        },
        "defaultSize": "22oz",
        "type": "Tea",
        "description": "Vibrant violet butterfly pea tea with natural honey and fresh lemon juice.",
        "badge": "SIGNATURE"
      },
      {
        "id": "orange-ginger-tea",
        "name": "Orange Ginger",
        "prices": {
          "22oz": 165
        },
        "defaultSize": "22oz",
        "type": "Tea",
        "description": "Citrusy Valencia orange with gentle warming ginger kick over ice.",
        "badge": "ZINGY"
      }
    ]
  },
  {
    "id": "iced-blends-coffee",
    "name": "Iced Blends - Coffee Base",
    "subtitle": "ICE-CRUSHED BLENDED FRAPPES",
    "description": "Rich espresso frappes blended thick with ice and decadent dessert toppings.",
    "items": [
      {
        "id": "blend-latte",
        "name": "Latte",
        "prices": {
          "22oz": 170
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "Classic creamy espresso frappe blended smooth with ice.",
        "badge": "FRAPPE"
      },
      {
        "id": "blend-mocha-chip",
        "name": "Mocha Chip",
        "prices": {
          "22oz": 195
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "Chocolate espresso frappe blended with crunchy chocolate chips.",
        "badge": "POPULAR"
      },
      {
        "id": "blend-biscoff",
        "name": "Biscoff",
        "prices": {
          "22oz": 210
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "Lotus Biscoff cookie butter espresso blend with cookie crunch.",
        "badge": "BEST SELLER"
      },
      {
        "id": "blend-oreo",
        "name": "Oreo",
        "prices": {
          "22oz": 200
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "Crushed Oreo cookies blended with dark espresso and cream.",
        "badge": "FAVORITE"
      },
      {
        "id": "blend-double-dutch",
        "name": "Double Dutch",
        "prices": {
          "22oz": 200
        },
        "defaultSize": "22oz",
        "type": "Coffee",
        "description": "Double chocolate and vanilla bean frappe with chocolate chips and espresso.",
        "badge": "HOUSE SPECIAL"
      }
    ]
  },
  {
    "id": "iced-blends-non-coffee",
    "name": "Iced Blends - Non-Coffee",
    "subtitle": "CRUNCHY SWEET FRAPPES",
    "description": "Thick dessert frappes without caffeine, loaded with chocolates and cookies.",
    "items": [
      {
        "id": "blend-strawberry-oreo",
        "name": "Strawberry Oreo",
        "prices": {
          "22oz": 190
        },
        "defaultSize": "22oz",
        "type": "Not coffee",
        "description": "Strawberry puree blended with crunchy Oreo cookies and fresh milk.",
        "badge": "POPULAR"
      },
      {
        "id": "blend-choco-chips",
        "name": "Choco Chips",
        "prices": {
          "22oz": 190
        },
        "defaultSize": "22oz",
        "type": "Not coffee",
        "description": "Creamy Dutch chocolate frappe with chocolate chip crunches.",
        "badge": "CHOCO CRUNCH"
      },
      {
        "id": "blend-white-choco-chips",
        "name": "White Choco Chips",
        "prices": {
          "22oz": 190
        },
        "defaultSize": "22oz",
        "type": "Not coffee",
        "description": "Sweet vanilla cream frappe with white chocolate chips.",
        "badge": "SWEET SIP"
      },
      {
        "id": "blend-kalmado",
        "name": "Kalmado",
        "prices": {
          "22oz": 170
        },
        "defaultSize": "22oz",
        "type": "Not coffee",
        "description": "House signature soothing malt milk frappe with brown sugar swirl.",
        "badge": "SIGNATURE"
      },
      {
        "id": "blend-choco-pistachio",
        "name": "Choco Pistachio",
        "prices": {
          "22oz": 200
        },
        "defaultSize": "22oz",
        "type": "Not coffee",
        "description": "Dark chocolate frappe blended with rich Mediterranean pistachio nut paste.",
        "badge": "PREMIUM"
      }
    ]
  },
  {
    "id": "iced-blends-milkshake",
    "name": "Iced Blends - Milkshake",
    "subtitle": "THICK CREAMY SHAKES",
    "description": "Classic thick milkshakes churned with rich dairy cream and natural flavors.",
    "items": [
      {
        "id": "shake-strawberry",
        "name": "Strawberry",
        "prices": {
          "16oz": 175
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Real strawberry puree churned into a rich velvety pink milkshake.",
        "badge": "FRUITY"
      },
      {
        "id": "shake-chocolate",
        "name": "Chocolate",
        "prices": {
          "16oz": 165
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Thick Dutch cocoa milkshake with chocolate drizzle.",
        "badge": "CLASSIC"
      },
      {
        "id": "shake-biscoff",
        "name": "Biscoff",
        "prices": {
          "16oz": 195
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Lotus Biscoff cookie spread churned with rich vanilla cream shake.",
        "badge": "BEST SELLER"
      },
      {
        "id": "shake-oreo",
        "name": "Oreo",
        "prices": {
          "16oz": 180
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Cookies & cream shake blended thick with dark Oreo cookie pieces.",
        "badge": "POPULAR"
      },
      {
        "id": "shake-vanilla",
        "name": "Vanilla",
        "prices": {
          "16oz": 190
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Pure Madagascar vanilla bean milkshake with whipped topping.",
        "badge": "CLASSIC"
      },
      {
        "id": "shake-matcha",
        "name": "Matcha",
        "prices": {
          "16oz": 190
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Japanese ceremonial green tea blended with sweet creamy shake.",
        "badge": "SPECIALTY"
      },
      {
        "id": "shake-oreo-matcha",
        "name": "Oreo Matcha",
        "prices": {
          "16oz": 195
        },
        "defaultSize": "16oz",
        "type": "Not coffee",
        "description": "Matcha milkshake churned with crunchy crushed Oreo cookies.",
        "badge": "HOUSE SPECIAL"
      }
    ]
  }
];

export const beverageAddOns: BeverageModifier[] = [
  {
    "id": "addon-espresso",
    "name": "Espresso Shot",
    "price": 35
  },
  {
    "id": "addon-sea-salt-cream",
    "name": "Sea Salt Cream",
    "price": 35
  },
  {
    "id": "addon-whipped-cream",
    "name": "Whipped Cream",
    "price": 35
  },
  {
    "id": "addon-choco-sauce",
    "name": "Chocolate Sauce",
    "price": 20
  },
  {
    "id": "addon-white-choco-sauce",
    "name": "White Chocolate Sauce",
    "price": 20
  },
  {
    "id": "addon-caramel-sauce",
    "name": "Caramel Sauce",
    "price": 20
  },
  {
    "id": "addon-vanilla-syrup",
    "name": "Vanilla Syrup",
    "price": 20
  },
  {
    "id": "addon-caramel-syrup",
    "name": "Caramel Syrup",
    "price": 20
  },
  {
    "id": "addon-strawberry-syrup",
    "name": "Strawberry Syrup",
    "price": 20
  },
  {
    "id": "addon-milk",
    "name": "Milk",
    "price": 20
  },
  {
    "id": "addon-honey",
    "name": "Honey",
    "price": 20
  }
];

export const beverageSubs: BeverageModifier[] = [
  {
    "id": "sub-decaf",
    "name": "Decaf Shot",
    "price": 35
  },
  {
    "id": "sub-ceremonial-matcha",
    "name": "Ceremonial Grade Matcha",
    "price": 30
  },
  {
    "id": "sub-oatside",
    "name": "Oatside (Oatmilk)",
    "price": 40
  },
  {
    "id": "sub-soymilk",
    "name": "Soy Milk",
    "price": 30
  },
  {
    "id": "sub-nonfat",
    "name": "Non-Fat Milk",
    "price": 0
  },
  {
    "id": "sub-sugarfree",
    "name": "Sugar Free Syrup",
    "price": 0
  }
];

export const allBeverages: BeverageItem[] = beverageCategories.flatMap((c) => c.items);
