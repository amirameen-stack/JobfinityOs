import { Request, Response, NextFunction } from "express";
import twilio from "twilio";
import { twilioClient } from "../lib/twilio";
import { getGeminiModel } from "../lib/gemini";
import { broadcast } from "../lib/websocket";
import { CallModel } from "../models/call.model";
import { AppError } from "../middleware/error.middleware";
import { env } from "../config/env";
import { handleCallCompletion, runDailyCallsForUser } from "../services/callScheduler";
// import { SALES_SCRIPT } from "../services/callScript"; 
const SALES_SCRIPT = "You are a sales agent..."; // Placeholder
import { supabaseAdmin } from "../config/supabase";

// system prompt that shapes the AI agent's personality and goal
const AGENT_SYSTEM_PROMPT = SALES_SCRIPT;

// ─────────────────────────────────────────────
// POST /api/calls/start
// ─────────────────────────────────────────────
export const startCall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, "Unauthorized");

    const { lead_id, to_number } = req.body;
    if (!lead_id || !to_number) throw new AppError(400, "lead_id and to_number are required");

    // fire the outbound call via Twilio REST
    const twilioCall = await twilioClient.calls.create({
      to: to_number,
      from: env.TWILIO_PHONE_NUMBER,
      // Twilio hits this URL when the call connects — returns TwiML to start the conversation
      url: `${env.WEBHOOK_BASE_URL}/api/calls/webhook`,
      // Twilio hits this URL whenever call status changes (ringing, completed, failed, etc.)
      statusCallback: `${env.WEBHOOK_BASE_URL}/api/calls/status`,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });

    // persist the call record immediately
    const call = await CallModel.createCall(
      {
        lead_id,
        twilio_sid: twilioCall.sid,
        to_number,
      },
      userId
    );

    // notify React clients that a new call has started
    broadcast({
      type: "CALL_STARTED",
      call_id: call.id,
      twilio_sid: twilioCall.sid,
      lead_id,
      to_number,
    });

    res.status(201).json({ success: true, call });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/calls/auto-start
// ─────────────────────────────────────────────
export const startAutoCalls = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, "Unauthorized");

    // Don't await because it runs slowly and staggers
    runDailyCallsForUser(userId).catch(console.error);

    res.json({ success: true, message: "Auto calls started" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/calls/webhook
// Called by Twilio on every conversation turn
// ─────────────────────────────────────────────
export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      CallSid,
      SpeechResult,   // what the prospect said (transcribed by Twilio)
      Confidence,     // transcription confidence score 0-1
    } = req.body;

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    // first turn — no speech yet, agent speaks first
    if (!SpeechResult) {
      const openingLine = await getGeminiReply(CallSid, null);

      twiml.say({ voice: "Polly.Joanna", language: "en-US" }, openingLine);
      twiml.gather({
        input: ["speech"],
        action: `${env.WEBHOOK_BASE_URL}/api/calls/webhook`,
        speechTimeout: "auto",
        language: "en-US",
      });

      await CallModel.appendTranscript(CallSid, {
        role: "agent",
        text: openingLine,
        timestamp: new Date().toISOString(),
      });

      broadcast({
        type: "TRANSCRIPT_UPDATE",
        twilio_sid: CallSid,
        role: "agent",
        text: openingLine,
        timestamp: new Date().toISOString(),
      });

      res.type("text/xml").send(twiml.toString());
      return;
    }

    // low confidence — ask prospect to repeat
    if (parseFloat(Confidence) < 0.4) {
      twiml.say(
        { voice: "Polly.Joanna" },
        "I'm sorry, I didn't catch that. Could you say that again?"
      );
      twiml.gather({
        input: ["speech"],
        action: `${env.WEBHOOK_BASE_URL}/api/calls/webhook`,
        speechTimeout: "auto",
      });
      res.type("text/xml").send(twiml.toString());
      return;
    }

    // save prospect's speech to transcript
    await CallModel.appendTranscript(CallSid, {
      role: "prospect",
      text: SpeechResult,
      timestamp: new Date().toISOString(),
    });

    broadcast({
      type: "TRANSCRIPT_UPDATE",
      twilio_sid: CallSid,
      role: "prospect",
      text: SpeechResult,
      timestamp: new Date().toISOString(),
    });

    // get Gemini's reply using full conversation history
    const agentReply = await getGeminiReply(CallSid, SpeechResult);

    // save agent reply to transcript
    await CallModel.appendTranscript(CallSid, {
      role: "agent",
      text: agentReply,
      timestamp: new Date().toISOString(),
    });

    broadcast({
      type: "TRANSCRIPT_UPDATE",
      twilio_sid: CallSid,
      role: "agent",
      text: agentReply,
      timestamp: new Date().toISOString(),
    });

    // check if agent has decided to end the call
    const shouldEnd = detectCallEnd(agentReply);

    twiml.say({ voice: "Polly.Joanna", language: "en-US" }, agentReply);

    if (shouldEnd) {
      twiml.hangup();
    } else {
      twiml.gather({
        input: ["speech"],
        action: `${env.WEBHOOK_BASE_URL}/api/calls/webhook`,
        speechTimeout: "auto",
        language: "en-US",
      });
    }

    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    // always return valid TwiML even on error — otherwise Twilio plays
    // a generic error message to the prospect
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say("I'm sorry, we're experiencing a technical issue. We'll call you back shortly.");
    twiml.hangup();
    res.type("text/xml").send(twiml.toString());
  }
};

