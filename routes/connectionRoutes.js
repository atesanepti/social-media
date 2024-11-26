import express from "express";
import { authorized } from "./../middlewares/authMiddlewares.js";
import {
  connectEstablish,
  disconnectEstablish,
} from "../controllers/connectionControllers.js";
const router = express.Router();

router.put("/connect/:id", authorized, connectEstablish);
router.put("/disconnect/:id", authorized, disconnectEstablish);

export default router;
