const express = require("express");
const ProductController = require("../controllers/ProductController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/products", authMiddleware, ProductController.index);
router.post("/products", authMiddleware, ProductController.create);
router.put("/products/:id", authMiddleware, ProductController.update);
router.delete("/products/:id", authMiddleware, ProductController.delete);

module.exports = router;
