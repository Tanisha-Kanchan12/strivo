import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

export async function sendFeedbackNotificationEmail(params: {
  userName: string;
  userEmail: string;
  feedbackType: string;
  message: string;
  timestamp: string;
  screenshotUrl?: string | null;
}) {
  const ownerEmail = process.env.FEEDBACK_OWNER_EMAIL;
  if (!ownerEmail) {
    console.warn("FEEDBACK_OWNER_EMAIL not set; skipping feedback email");
    return;
  }

  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY not set; skipping feedback email");
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "Strivo <onboarding@resend.dev>";

  await client.emails.send({
    from,
    to: ownerEmail,
    subject: `[Strivo Feedback] ${params.feedbackType}`,
    html: `
      <h2>New feedback from Strivo</h2>
      <p><strong>From:</strong> ${params.userName} (${params.userEmail})</p>
      <p><strong>Type:</strong> ${params.feedbackType}</p>
      <p><strong>Time:</strong> ${params.timestamp}</p>
      <p><strong>Message:</strong></p>
      <p>${params.message.replace(/\n/g, "<br>")}</p>
      ${params.screenshotUrl ? `<p><strong>Screenshot:</strong> <a href="${params.screenshotUrl}">View</a></p>` : ""}
    `,
  });
}
