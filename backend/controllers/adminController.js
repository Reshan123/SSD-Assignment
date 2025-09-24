const AdminModel = require("../models/adminModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const login = async (req, res) => {
  try {
    const jwt = require("jsonwebtoken");
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const admin = await AdminModel.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { _id: admin._id, email: admin.email, role: "admin" },
      process.env.SECRET,
      { expiresIn: "3d" }
    );
    res.status(200).json({
      username: admin.username,
      email: admin.email,
      userToken: token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server error" });
  }
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = decoded;
    console.log("Decoded token:", decoded);
  });
  res
    .status(200)
    .json({
      role: req.user.role,
      email: req.user.email,
      id: req.user._id
    });
};

module.exports = { login, verifyToken };
