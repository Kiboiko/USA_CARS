import CarCard from "@/components/CarCard";
import { getCarsServer } from "@/lib/server-api";

// Cars list = home page (TZ §1). Server-rendered for SEO; data from GET /api/cars.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let cars = [] as Awaited<ReturnType<typeof getCarsServer>>;
  let failed = false;
  try {
    cars = await getCarsServer();
  } catch {
    failed = true;
  }

  return (
    <div className="container">
      <section className="hero">
        <h1>Find your next car</h1>
        <p>
          Hand-picked used cars across the USA. Browse the inventory, check photos
          and specs, and request a test drive in a couple of clicks.
        </p>
      </section>

      {failed ? (
        <div className="state">
          Could not load the inventory right now. Please try again later.
        </div>
      ) : cars.length === 0 ? (
        <div className="state">No cars in the inventory yet. Check back soon.</div>
      ) : (
        <section className="grid" aria-label="Car inventory">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </section>
      )}
    </div>
  );
}
