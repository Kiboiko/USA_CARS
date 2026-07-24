import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team",
  description: "The Pro AutoHub team — the people who inspect, price, and sell every car we list.",
};

// Honest role-based team section (no fabricated names/photos). When the client
// provides real staff names and photos, swap these cards for real profiles.
const ROLES = [
  {
    tag: "SA",
    role: "Sales",
    text: "Help you find the right vehicle, answer questions, and set up a test drive — no pressure.",
  },
  {
    tag: "FN",
    role: "Financing",
    text: "Walk you through payment options and pre-approval with clear, upfront numbers.",
  },
  {
    tag: "IN",
    role: "Inspection & Reconditioning",
    text: "Inspect and recondition every car before it goes on the lot, so it's ready to drive.",
  },
  {
    tag: "CC",
    role: "Customer Care",
    text: "Your first point of contact for any request — before, during, and after the sale.",
  },
];

export default function TeamPage() {
  return (
    <div className="container prose" style={{ maxWidth: "var(--maxw)" }}>
      <h1>Our Team</h1>
      <p style={{ maxWidth: 720 }}>
        We&apos;re a small, hands-on team in Davenport, FL. We inspect, prepare, and
        sell every car we list — and stay in touch after you drive off. Here&apos;s
        who you&apos;ll be working with.
      </p>

      <div className="team-grid">
        {ROLES.map((m) => (
          <div className="team-card" key={m.role}>
            <div className="avatar avatar-monogram" aria-hidden="true">
              {m.tag}
            </div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{m.role}</div>
            <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>{m.text}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 24, color: "var(--muted)" }}>
        Questions about a specific car? Call{" "}
        <a href="tel:+18507134077">+1 850-713-4077</a> or open any listing and send
        an inquiry — we usually reply the same day.
      </p>
    </div>
  );
}
