"use client";

import { useEffect, useState } from "react";
import { ApiError, getLeadOptions, postLead } from "@/lib/api";
import type { LeadOption } from "@/lib/types";
import { isUsPhone } from "@/lib/format";
import { trackLead } from "@/lib/fbq";

// Lead form with client-side validation (TZ §2.1 / §2.4). Fields per the
// updated §6 contract: name + phone + email + interest (dropdown) + message.
// Interest options come from GET /api/lead-options; the "Select Your Interest"
// placeholder (value "") is added here and is a valid submission.
// Sends slug values to POST /api/leads.

type Errors = Partial<Record<"name" | "phone" | "email", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(name: string, phone: string, email: string): Errors {
  const errors: Errors = {};
  if (name.trim().length < 2) {
    errors.name = "Please enter your name.";
  }
  const p = phone.trim();
  const e = email.trim();
  if (!p && !e) {
    // At least one contact method required — flag both fields.
    errors.phone = "Enter a phone number or email.";
    errors.email = "Enter a phone number or email.";
  } else {
    if (p && !isUsPhone(p)) errors.phone = "Enter a valid US phone number.";
    if (e && !EMAIL_RE.test(e)) errors.email = "Enter a valid email address.";
  }
  return errors;
}

export default function LeadForm({
  carId,
  carTitle,
}: {
  carId: number | null;
  carTitle?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState(""); // "" = Select Your Interest
  const [message, setMessage] = useState(
    carTitle ? `I'm interested in the ${carTitle}. Please contact me.` : "",
  );
  const [options, setOptions] = useState<LeadOption[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    "idle",
  );
  const [serverError, setServerError] = useState("");

  // Load Interest dropdown options. On failure the select still renders with
  // just the placeholder — interest is optional, so the form stays usable.
  useEffect(() => {
    let active = true;
    getLeadOptions()
      .then((res) => {
        if (active) setOptions(res.interests ?? []);
      })
      .catch(() => {
        /* keep placeholder-only select */
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const found = validate(name, phone, email);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    setServerError("");
    try {
      await postLead({
        car_id: carId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        interest, // slug value ("" if not selected)
        message: message.trim(),
      });
      setStatus("ok");
      trackLead(); // Meta Pixel "Lead" event on successful submission
      setName("");
      setPhone("");
      setEmail("");
      setInterest("");
      setMessage("");
      setTouched(false);
    } catch (err) {
      setStatus("error");
      setServerError(
        err instanceof ApiError
          ? "Could not send your request. Please try again."
          : "Network error. Please check your connection and try again.",
      );
    }
  }

  if (status === "ok") {
    return (
      <div className="panel" role="status">
        <div className="alert alert-ok" style={{ marginBottom: 14 }}>
          Got it — we&apos;ll be in touch with pricing and availability shortly,
          usually the same day.
        </div>
        <button className="btn" onClick={() => setStatus("idle")}>
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={handleSubmit} noValidate>
      <h3>Get your ePrice</h3>
      <p className="panel-sub">
        Send your info and we&apos;ll reply with pricing and availability — no
        account, no spam.
      </p>

      {status === "error" && (
        <div className="alert alert-err">{serverError}</div>
      )}

      <div className={`field ${touched && errors.name ? "invalid" : ""}`}>
        <label htmlFor="lead-name">Name</label>
        <input
          id="lead-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setErrors(validate(name, phone, email))}
          placeholder="John Smith"
          autoComplete="name"
        />
        {touched && errors.name && (
          <span className="err-text">{errors.name}</span>
        )}
      </div>

      <div className={`field ${touched && errors.phone ? "invalid" : ""}`}>
        <label htmlFor="lead-phone">Phone</label>
        <input
          id="lead-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setErrors(validate(name, phone, email))}
          placeholder="+1 (212) 555-0134"
          autoComplete="tel"
        />
        {touched && errors.phone && (
          <span className="err-text">{errors.phone}</span>
        )}
      </div>

      <div className={`field ${touched && errors.email ? "invalid" : ""}`}>
        <label htmlFor="lead-email">Email</label>
        <input
          id="lead-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setErrors(validate(name, phone, email))}
          placeholder="you@email.com"
          autoComplete="email"
        />
        {touched && errors.email && (
          <span className="err-text">{errors.email}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="lead-interest">What are you after?</label>
        <select
          id="lead-interest"
          name="interest"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        >
          <option value="">Select your interest</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="lead-message">Message (optional)</label>
        <textarea
          id="lead-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="A question, or a good time to reach you"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
