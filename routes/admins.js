const express = require("express");
const authenticateJwt = require("../middelwares/auth");
const adminController = require("../controllers/admin");
const router = express.Router();

router.put("/approveOwner/:id", authenticateJwt, adminController.approveOwners);
module.exports = router;
