import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // get total video views,total subscribers,total videos,total likes,etc.

  const channelId = req.user._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Not Authorised");
  }

  // total videos & total views
  const videoStats = await Video.aggregate([
    { $match: { owner: channelId } },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  // total subscribers
  const totalSubscribers = await subscription.countDocuments({
    channel: channelId,
  });

  // total comments
  const totalComments = await Comment.countDocuments({ 
    owner: channelId });

  // total likes on videoStats
  const totalLikes = await Like.countDocuments({
    video: {
      $in: await Video.find({ owner: channelId }).distinct("_id"),
    },
  });

  //final stats:

  const stats = {
    totalVideos: videoStats[0]?.totalVideos || 0,
    totalViews: videoStats[0]?.totalViews || 0,
    totalComments,
    totalSubscribers,
    totalLikes,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel status fetched successfully"));

  // channel = user
  // Video.owner
  // subscription.channel
  // Like.Video
  // Video.views
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.user._id;

  const videos = await Video.find({
    owner: req.user._id,
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel Videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
