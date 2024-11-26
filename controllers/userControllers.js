import createHttpError from "http-errors";
import prisma from "../prisma/index.js";
import { passwordEncrypt, passwordMatch } from "../helper/password.js";
import { isPublic } from "./../helper/publicDataCheck.js";

export const createUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      throw createHttpError(400, "Please fill all of input");
    }

    const hasedPassword = passwordEncrypt(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hasedPassword,
        connections: {
          create: {
            followers: [],
            following: [],
          },
        },
        profile: {
          create: {
            bio: "",
            address: {
              public: true,
              address: "",
            },
            education: {
              public: true,
              instituteName: "",
              instituteLink: "",
              degree: "",
            },
            link: "",
            dob: { public: true, year: "", month: "", day: "" },
            hobies: [],
            occupation: {
              emotion: "",
              name: "",
            },
          },
        },
      },
      select: {
        id: 1,
        email: 1,
        username: 1,
      },
    });

    return res
      .status(201)
      .json({ ok: true, message: "Account Created", user: newUser });
  } catch (error) {
    next(error);
  }
};

export const findMine = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: 1,
        email: 1,
        username: 1,
        profile: 1,
        connections: 1,
      },
    });

    const postCount = await prisma.post.count({
      where: { creatorId: req.user.id },
    });
    const connectionCount = user.connections.followers.length;
    return res
      .status(200)
      .json({ ok: true, message: "Found", user, postCount, connectionCount });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    // const { id } = req.params;
    const selfId = req.user.id;
    const id = req.params.id.replace(/[^a-f0-9]/gi, "");

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: 1,
        email: 1,
        username: 1,
        profile: 1,
      },
    });

    if (!user) {
      next(createHttpError(404, "User not found"));
    }

    const userIsConnected =
      (
        await prisma.connection.findMany({
          where: { userId: id, followers: { hasSome: [selfId] } },
        })
      ).length > 0
        ? true
        : false;

    isPublic(user.profile, ["dob", "address", "education"]);

    const connections = await prisma.connection.findUnique({
      where: { userId: user.id },
    });
    const connectionCount = connections.followers.length;
    const postCount = await prisma.post.count({
      where: { creatorId: user.id },
    });
    const payload = {
      user: user,
      userIsConnected,
      connectionCount,
      postCount,
    };

    console.log("payload ", payload);
    return res.status(200).json({ ok: true, message: "Found", payload });
  } catch (error) {
    console.log("ERRROR ", error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const payload = {};
    Object.keys(req.body).forEach((key) => {
      payload[key] = req.body[key];
    });

    if (payload["newPassword"]) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { password: 1, id: 1, email: 1 },
      });

      const isPasswordMatch = await passwordMatch(
        payload["oldPassword"],
        user.password
      );
      console.log("Is password ", isPasswordMatch);
      if (!isPasswordMatch) {
        return next(createHttpError(401, "Old password was Incorrect!"));
      }

      const hasedPassword = passwordEncrypt(payload["newPassword"]);

      delete payload["newPassword"];
      delete payload["oldPassword"];

      payload.password = hasedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: payload,
      select: {
        id: 1,
        username: 1,
        email: 1,
      },
    });

    if (!updatedUser) {
      next(createHttpError(409, "User not update"));
    }

    return res
      .status(200)
      .json({ message: "User was Updated", ok: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const searchUser = async (req, res, next) => {
  try {
    const search = req.query.search || "";

    let users, usersCount;

    if (search) {
      users = await prisma.user.findMany({
        where: {
          AND: [
            { username: { contains: search, mode: "insensitive" } },
            { username: { not: "" } },
          ],
        },
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              image: true,
              occupation: true,
            },
          },
        },
        take: 10,
      });
      usersCount = await prisma.user.count({
        where: { username: { contains: search, mode: "insensitive" } },
      });
    }

    res.status(200).json({
      message: "User found",
      ok: true,
      payload: { users: users, usersCount },
    });
  } catch (error) {
    next(error);
  }
};
