import multer from "multer";

//we are using disk storage to store the files on the server

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
    // not a good idea to use original name in production, but its temporary & then uploaded to cloud so its fine
  },
});

export const upload = multer({ storage,});

//ES6 = Modern JavaScript (clean, powerful, modular)