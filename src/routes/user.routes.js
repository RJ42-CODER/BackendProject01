import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";


const router = Router();

//the control is passed here from app.js
router.route("/register").post(registerUser);


export default router;
