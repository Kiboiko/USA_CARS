import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts",
  description: "Get in touch with Pro AutoHub — phone, email, and address.",
};

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
        <a href="tel:+18507134077">+1 850-713-4077</a> — Mon–Sat, 9:00–19:00
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

      <p style={{ marginTop: 24, color: "var(--muted)" }}>
        Prefer we call you? Open any car listing and use the request form — we'll
        get back to you shortly.
      </p>
    </div>
  );
}
