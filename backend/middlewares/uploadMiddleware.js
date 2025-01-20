const multer = require("multer");

// Configure multer storage to store files in memory for processing
const storage = multer.memoryStorage();

// Create a multer instance with memory storage
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max file size per file
});

// Export multer instance for different use cases
module.exports = {
    single: upload.single.bind(upload), // For single file uploads
    multiple: upload.fields([
        { name: "images", maxCount: 10 }, // Accept up to 10 images
        { name: "videos", maxCount: 5 },  // Accept up to 5 videos
    ]),
};