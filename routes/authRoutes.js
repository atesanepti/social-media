import express from "express";
const router = express.Router();

import { login, protectedRoute } from "./../controllers/authControllers.js";

router.post("/login",login)
router.get("/protected/:token", protectedRoute);

export default router;
