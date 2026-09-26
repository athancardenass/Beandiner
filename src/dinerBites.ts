export type DinerBite = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number | null;
  tag: string;
  badge: string;
  sample?: boolean;
};

export const dinerBites: DinerBite[] = [
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
  {
    id: "garlic-parmesan-wings-idea",
    name: "Garlic Parmesan Wings",
    subtitle: "CRISPY WING FLAVOR IDEA",
    description:
      "Crispy wings tossed in garlic butter and finished with Parmesan and herbs.",
    price: null,
    tag: "WINGS IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
  {
    id: "korean-bbq-wings-idea",
    name: "Korean BBQ Wings",
    subtitle: "SWEET & SAVORY WING IDEA",
    description:
      "Crunchy wings coated in a sticky soy-garlic glaze with a gentle kick.",
    price: null,
    tag: "WINGS IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
  {
    id: "loaded-sisig-fries-idea",
    name: "Loaded Sisig Fries",
    subtitle: "SHARING BITE IDEA",
    description:
      "Golden fries layered with savory sisig-style toppings and creamy sauce.",
    price: null,
    tag: "TO SHARE IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
  {
    id: "chicken-tenders-idea",
    name: "Crispy Chicken Tenders",
    subtitle: "DIPPING BITE IDEA",
    description:
      "Crunchy chicken strips paired with a simple diner-style dipping sauce.",
    price: null,
    tag: "DINER BITE IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
  {
    id: "mozzarella-sticks-idea",
    name: "Mozzarella Sticks",
    subtitle: "CHEESY SNACK IDEA",
    description:
      "Golden crumb-coated cheese sticks with a warm tomato dip on the side.",
    price: null,
    tag: "DINER BITE IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
  {
    id: "beef-quesadilla-idea",
    name: "Beef & Cheese Quesadilla",
    subtitle: "SHARING PLATE IDEA",
    description:
      "Toasted tortilla wedges filled with seasoned beef and melted cheese.",
    price: null,
    tag: "TO SHARE IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
  {
    id: "buffalo-sliders-idea",
    name: "Buffalo Chicken Sliders",
    subtitle: "HANDHELD BITE IDEA",
    description:
      "Mini buns with crispy chicken, tangy buffalo sauce, and cool slaw.",
    price: null,
    tag: "DINER BITE IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
  {
    id: "creamy-mushroom-pasta-idea",
    name: "Creamy Mushroom Pasta",
    subtitle: "COMFORT PLATE IDEA",
    description:
      "Pasta folded through a creamy mushroom sauce with a savory finish.",
    price: null,
    tag: "COMFORT PLATE IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
  {
    id: "chicken-pesto-pasta-idea",
    name: "Chicken Pesto Pasta",
    subtitle: "COMFORT PLATE IDEA",
    description:
      "Pasta with basil pesto, tender chicken, and a bright Parmesan finish.",
    price: null,
    tag: "COMFORT PLATE IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
  {
    id: "bbq-chicken-rice-idea",
    name: "BBQ Chicken Rice Bowl",
    subtitle: "HEARTY BOWL IDEA",
    description:
      "Glazed chicken over warm rice with crisp vegetables and a smoky sauce.",
    price: null,
    tag: "COMFORT PLATE IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
  {
    id: "baked-mac-cheese-idea",
    name: "Baked Mac & Cheese",
    subtitle: "CHEESY COMFORT IDEA",
    description:
      "Creamy macaroni under a golden baked cheese topping for a cozy plate.",
    price: null,
    tag: "COMFORT PLATE IDEA",
    badge: "SAMPLE ITEM",
    sample: true,
  },
];
