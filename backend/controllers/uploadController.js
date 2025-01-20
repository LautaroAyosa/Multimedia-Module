const { imageQueue, videoQueue } = require("../queues/fileQueue");
const File = require("../models/File");

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const mimeType = req.file.mimetype;

        if (mimeType.startsWith("image")) {
            // Add image job to the queue
            await imageQueue.add({
                file: {
                    buffer: req.file.buffer.toString("base64"), // Serialize buffer
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                },
            });

            return res.status(202).json({
                message: "Image processing job has been queued",
            });
        }

        if (mimeType.startsWith("video")) {
            // Add video job to the queue
            await videoQueue.add({
                file: {
                    buffer: req.file.buffer.toString("base64"), // Serialize buffer
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                },
            });

            return res.status(202).json({
                message: "Video processing job has been queued",
            });
        }

        return res.status(400).json({ message: "Unsupported file type" });
    } catch (error) {
        console.error("Error queuing file processing job:", error);
        res.status(500).json({ message: "Error queuing file processing job" });
    }
};


const uploadMultipleFiles = async (req, res) => {
    try {
        if (!req.files || (!req.files.images && !req.files.videos)) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        if (req.files.images) {
            req.files.images.forEach((image) => imageQueue.add({ file: image }));
        }

        if (req.files.videos) {
            req.files.videos.forEach((video) => videoQueue.add({ file: video }));
        }

        return res.status(202).json({
            message: "File processing jobs have been queued",
        });
    } catch (error) {
        console.error("Error queuing multiple file processing jobs:", error);
        res.status(500).json({ message: "Error queuing multiple file processing jobs" });
    }
};

module.exports = {
    uploadFile,
    uploadMultipleFiles,
};