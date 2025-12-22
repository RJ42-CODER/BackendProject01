import mongoose, { isValidObjectId, plugin } from "mongoose";

import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  // create a new playlist

  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Name is required");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "User is not Valid");
  }

  const playlists = await Playlist.find({ owner: userId }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  //add video
  const { playlistId, videoId } = req.params;

  //playlist exists
  //playlist user is logged in
  //videoId is valid
  //video is not in playlist - invalid

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }

  //give me the playlist if i own it
  const playlist = await Playlist.findOne(
    { _id: playlistId },
    { owner: req.user._id }
  );

  if (!playlist) {
    throw new ApiError("Playlist not Found");
  }

  //push only the id instead of full video
  //$addToSet = push only if not already present
  const updatePlaylist = await Playlist.findOneAndUpdate(
    {
      //filter
      _id: playlistId,
      owner: req.user._id,
    },
    {
      //update
      $addToSet: { videos: videoId },
    },
    {
      //option
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatePlaylist,
        "Video added successfully to the playlist"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist does not exist");
  }

  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiError(400, "Not Authorised");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // ..delete
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Not Valid Id");
  }

  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiError(400, "Not Authorised");
  }

  //Always convert videoId to ObjectId before comparing or pulling.

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video not found in playlist");
  }
  //push - add, pull - minus
  playlist.videos.pull(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video removed successfully from playlist")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  //delete the playlist

  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist with this Id does not exist");
  }
  //only the owner can delete its own playlist
  //find returns an array, so use findOne
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiError(400, "Playlist does not exist");
  }
  //no need to do anything to the videos inside, playlist deletion is enough
  await playlist.deleteOne();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { playlistId }, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //update the playlist
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist does not exist");
  }

  if (!name && !description) {
    throw new ApiError("Atleast one of the fields is required to update");
  }

  const updateFields = {};

  if(name?.trim()){
    updateFields.name = name.trim()
  } 
  
  if(description?.trim()){
    updateFields.description = description.trim()
  }


  const playlist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: req.user._id },
    {$set: updateFields},
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(404, "Playlist not found or not authorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylist,
  addVideoToPlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
