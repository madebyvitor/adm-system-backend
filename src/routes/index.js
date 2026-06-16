const express = require("express");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const userRoutes = require("./userRoutes");

const router = express.Router();

router.use(authRoutes);
router.use(productRoutes);
router.use(userRoutes);

module.exports = router;
