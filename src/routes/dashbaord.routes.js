import {Router} from "express"

import { getChannelStats,getChannelVideos } from "../controllers/dashboard.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js"

const router = Router();

router.route("/getChannelStats").get(verifyJWT,getChannelStats)
router.route("/getChannelVideos").get(verifyJWT,getChannelVideos)

export default router;