import { Router } from "express";
import { signin, signup, verifyUser } from "../controllers/authController";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/verify-user", verifyUser);

export default router;
