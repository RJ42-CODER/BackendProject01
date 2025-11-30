import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//we need the path to upload the files to cloudinary

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null
    //upload the file on cloudinary

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //file has been uploaded on cloudinary server
    //console.log("file uploaded on cloudinary successfully!", response.url);
    fs.unlinkSync(localFilePath); //delete the file from local system to avoid malicious files 
    return response;
  } catch (error) {
    //file is there on local system but some error while uploading on cloudinary

    fs.unlinkSync(localFilePath); //delete the file from local system to avoid malicious files

    return null;
  }
};

export { uploadOnCloudinary };
