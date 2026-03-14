import { Router } from "express";
import {
  getAllUser,
  getUserById,
  profile,
  signin,
  updateProfile,
  verifyUser,
} from "../controllers/authController";
import { verifyUserToken } from "../middleware/verifyJwtToken";

const router = Router();

router.post("/signin", signin);
router.post("/verify-user", verifyUser);
router.get("/profile", verifyUserToken, profile);
router.post("/update-profile", verifyUserToken, updateProfile);
router.get("/users", verifyUserToken, getAllUser);
router.get("/users/:id",  getUserById);

export default router;
