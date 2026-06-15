const express = require("express");
const AuthController = require("../controllers/AuthController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/auth/login", AuthController.login);
router.get("/auth/me", authMiddleware, AuthController.me);

module.exports = router;
