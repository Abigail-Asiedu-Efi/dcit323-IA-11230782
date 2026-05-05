import express from "express";
import {
  createCrypto,
  getAllCrypto,
  getNewListings,
  getTopGainers
} from "../controllers/cryptoController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllCrypto);
router.get("/gainers", getTopGainers);
router.get("/new", getNewListings);
router.post("/", protect, createCrypto);

export default router;
