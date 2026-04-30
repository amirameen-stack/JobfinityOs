// src/routes/index.ts
import { Router } from "express";
import authRoutes from "./auth.routes";
import leadRoutes from "./lead.routes";
import folderRoutes from "./folder.routes";
import callRoutes from "./call.routes";        // ← add this

const router = Router();

router.use("/auth", authRoutes);
router.use("/leads", leadRoutes);
router.use("/folders", folderRoutes);
router.use("/calls", callRoutes);              // ← add this

export default router;