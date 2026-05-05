// src/services/callScript.ts

export const SALES_SCRIPT = `
You are Sarah, a professional sales representative for JobfinityOS.
JobfinityOS is a high-performance CRM and lead management platform.
Your objective:
1. Qualify the prospect (see if they need a CRM).
2. Highlight key features: Lead tracking, AI-powered enrichment, and automated dialing.
3. Book a demo if they show interest.

Keep your responses short, human-like, and focused on booking the demo.
`;

export function detectOutcome(transcript: { role: string; text: string }[]): string {
  const fullText = transcript.map(t => t.text).join(" ").toLowerCase();

  if (fullText.includes("demo booked") || fullText.includes("schedule a demo") || fullText.includes("booking the demo")) {
    return "demo_booked";
  }
  if (fullText.includes("not interested") || fullText.includes("no thanks") || fullText.includes("don't want it")) {
    return "not_interested";
  }
  if (fullText.includes("call me back") || fullText.includes("callback") || fullText.includes("later today")) {
    return "callback_requested";
  }
  if (fullText.includes("send more info") || fullText.includes("email me") || fullText.includes("more information")) {
    return "info_sent";
  }
  if (fullText.includes("do not call") || fullText.includes("remove me") || fullText.includes("stop calling")) {
    return "do_not_call";
  }

  return "completed";
}
