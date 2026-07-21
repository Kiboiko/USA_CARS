"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /admin → redirect to the cars management screen.
export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/cars");
  }, [router]);
  return (
    <div className="state">
      <div className="spinner" />
      Loading…
    </div>
  );
}
