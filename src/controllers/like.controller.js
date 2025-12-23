import mongoose, { isValidObjectId } from "mongoose";

import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //switch toggle like on video

  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invaild VideoId");
  }

  const existinglike = await Like.findOne({
    likedBy: req.user._id,
    video: videoId,
  });

  // If user already liked the video → unlike
  // If user has not liked → like

  if (existinglike) {
    await existinglike.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Video unliked successfully"));
  }

  const newlike = await Like.create({ likedBy: req.user._id, video: videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, newlike, "Video liked successfuly"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }
  //toggle like on comment

  const existinglike = await Like.findOne({
    likedBy: req.user._id,
    comment: commentId,
  });

  if (existinglike) {
    await existinglike.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Comment unliked successfully"));
  }

  const newLike = await Like.create({
    likedBy: req.user._id,
    comment: commentId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //toggle tweet like

  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const existinglike = await Like.findOne({
    likedBy: req.user._id,
    tweet: tweetId,
  });

  if (existinglike) {
    await existinglike.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Tweet unliked successfully"));
  }

  const newLike = await Like.create({
    likedBy: req.user._id,
    tweet: tweetId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //return all the videos liked by the currently logged in user (liked videos)
  const userId = req.user._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Not Authroized");
  }

  const likedVideos = await Like.find({
    likedBy: userId,
    video: { $exists: true },
  }).populate({
    //video details:
    path: "video",
    select: "title desciption thumbnail owner createdAt",
  }).sort({createdAt:-1});

  return res.status(200).json(new ApiResponse(200,likedVideos.map(like => like.video),"Liked Videos fetched successfully"))


});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
