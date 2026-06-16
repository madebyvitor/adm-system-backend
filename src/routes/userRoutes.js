const express = require("express");
const UserController = require("../controllers/UserController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

router.get("/users", authMiddleware, UserController.index);
router.get("/users/:id", authMiddleware, UserController.show);
router.post("/users", authMiddleware, adminMiddleware, UserController.create);
router.put("/users/:id", authMiddleware, adminMiddleware, UserController.update);
router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  UserController.delete
);

module.exports = router;
