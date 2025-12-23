import mongoose, { Schema } from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      default: undefined,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: undefined,
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
      default: undefined,
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
