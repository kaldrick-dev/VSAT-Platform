import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* ── Icons ─────────────────────────────────────────────────────────── */

const ICONS = {
  map: <><path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Z" /><path d="M9 4v13M15 7v13" /></>,
  record: <><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  user: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.7-4 2.9-6 6.5-6s5.8 2 6.5 6" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  bell: <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" /><path d="M10 21h4" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.4" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  locate: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1 1M17.4 17.4l1 1M5.6 18.4l1-1M17.4 6.6l1-1" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  store: <><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5 12.5V20h14v-7.5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  flag: <><path d="M6 21V4" /><path d="M6 5h11l-2 4 2 4H6" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  logout: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />
};

export function Icon({ name, className = "size-4" }) {
  return (
    <svg
      className={`${className} shrink-0`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

/* ── Surfaces ──────────────────────────────────────────────────────── */

/** Flat section: no fill, no shadow — separation comes from hairlines and spacing. */
export function Card({ as: Tag = "div", className = "", ...props }) {
  return <Tag className={`border-t border-line ${className}`} {...props} />;
}

/** Solid raised surface, used only for things that float over other content. */
export function Float({ as: Tag = "div", className = "", ...props }) {
  return <Tag className={`rounded-[22px] bg-surface shadow-float ${className}`} {...props} />;
}

/** Small uppercase mono label used for table headers and eyebrows. */
export function Eyebrow({ className = "", ...props }) {
  return <span className={`font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint ${className}`} {...props} />;
}

/* ── Chips ─────────────────────────────────────────────────────────── */

const TONES = {
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
  idle: "bg-idle-soft text-idle"
};

export function Chip({ tone = "idle", className = "", children }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 font-mono text-[10.5px] font-medium uppercase leading-none tracking-[0.05em] ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export const SITE_STATUS = {
  available: { tone: "good", label: "Available" },
  allocated: { tone: "info", label: "Allocated" },
  inactive: { tone: "idle", label: "Inactive" }
};

export function StatusChip({ status }) {
  const { tone, label } = SITE_STATUS[status];
  return <Chip tone={tone}>{label}</Chip>;
}

/* ── Buttons ───────────────────────────────────────────────────────── */

const BUTTON_BASE =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition active:translate-y-px disabled:pointer-events-none disabled:opacity-40";
const BUTTON_VARIANTS = {
  primary: "bg-ink text-white hover:bg-accent",
  accent: "bg-lime text-ink hover:brightness-95",
  secondary: "text-ink shadow-[inset_0_0_0_1px_var(--c-ink)] hover:bg-ink hover:text-surface",
  ghost: "text-mute hover:bg-sunken hover:text-ink"
};
const BUTTON_SIZES = {
  sm: "h-8 px-3.5 text-[12.5px]",
  md: "h-10 px-5 text-[13.5px]",
  lg: "h-12 px-6 text-sm w-full"
};

export function Button({ variant = "primary", size = "md", to, className = "", ...props }) {
  const classes = `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;
  if (to) return <Link to={to} className={classes} {...props} />;
  return <button type="button" className={classes} {...props} />;
}

export function IconButton({ icon, label, className = "", badge, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`relative grid size-10 place-items-center rounded-full bg-surface text-ink shadow-[inset_0_0_0_1px_var(--c-line)] transition hover:bg-sunken ${className}`}
      {...props}
    >
      <Icon name={icon} className="size-[18px]" />
      {badge && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-bad" />}
    </button>
  );
}

/* ── Form fields ───────────────────────────────────────────────────── */

export const fieldClass =
  "h-10 w-full rounded-lg bg-surface px-3.5 text-[13.5px] text-ink ring-[0.5px] ring-ink/25 transition placeholder:text-faint focus:outline-none focus:ring-accent";

export function Field({ label, hint, children }) {
  return (
    <label className="grid gap-1.5">
      <Eyebrow>{label}</Eyebrow>
      {children}
      {hint && <span className="text-xs text-mute">{hint}</span>}
    </label>
  );
}

/**
 * Accessible custom dropdown (listbox pattern) replacing the native <select>.
 * options: [[value, label], …]
 */
export function Dropdown({ value, onChange, options, label, className = "", buttonClassName = "" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listId = useId();
  const selectedIndex = Math.max(0, options.findIndex(([key]) => key === value));

  useEffect(() => {
    if (!open) return;
    const onDown = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function openList() { setActive(selectedIndex); setOpen(true); }
  function choose(index) { onChange(options[index][0]); setOpen(false); }

  function onKeyDown(event) {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); openList(); }
      return;
    }
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
    else if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => Math.min(i + 1, last)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (event.key === "Home") { event.preventDefault(); setActive(0); }
    else if (event.key === "End") { event.preventDefault(); setActive(last); }
    else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(active); }
    else if (event.key === "Tab") setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-xl bg-surface px-3.5 text-left text-[13.5px] shadow-[inset_0_0_0_1px_var(--c-line)] transition hover:shadow-[inset_0_0_0_1px_var(--c-ink)] ${buttonClassName}`}
      >
        <span className="truncate">{options[selectedIndex]?.[1]}</span>
        <Icon name="chevron" className={`size-4 text-mute transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-64 min-w-[10rem] overflow-y-auto rounded-2xl bg-surface p-1.5 shadow-float"
        >
          {options.map(([key, text], index) => (
            <li
              key={key}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={key === value}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-[13.5px] ${
                index === active ? "bg-sunken" : ""
              } ${key === value ? "font-medium" : "text-mute"}`}
            >
              {text}
              {key === value && <Icon name="check" className="size-3.5 text-accent" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pill-style segmented control. */
export function Segmented({ options, value, onChange, label, className = "" }) {
  return (
    <div role="tablist" aria-label={label} className={`inline-flex rounded-full bg-sunken p-1 shadow-[inset_0_0_0_1px_var(--c-line)] ${className}`}>
      {options.map(([key, text, count]) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition ${
              active ? "bg-surface text-ink shadow-card" : "text-mute hover:text-ink"
            }`}
          >
            {text}
            {count !== undefined && <span className={`font-mono text-[10.5px] text-faint`}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Page furniture ────────────────────────────────────────────────── */

export function PageHeader({ title, description, actions }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pt-2">
      <div>
        <h1 className="brand-title text-[30px] font-semibold leading-tight tracking-[-0.025em]">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-mute">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

const DELTA_TONE = { up: "text-good", down: "text-bad", flat: "text-faint" };

/** Metrics on an open row separated by hairlines — no enclosing box. */
export function StatStrip({ items, className = "" }) {
  return (
    <div className={`grid divide-line border-y border-line sm:grid-flow-col sm:auto-cols-fr sm:divide-x max-sm:grid-cols-2 ${className}`}>
      {items.map(({ label, value, delta, tone = "flat" }) => (
        <div key={label} className="px-5 py-5 first:pl-0">
          <p className="text-[12.5px] text-mute">{label}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{value}</span>
            {delta && <span className={`text-xs font-medium tabular-nums ${DELTA_TONE[tone]}`}>{delta}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Circular progress with a centred figure — used for queue position. */
export function Ring({ value, size = 88, stroke = 6, children, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--c-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--c-accent)" strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">{children}</div>
    </div>
  );
}

/** Standard padded, centred content column for non-map pages. */
export function Page({ children, className = "" }) {
  return <div className={`mx-auto grid w-full max-w-[1180px] gap-7 px-4 pb-10 pt-6 sm:px-6 ${className}`}>{children}</div>;
}

export function EmptyState({ title, children }) {
  return (
    <div className="grid gap-1 px-6 py-14 text-center">
      <strong className="text-sm font-medium">{title}</strong>
      <span className="text-[13px] text-mute">{children}</span>
    </div>
  );
}
