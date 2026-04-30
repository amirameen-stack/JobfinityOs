// src/controllers/call.controller.ts
import { Request, Response, NextFunction } from "express";
import twilio from "twilio";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CallModel } from "../models/call.model";
import { AppError } from "../middleware/error.middleware";
import { env } from "../config/env";
import { WebSocketServer } from "ws";

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// shared WebSocket server instance — set from server.ts after httpServer is created
let wss: WebSocketServer | null = null;
export const setWss = (instance: WebSocketServer) => { wss = instance; };

// broadcast transcript update to all connected React clients
const broadcast = (payload: object) => {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
};

// system prompt that shapes the AI agent's personality and goal
const AGENT_SYSTEM_PROMPT = `
You are Sarah, a professional sales agent for Jobfinity, an AI-powered recruitment platform.
Your goal is to qualify leads and book a demo call.

Rules:
- Keep responses under 3 sentences — this is a phone call, not an email
- Be warm, confident and consultative, never pushy
- Ask one question at a time
- If the prospect is not interested, thank them and end politely
- If they want a demo, confirm their email and say the team will be in touch within 24 hours
- Never make up pricing or features you are unsure about

Start by greeting the prospect and asking if they have 2 minutes to hear about how Jobfinity 
can cut their hiring time by 60%.
`.trim();

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

    const validStatuses = ["initiated", "ringing", "in-progress", "completed", "failed", "busy", "no-answer"];
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

    res.sendStatus(200);
  } catch (err) {
    // always 200 to Twilio — otherwise it retries the webhook repeatedly
    res.sendStatus(200);
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

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: AGENT_SYSTEM_PROMPT,
  });

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
    "take care",
    "goodbye",
    "talk soon",
    "we'll be in touch",
    "team will contact you",
    "thank you for your time",
    "not a good fit",
  ];
  const lower = reply.toLowerCase();
  return endPhrases.some(phrase => lower.includes(phrase));
};