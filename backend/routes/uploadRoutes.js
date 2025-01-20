const { uploadFile, uploadMultipleFiles } = require('../controllers/files/uploadController')
const upload = require("../middlewares/uploadMiddleware");
const uploadRouter = require("express").Router();

// Route for single file upload
uploadRouter.post("/upload", upload.single("file"), uploadFile);

// Route for multiple file uploads
uploadRouter.post("/upload-multiple", upload.multiple, uploadMultipleFiles);

module.exports = uploadRouter;
