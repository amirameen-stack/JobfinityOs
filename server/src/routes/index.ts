import { Router } from "express";
import authRoutes from "./auth.routes";
import leadRoutes from "./lead.routes";
import folderRoutes from "./folder.routes";
import fileRoutes from "./leadFile.routes";
import callRoutes from "./call.routes";
import proposalRoutes from "./proposal.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/leads", leadRoutes);
router.use("/folders", folderRoutes);
router.use("/lead-files", fileRoutes); 
router.use("/calls", callRoutes);
router.use("/proposals", proposalRoutes);

export default router;