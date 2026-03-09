import { Router } from "express";
import { sendMailHandler } from "../controllers/mailController";

const router = Router();

router.post("/send", sendMailHandler);

export default router;
