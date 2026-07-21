"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearToken, useToken } from "@/lib/admin-auth";

const TABS = [
  { href: "/admin/cars", label: "Cars" },
  { href: "/admin/leads", label: "Leads" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, ready } = useToken();
  const isLogin = pathname === "/admin/login";

  // Redirect unauthenticated users to the login page.
  useEffect(() => {
    if (ready && !token && !isLogin) {
      router.replace("/admin/login");
    }
  }, [ready, token, isLogin, router]);

  if (isLogin) {
    return <div className="admin-shell">{children}</div>;
  }

  if (!ready || !token) {
    return (
      <div className="state">
        <div className="spinner" />
        Checking session…
      </div>
    );
  }

  function logout() {
    clearToken();
    router.replace("/admin/login");
  }

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div className="container bar">
          <div className="tabs">
            <Link href="/admin/cars" className="brand" style={{ fontSize: 16, marginRight: 12 }}>
              <span className="mark">◆</span> Admin
            </Link>
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={pathname.startsWith(t.href) ? "active" : ""}
              >
                {t.label}
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/" className="tag">View site ↗</Link>
            <button className="btn" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </div>
      <div className="container">{children}</div>
    </div>
  );
}
