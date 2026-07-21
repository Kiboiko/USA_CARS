import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import LeadForm from "@/components/LeadForm";
import { getCarServer } from "@/lib/server-api";
import { carTitle, formatMileage, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const car = await getCarServer(params.id).catch(() => null);
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
  params: { id: string };
}) {
  const car = await getCarServer(params.id).catch(() => null);
  if (!car) notFound();

  const title = carTitle(car);

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">Cars</Link> / {title}
      </nav>

      <div className="detail">
        <div>
          <Gallery photos={car.photos} alt={title} />
          <div className="panel" style={{ marginTop: 20 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>Description</h2>
            <p className="desc">{car.description}</p>
          </div>
        </div>

        <div>
          <h1>{title}</h1>
          <div className="price-lg">{formatPrice(car.price)}</div>

          <div className="specs">
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
          </div>

          <LeadForm carId={car.id} carTitle={title} />
        </div>
      </div>
    </div>
  );
}
