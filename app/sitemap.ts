import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getCarsServer } from "@/lib/server-api";

// Sitemap includes the static pages plus one entry per car (TZ §2.1 SEO).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/contacts`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/team`, changeFrequency: "monthly", priority: 0.4 },
  ];

  let carPages: MetadataRoute.Sitemap = [];
  try {
    const cars = await getCarsServer();
    carPages = cars.map((c) => ({
      url: `${SITE_URL}/cars/${c.id}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // If the API is unavailable at build/request time, still return the
    // static pages rather than failing the whole sitemap.
  }

  return [...staticPages, ...carPages];
}
