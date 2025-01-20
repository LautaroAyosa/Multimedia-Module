const File = require("../models/File");
const { processAndUploadImages, processAndUploadVideo } = require("../services/s3Service");

// Utility function to process a single file
const processSingleFile = async (file) => {
    const mimeType = file.mimetype;

    if (mimeType.startsWith("image")) {
        // Process and upload image
        const imageUrls = await processAndUploadImages(file);

        // Save metadata to MongoDB
        const fileData = {
            originalName: file.originalname,
            mimeType: mimeType,
            size: file.size,
            paths: imageUrls, // Save image URLs for multiple sizes
        };

        return await File.create(fileData);
    }

    if (mimeType.startsWith("video")) {
        // Process and upload video
        const videoUrls = await processAndUploadVideo(file);

        // Save metadata to MongoDB
        const fileData = {
            originalName: file.originalname,
            mimeType: mimeType,
            size: file.size,
            paths: videoUrls, // Save video URLs and thumbnail
        };

        return await File.create(fileData);
    }

    throw new Error("Unsupported file type");
};

// Utility function to process multiple files
const processMultipleFiles = async (files) => {
    return await Promise.all(
        files.map(async (file) => {
            try {
                return await processSingleFile(file);
            } catch (error) {
                console.error(`Error processing file ${file.originalname}:`, error);
                return null; // Handle specific file errors gracefully
            }
        })
    );
};


// Upload a single file
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const savedFile = await processSingleFile(req.file);

        res.status(200).json({
            message: "File processed, uploaded to S3, and metadata saved successfully",
            file: savedFile,
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ message: error.message });
    }
};

// Upload multiple files
const uploadMultipleFiles = async (req, res) => {
    try {
        if (!req.files || (!req.files.images && !req.files.videos)) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        const uploadedFiles = [];

        // Process images
        if (req.files.images) {
            const imageResults = await processMultipleFiles(req.files.images);
            uploadedFiles.push(...imageResults);
        }

        // Process videos
        if (req.files.videos) {
            const videoResults = await processMultipleFiles(req.files.videos);
            uploadedFiles.push(...videoResults);
        }

        res.status(200).json({
            message: "Files processed, uploaded to S3, and metadata saved successfully",
            files: uploadedFiles,
        });
    } catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadFile,
    uploadMultipleFiles,
};