const express = require("express");
const PromotionController = require("../controllers/PromotionController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/promotions", authMiddleware, PromotionController.index);
router.get("/promotions/:id", authMiddleware, PromotionController.show);
router.post("/promotions", authMiddleware, PromotionController.create);
router.put("/promotions/:id", authMiddleware, PromotionController.update);
router.delete("/promotions/:id", authMiddleware, PromotionController.delete);
router.post(
  "/promotions/:id/products",
  authMiddleware,
  PromotionController.linkProducts
);
router.delete(
  "/promotions/:id/products/:productId",
  authMiddleware,
  PromotionController.unlinkProduct
);

module.exports = router;
