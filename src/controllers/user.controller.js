import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

//asynchandler not required here since we are using it internally and not through web requests.
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    //saving without validation as only refresh token is being updated
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

// Temporary test - bypass asyncHandler
const registerUser = asyncHandler(async (req, res) => {
  console.log("req.files:", req.files);
  console.log("req.body:", req.body);

  const { username, fullname, email, password } = req.body;

  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "Invalid email address");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with email or username.");
  }

  //we'll get the path which is taken by the multer middleware
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //debugging for cover image path
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  //upload on cloudinary and it will take some time
  const Avatar = await uploadOnCloudinary(avatarLocalPath);

  const CoverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!Avatar || !Avatar.url) {
    throw new ApiError(500, "Avatar file is required");
  }

  //create user in db

  //sometimes mongoose operations take time so add await
  const user = await User.create({
    fullname,
    avatar: Avatar.url,
    //not compulsory
    coverImage: CoverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //fetch the created user without password and refreshToken
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registrating the user");
  }

  //for proper structure Response -> use ApiResponse

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Login logic will go here
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required to login");
  }

  if (!password) {
    throw new ApiError(400, "Password is required to login");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //method call from user.model.js to compare password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  //access or refresh token logic will go here

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);
  //refresh token bhi hai and access bhi

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //send cookies
  //options of cookies
  const options = {
    //only modified by server and not by frontend
    httpOnly: true,
    secure: true,
  };

  return (
    res
      //succesfull login
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          //data to be sent
          {
            user: loggedInUser,
            //incase mobile app wants to store tokens on its own
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      )
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Logout logic will go here
  //after next() from middleware auth we have access to req.user

  await User.findByIdAndUpdate(
    req.user._id,
    {
      //what to update
      $set: {
        refreshToken: undefined,
      },
    },
    {
      // return with response this new updated document
      new: true,
    }
  );

  const options = {
    //only modified by server and not by frontend
    httpOnly: true,
    secure: true,
  };

  //clear cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Refresh token logic will go here

  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  //verify refresh token
  //user has encrypted refresh token
  //we need raw token to compare with database

  try {
    //maybe some errors will come while verifying, so for safety use try catch
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token - user not found");
    }

    //USER NE BHEJA EK TOKEN compare with the token of user whose _id we got from the decoded token

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is invalid or used");
    }

    //user is valid and token matches
    //generate new access token

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Change current password logic will go here
  const { oldPassword, newPassword } = req.body;

  // we got req.user by using the verifyjwt middleware
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect");
  }

  //if the old password is correct, update to new password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  //return this response - important!!
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // Get current user logic will go here
  //middleware run ho gaya hai , and we have access to req.user
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, username } = req.body;

  if (!fullname?.trim() || !username?.trim()) {
    throw new ApiError(400, "Fullname and Username are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    //mongodb operators used here
    {
      $set: {
        fullname,
        username: username.toLowerCase(),
      },
    },
    //updated informartion is returned
    { new: true }
  ).select("-password");
  //With select("-password") → one query, password excluded.
  //Without select → one query, password included (you should remove it manually).

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  // Update avatar logic will go here
  //firstly check user should be valid using verifyJWT middleware
  //secondly use multer middleware to get the file path

  //only one file is expected
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //upload the avatar on cloudinary
  const newAvatar = await uploadOnCloudinary(avatarLocalPath);
  //we got the complete avatar object from cloudinary, we'll only use the url

  if (!newAvatar || !newAvatar.url) {
    throw new ApiError(500, "Error while uploading avatar file");
  }

  //extract the old id and delete its avatar from cloudinary
  // cloudinaryUrl is req.user?.avatar;
  //example: https://res.cloudinary.com/<cloud_name>/image/upload/v1723456789/folder/myimage_abcd1234.jpg

  const oldAvatarUrl = req.user?.avatar;

  const extractPublicId = (oldAvatarUrl) => {
    if (!oldAvatarUrl) return null;

    const urlWithoutParams = oldAvatarUrl.split("?")[0];

    // Get the last part of the path
    const parts = urlWithoutParams.split("/");
    const filename = parts[parts.length - 1]; // e.g. "myimage_abcd1234.jpg"

    // Remove extension
    const publicId = filename.split(".")[0];

    return publicId;
  };

  const oldAvatarPublicId = extractPublicId(oldAvatarUrl);
  if (oldAvatarPublicId) {
    await cloudinary.uploader.destroy(oldAvatarPublicId);
  }

  //now we'll update the avatar field
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: newAvatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  // Update cover image logic will go here

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage || !coverImage.url) {
    throw new ApiError(500, "Error while uploading cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannel = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        //model lowercase and plural form
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: { $subscribedTo },
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  //console log this for debugging

  if (!channel?.length) {
    // if channel?.length is 0 or undefined -> !0 = true -> error
    throw new ApiError(404, "Channel not found");
  }

  return (
    res
      .status(200)
      //returning first element/object of the channel array
      .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
      )
  );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // to get the converted value of string for ObjectId

  const user = User.aggregate([
    {
      $match: {
        // _id : req.user?._id  string to ObjectId conversion
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        //subpipeline to lookup owner details
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          { //to get the first object of owner array
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          },
        ],
      },
    },
  ]);

  return res
  .status(200)
  //just give the watch history array
  .json(new ApiResponse(200,user[0].watchHistory, "Watch history fetched successfully"));

});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannel,
  getWatchHistory,
};
