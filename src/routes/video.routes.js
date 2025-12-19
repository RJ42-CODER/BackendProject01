import { Router } from "express";
import {
  getAllVideos,
  publishAVideo,
  togglePublishStatus,
  deleteVideo,
  updateVideo,
  getVideoById
} from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/getAllVideos").get(verifyJWT, getAllVideos);

router.route("/publishVideo").post(
  verifyJWT,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

//not post , use patch or else it will update all the details mandatorily
router.route("/toggle-publish/:videoId").patch(verifyJWT, togglePublishStatus);

router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);
router.route("/update-video/:videoId").patch(
  verifyJWT, 
  upload.single("thumbnail"),
  updateVideo);

router.route("/getVideoById/:videoId").get(getVideoById)

export default router;
