import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How USA Auto Sales collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="container prose">
      <h1>Privacy Policy</h1>
      <p style={{ color: "var(--muted)" }}>Last updated: {new Date().getFullYear()}</p>

      <p>
        This Privacy Policy explains how USA Auto Sales ("we", "us") collects and
        uses your personal information when you use our website and submit a
        request through our forms.
      </p>

      <h2>1. Information we collect</h2>
      <p>
        When you submit a request form, we collect the name and contact details
        (phone number or email) you provide, along with any message text and the
        car listing the request relates to.
      </p>

      <h2>2. How we use your information</h2>
      <p>
        We use your information solely to respond to your enquiry, arrange a test
        drive or call, and provide information about the vehicle you asked about.
      </p>

      <h2>3. Storage and sharing</h2>
      <p>
        Requests are stored in our internal system and may be forwarded to our
        sales team by email and recorded in our internal spreadsheet. We do not
        sell your personal data to third parties.
      </p>

      <h2>4. Data retention</h2>
      <p>
        We keep request data only for as long as needed to handle your enquiry and
        to comply with applicable legal requirements.
      </p>

      <h2>5. Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal
        data by contacting us at{" "}
        <a href="mailto:sales@usa-auto.example">sales@usa-auto.example</a>.
      </p>

      <h2>6. Contact</h2>
      <p>
        For any questions about this policy, email{" "}
        <a href="mailto:sales@usa-auto.example">sales@usa-auto.example</a>.
      </p>
    </div>
  );
}
