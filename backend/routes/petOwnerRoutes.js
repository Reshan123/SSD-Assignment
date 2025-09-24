const express = require("express");
const {
  authenticateToken,
  requireAdmin,
} = require("../middlewear/authMiddleware");
//controller imports
const petOwnerController = require("../controllers/petOwnerController");
const { loginLimiter } = require("../middlewear/rateLimiter");

//router
const petOwnerRouter = express.Router();

//routes
petOwnerRouter.post("/login", loginLimiter, petOwnerController.login);

petOwnerRouter.post("/signin", petOwnerController.signin);

//update and delete routes are protected and only accessible to authenticated users
petOwnerRouter.put(
  "/updateUserDetailsFromToken",
  authenticateToken,
  petOwnerController.updateUserDetailsFromToken
);

petOwnerRouter.delete(
  "/deleteUserDetailsFromToken",
  authenticateToken,
  petOwnerController.deleteUserDetailsFromToken
);

petOwnerRouter.get("/getAllUsers", petOwnerController.getAllUsers);

//verify token route to check if the token is valid and the user is a pet owner
petOwnerRouter.get(
  "/verifyToken",
  authenticateToken,
  petOwnerController.verifyToken
);

//delete route protected and only accessible to authenticated admins using user ID
petOwnerRouter.delete(
  "/deleteUserFromUserID/:userID",
  authenticateToken,
  requireAdmin,
  petOwnerController.deleteUserFromUserID
);

module.exports = petOwnerRouter;
