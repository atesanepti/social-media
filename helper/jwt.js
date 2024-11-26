import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

export const createToken = (
  payload,
  options = {
    expiresIn: "30d",
  }
) => {
  try {
    if (!payload || payload == {}) {
      return "";
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET, options);

    return "Bearar" + " " + token;
  } catch (error) {
    throw error;
  }
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      throw Error;
    }

    return decoded;
  } catch (error) {
    throw createHttpError(400, "Authtication Failed!");
  }
};
