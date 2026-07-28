"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/fbq";

// Fires a Meta Pixel PageView on each client-side route change. The initial
// PageView is sent by the base pixel script (inlined in the root layout);
// Next.js App Router navigations don't reload the page, so we track them here.
export default function MetaPixel() {
  const pathname = usePathname();
  const firstLoad = useRef(true);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false; // base script already sent the initial PageView
      return;
    }
    trackPageView();
  }, [pathname]);

  return null;
}
