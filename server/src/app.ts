// src/app.ts  — only the changed sections shown, everything else stays the same
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";
import morgan from "morgan";
import { supabaseAdmin } from "./config/supabase";

const app = express();

app.use(helmet());
app.set("trust proxy", 1);
app.use(morgan("dev"));

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  })
);

app.use(express.json({ limit: "10kb" }));

// ── Twilio webhooks arrive as application/x-www-form-urlencoded ──────────────
// This must be added — without it req.body is empty in handleWebhook
app.use(express.urlencoded({ extended: false }));
// ─────────────────────────────────────────────────────────────────────────────

app.use(cookieParser(env.COOKIE_SECRET));

app.use("/api", routes);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use(errorHandler);

export async function initStorage() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucket = buckets?.find((b) => b.name === "lead-files");
    if (!bucket) {
      await supabaseAdmin.storage.createBucket("lead-files", { public: true });
      console.log("[storage] Created bucket: lead-files");
    } else if (!bucket.public) {
      await supabaseAdmin.storage.updateBucket("lead-files", { public: true });
      console.log("[storage] Updated bucket to public: lead-files");
    } else {
      console.log("[storage] Bucket ready: lead-files");
    }
  } catch (err) {
    console.error("[storage] Failed to initialise storage bucket:", err);
  }
}

export default app;