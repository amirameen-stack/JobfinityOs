import { Router } from "express";
import { startCall, handleWebhook, callStatus, getAllCalls, startAutoCalls, endCall } from "../controllers/call.controller";
import { getTodaysCalls } from "../controllers/call.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// startCall requires a logged-in user (has lead_id + to_number in body)
router.post("/start", requireAuth, startCall);

// start auto calls
router.post("/auto-start", requireAuth, startAutoCalls);

// end call manually
router.post("/:twilio_sid/end", requireAuth, endCall);

// webhook + status are called by Twilio — no user session, no requireAuth
// Twilio signs every request with a signature header — we validate that instead
router.post("/webhook", handleWebhook);
router.post("/status", callStatus);
router.get("/today", requireAuth, getTodaysCalls);
router.get("/",requireAuth, getAllCalls);

export default router;