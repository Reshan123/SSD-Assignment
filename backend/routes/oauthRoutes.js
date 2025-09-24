const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();

const createToken = (_id, email, role = "petOwner") => {
  return jwt.sign({ _id, email, role }, process.env.SECRET, {
    expiresIn: "3d",
  });
};

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL + "/login?error=auth_failed",
    session: false,
  }),
  (req, res) => {
    const token = createToken(req.user._id, req.user.email, "petOwner");

    // Redirect to frontend with token
    res.redirect(
      `${
        process.env.FRONTEND_URL
      }/pet/signin?token=${token}&user=${encodeURIComponent(
        JSON.stringify({
          id: req.user._id,
          username: req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          isOAuth: true,
        })
      )}`
    );
  }
);

// OAuth login endpoint
router.post(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
  (req, res) => {
    const token = createToken(req.user._id, req.user.email, "petOwner");

    res.json({
      success: true,
      token,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        isOAuth: true,
      },
    });
  }
);

module.exports = router;
