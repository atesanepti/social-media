import createHttpError from "http-errors";
import prisma from "../prisma/index.js";
import { deleteImage, uploadImage } from "../helper/image.js";
import { CLOUDINARY } from "./../constants/cloudinary.js";

export const createPost = async (req, res, next) => {
  try {
    const payload = {};

    if (req.body.content) {
      payload.content = req.body.content;
    }

    const files = [];
    for (let key in req.files) {
      files.push(req.files[key][0]);
    }

    if (files.length > 0) {
      const largeFile = files.some((file) => {
        return file.size > 2 * (1024 * 1024);
      });

      if (largeFile) {
        console.log(req.files);
        return next(createHttpError(400, "Image has to be below 1MB"));
      }

      const imagePaths = files.map((file) => file.path);
      const url = await uploadImage(imagePaths, {
        folder: `${CLOUDINARY.SOCIAL_MEDIA}/${CLOUDINARY.USER}`,
      });

      payload.images = Array.isArray(url) ? url : [url];
    }

    const newPost = await prisma.post.create({
      data: {
        user: {
          connect: {
            id: req.user.id,
          },
        },
        likes: {
          create: {
            likes: [],
          },
        },

        ...payload,
      },
      include: {
        user: {
          select: {
            username: 1,
            email: 1,
            profile: {
              select: {
                image: 1,
              },
            },
          },
        },
      },
    });

    if (req.body.mentions) {
      const mentionsPayload = JSON.parse(req.body.mentions);
      const mentions = await prisma.mention.create({
        data: {
          users: mentionsPayload,
          post: { connect: { id: newPost.id } },
        },
      });
      if (!mentions) {
        return next(createHttpError(400, "Mentions was not created"));
      }
    }

    return res
      .status(201)
      .json({ ok: true, message: "Post created", payload: newPost });
  } catch (error) {
    next(error);
  }
};

