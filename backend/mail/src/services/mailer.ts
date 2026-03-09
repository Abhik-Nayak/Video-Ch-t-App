import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

export const getTransporter = (): Transporter => {
  if (transporter) {
    return transporter;
  }

  const host = getRequiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return transporter;
};

export const sendMail = async (params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> => {
  const from = process.env.MAIL_FROM || "no-reply@example.com";
  const mailer = getTransporter();

  await mailer.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html
  });
};
