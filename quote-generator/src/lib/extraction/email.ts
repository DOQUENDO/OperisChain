/**
 * OperisChain — Email Parser
 *
 * Wrapper around mailparser for extracting content from
 * forwarded carrier rate emails (.eml files or raw text).
 */

import { simpleParser, type ParsedMail } from "mailparser";

export interface ParsedEmail {
  subject: string;
  from: string;
  to: string;
  date: Date | null;
  textBody: string;
  htmlBody: string;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

/**
 * Parse an email from raw MIME content or .eml file buffer.
 */
export async function parseEmail(
  source: string | Buffer,
): Promise<ParsedEmail> {
  const parsed: ParsedMail = await simpleParser(source);

  const attachments: EmailAttachment[] = (parsed.attachments || []).map(
    (att) => ({
      filename: att.filename || "unnamed",
      contentType: att.contentType,
      size: att.size,
      content: att.content,
    }),
  );

  return {
    subject: parsed.subject || "",
    from: parsed.from?.text || "",
    to: parsed.to
      ? Array.isArray(parsed.to)
        ? parsed.to.map((t) => t.text).join(", ")
        : parsed.to.text
      : "",
    date: parsed.date || null,
    textBody: parsed.text || "",
    htmlBody: parsed.html || "",
    attachments,
  };
}

/**
 * Parse plain text email content (when receiving forwarded text, not .eml).
 * This is the most common case — operators forward or paste email text.
 */
export function parseEmailText(text: string): ParsedEmail {
  // Try to extract structured info from plain text forwarded emails
  const subjectMatch = text.match(/Subject:\s*(.+)/i);
  const fromMatch = text.match(/From:\s*(.+)/i);
  const dateMatch = text.match(/Date:\s*(.+)/i);

  return {
    subject: subjectMatch?.[1]?.trim() || "",
    from: fromMatch?.[1]?.trim() || "",
    to: "",
    date: dateMatch?.[1] ? new Date(dateMatch[1]) : null,
    textBody: text,
    htmlBody: "",
    attachments: [],
  };
}
