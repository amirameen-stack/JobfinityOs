import cron from "node-cron";
import twilio from "twilio";
import { supabaseAdmin } from "../config/supabase";
import { LeadModel } from "../models/lead.model";
import { CallModel } from "../models/call.model";
import { env } from "../config/env";
import { detectOutcome } from "./callScript"; 
import { WebSocketServer } from "ws";

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

let wss: WebSocketServer | null = null;
export const setSchedulerWss = (instance: WebSocketServer) => { wss = instance; };

const broadcastScheduler = (payload: object) => {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
};

// ── get all user IDs that have leads to call ──────────────────────────────────
async function getActiveUserIds(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("user_id")
    .in("status", ["newLeads", "potential"])
    .eq("auto_call_excluded", false)
    .lt("call_attempts", 3);

  if (error) return [];
  const unique = [...new Set(data?.map(r => r.user_id) ?? [])];
  return unique;
}

// ── fire calls for a single user ──────────────────────────────────────────────
export async function runDailyCallsForUser(userId: string) {
  const limit = parseInt(env.DAILY_CALL_LIMIT || "35", 10);
  const leads = await LeadModel.getLeadsForAutoCall(userId, limit);

  if (leads.length === 0) {
    console.log(`[scheduler] No leads to call for user ${userId}`);
    return;
  }

  console.log(`[scheduler] Firing ${leads.length} calls for user ${userId}`);

  broadcastScheduler({
    type: "SCHEDULER_STARTED",
    user_id: userId,
    total: leads.length,
    time: new Date().toLocaleString("en-GB", { timeZone: "Europe/London" }),
  });

  // stagger calls 30s apart to avoid Twilio rate limits
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    setTimeout(async () => {
      try {
        if (!lead.phone) {
          console.log(`[scheduler] Skipping ${lead.company_name} — no phone`);
          return;
        }

        const twilioCall = await twilioClient.calls.create({
          to:lead.phone,
          from:env.TWILIO_PHONE_NUMBER,
          url:`${env.WEBHOOK_BASE_URL}/api/calls/webhook`,
          statusCallback:`${env.WEBHOOK_BASE_URL}/api/calls/status`,
          statusCallbackMethod:"POST",
          statusCallbackEvent:["initiated", "ringing", "answered", "completed"],
        });

        await CallModel.createCall(
          { lead_id: lead.id, twilio_sid: twilioCall.sid, to_number: lead.phone },
          userId
        );

        await LeadModel.incrementCallAttempt(lead.id);

        broadcastScheduler({
          type:"SCHEDULED_CALL_FIRED",
          lead_id:lead.id,
          lead_name:lead.contact_name,
          company:lead.company_name,
          twilio_sid: twilioCall.sid,
          attempt:(lead.call_attempts ?? 0) + 1,
        });

        console.log(`[scheduler] Called ${lead.contact_name} @ ${lead.company_name}`);
      } catch (err: any) {
        console.error(`[scheduler] Failed to call ${lead.company_name}:`, err.message);
        broadcastScheduler({
          type:"SCHEDULED_CALL_FAILED",
          lead_id:lead.id,
          error:err.message,
        });
      }
    }, i * 30_000); // 30s between each call
  }
}

// ── handle call completion — update lead status based on outcome ──────────────
export async function handleCallCompletion(twilioSid: string, status?: string) {
  try {
    const call = await CallModel.getCallByTwilioSid(twilioSid);
    if (!call) return;

    // If Twilio reported a failure, use that as the outcome directly
    let outcome = "completed";
    if (status === "no-answer" || status === "busy" || status === "failed" || status === "canceled") {
      outcome = "no-answer";
    } else {
      outcome = detectOutcome(call.transcript ?? []);
    }

    // update call record with outcome
    await supabaseAdmin
      .from("calls")
      .update({ outcome })
      .eq("twilio_sid", twilioSid);

    // update lead based on outcome
    if (outcome === "demo_booked" || outcome === "not_interested" || outcome === "info_sent") {
      await LeadModel.markAsContacted(call.lead_id);
    } else if (outcome === "do_not_call") {
      await LeadModel.excludeFromAutoCalls(call.lead_id);
      await LeadModel.markAsContacted(call.lead_id);
    }
    // no_answer / callback_requested → leave in current status, retry tomorrow

    broadcastScheduler({
      type:"CALL_OUTCOME",
      twilio_sid: twilioSid,
      lead_id: call.lead_id,
      outcome,
    });

    console.log(`[scheduler] Call outcome: ${outcome} for lead ${call.lead_id}`);
  } catch (err: any) {
    console.error("[scheduler] handleCallCompletion error:", err.message);
  }
}

// ── start the cron job ────────────────────────────────────────────────────────
export function startCallScheduler(wssInstance: WebSocketServer) {
  setSchedulerWss(wssInstance);

  // 9:00 AM UK time
  cron.schedule("55 10 * * *", async () => {
    const nowUK = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });
    console.log(`[scheduler] Daily call run starting — UK time: ${nowUK}`);

    try {
      const userIds = await getActiveUserIds();
      console.log(`[scheduler] ${userIds.length} users have leads to call`);

      for (const userId of userIds) {
        await runDailyCallsForUser(userId);
      }
    } catch (err: any) {
      console.error("[scheduler] Cron job error:", err.message);
    }
  }, {
    timezone: "Europe/London"
  });

  console.log(`[scheduler] Daily calls scheduled at 9:00 AM UK time`);
}

