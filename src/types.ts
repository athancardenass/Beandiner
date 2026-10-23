// ↓ TYPE: Product data shape
export type Product = {
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

// ↓ TYPE: Shopping cart item shape
export type CartItem = {
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

export type CheckoutPayment = "cash" | "gcash" | "maya";
