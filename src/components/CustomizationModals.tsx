import { useState, type CSSProperties } from "react";
import type { DinerBite } from "../dinerBites";
import type { CartItem, Product } from "../types";
import { Icon } from "../ui/graphics";
import { Modal } from "../ui/Modal";
import { MAX_CART_QUANTITY } from "../utils/cart";
import { money, productImage } from "../utils/presentation";

const OAT_MILK_SURCHARGE = 35;
const ITEM_NOTE_MAX_LENGTH = 120;

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
export function ProductModal({
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
  const fixedTemperature = product.fixedTemperature ?? (isIcedDrink ? "Iced" : isHotDrink || product.hot ? "Hot" : undefined);
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
    (hasMilk && milk === "Oat" ? OAT_MILK_SURCHARGE : 0);

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
            options={sizeOptions.map((option) => ({
              value: option.size,
              label: option.size,
              extra:
                option.price > sizeOptions[0].price
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
              { value: "Oat", label: "Oat", extra: `+${money(OAT_MILK_SURCHARGE)}` },
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
            maxLength={ITEM_NOTE_MAX_LENGTH}
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
              onClick={() => setQuantity((q) => Math.min(MAX_CART_QUANTITY, q + 1))}
              aria-label="Increase quantity"
              disabled={quantity === MAX_CART_QUANTITY}
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

// ↓ DINER BITE CUSTOMIZE MODAL: Flavor / glaze / option selection dialog
export function BiteCustomizeModal({
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
            maxLength={ITEM_NOTE_MAX_LENGTH}
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
              onClick={() => setQuantity((q) => Math.min(MAX_CART_QUANTITY, q + 1))}
              disabled={quantity >= MAX_CART_QUANTITY}
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
