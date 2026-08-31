"use client";

import { useEffect, useRef } from "react";
import { trackViewContent } from "@/lib/fbq";

/**
 * Reports a car listing to the Meta Pixel as a "ViewContent", with the car's
 * id, title and price. Renders nothing — it exists so the price of every car
 * reaches Meta on the view, not only on the cars that produce a lead.
 */
export default function CarViewContent({
  carId,
  carTitle,
  price,
}: {
  carId: number;
  carTitle: string;
  price: number;
}) {
  // One event per car: React runs effects twice in development, and an App
  // Router navigation from one car to the next reuses this component.
  const sent = useRef<number | null>(null);

  useEffect(() => {
    if (sent.current === carId) return;
    sent.current = carId;
    trackViewContent({ carId, carTitle, value: price });
  }, [carId, carTitle, price]);

  return null;
}
