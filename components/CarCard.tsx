import Link from "next/link";
import type { CarListItem } from "@/lib/types";
import { carTitle, formatMileage, formatPrice } from "@/lib/format";

export default function CarCard({ car }: { car: CarListItem }) {
  return (
    <Link href={`/cars/${car.id}`} className="card">
      <div className="thumb">
        {/* Plain <img> keeps mocks host-agnostic; swap to next/image later. */}
        <img
          src={car.photo_cover}
          alt={carTitle(car)}
          loading="lazy"
          width={600}
          height={400}
        />
      </div>
      <div className="body">
        <div className="title">{carTitle(car)}</div>
        <div className="meta">{formatMileage(car.mileage)}</div>
        <div className="price">{formatPrice(car.price)}</div>
      </div>
    </Link>
  );
}
