const multer = require("multer");
const path = require("path");
// multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, "pdf_" + uniqueSuffix + "_" + file.originalname); // Generate unique filename
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Optional: limit file size (e.g., 5MB)
});

module.exports = upload;
