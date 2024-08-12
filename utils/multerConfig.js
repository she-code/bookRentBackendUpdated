const multer = require("multer");
const path = require("path");

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Set the filename
    cb(null, `${Date.now()}${ext}`);
  },
});

// Initialize multer with storage configuration
const upload = multer({ storage });

module.exports = upload;
