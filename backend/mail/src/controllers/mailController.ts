import { Request, Response } from "express";
import { sendMail } from "../services/mailer";

export const sendMailHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { to, subject, text, html } = req.body as {
      to?: string;
      subject?: string;
      text?: string;
      html?: string;
    };

    if (!to || !subject || !text) {
      return res.status(400).json({
        message: "to, subject, and text are required"
      });
    }

    await sendMail({ to, subject, text, html });

    return res.status(200).json({
      message: "Email sent successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send email",
      error: (error as Error).message
    });
  }
};
