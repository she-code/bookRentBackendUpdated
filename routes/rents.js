const express = require("express");
const rentController = require("../controllers/rents");
const authenticateJwt = require("../middelwares/auth");

const router = express.Router();
router.post(
  "/rentBook",

  rentController.rentBook
);
module.exports = router;
