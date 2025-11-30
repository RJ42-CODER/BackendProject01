import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Temporary test - bypass asyncHandler
const registerUser = asyncHandler(async (req, res) => {
  console.log('req.files:', req.files);
  console.log('req.body:', req.body);

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
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
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

  if (!Avatar) {
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

export { registerUser };
