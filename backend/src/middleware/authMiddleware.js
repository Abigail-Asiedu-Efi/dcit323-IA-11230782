import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const token = req.cookies.token || bearer;

    if (!token) {
      res.status(401);
      throw new Error("Authentication required. Please log in.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("The authenticated user no longer exists.");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    next(error);
  }
}
