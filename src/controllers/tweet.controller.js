import mongoose,{isValidObjectId} from "mongoose";
import {Tweet} from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async(req,res)=>{
    //create a tweet
    const {content} = req.body;

    if(!content?.trim()){
        throw new ApiError(400,"Tweet is required");
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner:req.user._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201,tweet,"Tweet created successfully"));
})

const getUserTweets = asyncHandler(async(req,res)=>{
    //get user tweets
    //basically array of all the tweets by the user right?
    const {userId} = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Valid UserId is required");
    }
    //many tweets - find
    //one tweet - findone
    const tweet = await Tweet.find({owner : userId}).sort({createdAt:-1})

    //we'll do sorting - the latest ones before then the older ones

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async(req,res)=>{
//update the user's tweets
  const {tweetId} = req.params;
  const{content} = req.body;

  if(!tweetId ||!isValidObjectId(tweetId) || !content?.trim()){
    throw new ApiError(400,"Tweet doesn't exist")
  }

  const tweet = await Tweet.findOne({
    _id:tweetId,
    owner:req.user._id});

    //owner check!!!
    if(!tweet){
        throw new ApiError(400,"Valid userID is required.")
    }

    const updatedtweet = await Tweet.findOneAndUpdate(
        //filter
        {
            _id: tweetId,
            owner: req.user._id,
        },
        //update
        {
            $set:{
                content:content.trim()
            }
        },
        //options
        {new:true}
    )

    //findOneAndUpdate already saves
    //unnecessary await updatedtweet.save();

    return res
    .status(200)
    .json(new ApiResponse(200,updatedtweet,"Tweet Updated Successfully"))

})

const deleteTweet = asyncHandler(async(req,res)=>{
    //delete Tweet
    const {tweetId} = req.params;
    
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"Tweet does not exist");
    }

    const tweet = await Tweet.findOne({
        _id:tweetId,
        owner:req.user._id
    })

    if(!tweet){
        throw new ApiError(403,"Not Authorized")
    }

    await tweet.deleteOne();

    return res.status(200).json(new ApiResponse(200,tweet,"Tweet Deleted Successfully"))

})

export {createTweet,getUserTweets,updateTweet,deleteTweet};


