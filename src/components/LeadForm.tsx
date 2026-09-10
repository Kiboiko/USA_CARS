"use client";

import { useEffect, useState } from "react";
import { ApiError, getLeadOptions, postLead } from "@/lib/api";
import type { LeadOption } from "@/lib/types";
import { isUsPhone } from "@/lib/format";
import { trackLeadSubmission } from "@/lib/fbq";

// Lead form with client-side validation (TZ §2.1 / §2.4). Fields per the
// updated §6 contract: name + phone + email + interest (dropdown) + message.
// Interest options come from GET /api/lead-options; the "Select Your Interest"
// placeholder (value "") is added here and is a valid submission.
// Sends slug values to POST /api/leads.

type Errors = Partial<Record<"name" | "phone" | "email", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Every field here is required: the form stays locked until name, phone and
 * email are all filled in and well-formed. (The API itself is laxer — it
 * accepts a lead with just one contact method — but the site asks for both.)
 */
function validate(name: string, phone: string, email: string): Errors {
  const errors: Errors = {};
  const p = phone.trim();
  const e = email.trim();

  if (name.trim().length < 2) errors.name = "Please enter your name.";

  if (!p) errors.phone = "Enter your phone number.";
  else if (!isUsPhone(p)) errors.phone = "Enter a valid US phone number.";

  if (!e) errors.email = "Enter your email address.";
  else if (!EMAIL_RE.test(e)) errors.email = "Enter a valid email address.";

  return errors;
}

export default function LeadForm({
  carId,
  carTitle,
  carPrice,
}: {
  carId: number | null;
  carTitle?: string;
  carPrice?: number;
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
  // Which fields the visitor has already left, so an error is only shown for a
  // field they actually visited — the submit button can no longer be pressed
  // to reveal them all at once.
  const [touched, setTouched] = useState<Partial<Record<keyof Errors, boolean>>>({});
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

  /** Mark a field as visited and refresh the error list for it. */
  function blur(field: keyof Errors) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(name, phone, email));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, phone: true, email: true });
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
      // Meta Pixel "Lead" + "Purchase" with vehicle context and the car's price.
      // The contact details go with them as advanced matching — the pixel hashes
      // them with SHA-256 in the browser, so Meta never receives them in clear.
      trackLeadSubmission({
        carId,
        carTitle,
        value: carPrice,
        user: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      });
      setName("");
      setPhone("");
      setEmail("");
      setInterest("");
      setMessage("");
      setTouched({});
    } catch (err) {
      setStatus("error");
      setServerError(
        err instanceof ApiError
          ? "Could not send your request. Please try again."
          : "Network error. Please check your connection and try again.",
      );
    }
  }

  // Submit stays locked until name, phone and email are all present and valid.
  const incomplete = Object.keys(validate(name, phone, email)).length > 0;

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

      <div className={`field ${touched.name && errors.name ? "invalid" : ""}`}>
        <label htmlFor="lead-name">Name *</label>
        <input
          id="lead-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => blur("name")}
          placeholder="John Smith"
          autoComplete="name"
          required
        />
        {touched.name && errors.name && (
          <span className="err-text">{errors.name}</span>
        )}
      </div>

      <div className={`field ${touched.phone && errors.phone ? "invalid" : ""}`}>
        <label htmlFor="lead-phone">Phone *</label>
        <input
          id="lead-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => blur("phone")}
          placeholder="+1 (212) 555-0134"
          autoComplete="tel"
          required
        />
        {touched.phone && errors.phone && (
          <span className="err-text">{errors.phone}</span>
        )}
      </div>

      <div className={`field ${touched.email && errors.email ? "invalid" : ""}`}>
        <label htmlFor="lead-email">Email *</label>
        <input
          id="lead-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => blur("email")}
          placeholder="you@email.com"
          autoComplete="email"
          required
        />
        {touched.email && errors.email && (
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
        disabled={incomplete || status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send inquiry"}
      </button>

      {incomplete && status !== "sending" && (
        <p className="panel-sub" style={{ marginTop: 10, marginBottom: 0 }}>
          Fill in your name, phone and email to enable sending.
        </p>
      )}
    </form>
  );
}
