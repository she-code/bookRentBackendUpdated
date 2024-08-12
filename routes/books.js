const express = require("express");
const bookController = require("../controllers/books");
const authenticateJwt = require("../middelwares/auth");
const upload = require("../utils/multerConfig");
const router = express.Router();
router.get(
  "/getApprovedBooks",

  bookController.getApprovedBooks
);

router.use(authenticateJwt);
// router.post(
//   "/addBook",

//   bookController.addBook
// );
router.post(
  "/uploadBook",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  bookController.uploadBook
);

router.get(
  "/getAllBooks",

  bookController.getAllBooks
);
router.get(
  "/getNewBooks",

  bookController.getNewBooks
);
router.get(
  "/getOwnerBooks",

  bookController.getOwnerBooks
);
router.put(
  "/updateBookStatus/:id",

  bookController.updateBookStatus
);
router.get(
  "/:id",

  bookController.getBook
);

router.put(
  "/:id",

  bookController.updateBook
);

router.get("/getBookRequests", bookController.getBookRequests);
module.exports = router;
