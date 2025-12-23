import { Router } from "express";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/videoComments/:videoId").get(getVideoComments)
router.route("/addComment/:videoId").get(verifyJWT,addComment)
router.route("/updateComment/:commentId").patch(verifyJWT,updateComment)
router.route("/deleteComment/:commentId").delete(verifyJWT,deleteComment)

export default router;