import User from "../models/User.js";
import { setAuthCookie, signToken } from "../utils/token.js";

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email, and password are required.");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      throw new Error("An account with this email already exists.");
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required.");
    }

    const user = await User.findOne({ email });
    const isMatch = user ? await user.matchPassword(password) : false;

    if (!user || !isMatch) {
      res.status(401);
      throw new Error("Invalid email or password.");
    }

    const token = signToken(user._id);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res) {
  res.json({
    success: true,
    user: publicUser(req.user)
  });
}

export function logout(req, res) {
  res.clearCookie("token");
  res.json({
    success: true,
    message: "Logged out successfully."
  });
}
