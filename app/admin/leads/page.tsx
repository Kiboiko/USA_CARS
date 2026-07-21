"use client";

import { useEffect, useState } from "react";
import { adminGetLeads } from "@/lib/api";
import { useToken } from "@/lib/admin-auth";
import type { Lead } from "@/lib/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function AdminLeadsPage() {
  const { token, ready } = useToken();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !token) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        setLeads(await adminGetLeads(token));
      } catch {
        setError("Could not load leads.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, token]);

  return (
    <div>
      <h1 style={{ marginTop: 24, fontSize: 24 }}>Leads ({leads.length})</h1>

      {error && <div className="alert alert-err">{error}</div>}

      {loading ? (
        <div className="state">
          <div className="spinner" />
          Loading leads…
        </div>
      ) : leads.length === 0 ? (
        <div className="state">
          No leads yet. Submitted request forms will appear here.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Car</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.id}</td>
                  <td>{formatDate(lead.created_at)}</td>
                  <td>{lead.name}</td>
                  <td>{lead.contact}</td>
                  <td>
                    {lead.car_id ? (
                      <a href={`/cars/${lead.car_id}`} className="tag">
                        #{lead.car_id}
                      </a>
                    ) : (
                      <span className="tag">—</span>
                    )}
                  </td>
                  <td className="wrap">{lead.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
