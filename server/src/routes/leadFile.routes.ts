import { Router } from "express";
import { LeadFileController, upload } from "../controllers/leadFile.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

// ✅ upload.single("file") parses the multipart form and populates req.body + req.file
router.post("/", upload.single("file"), LeadFileController.upload);
router.get("/", LeadFileController.getAll);
router.get("/:leadId", LeadFileController.getByLead);
router.delete("/:fileId", LeadFileController.delete);

export default router;