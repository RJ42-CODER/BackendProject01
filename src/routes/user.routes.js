import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js";

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



export default router;
