import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannel,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

//the control is passed here from app.js
router.route("/register").post(
  //use multer middleware to handle multiple file uploads
  //it accepts an array of objects
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  //jatewakt milke jana middleware ko
  registerUser
);

router.route("/login").post(loginUser);

//secured routes will go here
router.route("/logout").post(verifyJWT, logoutUser);
//not using verifyJWT here because we have did it in the controller itself
router.route("/refresh-token").post(refreshAccessToken);
//user should be logged in -> verifyJWT
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
//not post , use patch or else it will update all the details mandatorily
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

//there are multiple files to upload so use upload.single
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);

router
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

//we're getting params
router.route("/c/:username").get(verifyJWT, getUserChannel);

router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
