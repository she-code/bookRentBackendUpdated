const express = require("express");
const rentController = require("../controllers/rents");
const authenticateJwt = require("../middelwares/auth");

const router = express.Router();
router.use(authenticateJwt);
router.post(
  "/rentBook",

  rentController.rentBook
);
router.get(
  "/getOwnerRents",

  rentController.getOwnerRents
);
router.get(
  "/getRents",

  rentController.getAllRents
);
module.exports = router;
