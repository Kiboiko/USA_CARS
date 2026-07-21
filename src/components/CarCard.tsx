import Link from "next/link";
import type { CarListItem } from "@/lib/types";
import { formatMileage } from "@/lib/format";

export default function CarCard({ car }: { car: CarListItem }) {
  return (
    <Link href={`/cars/${car.id}`} className="card">
      <div className="thumb">
        {/* Plain <img> keeps hosts flexible; swap to next/image later. */}
        <img
          src={car.photo_cover}
          alt={`${car.make} ${car.model}`}
          loading="lazy"
          width={600}
          height={400}
        />
        <span className="year-tag">{car.year}</span>
      </div>
      <div className="body">
        <div className="title">
          {car.make} {car.model}
        </div>
        <div className="meta">{formatMileage(car.mileage)}</div>
        <div className="price">
          <span className="cur">$</span>
          {car.price.toLocaleString("en-US")}
        </div>
      </div>
    </Link>
  );
}
