// require('dotenv').config({path:'./.env'})

import {app} from './app.js';
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env"
});


connectDB()
.then(()=>{
  app.on("error",(error)=>{
    console.log("Error: ",error);
  })
  app.listen(process.env.PORT || 8000,()=>{
    console.log(`App is listening on port ${process.env.PORT || 8000}`);
  })
})
.catch((err)=>{
  console.log("DB connection failed: ",err)
})




/*
import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    app.on("errror", (error) => {
      console.log("Error:", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Error:", error);
    throw error;
  }
})();
*/
