import mongoose, { isValidObjectId } from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  console.log(req.query);

  //all the videos are fetched from db
  //now only send the videos that are published to be sent as response
  //page-wise results
  //order wise sorting
  //filter by userId (if provided)
  //search by title or description (if query provided)

  // convert query params to numbers
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  // calculate skip
  const skip = (pageNumber - 1) * limitNumber;

  //filter object
  const filter = {
    isPublished: true,
  };

  if (query) {
    filter.$or = [
      {
        title: { $regex: query, $options: "i" },
      },
      {
        description: { $regex: query, $options: "i" },
      },
    ];
  }

  if (userId && isValidObjectId(userId)) {
    filter.owner = userId;
  }

  //newest videos first -> sort by createdAt desc
  const videos = await Video.find(filter)
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: -1 });

  console.log(videos);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  //steps:
  //1. validate input
  //2. upload video file and thumbnail to cloudinary
  //3. save video details to db
  //4. send response back to user

  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and Description are required");
  }

  if (
    !req.files ||
    !Array.isArray(req.files.video) ||
    !Array.isArray(req.files.thumbnail)
  ) {
    throw new ApiError(400, "Video file and Thumbnail are required");
  }

  //Files from multer middleware
  const videoLocalPath = req.files.video[0].path;
  const thumbnailLocalPath = req.files.thumbnail[0].path;

  //upload on cloudinary
  const videoPath = await uploadOnCloudinary(videoLocalPath);
  const thumbnailPath = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoPath?.url || !thumbnailPath?.url) {
    throw new ApiError(500, "Error uploading files to cloudinary");
  }

  //save video details to db
  const newVideo = await Video.create({
    videoFile: videoPath.url,
    thumbnail: thumbnailPath.url,
    title: title.trim(),
    description: description.trim(),
    duration: videoPath.duration, //in seconds, from frontend
    owner: req.user._id,
  });

  console.log(newVideo);

  if (!newVideo) {
    throw new ApiError(500, "Error saving video to database");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video published successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  //Goal:
  // Creator can publish / unpublish a video
  // Logged-in user only controls their own video
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  //authorisation : check if the video belongs to the logged-in user
  const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  //patch only because we're updating only a part of the resource
  //toggle publish status
  video.isPublished = !video.isPublished;
  //reusable code of mongoose examples:
  //publish/unpublish
  //follow/unfollow
  //like/unlike
  //enable/disable

  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video publish status toggled successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findOne({
    _id: videoId,
    owner: req.user?._id,
  });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  //extract the video details before deleting
  const videoDetails = {
    videoFile: video.videoFile,
    thumbnail: video.thumbnail,
    title: video.title,
    description: video.description,
  };

  // extract the cloudinary public IDs from the URLs like this https://res.cloudinary.com/demo/video/upload/v123456789/my_video_abc123.mp4 -> my_video_abc123
  // a small built-in function
  const getPublicId = (url) => {
    const cleanUrl = url.split("?")[0]; //remove query params if any
    return cleanUrl.split("/").pop().split(".")[0]; //get last part after / and before .
  };

  const videoPublicId = getPublicId(video.videoFile);
  const thumbnailPublicId = getPublicId(video.thumbnail);

  //delete the video from cloudinary
  (await cloudinary.uploader.destroy(videoPublicId, { resource_type: "video" }),
    await cloudinary.uploader.destroy(thumbnailPublicId));

  //delete the video from db
  await Video.deleteOne({ _id: videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, videoDetails, "Video deleted successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //update video title and description, optional- thumbnail and not videofile

  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (!title?.trim() && !description?.trim() && !req.file) {
    throw new ApiError(400, "Enter detais to be updated");
  }

   const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  let uploadedThumbnail;

  if (req.file) {
    uploadedThumbnail = await uploadOnCloudinary(req.file.path);

  if (!uploadedThumbnail?.url) {
    throw new ApiError(500, "Thumbnail upload failed");
  }

//delete old thumbnail from cloudinary
  if (video.thumbnail) {
    const oldPublicId = video.thumbnail.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(oldPublicId);
  }

  video.thumbnail= uploadedThumbnail.url;
}

  if (title) video.title = title.trim();
  if (description) video.description = description.trim();

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
      throw new ApiError(400,"Invalid VideoId")
    }

    //If video is not published:allow only owner to see it - DRAFTS
    //If video is published:allow anyone

    const video = await Video.findOne({_id:videoId});

    if(!video){
      throw new ApiError(404,"Video not Found");
    }

    // Ensures only creator can see drafts.
    if(!video.isPublished && (!req.user || video.owner.toString() !== req.user._id.toString())){
      throw new ApiError(403,"You are not allowed to view this video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video fetched successfully"))


})

export {
  getAllVideos,
  publishAVideo,
  togglePublishStatus,
  deleteVideo,
  updateVideo,
  getVideoById
};
