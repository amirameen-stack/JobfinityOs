import { Router } from "express";
import { ProposalController } from "../controllers/proposal.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
router.use(requireAuth);

router.post("/send", ProposalController.sendProposal);
router.get("/lead/:id", ProposalController.getLeadById);

export default router;
