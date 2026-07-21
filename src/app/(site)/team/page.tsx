import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the USA Auto Sales team — the people who help you buy.",
};

const TEAM = [
  {
    name: "Michael Reed",
    role: "Owner & Sales Director",
    photo: "https://picsum.photos/seed/team-michael/200/200",
    bio: "20+ years in the US used-car market.",
  },
  {
    name: "Sarah Collins",
    role: "Senior Sales Consultant",
    photo: "https://picsum.photos/seed/team-sarah/200/200",
    bio: "Helps buyers find the right fit and financing.",
  },
  {
    name: "David Nguyen",
    role: "Service & Inspection Lead",
    photo: "https://picsum.photos/seed/team-david/200/200",
    bio: "Certified mechanic; inspects every car we list.",
  },
  {
    name: "Emily Carter",
    role: "Customer Care",
    photo: "https://picsum.photos/seed/team-emily/200/200",
    bio: "Your first point of contact for any request.",
  },
];

export default function TeamPage() {
  return (
    <div className="container prose" style={{ maxWidth: "var(--maxw)" }}>
      <h1>Our Team</h1>
      <p style={{ maxWidth: 700 }}>
        We're a small, dedicated team that inspects, prepares, and sells every car
        we list. Here are the people you'll be dealing with.
      </p>

      <div className="team-grid">
        {TEAM.map((m) => (
          <div className="team-card" key={m.name}>
            <img className="avatar" src={m.photo} alt={m.name} />
            <div style={{ fontWeight: 700, fontSize: 17 }}>{m.name}</div>
            <div className="role">{m.role}</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>{m.bio}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
