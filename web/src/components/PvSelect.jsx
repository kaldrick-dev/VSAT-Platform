import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./ui.jsx";

/**
 * Custom dropdown for the public site (listbox pattern). Replaces the native <select>.
 * options: [[value, label], ...]. Keyboard: arrows, Home/End, Enter/Space, Esc, type-ahead.
 */
export function PvSelect({ label, value, onChange, options, className = "" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const typed = useRef({ text: "", timer: 0 });
  const id = useId();
  const selectedIndex = Math.max(0, options.findIndex(([key]) => key === value));

  useEffect(() => {
    if (!open) return;
    const onDown = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, id]);

  const openList = () => { setActive(selectedIndex); setOpen(true); };
  const choose = (index) => { onChange(options[index][0]); setOpen(false); };

  function onKeyDown(event) {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); openList(); }
      return;
    }
    switch (event.key) {
      case "Escape": event.preventDefault(); setOpen(false); break;
      case "ArrowDown": event.preventDefault(); setActive((i) => Math.min(i + 1, last)); break;
      case "ArrowUp": event.preventDefault(); setActive((i) => Math.max(i - 1, 0)); break;
      case "Home": event.preventDefault(); setActive(0); break;
      case "End": event.preventDefault(); setActive(last); break;
      case "Enter": case " ": event.preventDefault(); choose(active); break;
      case "Tab": setOpen(false); break;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
          clearTimeout(typed.current.timer);
          typed.current.text += event.key.toLowerCase();
          typed.current.timer = setTimeout(() => { typed.current.text = ""; }, 600);
          const hit = options.findIndex(([, text]) => text.toLowerCase().startsWith(typed.current.text));
          if (hit >= 0) setActive(hit);
        }
    }
  }

  return (
    <div ref={rootRef} className={`pv-select ${className}`}>
      <span id={`${id}-label`} className="pv-select-label">{label}</span>
      <button
        type="button"
        role="combobox"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="pv-select-btn"
      >
        <span id={`${id}-value`}>{options[selectedIndex]?.[1]}</span>
        <Icon name="chevron" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="pv-select-list">
          {options.map(([key, text], index) => (
            <li
              key={key}
              id={`${id}-${index}`}
              role="option"
              aria-selected={key === value}
              data-active={index === active || undefined}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
            >
              {text}
              {key === value && <Icon name="check" className="size-4" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
