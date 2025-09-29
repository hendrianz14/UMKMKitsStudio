import nodemailer from 'nodemailer';

type MailerDeps = {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
};

let transporter: nodemailer.Transporter | null = null;

function ensureConfig(config: MailerDeps) {
  const { host, port, user, pass, from } = config;
  if (!host || !port || !user || !pass || !from) {
    throw new Error('SMTP configuration is incomplete. Please check environment variables.');
  }
  return { host, port, user, pass, from } as Required<MailerDeps>;
}

function getConfig(): Required<MailerDeps> {
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  return ensureConfig({
    host: process.env.SMTP_HOST,
    port,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM
  });
}

export function getMailer() {
  if (transporter) return transporter;
  const { host, port, user, pass } = getConfig();
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
  return transporter;
}

export async function sendOtpEmail(to: string, code: string) {
  const { from } = getConfig();
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#0f172a;color:#f8fafc;">
      <h2 style="margin-top:0;margin-bottom:16px;">Kode Verifikasi Anda</h2>
      <p>Gunakan kode berikut untuk masuk ke UMKM Kits Studio:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:24px 0;">${code}</p>
      <p>Kode ini berlaku selama 10 menit. Jika Anda tidak meminta kode ini, abaikan email ini.</p>
      <p style="margin-top:32px;">Tetap buka tab login dan masukkan kode di atas atau klik <a href="${appUrl}/otp" style="color:#60a5fa;">tautan ini</a>.</p>
    </div>
  `;

  await getMailer().sendMail({
    from,
    to,
    subject: `Kode verifikasi: ${code}`,
    text: `Kode verifikasi Anda adalah ${code}. Kode ini berlaku selama 10 menit.`,
    html
  });
}
