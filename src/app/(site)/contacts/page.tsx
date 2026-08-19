import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts",
  description: "Get in touch with Pro AutoHub — phone, email, and address.",
};

const ADDRESS = "41239 US-27, Davenport, FL 33837";
// Keyless Google Maps embed — no API key or billing account needed.
/**
 * The map points at the Google Business listing by its CID rather than by a
 * text query, so the pin is labelled "Pro Auto Hub" instead of a bare street
 * number. A name+address query is not equivalent — Google resolves it to a
 * different spot a few miles away.
 *
 * `hl=en` pins the labels to English; Google otherwise localises them by the
 * visitor's IP, which put Cyrillic labels on this English-only site.
 */
const PLACE_CID = "8684769818177209222"; // maps.app.goo.gl/GrR8JwfjzWThJyuHA
const MAP_EMBED = `https://maps.google.com/maps?cid=${PLACE_CID}&z=17&hl=en&output=embed`;
const MAP_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`;

export default function ContactsPage() {
  return (
    <div className="container prose">
      <h1>Contacts</h1>
      <p>
        Have a question about a car or want to schedule a test drive? Reach out —
        we usually reply the same day.
      </p>

      <h2>Phone</h2>
      <p>
        <a href="tel:+18507134077">+1 850-713-4077</a>
      </p>

      <h2>Email</h2>
      <p>
        <a href="mailto:sales@pro-autohub.com">sales@pro-autohub.com</a>
      </p>

      <h2>Showroom</h2>
      <p>
        41239 US-27,
        <br />
        Davenport, FL 33837, USA
      </p>

      <div className="map-embed">
        <iframe
          src={MAP_EMBED}
          title={`Pro AutoHub showroom — ${ADDRESS}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p>
        <a href={MAP_DIRECTIONS} target="_blank" rel="noopener noreferrer">
          Get directions →
        </a>
      </p>

      <p style={{ marginTop: 24, color: "var(--muted)" }}>
        Prefer we call you? Open any car listing and use the request form — we'll
        get back to you shortly.
      </p>
    </div>
  );
}
