import Crypto from "../models/Crypto.js";

export async function getAllCrypto(req, res, next) {
  try {
    const crypto = await Crypto.find().sort({ name: 1 });
    res.json({ success: true, count: crypto.length, crypto });
  } catch (error) {
    next(error);
  }
}

export async function getTopGainers(req, res, next) {
  try {
    const crypto = await Crypto.find({ change24h: { $gt: 0 } }).sort({ change24h: -1 });
    res.json({ success: true, count: crypto.length, crypto });
  } catch (error) {
    next(error);
  }
}

export async function getNewListings(req, res, next) {
  try {
    const crypto = await Crypto.find().sort({ createdAt: -1 });
    res.json({ success: true, count: crypto.length, crypto });
  } catch (error) {
    next(error);
  }
}

export async function createCrypto(req, res, next) {
  try {
    const { name, symbol, price, image, change24h } = req.body;

    if (!name || !symbol || price === undefined || !image || change24h === undefined) {
      res.status(400);
      throw new Error("Name, symbol, price, image, and change24h are required.");
    }

    const exists = await Crypto.findOne({ symbol: symbol.toUpperCase() });
    if (exists) {
      res.status(409);
      throw new Error("A cryptocurrency with this symbol already exists.");
    }

    const crypto = await Crypto.create({ name, symbol, price, image, change24h });

    res.status(201).json({
      success: true,
      message: "Cryptocurrency added successfully.",
      crypto
    });
  } catch (error) {
    next(error);
  }
}
