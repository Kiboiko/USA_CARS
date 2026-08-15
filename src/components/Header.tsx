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

const PHONE = "+1 850-713-4077";
const PHONE_HREF = "tel:+18507134077";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <span className="tb-hours">Davenport, FL</span>
          <span className="tb-right">
            Sales <span className="sep">|</span>
            <a href={PHONE_HREF}>{PHONE}</a>
          </span>
        </div>
      </div>

      <header className="site-header">
        <div className="container bar">
          <Link href="/" className="brand-word" aria-label="Pro AutoHub — home" onClick={() => setOpen(false)}>
            PRO<span className="accent">AUTO</span>HUB
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
