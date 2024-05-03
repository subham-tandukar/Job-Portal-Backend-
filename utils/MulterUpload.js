const multer = require("multer");
const path = require("path");
// multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "./tmp"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "pdf_" + uniqueSuffix + path.extname(file.originalname)); // Generate unique filename
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Optional: limit file size (e.g., 5MB)
});

module.exports = upload;
