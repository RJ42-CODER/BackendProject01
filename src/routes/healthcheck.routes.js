import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/getHealthCheck").get(healthcheck)


export default router;
