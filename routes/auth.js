const express = require("express");
const routerController = require("../controllers/auth");
const router = express.Router();
const authenticateJwt = require("../middelwares/auth");
router.post("/register", routerController.registerUser);
router.post("/registerAsOwner", routerController.registerAsOwner);

router.post("/login", routerController.login);
router.post("/logout", authenticateJwt, routerController.logout);
module.exports = router;
