import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container cols">
        <div>
          <div className="brand" style={{ fontSize: 18 }}>
            <span className="mark">◆</span> USA Auto Sales
          </div>
          <p style={{ marginTop: 8, maxWidth: "36ch" }}>
            Quality used cars across the USA. Contact us to schedule a test drive.
          </p>
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>Pages</p>
          <p><Link href="/">Cars</Link></p>
          <p><Link href="/contacts">Contacts</Link></p>
          <p><Link href="/privacy">Privacy Policy</Link></p>
          <p><Link href="/team">Team</Link></p>
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>Contact</p>
          <p><a href="tel:+15551234567">+1 (555) 123-4567</a></p>
          <p><a href="mailto:sales@usa-auto.example">sales@usa-auto.example</a></p>
          <p>Mon–Sat, 9:00–19:00</p>
        </div>
      </div>
      <div className="container" style={{ paddingBottom: 24 }}>
        © {year} USA Auto Sales. All rights reserved.
      </div>
    </footer>
  );
}
