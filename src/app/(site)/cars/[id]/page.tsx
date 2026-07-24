import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import LeadForm from "@/components/LeadForm";
import { getCarServer } from "@/lib/server-api";
import { carTitle, estMonthly, formatMileage, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const car = await getCarServer(id).catch(() => null);
  if (!car) return { title: "Car not found" };
  const title = carTitle(car);
  const description = `${title} — ${formatPrice(car.price)}, ${formatMileage(
    car.mileage,
  )}. ${car.description.slice(0, 140)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: car.photos.slice(0, 1),
    },
  };
}

export default async function CarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const car = await getCarServer(id).catch(() => null);
  if (!car) notFound();

  const title = carTitle(car);

  const stock = String(car.id).padStart(4, "0");

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">Inventory</Link> &nbsp;/&nbsp; Used {car.make} &nbsp;/&nbsp; {title}
      </nav>

      <div className="detail">
        <div>
          <Gallery photos={car.photos} alt={title} />

          <div style={{ marginTop: 24 }}>
            <h2 className="block-title">Vehicle overview</h2>
            <p className="desc">{car.description}</p>
          </div>

          <div style={{ marginTop: 24 }}>
            <h2 className="block-title">Specifications</h2>
            <div className="specs" style={{ borderRadius: "var(--radius)" }}>
              <div className="row">
                <span className="k">Make</span>
                <span className="v">{car.make}</span>
              </div>
              <div className="row">
                <span className="k">Model</span>
                <span className="v">{car.model}</span>
              </div>
              <div className="row">
                <span className="k">Year</span>
                <span className="v">{car.year}</span>
              </div>
              <div className="row">
                <span className="k">Mileage</span>
                <span className="v">{formatMileage(car.mileage)}</span>
              </div>
              <div className="row">
                <span className="k">Stock #</span>
                <span className="v">{stock}</span>
              </div>
              <div className="row">
                <span className="k">VIN</span>
                <span className="v">Available on request</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h1 className="vdp-title">{title}</h1>
          <p className="vdp-sub">
            Stock #{stock} · {formatMileage(car.mileage)} · Used
          </p>

          <div className="pricecard">
            <div className="pc-top">
              <div>
                <div className="price-label">Our price</div>
                <div className="pc-price">{formatPrice(car.price)}</div>
              </div>
              <div className="price-mo">
                <b>${estMonthly(car.price).toLocaleString("en-US")}/mo</b>
                est.*
              </div>
            </div>
            <div className="pc-cta">
              <a href="#inquiry" className="btn btn-deal btn-block">
                Get ePrice
              </a>
              <a href="#inquiry" className="btn btn-primary btn-block">
                Check availability
              </a>
              <a href="tel:+18507134077" className="btn btn-block">
                ☎ Call about this car
              </a>
            </div>
            <p className="pc-fine">
              *Estimated payment: 10% down, 7.9% APR, 72 mo. On approved credit;
              not a financing offer. Price excludes tax, title, and fees.
            </p>
          </div>

          <div id="inquiry">
            <LeadForm carId={car.id} carTitle={title} />
          </div>
        </div>
      </div>
    </div>
  );
}
