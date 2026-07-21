"use client";

import { useState } from "react";
import { ApiError, postLead } from "@/lib/api";

// Lead form with client-side validation (TZ §2.1 / §2.4). Fields per the
// open question in §2.4 / §9: name + contact (phone or email) + message.
// Sends to POST /api/leads.

type Errors = Partial<Record<"name" | "contact", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\-\s\d]{7,}$/;

function validate(name: string, contact: string): Errors {
  const errors: Errors = {};
  if (name.trim().length < 2) {
    errors.name = "Please enter your name.";
  }
  const c = contact.trim();
  if (!c) {
    errors.contact = "Enter a phone number or email.";
  } else if (!EMAIL_RE.test(c) && !PHONE_RE.test(c)) {
    errors.contact = "Enter a valid phone number or email.";
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
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState(
    carTitle ? `I'm interested in the ${carTitle}. Please contact me.` : "",
  );
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    "idle",
  );
  const [serverError, setServerError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const found = validate(name, contact);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    setServerError("");
    try {
      await postLead({
        car_id: carId,
        name: name.trim(),
        contact: contact.trim(),
        message: message.trim(),
      });
      setStatus("ok");
      setName("");
      setContact("");
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
        <div className="alert alert-ok" style={{ marginBottom: 12 }}>
          Thank you! Your request has been sent. We'll contact you shortly.
        </div>
        <button className="btn" onClick={() => setStatus("idle")}>
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={handleSubmit} noValidate>
      <h3 style={{ marginTop: 0 }}>Request a call back</h3>

      {status === "error" && (
        <div className="alert alert-err">{serverError}</div>
      )}

      <div className={`field ${touched && errors.name ? "invalid" : ""}`}>
        <label htmlFor="lead-name">Name</label>
        <input
          id="lead-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setErrors(validate(name, contact))}
          placeholder="John Smith"
          autoComplete="name"
        />
        {touched && errors.name && (
          <span className="err-text">{errors.name}</span>
        )}
      </div>

      <div className={`field ${touched && errors.contact ? "invalid" : ""}`}>
        <label htmlFor="lead-contact">Phone or email</label>
        <input
          id="lead-contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          onBlur={() => setErrors(validate(name, contact))}
          placeholder="+1 (555) 123-4567 or you@email.com"
          autoComplete="tel"
        />
        {touched && errors.contact && (
          <span className="err-text">{errors.contact}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="lead-message">Message (optional)</label>
        <textarea
          id="lead-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your question or preferred time to call"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
