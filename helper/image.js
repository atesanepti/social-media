import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import createHttpError from "http-errors";
import path from "path";
export const fileDelete = (path) => {
  try {
    fs.unlinkSync(path);
  } catch (error) {
    throw error;
  }
};

export const uploadImage = async (path, options = {}) => {
  try {
    const paths = Array.isArray(path) ? path : [path];

    const uploads = paths.map((path) =>
      cloudinary.uploader.upload(path, {
        ...options,
        transformation: [{ quality: 20, fetch_format: "auto" }],
      })
    );

    const result = await Promise.all(uploads);

    //delete image from server
    paths.forEach((path) => fileDelete(path));

    const urls = [];

    result.forEach((r) => urls.push(r.secure_url));

    if (urls.length == 1) {
      return urls[0];
    }
    return urls;
  } catch (error) {
    throw error;
  }
};

const publicId = (imagePath) => {
  const pathSegments = imagePath.split("/");
  const pathLastSegment = pathSegments[pathSegments.length - 1];
  const extenname = path.extname(imagePath);
  const publicId = pathLastSegment.replace(extenname, "");
  return (
    pathSegments[pathSegments.length - 3] +
    "/" +
    pathSegments[pathSegments.length - 2] +
    "/" +
    publicId
  );
};

export const deleteImage = async (imagePath) => {
  try {
    const imagePaths = Array.isArray(imagePath) ? imagePath : [imagePath];

    const publicIds = imagePaths.map((path) => publicId(path));

    const destoris = publicIds.map((id) => cloudinary.uploader.destroy(id));

    const result = await Promise.all(destoris);
    let isSuccess = false;

    for (let i = 0; i < result.length; i++) {
      if (result[i].result == "ok") {
        isSuccess = true;
      }
    }
    if (isSuccess) {
      return true;
    }
    throw createHttpError(500, "Image was not deleted");
  } catch (error) {
    throw error;
  }
};
