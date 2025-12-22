import { Router } from "express";
import { createPlaylist,
    getUserPlaylist,
    addVideoToPlaylist,
    getPlaylistById,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/createPlaylist").post(verifyJWT,createPlaylist);
router.route("/getUserPlaylist/:userId").get(verifyJWT,getUserPlaylist);
router.route("/addVideoToPlaylist/:playlistId/:videoId").patch(verifyJWT,addVideoToPlaylist);
router.route("/getPlaylistById/:playlistId").get(verifyJWT,getPlaylistById);
router.route("/removeVideoFromPlaylist/:playlistId/:videoId").patch(verifyJWT,removeVideoFromPlaylist);
router.route("/deletePlaylist/:playlistId").delete(verifyJWT,deletePlaylist);
router.route("/updatePlaylist/:playlistId").patch(verifyJWT,updatePlaylist);


export default router;