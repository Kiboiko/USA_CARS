import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container state">
      <div className="big">404</div>
      <p>That car has left the lot — or the page never existed.</p>
      <p style={{ marginTop: 20 }}>
        <Link href="/" className="btn btn-primary">
          Back to the inventory
        </Link>
      </p>
    </div>
  );
}
