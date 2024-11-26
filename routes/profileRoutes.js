import express from "express";
const router = express.Router();

import { authorized } from "./../middlewares/authMiddlewares.js";
import { upload } from "../helper/multer.js";
import { uploadProfilePicture } from "../controllers/profileControllers.js";
import { uploadCoverImage } from "../controllers/profileControllers.js";
import { updateProfile } from "../controllers/profileControllers.js";

router.put(
  "/profile",
  authorized,
  upload.single("profile"),
  uploadProfilePicture
);
router.put("/cover", authorized, upload.single("cover"), uploadCoverImage);
router.route("/").put(authorized, updateProfile);

export default router;
