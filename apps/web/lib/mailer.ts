import "server-only";

import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.EMAIL_FROM ?? "UMKM MINI Studio <no-reply@example.com>";

if (!host || !user || !pass) {
  console.warn("[mailer] SMTP credentials are incomplete. OTP emails will fail until environment variables are set.");
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user && pass ? { user, pass } : undefined,
});

export async function sendOtpEmail(to: string, code: string) {
  const subject = "Kode OTP UMKM MINI Studio";
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; line-height: 1.5; color: #0b0f1a;">
      <h2 style="margin-bottom: 16px;">Kode OTP Anda</h2>
      <p>Gunakan kode berikut untuk masuk ke UMKM MINI Studio:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px;">${code}</p>
      <p>Kode berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.</p>
      <p style="margin-top: 24px;">Terima kasih,<br/>Tim UMKM MINI Studio</p>
    </div>
  `;
  const text = `Kode OTP Anda: ${code}\nKode berlaku selama 10 menit. Jangan bagikan kode ini.`;

  await transporter.sendMail({
    to,
    from,
    subject,
    html,
    text,
  });
}
