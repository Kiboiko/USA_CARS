import InventoryBrowser from "@/components/InventoryBrowser";
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

  const startingAt =
    cars.length > 0 ? Math.min(...cars.map((c) => c.price)) : null;

  return (
    <>
      <section className="hero-search">
        <div className="container inner">
          <h1>Used cars for sale</h1>
          <p>
            Inspected, reconditioned, and priced to move. Browse our current
            inventory, filter by make and budget, and get an ePrice in minutes.
          </p>
          <div className="hero-stats">
            <span>
              <b>{cars.length}</b> vehicles in stock
            </span>
            {startingAt !== null && (
              <span>
                <b>${startingAt.toLocaleString("en-US")}</b> starting price
              </span>
            )}
            <span>
              <b>Davenport, FL</b> — 41239 US-27
            </span>
          </div>
        </div>
      </section>

      {failed ? (
        <div className="container" style={{ padding: "40px 20px" }}>
          <div className="state">
            We couldn&apos;t load the inventory right now. Please refresh in a moment.
          </div>
        </div>
      ) : (
        <InventoryBrowser cars={cars} />
      )}
    </>
  );
}
