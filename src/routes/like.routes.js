import { Router } from "express";

import { toggleCommentLike, toggleVideoLike ,toggleTweetLike, getLikedVideos} from "../controllers/like.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/toggle-video-like/:videoId").patch(verifyJWT,toggleVideoLike);
router.route("/toggle-comment-like/:commentId").patch(verifyJWT,toggleCommentLike);
router.route("/toggle-tweet-like/:tweetId").patch(verifyJWT,toggleTweetLike);
router.route("/LikedVideos").get(verifyJWT,getLikedVideos);



export default router;