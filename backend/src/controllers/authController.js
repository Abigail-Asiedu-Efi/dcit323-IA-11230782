import User from "../models/User.js";
import { setAuthCookie, signToken } from "../utils/token.js";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function defaultAvatar(name) {
  const initial = escapeXml((name || "E").trim().slice(0, 1).toUpperCase() || "E");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#00ff88"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#05070d" font-family="Arial, sans-serif" font-size="72" font-weight="800">${initial}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || defaultAvatar(user.name),
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

export async function updateAvatar(req, res, next) {
  try {
    const { avatar } = req.body;
    const isAllowedImage =
      typeof avatar === "string" && /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(avatar);

    if (!isAllowedImage) {
      res.status(400);
      throw new Error("Upload a PNG, JPG, or WebP profile image.");
    }

    if (avatar.length > 500000) {
      res.status(413);
      throw new Error("Profile image is too large. Choose an image under 350 KB.");
    }

    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true }).select("-password");

    res.json({
      success: true,
      message: "Profile picture updated.",
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res) {
  res.clearCookie("token");
  res.json({
    success: true,
    message: "Logged out successfully."
  });
}
