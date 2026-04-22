"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Dashboard"  },
  { href: "/bookings",  label: "Bookings"   },
  { href: "/settings",  label: "Fee Config" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      <Link href="/dashboard" className="nav-brand">Lodgify Cash Flow</Link>
      <div className="nav-tabs">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`nav-tab${pathname.startsWith(t.href) ? " active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
