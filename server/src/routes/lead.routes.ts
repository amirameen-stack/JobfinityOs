import { Router } from "express";
import { LeadController } from "../controllers/lead.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth); // all lead routes require auth

router.get("/",LeadController.getAll);
router.post("/",LeadController.create);
router.patch("/:id",LeadController.update);
router.patch("/:id/status",LeadController.updateStatus); // dedicated status endpoint
router.patch("/:id/folder", LeadController.assignFolder);
router.delete("/:id",LeadController.delete);



export default router;