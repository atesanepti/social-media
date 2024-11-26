import express from "express";
const router = express.Router();

import {
  createPost,
  fetchPostsMine,
  deletePost,
  likeOnPost,
  createComment,
  createReplyComment,
  deleteComment,
  updateComment,
  fetchComment,
  fetchPosts,
  mentionSearch,
  createSharedPost,
  fetchSinglePost,
  fetchPostsForNewsfeed,
} from "./../controllers/postControllers.js";
import { authorized } from "./../middlewares/authMiddlewares.js";
import { upload } from "../helper/multer.js";

router.route("/").post(
  authorized,
  upload.fields([
    { name: "time_1", maxCount: 1 },
    { name: "time_2", maxCount: 1 },
  ]),
  createPost
);
router.post("/share", authorized, createSharedPost);

router.get("/mine", authorized, fetchPostsMine);

router
  .route("/:id([0-9a-f]{24})")
  .delete(authorized, deletePost)
  .get(authorized, fetchSinglePost);

router.get("/user/:id([0-9a-f]{24})", authorized, fetchPosts);
router.get("/newsfeed", authorized,fetchPostsForNewsfeed)
router.put("/like/:id", authorized, likeOnPost);


// create (postId, userId) , uppdate(postId, commentId,userId), delete(postId, commentId,userId)
router.post("/comment", authorized, createComment);
router.post("/comment/reply/:id", authorized, createReplyComment);
router
  .route("/comment/:id")
  .delete(authorized, deleteComment)
  .put(authorized, updateComment);

router.get("/comment/:postId", authorized, fetchComment);
router.get("/mentions", authorized, mentionSearch);
export default router;
