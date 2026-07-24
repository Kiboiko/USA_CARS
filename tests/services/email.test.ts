import { describe, it, expect, vi } from "vitest";
import {
  buildLeadEmail,
  sendLeadEmail,
  createSmtpTransport,
  createResendTransport,
  createMailTransport,
  type MailTransport,
} from "@/lib/services/email";
import type { EmailConfig } from "@/lib/config";
import type { Lead } from "@/lib/db/leads";
import type { Car } from "@/lib/db/cars";

const config: EmailConfig = {
  host: "smtp.titan.email",
  port: 465,
  secure: true,
  user: "box@site.com",
  password: "pw",
  from: "box@site.com",
  to: "owner@site.com",
};

const lead: Lead = {
  id: 1,
  car_id: 5,
  name: "Иван",
  phone: "+1 555",
  email: "ivan@x.io",
  interest: "buy_now",
  message: "интересует",
  created_at: "2026-07-21 10:00:00",
};

const car: Car = {
  id: 5,
  make: "Ford",
  model: "Mustang",
  year: 2019,
  price: 32900,
  mileage: 41000,
  description: "",
  photos: [],
  created_at: "",
  updated_at: "",
};

describe("email service", () => {
  it("builds a message with lead + car details", () => {
    const msg = buildLeadEmail(config, lead, car);
    expect(msg.from).toBe(config.from);
    expect(msg.to).toBe(config.to);
    expect(msg.subject).toContain("Ford Mustang");
    expect(msg.text).toContain("Иван");
    expect(msg.text).toContain("+1 555");
    expect(msg.text).toContain("ivan@x.io");
    expect(msg.text).toContain("Интерес: Buy Now");
    expect(msg.text).toContain("2019 Ford Mustang");
  });

  it("shows placeholders when phone/email/interest are empty", () => {
    const msg = buildLeadEmail(config, { ...lead, phone: "", email: "", interest: "" }, null);
    expect(msg.text).toContain("Телефон: —");
    expect(msg.text).toContain("Email: —");
    expect(msg.text).toContain("Интерес: —");
  });

  it("handles a lead without a car object but with car_id", () => {
    const msg = buildLeadEmail(config, lead, null);
    expect(msg.text).toContain("car #5");
    expect(msg.subject).toBe("Новая заявка");
  });

  it("handles a lead with no car at all", () => {
    const msg = buildLeadEmail(config, { ...lead, car_id: null, message: "" }, null);
    expect(msg.text).toContain("Машина: —");
    expect(msg.text).toContain("Сообщение: —");
  });

  it("sends via the transport and returns true", async () => {
    const transport: MailTransport = { sendMail: vi.fn().mockResolvedValue({ ok: true }) };
    const ok = await sendLeadEmail(transport, config, lead, car);
    expect(ok).toBe(true);
    expect(transport.sendMail).toHaveBeenCalledOnce();
  });

  it("returns false (never throws) when the transport fails", async () => {
    const transport: MailTransport = { sendMail: vi.fn().mockRejectedValue(new Error("smtp down")) };
    const ok = await sendLeadEmail(transport, config, lead, car);
    expect(ok).toBe(false);
  });

  it("createSmtpTransport builds a transport exposing sendMail", () => {
    // Constructing the transport does not open a connection (that happens on send),
    // so this is safe without a real SMTP server.
    const transport = createSmtpTransport(config);
    expect(typeof transport.sendMail).toBe("function");
  });

  it("createResendTransport POSTs to the Resend API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: "email_123" }), text: async () => "" });
    const transport = createResendTransport({ ...config, resendApiKey: "re_test" }, fetchMock as any);
    await transport.sendMail({ from: "a@b.io", to: "c@d.io", subject: "Hi", text: "body" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init as any).headers.authorization).toBe("Bearer re_test");
    expect(JSON.parse((init as any).body)).toEqual({
      from: "a@b.io",
      to: ["c@d.io"],
      subject: "Hi",
      text: "body",
    });
  });

  it("createResendTransport throws on a Resend API error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 401, text: async () => "unauthorized" });
    const transport = createResendTransport({ ...config, resendApiKey: "bad" }, fetchMock as any);
    await expect(
      transport.sendMail({ from: "a", to: "b", subject: "s", text: "t" }),
    ).rejects.toThrow(/Resend API error 401/);
  });

  it("createMailTransport routes to Resend when an API key is set", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}), text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);
    const transport = createMailTransport({ ...config, resendApiKey: "re_1" });
    await transport.sendMail({ from: "a", to: "b", subject: "s", text: "t" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.anything());
    vi.unstubAllGlobals();
  });
});
