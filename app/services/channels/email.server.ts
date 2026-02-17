import nodemailer from "nodemailer";
import { env } from "~/lib/env.server";
import { logger } from "~/lib/logger.server";

// ─── Types ────────────────────────────────────────────────

export interface ChannelResult {
  externalId: string | null;
  status: "SENT" | "FAILED";
  error?: string;
}

// ─── Transport ───────────────────────────────────────────

let transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST) {
    return null;
  }

  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }

  return transport;
}

// ─── Public API ──────────────────────────────────────────

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
): Promise<ChannelResult> {
  const mailer = getTransport();

  if (!mailer) {
    logger.info({ to, subject }, "[Email Dev Mode] Would send email (SMTP_HOST not configured)");
    return { externalId: null, status: "SENT" };
  }

  try {
    const info = await mailer.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html: htmlBody,
    });

    logger.info({ to, messageId: info.messageId }, "Email sent");
    return { externalId: info.messageId ?? null, status: "SENT" };
  } catch (error: any) {
    logger.error({ to, error: error.message }, "Email send failed");
    return { externalId: null, status: "FAILED", error: error.message };
  }
}
