import {asyncHandler} from "../utils/asyncHandler.js";

// Temporary test - bypass asyncHandler
const registerUser = asyncHandler(async(req, res) => {
    res.status(200).json({
        message: "ok"
    })
})

export {registerUser};