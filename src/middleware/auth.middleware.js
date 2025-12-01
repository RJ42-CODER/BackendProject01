//our own design to middleware for authentication
//will verify if there is user or not
//separate file for better structure and can be used in multiple places

import {ApiError} from "../utils/ApiError";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler";

export const verifyJWT = asyncHandler(async(req, _ ,next)=>{
    try {
        //we get access to all the cookies
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // by replacing the Bearer part with empty string we get only token
    
        if(!token){
            throw new ApiError(401,"Unauthorized request");
        }
         
        //decode the info provided through accessToken
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        //attach the user to the req object
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            //discussion about frontend
            throw new ApiError(401,"Invalid access token");
        }
    
        //add a new object to req
        //give user access to req object
        req.user = user;
        next();
        //run the next method/controller in the routes
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token");
    }



})