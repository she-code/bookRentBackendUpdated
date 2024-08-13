const express = require("express");
const bookController = require("../controllers/books");
const authenticateJwt = require("../middelwares/auth");
const upload = require("../utils/multerConfig");
const router = express.Router();
router.get(
  "/getApprovedBooks",

  bookController.getApprovedBooks
);
router.get(
  "/bookCopies/:id",

  bookController.getBookCopy
);
router.get(
  "/bookCopiesEdit/:id",

  bookController.getBookCopyEdit
);
router.post(
  "/uploadBook",
  authenticateJwt,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  bookController.uploadBook
);

router.get("/getAllBooks", authenticateJwt, bookController.getAllBooks);
router.get("/getNewBooks", authenticateJwt, bookController.getNewBooks);
router.get("/getOwnerBooks", authenticateJwt, bookController.getOwnerBooks);
router.patch(
  "/updateBookStatus/:id",
  authenticateJwt,
  bookController.updateBookStatus
);
router.get("/getBookRequests", authenticateJwt, bookController.getBookRequests);

router.get("/:id", bookController.getBook);
router.delete("/:id", authenticateJwt, bookController.deleteBook);
router.put("/:id", authenticateJwt, bookController.updateBook);

module.exports = router;