// ─────────────────────────────────────────────
// POST /api/calls/status
// Called by Twilio when call status changes
// ─────────────────────────────────────────────
export const callStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      CallSid,
      CallStatus,
      CallDuration, // duration in seconds, only present when status = completed
    } = req.body;

    const validStatuses = ["initiated", "ringing", "in-progress", "completed", "failed", "busy", "no-answer", "canceled"];
    if (!validStatuses.includes(CallStatus)) {
      res.sendStatus(200);
      return;
    }

  await CallModel.updateCall(CallSid, {
  status: CallStatus,
  ...(CallDuration ? { duration: parseInt(CallDuration, 10) } : {}),
});

broadcast({
  type: "CALL_STATUS",
  twilio_sid: CallSid,
  status: CallStatus,
  duration: CallDuration ? parseInt(CallDuration, 10) : null,
});

// trigger outcome detection and lead status update when call ends
if (CallStatus === "completed" || CallStatus === "no-answer" || CallStatus === "busy" || CallStatus === "failed" || CallStatus === "canceled") {
  await handleCallCompletion(CallSid, CallStatus);
}

res.sendStatus(200);
  } catch (err) {
    // always 200 to Twilio — otherwise it retries the webhook repeatedly
    res.sendStatus(200);
  }
};

// ─────────────────────────────────────────────
// POST /api/calls/:twilio_sid/end
// ─────────────────────────────────────────────
export const endCall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { twilio_sid } = req.params;
    if (!twilio_sid) throw new AppError(400, "twilio_sid is required");

    await twilioClient.calls(twilio_sid as string).update({ status: "completed" });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// Gemini helper
// ─────────────────────────────────────────────
const getGeminiReply = async (
  twilioSid: string,
  latestProspectSpeech: string | null
): Promise<string> => {
  // fetch full transcript so Gemini has conversation history
  const call = await CallModel.getCallByTwilioSid(twilioSid);
  const transcript: { role: string; text: string }[] = call.transcript ?? [];

  // build Gemini chat history from saved transcript
  // Gemini expects alternating user/model roles
  const history = transcript.map(entry => ({
    role: entry.role === "agent" ? "model" : "user",
    parts: [{ text: entry.text }],
  }));

  const model = getGeminiModel("gemini-1.5-flash", AGENT_SYSTEM_PROMPT);

  const chat = model.startChat({ history });

  // if first turn, prompt Gemini to open the conversation
  const userMessage = latestProspectSpeech ?? "Begin the call now.";
  const result = await chat.sendMessage(userMessage);
  const reply = result.response.text().trim();

  return reply;
};

// ─────────────────────────────────────────────
// Detect if agent reply signals end of call
// ─────────────────────────────────────────────
const detectCallEnd = (reply: string): boolean => {
  const endPhrases = [
    "have a great day",
    "have a wonderful day",
    "calendar invite within 24 hours",
    "looking forward to showing",
    "leave it with you",
    "feel free to reach out",
    "removed right away",
    "sorry for the interruption",
    "try you then",
    "reconnect closer to that time",
    "won't take up any more of your time",
  ];
  const lower = reply.toLowerCase();
  return endPhrases.some(phrase => lower.includes(phrase));
};

export const getTodaysCalls = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AppError(401, "Unauthorized");

    const startOfDayUK = new Date();
    startOfDayUK.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
      .from("calls")
      .select("*, leads(company_name, contact_name, phone)")
      .eq("user_id", userId)
      .gte("created_at", startOfDayUK.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw new AppError(500, error.message);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
export const getAllCalls = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, "Unauthorized");

    const { data, error } = await supabaseAdmin
      .from("calls")
      .select("*, leads(company_name, contact_name, phone)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(500, error.message);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};