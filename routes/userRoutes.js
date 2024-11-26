import express from "express";
const router = express.Router();

import {
  createUser,
  findMine,
  getUser,
  searchUser,
  updateUser,
} from "../controllers/userControllers.js";
import { authorized } from "./../middlewares/authMiddlewares.js";
import { upload } from "../helper/multer.js";

router.route("/").post(createUser);

router.route("/mine").get(authorized, findMine).put(authorized, updateUser);

router.get("/search", authorized, searchUser);

router.route("/:id").get(authorized, getUser);

export default router;
