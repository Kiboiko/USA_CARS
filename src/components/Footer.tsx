import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container cols">
        <div>
          <div className="col-title">USA Auto Sales</div>
          <p style={{ maxWidth: "34ch" }}>
            Quality pre-owned vehicles, inspected and reconditioned. Serving
            Springfield and the greater Illinois area.
          </p>
        </div>
        <div>
          <div className="col-title">Shop</div>
          <p><Link href="/">Used inventory</Link></p>
          <p><Link href="/">Get an ePrice</Link></p>
          <p><Link href="/team">Meet the team</Link></p>
        </div>
        <div>
          <div className="col-title">Company</div>
          <p><Link href="/contacts">Contacts</Link></p>
          <p><Link href="/privacy">Privacy Policy</Link></p>
          <p><Link href="/team">Team</Link></p>
        </div>
        <div>
          <div className="col-title">Visit us</div>
          <p>1200 Auto Plaza Dr<br />Springfield, IL 62704</p>
          <p><a href="tel:+15551234567">+1 (555) 123-4567</a></p>
          <p><a href="mailto:sales@usa-auto.example">sales@usa-auto.example</a></p>
          <p>Mon–Sat, 9:00–19:00</p>
        </div>
      </div>
      <div className="container footer-legal">
        © {year} USA Auto Sales. All rights reserved. Prices exclude tax, title,
        and dealer fees. Monthly estimates are illustrative, not a financing offer.
      </div>
    </footer>
  );
}
