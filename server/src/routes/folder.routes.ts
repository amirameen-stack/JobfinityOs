// src/routes/folder.routes.ts
import { Router } from "express";
import { FolderController } from "../controllers/folder.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/", FolderController.create);
router.get("/", FolderController.getAll);
router.patch("/:id", FolderController.rename);
router.delete("/:id", FolderController.delete);

export default router;