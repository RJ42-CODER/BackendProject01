import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

const loginUser = asyncHandler(async (req, res) => {
  // Login logic will go here
  const { username, email, password } = req.body;
  if (!username || !email) {
    throw new ApiError(400, "Username or Email is required to login");
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
      .coookie("refreshToken", refreshToken, options)
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
  .json(new ApiResponse(200,null,"User Logged Out Successfully"));


});

export { registerUser, loginUser, logoutUser };
