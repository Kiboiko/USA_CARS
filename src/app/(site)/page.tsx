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
        <p className="eyebrow">Used cars · nationwide · inspected</p>
        <h1 className="poster">
          Priced on the <span className="em">glass.</span>
        </h1>
        <p className="lede">
          Every car on the lot is inspected, honestly priced, and ready for a test
          drive. Find yours and start a conversation in a couple of clicks.
        </p>
      </section>

      <div className="roadline" aria-hidden="true" />

      {failed ? (
        <div className="state">
          We couldn&apos;t load the lot right now. Give it a moment and refresh.
        </div>
      ) : cars.length === 0 ? (
        <div className="state">The lot is empty right now — new arrivals soon.</div>
      ) : (
        <>
          <div className="section-head">
            <p className="eyebrow" style={{ margin: 0 }}>
              On the lot
            </p>
            <span className="count">
              {cars.length} {cars.length === 1 ? "car" : "cars"} in stock
            </span>
          </div>
          <section className="grid" aria-label="Car inventory">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