export const createSharedPost = async (req, res, next) => {
  try {
    const payload = {};

    if (req.body.content) {
      payload.content = req.body.content;
    }

    if (req.body.sharedPostId) {
      payload.sharedPostId = req.body.sharedPostId;
    }

    const parentPost = await prisma.post.findUnique({
      where: { id: payload.sharedPostId },
      select: { id: 1, shareId: 1 },
    });

    if (!parentPost) {
      return next(createHttpError(404, "Post not found"));
    }

    if (parentPost.shareId) {
      return next(createHttpError(400, "Can't share post that already shared"));
    }

    const newPost = await prisma.post.create({
      data: {
        content: payload.content,
        sharedPost: { connect: { id: payload.sharedPostId } },

        user: {
          connect: {
            id: req.user.id,
          },
        },
        likes: {
          create: {
            likes: [],
          },
        },
      },
      include: {
        user: {
          select: {
            username: 1,
            email: 1,
            profile: {
              select: {
                image: 1,
              },
            },
          },
        },
      },
    });

    if (req.body.mentions) {
      const mentionsPayload = JSON.parse(req.body.mentions);
      const mentions = await prisma.mention.create({
        data: {
          users: mentionsPayload,
          post: { connect: { id: newPost.id } },
        },
      });
      if (!mentions) {
        return next(createHttpError(400, "Mentions was not created"));
      }
    }

    return res.status(201).json({
      ok: true,
      message: "New shared post was created",
      payload: newPost,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchPosts = async (req, res, next) => {
  try {
    const userId = req.params.id;

    let posts = await prisma.post.findMany({
      where: { creatorId: userId },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        likes: true,
        user: {
          select: {
            id: 1,
            email: 1,
            username: 1,
            profile: {
              select: {
                image: 1,
              },
            },
          },
        },
        mentions: true,
        sharedPost: {
          include: {
            user: {
              select: {
                id: 1,
                email: 1,
                username: 1,
                profile: {
                  select: {
                    image: 1,
                  },
                },
              },
            },
            mentions: true,
          },
        },
      },
    });

    posts.forEach(async (post) => {
      const hasLikedByMe = post.likes.likes.some((like) => like == req.user.id);
      post.hasLikedByMe = hasLikedByMe;

      post.commentCount = await prisma.comments.count({
        where: { postId: post.id },
      });
    });

    return res.status(200).json({
      ok: true,
      message: "Post Fetched",
      payload: posts,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchPostsMine = async (req, res, next) => {
  try {
    let posts = await prisma.post.findMany({
      where: { creatorId: req.user.id },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        likes: true,
        mentions: true,
        user: {
          select: {
            id: 1,
            email: 1,
            username: 1,
            profile: {
              select: {
                image: 1,
              },
            },
          },
        },
        sharedPost: {
          include: {
            user: {
              select: {
                id: 1,
                email: 1,
                username: 1,
                profile: {
                  select: {
                    image: 1,
                  },
                },
              },
            },
            mentions: true,
          },
        },
      },
    });

    posts.forEach(async (post) => {
      const hasLikedByMe = post.likes.likes.some((like) => like == req.user.id);
      post.hasLikedByMe = hasLikedByMe;

      post.commentCount = await prisma.comments.count({
        where: { postId: post.id },
      });
    });

    return res.status(200).json({
      ok: true,
      message: "Post Fetched",
      payload: posts,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchPostsForNewsfeed = async (req, res, next) => {
  try {
    console.log("Called");

    const posts = await prisma.post.findMany({
      include: {
        likes: true,
        user: {
          select: {
            id: 1,
            email: 1,
            username: 1,
            profile: {
              select: {
                image: 1,
              },
            },
          },
        },
        mentions: true,
        sharedPost: {
          include: {
            user: {
              select: {
                id: 1,
                email: 1,
                username: 1,
                profile: {
                  select: {
                    image: 1,
                  },
                },
              },
            },
            mentions: true,
          },
        },
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });
    posts.forEach(async (post) => {
      const hasLikedByMe = post.likes.likes.some((like) => like == req.user.id);
      post.hasLikedByMe = hasLikedByMe;

      post.commentCount = await prisma.comments.count({
        where: { postId: post.id },
      });
    });
    return res
      .status(200)
      .json({ message: "posts found", ok: true, payload: posts });
  } catch (error) {
    next(error);
  }
};

export const fetchSinglePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: id },
      include: {
        likes: true,
        user: {
          select: {
            email: 1,
            id: 1,
            username: 1,
            profile: {
              select: {
                image: 1,
              },
            },
          },
        },
        mentions: true,
        sharedPost: {
          include: {
            user: {
              select: {
                id: 1,
                email: 1,
                username: 1,
                profile: {
                  select: {
                    image: 1,
                  },
                },
              },
            },
            mentions: true,
          },
        },
      },
    });

    if (!post) {
      return next(createHttpError(404, "Post not found"));
    }

    return res
      .status(200)
      .json({ message: "Post Found", ok: true, payload: post });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return next(createHttpError(404, "Post was not found"));
    }

    if (post.creatorId.toString() !== req.user.id.toString()) {
      return next(
        createHttpError(401, "You have no access to Modify This post")
      );
    }

    const deletedPost = await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    if (deletedPost) {
      await deleteImage(deletedPost.images);
    }

    return res.status(200).json({ ok: true, message: "Post wast deleted" });
  } catch (error) {
    next(error);
  }
};

export const likeOnPost = async (req, res, next) => {
  try {
    const { like } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;
    let updatedPost;

    const { likes } = await prisma.likes.findUnique({ where: { postId } });

    const isLikeable = likes.some((l) => l == userId);

    // add a new like on post
    if (like && !isLikeable) {
      await prisma.likes.update({
        where: { postId },
        data: {
          likeCount: { increment: 1 },
          likes: {
            push: userId,
          },
        },
      });
    }
    // remove a like on post
    else if (!like && isLikeable) {
      const newLikes = likes?.filter((l) => l != userId);
      await prisma.likes.update({
        where: { postId },
        data: {
          likeCount: { decrement: 1 },
          likes: {
            set: newLikes,
          },
        },
      });
    }

    return res.status(200).json({ ok: true, message: "Done" });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { postId, text } = req.body;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return next(createHttpError(404, "Post was not found"));

    const newComment = await prisma.comments.create({
      data: {
        text,
        post: { connect: { id: postId } },
        user: { connect: { id: req.user.id } },
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    return res.status(201).json({ ok: true, message: "Comment created" });
  } catch (error) {
    next(error);
  }
};

export const createReplyComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const { postId, text } = req.body;

    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return next(createHttpError(404, "Comment not found"));
    }

    if (comment.isReplied) {
      return next(createHttpError(400, "Nasted Replay not allow"));
    }
    if (!comment) {
      return next(createHttpError(404, "Comment Was not found"));
    }

    const newComment = await prisma.comments.create({
      data: {
        text,
        isReplied: true,
        post: {
          connect: {
            id: postId,
          },
        },
        user: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });

    const updatedComment = await prisma.comments.update({
      where: { id: commentId },
      data: {
        replies: {
          connect: {
            id: newComment.id,
          },
        },
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    return res.status(201).json({ ok: false, message: "Commente created" });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const { text } = req.body;

    const updatedComment = await prisma.comments.update({
      where: { id: commentId },
      data: { text },
    });

    if (!updatedComment) {
      return next(createHttpError(500, "Comment was not updated"));
    }

    return res.status(200).json({ ok: true, message: "Comment was updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;

    const replyComments = await prisma.comments.findUnique({
      where: { id: commentId },
      select: { replies: { select: { id: true, postId: true } } },
    });

    const commentDeleteQuery = prisma.comments.delete({
      where: { id: commentId },
    });

    if (replyComments.replies.length) {
      const deleteReplyCommentsQuery = replyComments.replies.map((reply) => {
        return prisma.comments.delete({ where: { id: reply.id } });
      });

      const allCommentsDelete = await prisma.$transaction([
        ...deleteReplyCommentsQuery,
        commentDeleteQuery,
      ]);

      await prisma.post.update({
        where: { id: replyComments.replies[0].postId },
        data: {
          commentCount: {
            decrement: 1 + replyComments.replies.length,
          },
        },
      });
    } else {
      const deletedComment = await commentDeleteQuery;

      await prisma.post.update({
        where: { id: deletedComment.postId },
        data: {
          commentCount: {
            decrement: 1,
          },
        },
      });
    }

    return res.status(200).json({ message: "Comment deleted", ok: true });
  } catch (error) {
    next(error);
  }
};

export const fetchComment = async (req, res, next) => {
  try {
    console.log("req.params.postId ", req.params.postId);
    const postId = req.params.postId;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return next(createHttpError(404, "Post was not found"));

    const comments = await prisma.comments.findMany({
      where: { AND: [{ postId: postId }, { isReplied: false }] },
      select: {
        replies: {
          select: {
            text: true,
            id: true,
            user: {
              select: {
                username: true,
                profile: {
                  select: {
                    image: true,
                  },
                },
              },
            },
          },
        },
        text: true,
        id: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            profile: {
              select: {
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res
      .status(200)
      .json({ ok: true, message: "Comments fetched", payload: comments });
  } catch (error) {
    next(error);
  }
};

// search for mention
export const mentionSearch = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    let users = [];
    if (search) {
      users = await prisma.user.findMany({
        where: {
          AND: [
            {
              username: { contains: search, mode: "insensitive" },
            },
            {
              id: { not: req.user.id },
            },
          ],
        },
        select: {
          id: 1,
          username: 1,
          profile: {
            select: {
              image: true,
            },
          },
        },
        take: 1,
      });
    }

    return res
      .status(200)
      .json({ message: "User fetched", ok: true, payload: users });
  } catch (error) {
    next(error);
  }
};
