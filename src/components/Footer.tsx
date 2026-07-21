import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container cols">
        <div style={{ maxWidth: "34ch" }}>
          <span className="plate" style={{ fontSize: 17 }}>
            <span className="bolt" aria-hidden="true" />
            USA <span className="tag">AUTO</span> SALES
            <span className="bolt" aria-hidden="true" />
          </span>
          <p style={{ marginTop: 12 }}>
            Every car on the lot is inspected, priced on the glass, and ready for a
            test drive.
          </p>
        </div>
        <div>
          <p className="col-title">Browse</p>
          <p><Link href="/">Inventory</Link></p>
          <p><Link href="/contacts">Contacts</Link></p>
          <p><Link href="/privacy">Privacy Policy</Link></p>
          <p><Link href="/team">Team</Link></p>
        </div>
        <div>
          <p className="col-title">Stop by</p>
          <p><a href="tel:+15551234567">+1 (555) 123-4567</a></p>
          <p><a href="mailto:sales@usa-auto.example">sales@usa-auto.example</a></p>
          <p>Mon–Sat, 9:00–19:00</p>
        </div>
      </div>
      <div className="container footer-legal">
        © {year} USA Auto Sales · Springfield, IL
      </div>
    </footer>
  );
}
