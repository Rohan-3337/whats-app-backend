import { Router } from "express";
import {CheckUser, generateToken, getAllusers, onBoardUser  }from "../controllers/AuthController.js";

const router = Router();

router.post('/check-user', CheckUser);
router.post("/onboard-user", onBoardUser);
router.get("/get-contacts", getAllusers);
router.get("/generate-token/:userId",generateToken);
 
export default router;