import mongoose, { isValidObjectId } from "mongoose";

import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  //page and limit come as strings from req.query. so be alert - turn them to numbers

  const skip = (Number(page) - 1) * Number(limit);
  //Get all comments of this video not just the loggedin user
  const videoComments = await Comment.find({
    video: videoId,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoComments,
        "Comments fetched successfully of this videoId"
      )
    );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Comment is required");
  }

  const newComment = await Comment.create({
    video: videoId,
    content: content.trim(),
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid CommentId");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Add comment to update it");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: req.user._id,
    },
    {
      $set: { content: content.trim() },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(400, "Comment not found or not authorised");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const comment = await Comment.findOne({
    _id:commentId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(400, "Not authorised");
  }

  await comment.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
