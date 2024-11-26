import prisma from "../prisma/index.js";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import { passwordMatch } from "../helper/password.js";
import { createToken, verifyToken } from "../helper/jwt.js";

export const login = async (req, res, next) => {
  try {
    const { password, email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: 1, email: 1, username: 1, password: 1 },
    });
    if (!user) throw createHttpError(404, "User not found");
    console.log("password = ", password);
    const isPasswordMatch = await passwordMatch(password, user.password);

    if (!isPasswordMatch) {
      throw createHttpError(401, "Incorrect password");
    }

    const token = createToken({ id: user.id, email: user.email });

    return res
      .status(200)
      .json({ ok: true, message: "Login Successsful", token, user });
  } catch (error) {
    next(error);
  }
};

export const protectedRoute = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return next(createHttpError(401, "Authentication Failed"));
    }

    const decoded = verifyToken(token.split(" ")[1]);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: 1, email: 1, username: 1 },
    });

    if (!user) {
      return next(createHttpError(404, "Authentication Failed"));
    }

    return res.status(200).json({ ok: true, messaga: "User verifyed", user });
  } catch (error) {
    next(error);
  }
};
