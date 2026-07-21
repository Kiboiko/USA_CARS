import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts",
  description: "Get in touch with USA Auto Sales — phone, email, and address.",
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
        <a href="tel:+15551234567">+1 (555) 123-4567</a> — Mon–Sat, 9:00–19:00
      </p>

      <h2>Email</h2>
      <p>
        <a href="mailto:sales@usa-auto.example">sales@usa-auto.example</a>
      </p>

      <h2>Showroom</h2>
      <p>
        1200 Auto Plaza Dr,
        <br />
        Springfield, IL 62704, USA
      </p>

      <p style={{ marginTop: 24, color: "var(--muted)" }}>
        Prefer we call you? Open any car listing and use the request form — we'll
        get back to you shortly.
      </p>
    </div>
  );
}
