import Link from "next/link";
import type { CarListItem } from "@/lib/types";
import { estMonthly, formatMileage, formatPrice } from "@/lib/format";

// Dealer-style vehicle card: photo with badges, title, a specs strip,
// price + estimated monthly payment, and two CTAs.
export default function CarCard({ car }: { car: CarListItem }) {
  const title = `${car.year} ${car.make} ${car.model}`;
  const lowMiles = car.mileage > 0 && car.mileage < 25000;

  return (
    <article className="card">
      <Link href={`/cars/${car.id}`} className="thumb" aria-label={title}>
        {car.photo_cover ? (
          <img src={car.photo_cover} alt={title} loading="lazy" width={600} height={450} />
        ) : null}
        <div className="badge-row">
          <span className="badge">Used</span>
          {lowMiles && <span className="badge certified">Low miles</span>}
        </div>
      </Link>

      <div className="body">
        <Link href={`/cars/${car.id}`}>
          <div className="title">{title}</div>
        </Link>
        <div className="trim">Stock #{String(car.id).padStart(4, "0")}</div>

        <div className="veh-specs">
          <span className="s">
            Mileage <b>{formatMileage(car.mileage)}</b>
          </span>
          <span className="s">
            Year <b>{car.year}</b>
          </span>
        </div>

        <div className="price-box">
          <div>
            <div className="price-label">Our price</div>
            <div className="price-main">{formatPrice(car.price)}</div>
          </div>
          <div className="price-mo">
            <b>${estMonthly(car.price).toLocaleString("en-US")}/mo</b>
            est.*
          </div>
        </div>

        <div className="cta-row">
          <Link href={`/cars/${car.id}`} className="btn btn-sm">
            View details
          </Link>
          <Link href={`/cars/${car.id}#inquiry`} className="btn btn-deal btn-sm">
            Get ePrice
          </Link>
        </div>
      </div>
    </article>
  );
}
