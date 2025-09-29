import nodemailer from 'nodemailer';

const transporterCache: { instance: nodemailer.Transporter | null } = { instance: null };

function resolveTransporter(): nodemailer.Transporter {
  if (transporterCache.instance) {
    return transporterCache.instance;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    throw new Error('Missing SMTP configuration environment variables.');
  }

  const port = Number(SMTP_PORT);

  if (Number.isNaN(port)) {
    throw new Error('Invalid SMTP_PORT value.');
  }

  transporterCache.instance = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporterCache.instance;
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const transporter = resolveTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Your verification code',
    text: `Your verification code is ${code}.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p>`,
  });
}
