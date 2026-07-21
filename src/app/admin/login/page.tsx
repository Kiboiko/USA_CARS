"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, login } from "@/lib/api";
import { setToken } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token } = await login({ username, password });
      setToken(token);
      router.replace("/admin/cars");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Invalid username or password."
          : "Login failed. Please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="center-card">
      <form className="panel" onSubmit={handleSubmit}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Admin sign in</h3>

        {error && <div className="alert alert-err">{error}</div>}

        <div className="field">
          <label htmlFor="u">Username</label>
          <input
            id="u"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="p">Password</label>
          <input
            id="p"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 14, marginBottom: 0 }}>
          Seeded dev logins: <b>admin1</b> / <b>admin1</b> · <b>admin2</b> / <b>admin2</b>
        </p>
      </form>
    </div>
  );
}
