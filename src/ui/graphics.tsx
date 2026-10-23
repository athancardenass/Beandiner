import type { CSSProperties, MouseEvent } from "react";
import { image } from "../utils/presentation";

// ↓ ICON COMPONENT: SVG icon set (arrow, bag, close, menu, plus, minus, play, check)
export function Icon({
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
export function Logo({
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
export function Ingredient({
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
export function Sun({ className = "" }: { className?: string }) {
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
