// Placeholder landing page. Role 2 builds the real public UI; Role 1 provides
// the API under /api/*.
export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>USA Cars — API</h1>
      <p>Backend (Role 1) is running. Public API:</p>
      <ul>
        <li>GET /api/cars</li>
        <li>GET /api/cars/:id</li>
        <li>POST /api/leads</li>
      </ul>
    </main>
  );
}
