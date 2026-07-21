import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container state">
      <h1 style={{ fontSize: 40, margin: "0 0 8px", color: "var(--text)" }}>404</h1>
      <p>The page or car you're looking for doesn't exist.</p>
      <p style={{ marginTop: 16 }}>
        <Link href="/" className="btn btn-primary">
          Back to all cars
        </Link>
      </p>
    </div>
  );
}
