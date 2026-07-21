"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Navigation — the 4 menu items from TZ §1 (Cars → "Inventory").
const NAV = [
  { href: "/", label: "Inventory" },
  { href: "/contacts", label: "Contacts" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/team", label: "Team" },
];

const PHONE = "+1 (555) 123-4567";
const PHONE_HREF = "tel:+15551234567";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <span className="tb-hours">Mon–Sat 9:00–19:00 · Springfield, IL</span>
          <span className="tb-right">
            Sales <span className="sep">|</span>
            <a href={PHONE_HREF}>{PHONE}</a>
          </span>
        </div>
      </div>

      <header className="site-header">
        <div className="container bar">
          <Link href="/" className="brand-word" aria-label="USA Auto Sales — home" onClick={() => setOpen(false)}>
            USA<span className="accent">AUTO</span>SALES
          </Link>

          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>

          <nav className={`nav ${open ? "open" : ""}`}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a href={PHONE_HREF} className="callbtn">
              ☎ Call now
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}
