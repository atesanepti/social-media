import createHttpError from "http-errors";
import prisma from "../prisma/index.js";
import { fileDelete, uploadImage } from "./../helper/image.js";
import { CLOUDINARY } from "./../constants/cloudinary.js";

export const uploadProfilePicture = async (req, res, next) => {
  try {
    const payload = {};
    if (req.file.size > 1024 * 1024) {
      fileDelete(req.file.path);
      return next(createHttpError(400, "Image has to be below 1MB"));
    } else {
      const imagePath = await uploadImage(req.file.path, {
        folder: `${CLOUDINARY.SOCIAL_MEDIA}/${CLOUDINARY.USER}`,
      });
      payload.image = imagePath;
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        image: payload.image,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Profile Picture updated",
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCoverImage = async (req, res, next) => {
  try {
    const payload = {};
    if (req.file.size > 1024 * 1024) {
      fileDelete(req.file.path);
      return next(createHttpError(400, "Image has to be below 1MB"));
    } else {
      const imagePath = await uploadImage(req.file.path, {
        folder: `${CLOUDINARY.SOCIAL_MEDIA}/${CLOUDINARY.USER}`,
      });
      payload.image = imagePath;
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        cover: payload.image,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Cover Picture updated",
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const payload = {};

    for (let key in req.body) {
      payload[key] = req.body[key];
    }

    const updatedProfile = await prisma.profile.update({
      where: {
        userId: req.user.id,
      },
      data: {
        ...payload,
      },
    });

    return res.status(201).json({
      message: "Profile Updateed",
      ok: true,
      payload: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};
