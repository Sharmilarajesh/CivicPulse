const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendInviteEmail,
} = require("../utils/email");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

const getRedirectPath = (role) => {
  switch (role) {
    case "super_admin":
      return "/admin";
    case "admin":
      return "/admin";
    case "officer":
      return "/officer";
    case "citizen":
      return "/my-reports";
    default:
      return "/";
  }
};

//  Register 
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "citizen",
      ward: "",
      isActive: true,
      isPasswordSet: true,
    });

    await newUser.save();

    sendWelcomeEmail(email, name).catch((err) =>
      console.error("Welcome email failed:", err.message),
    );

    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        ward: newUser.ward,
        district: newUser.district,
      },
      redirectTo: "/my-reports",
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

//  Login 
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Account is deactivated or invite pending" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward,
        district: user.district,
      },
      redirectTo: getRedirectPath(user.role),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

//  Setup 
const setup = async (req, res) => {
  try {
    const existingSuperAdmin = await User.findOne({ role: "super_admin" });
    if (existingSuperAdmin) {
      return res.status(400).json({ message: "Setup already completed" });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "super_admin",
      isPasswordSet: true,
      isActive: true,
    });

    await newUser.save();
    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        ward: newUser.ward,
        district: newUser.district,
      },
      redirectTo: "/admin",
    });
  } catch (err) {
    console.error("Setup error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

//  Invite 
const invite = async (req, res) => {
  try {
    const { name, email, role, ward, district } = req.body;

    if (role === "admin" && req.user.role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Only Super Admin can invite Admins" });
    }

    if (role === "officer" && !ward) {
      return res.status(400).json({ message: "Ward is required for officers" });
    }

    if ((role === "admin" || role === "officer") && !district) {
      return res.status(400).json({ message: "District is required for admins and officers" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenHash = crypto
      .createHash("sha256")
      .update(inviteToken)
      .digest("hex");

    // Create a random placeholder password since it's required by the schema
    const placeholderPassword = crypto.randomBytes(16).toString("hex");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(placeholderPassword, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      ward: role === "officer" ? ward : "",
      district: (role === "admin" || role === "officer") ? district : null,
      isActive: false,
      isPasswordSet: false,
      invitedBy: req.user.id,
      inviteToken: inviteTokenHash,
      inviteTokenExpires: Date.now() + 72 * 60 * 60 * 1000,
    });

    await newUser.save();

    await sendInviteEmail(email, name, role, inviteToken, req.user.name);

    res.status(200).json({ message: `Invite sent to ${email} successfully` });
  } catch (err) {
    console.error("Invite error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

//  Accept Invite 
const acceptInvite = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token)
      return res.status(400).json({ message: "Invite token is required" });
    if (!password)
      return res.status(400).json({ message: "Password is required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const inviteTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      inviteToken: inviteTokenHash,
      inviteTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invite link is invalid or expired" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.isActive = true;
    user.isPasswordSet = true;
    user.inviteToken = undefined;
    user.inviteTokenExpires = undefined;

    await user.save();

    const jwtToken = generateToken(user);

    res.status(200).json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward,
        district: user.district,
      },
      redirectTo: getRedirectPath(user.role),
    });
  } catch (err) {
    console.error("Accept invite error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

//  Forgot Password 
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: "If this email exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    await sendPasswordResetEmail(email, user.name, resetToken);

    res.status(200).json({
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

//  Reset Password 
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Reset token is required" });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Reset token is invalid or has expired",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successful. Please login." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  setup,
  invite,
  acceptInvite,
};
