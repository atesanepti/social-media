import express from "express";
import createHttpError from "http-errors";
import { config } from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";
import { cloudinaryConfig } from "./config/cloudinary.config.js";
import { upload } from "./helper/multer.js";
import { uploadImage } from "./helper/image.js";
import { CLOUDINARY } from "./constants/cloudinary.js";

config();

const app = express();

app.use(express.json());

// routers
app.use("/api/user/", userRoutes);
app.use("/api/auth/", authRoutes);
app.use("/api/post/", postRoutes);
app.use("/api/profile/", profileRoutes);
app.use("/api/connection/", connectionRoutes);

//error end point
app.use((req, res, next) => {
  next(createHttpError(404, "Route Not Found"));
});

app.use((error, req, res, next) => {
  const message = error.message || "Server Side Error";
  const status = error.status || 500;
  console.log("ERROR", error)
  return res.status(status).json({
    ok: false,
    error: message,
  });
});

app.listen(process.env.PORT, (error) => {
  if (error) {
    console.error("Error => ", error);
  } else {
    console.log(`Server is running at ${process.env.PORT}`);
    cloudinaryConfig();
  }
});
