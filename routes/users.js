const express = require("express");
const userController = require("../controllers/users");
const authenticateJwt = require("../middelwares/auth");
const router = express.Router();

router.use(authenticateJwt);
router.get(
  "/getOwnerRequests",

  userController.getOwnerRequests
);
router.get(
  "/getOwner/:id",

  userController.getOwner
);
router.put(
  "/becomeOwner",

  userController.requestToBecomeOwner
);
router.patch(
  "/:id/approval",

  userController.setOwnerApprovalStatus
);
router.patch(
  "/updateOwnerStatus/:id",

  userController.updateOwnerStatus
);
router.get("/getAllOwners", userController.getAllOwners);
router.get("/getAllCustomers", userController.getAllCustomers);
router.get("/currentUser", userController.getCurrentUser);
// router.put("/becomeOwner", authenticateJwt, userController.get);

module.exports = router;
