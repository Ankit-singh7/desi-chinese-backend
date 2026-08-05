// upload.middleware.js
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024  // ✅ increase to 10MB
  }
});

// ✅ Handle multer errors globally
upload.handleError = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).send({
      error: true,
      message: 'File too large. Maximum size is 10MB'
    });
  }
  next(err);
};

module.exports = upload;