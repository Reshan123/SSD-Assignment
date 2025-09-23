const express = require("express");
const Message = require("../models/messagemodel");
const { authenticateToken } = require("../middlewear/authMiddleware");

const router = express.Router();
const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");

router.get("/:id", authenticateToken, getMessages);
router.post("/send/:id", authenticateToken, sendMessage);
module.exports = router;
