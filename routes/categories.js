const express = require("express");
const categoryController = require("../controllers/category");
const authenticateJwt = require("../middelwares/auth");
const router = express.Router();

router.post("/addCategory", authenticateJwt, categoryController.addCategory);
router.get(
  "/getCategories",

  categoryController.getCategories
);

module.exports = router;
