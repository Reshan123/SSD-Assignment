const jwt = require("jsonwebtoken");
const PetOwner = require("../models/petOwnerModel");
const Doctor = require("../models/doctorModel");
const AdminModel = require("../models/adminModel");
const secureLogger = require("../utils/secureLogger"); // Add secure logger import

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      secureLogger.warn("Authentication attempt without token", {
        component: "auth",
        action: "token_missing",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.SECRET);

    if (decoded.role) {
      let user;
      if (decoded.role === "admin") {
        user = await AdminModel.findById(decoded._id);
      }

      if (decoded.role === "doctor") {
        user = await Doctor.findById(decoded._id);
      } else if (decoded.role === "petOwner") {
        user = await PetOwner.findById(decoded._id);
      }

      if (!user) {
        secureLogger.warn("Authentication with non-existent user", {
          component: "auth",
          action: "user_not_found",
          userId: decoded._id,
          role: decoded.role,
          ip: req.ip,
        });
        return res.status(401).json({ error: "User no longer exists" });
      }

      req.user = {
        id: decoded._id,
        email: decoded.email,
        name: user.name,
        role: decoded.role,
      };

      secureLogger.info("User authenticated successfully", {
        component: "auth",
        action: "authentication_success",
        userId: decoded._id,
        role: decoded.role,
        ip: req.ip,
      });
      return next();
    }

    // Try to find user in petOwner collection
    let user = await PetOwner.findById(decoded._id);
    let role = "petOwner";

    // If not found in petOwner, try doctor collection
    if (!user) {
      user = await Doctor.findById(decoded._id);
      role = "doctor";
    }

    // If user not found in either collection
    if (!user) {
      secureLogger.warn("Authentication with non-existent user (fallback)", {
        component: "auth",
        action: "user_not_found_fallback",
        userId: decoded._id,
        ip: req.ip,
      });
      return res.status(401).json({ error: "User no longer exists" });
    }

    req.user = {
      id: decoded._id,
      email: user.email,
      name: user.name,
      role: role,
    };

    secureLogger.info("User authenticated successfully (fallback)", {
      component: "auth",
      action: "authentication_success_fallback",
      userId: decoded._id,
      role: role,
      ip: req.ip,
    });
    next();
  } catch (error) {
    secureLogger.error("Token authentication error", {
      component: "auth",
      action: "authentication_error",
      error: error.message,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    secureLogger.warn("Unauthorized admin access attempt", {
      component: "auth",
      action: "unauthorized_admin_access",
      userId: req.user.id,
      role: req.user.role,
      ip: req.ip,
    });
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const requireDoctor = (req, res, next) => {
  if (req.user.role !== "doctor") {
    secureLogger.warn("Unauthorized doctor access attempt", {
      component: "auth",
      action: "unauthorized_doctor_access",
      userId: req.user.id,
      role: req.user.role,
      ip: req.ip,
    });
    return res.status(403).json({ error: "Doctor access required" });
  }
  next();
};

const requireAdminOrDoctor = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "doctor") {
    secureLogger.warn("Unauthorized admin/doctor access attempt", {
      component: "auth",
      action: "unauthorized_admin_doctor_access",
      userId: req.user.id,
      role: req.user.role,
      ip: req.ip,
    });
    return res.status(403).json({ error: "Admin or Doctor access required" });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireDoctor,
  requireAdminOrDoctor,
};
