import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container cols">
        <div>
          <div className="col-title">Pro AutoHub</div>
          <p style={{ maxWidth: "34ch" }}>
            Quality pre-owned vehicles, inspected and reconditioned. Serving
            Davenport and the greater Central Florida area.
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
          <p>41239 US-27<br />Davenport, FL 33837</p>
          <p><a href="tel:+18507134077">+1 850-713-4077</a></p>
          <p><a href="mailto:sales@pro-autohub.com">sales@pro-autohub.com</a></p>
          <p>Mon–Sat, 9:00–19:00</p>
        </div>
      </div>
      <div className="container footer-legal">
        © {year} Pro AutoHub. All rights reserved. Prices exclude tax, title,
        and dealer fees. Monthly estimates are illustrative, not a financing offer.
      </div>
    </footer>
  );
}
