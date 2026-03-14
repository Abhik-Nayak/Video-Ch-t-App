import nodemailer from "nodemailer";

const createMailTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendMail = async ({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> => {
  const transporter = createMailTransporter();

  await transporter.sendMail({
    from: "Chat App",
    to,
    subject,
    text,
  });
};
