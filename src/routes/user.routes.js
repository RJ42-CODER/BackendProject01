import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js";
import {verifyJWT} from "../middleware/auth.middleware.js";
const router = Router();

//the control is passed here from app.js
router.route("/register").post(

    //use multer middleware to handle multiple file uploads
    //it accepts an array of objects
    upload.fields([
        {
            name:"avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    //jatewakt milke jana middleware ko 
    registerUser);

router.route("/login").post(loginUser);

//secured routes will go here
router.route("/logout").post(verifyJWT,logoutUser);


export default router;
