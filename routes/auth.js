const express = require("express");
const routerController = require("../controllers/auth");
const router = express.Router();

router.post("/register", routerController.registerUser);
router.post("/registerAsOwner", routerController.registerAsOwner);

router.post("/login", routerController.login);
router.get("/logout", routerController.logout);
module.exports = router;
