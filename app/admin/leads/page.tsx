"use client";

import { useEffect, useMemo, useState } from "react";
import { adminGetLeads, getLeadOptions } from "@/lib/api";
import { useToken } from "@/lib/admin-auth";
import type { Lead, LeadOption } from "@/lib/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function AdminLeadsPage() {
  const { token, ready } = useToken();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [options, setOptions] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Map interest slug -> human label for display; fall back to the raw slug.
  const interestLabel = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]));
    return (slug: string) => (slug ? map.get(slug) ?? slug : "—");
  }, [options]);

  useEffect(() => {
    if (!ready || !token) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [leadList, opts] = await Promise.all([
          adminGetLeads(token),
          getLeadOptions().catch(() => ({ interests: [] })),
        ]);
        setLeads(leadList);
        setOptions(opts.interests ?? []);
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
                <th>Phone</th>
                <th>Email</th>
                <th>Interest</th>
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
                  <td>
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`}>{lead.email}</a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{interestLabel(lead.interest)}</td>
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
