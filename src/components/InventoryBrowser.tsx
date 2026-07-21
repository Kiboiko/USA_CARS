"use client";

import { useMemo, useState } from "react";
import type { CarListItem } from "@/lib/types";
import CarCard from "@/components/CarCard";

// Client-side inventory browser: filter rail (make / price / year / mileage) +
// sort toolbar + results grid. Mirrors how US dealership inventory pages work.
// Filtering happens in the browser over the full list from GET /api/cars.

type Sort = "price-asc" | "price-desc" | "year-desc" | "miles-asc";

const PRICE_OPTIONS = [15000, 20000, 25000, 30000, 40000, 50000];
const MILES_OPTIONS = [20000, 30000, 40000, 60000, 100000];

export default function InventoryBrowser({ cars }: { cars: CarListItem[] }) {
  const [makes, setMakes] = useState<Set<string>>(new Set());
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [yearMin, setYearMin] = useState<number | "">("");
  const [milesMax, setMilesMax] = useState<number | "">("");
  const [sort, setSort] = useState<Sort>("year-desc");
  const [openFilters, setOpenFilters] = useState(false);

  // Make list with counts, for the checkboxes.
  const makeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cars) m.set(c.make, (m.get(c.make) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [cars]);

  const years = useMemo(() => {
    const ys = [...new Set(cars.map((c) => c.year))].sort((a, b) => b - a);
    return ys;
  }, [cars]);

  const results = useMemo(() => {
    const filtered = cars.filter((c) => {
      if (makes.size > 0 && !makes.has(c.make)) return false;
      if (priceMax !== "" && c.price > priceMax) return false;
      if (yearMin !== "" && c.year < yearMin) return false;
      if (milesMax !== "" && c.mileage > milesMax) return false;
      return true;
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "miles-asc":
          return a.mileage - b.mileage;
        default:
          return b.year - a.year;
      }
    });
    return sorted;
  }, [cars, makes, priceMax, yearMin, milesMax, sort]);

  function toggleMake(make: string) {
    setMakes((prev) => {
      const next = new Set(prev);
      next.has(make) ? next.delete(make) : next.add(make);
      return next;
    });
  }

  const hasFilters = makes.size > 0 || priceMax !== "" || yearMin !== "" || milesMax !== "";
  function clearAll() {
    setMakes(new Set());
    setPriceMax("");
    setYearMin("");
    setMilesMax("");
  }

  return (
    <div className="container inv-layout">
      <aside className={`filters ${openFilters ? "open" : ""}`}>
        <div className="filters-head">
          <span className="ft">Filters</span>
          {hasFilters && (
            <button type="button" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>

        <div className="filter-group">
          <p className="filter-title">Make</p>
          {makeCounts.map(([make, count]) => (
            <label className="check" key={make}>
              <input
                type="checkbox"
                checked={makes.has(make)}
                onChange={() => toggleMake(make)}
              />
              {make}
              <span className="cnt">{count}</span>
            </label>
          ))}
        </div>

        <div className="filter-group">
          <p className="filter-title">Max price</p>
          <div className="range-row">
            <select
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : "")}
              aria-label="Maximum price"
            >
              <option value="">No max</option>
              {PRICE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  ${p.toLocaleString("en-US")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-group">
          <p className="filter-title">Year from</p>
          <div className="range-row">
            <select
              value={yearMin}
              onChange={(e) => setYearMin(e.target.value ? Number(e.target.value) : "")}
              aria-label="Minimum year"
            >
              <option value="">Any year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}+
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-group">
          <p className="filter-title">Max mileage</p>
          <div className="range-row">
            <select
              value={milesMax}
              onChange={(e) => setMilesMax(e.target.value ? Number(e.target.value) : "")}
              aria-label="Maximum mileage"
            >
              <option value="">No max</option>
              {MILES_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m.toLocaleString("en-US")} mi
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      <div>
        <div className="toolbar">
          <div className="results">
            <b>{results.length}</b> {results.length === 1 ? "vehicle" : "vehicles"}
            {hasFilters ? " match your filters" : " available"}
          </div>
          <button
            type="button"
            className="btn btn-sm filter-toggle"
            onClick={() => setOpenFilters((v) => !v)}
          >
            {openFilters ? "Hide filters" : "Filters"}
          </button>
          <div className="sort">
            <label htmlFor="sort">Sort</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="year-desc">Newest year</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="miles-asc">Lowest mileage</option>
            </select>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="state">
            No vehicles match your filters.{" "}
            <button type="button" className="btn btn-sm" onClick={clearAll} style={{ marginTop: 12 }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid">
            {results.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
