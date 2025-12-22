import mongoose, { isValidObjectId } from "mongoose";

import { subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  //toggle - switch
  //subscriber (req.user._id)
  // channel (channelId)

  //subscribe first time - creates subscription
  //call again - unsubscribe
  //subscribe to own - 400 error
  //invalid channelId - 400 error

  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel does not exist");
  }

  //edge case--------
  if (channelId.toString() === req.user._id.toString()) {
    throw new ApiError(400, "Cannot subscribe to your own channel");
  }

  const existingSubscription = await subscription.findOne({
    channel: channelId,
    subscriber: req.user._id,
  });

  if (existingSubscription) {
    // unsubscribe
    await existingSubscription.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unsubscribed successfully"));
  }

  const newSubscription = await subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
});

const getUserChannelSubscribers = asyncHandler(async(req,res)=>{
    //get the userID matblb the subscriber - req.user._Id
    //get list of the channels of subscribers
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel Id");
    }

    const subscribers = await subscription.find({
        channel:channelId,
    }).populate("subscriber","username fullname avatar")

    //populate becoz : it sends meaningful user info and avoids sending passwords/sensitive data
    //it returns a usefull structure like this :

    //{
    //  count: subscribers.length,
    //  subscribers: [...]
    // }

    return res
    .status(200)
    .json(new ApiResponse(200,subscribers,"Subcribers of this channel fetched successfully"))

})

const getSubscribedChannels = asyncHandler(async(req,res)=>{

    const {subscriberId} = req.params;

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid subscriberId")
    }

    // what this below logic does:
    // Give me all subscriptions where this user is the subscriber”
    const subscribedChannel = await subscription.find({subscriber:subscriberId})
    .populate("channel","username fullname avatar")

    return res
    .status(200)
    .json(new ApiResponse(200,subscribedChannel,"Subscribed Channels fetched successfully"))

})

export { toggleSubscription,getUserChannelSubscribers,getSubscribedChannels };
