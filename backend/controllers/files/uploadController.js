const { addImageJob, addVideoJob } = require("../../queues/fileQueue");

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const mimeType = req.file.mimetype;

        if (mimeType.startsWith("image")) {
            // Add the image job to the queue
            await addImageJob({
                buffer: req.file.buffer.toString("base64"), // Serialize buffer
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            });

            return res.status(202).json({
                message: "Image processing job has been queued",
            });
        }

        if (mimeType.startsWith("video")) {
            // Add the video job to the queue
            await addVideoJob({
                buffer: req.file.buffer.toString("base64"), // Serialize buffer
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
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

        const queuedJobs = [];

        // Queue image jobs
        if (req.files.images) {
            req.files.images.forEach((image) => {
                queuedJobs.push(
                    addImageJob({
                        buffer: image.buffer.toString("base64"), // Serialize buffer
                        originalname: image.originalname,
                        mimetype: image.mimetype,
                        size: image.size,
                    })
                );
            });
        }

        // Queue video jobs
        if (req.files.videos) {
            req.files.videos.forEach((video) => {
                queuedJobs.push(
                    addVideoJob({
                        buffer: video.buffer.toString("base64"), // Serialize buffer
                        originalname: video.originalname,
                        mimetype: video.mimetype,
                        size: video.size,
                    })
                );
            });
        }

        // Wait for all jobs to be queued
        await Promise.all(queuedJobs);

        res.status(202).json({
            message: "File processing jobs have been queued",
            totalJobsQueued: queuedJobs.length,
        });
    } catch (error) {
        console.error("Error queuing multiple file processing jobs:", error);
        res.status(500).json({ message: "Error queuing file processing jobs" });
    }
};

module.exports = {
    uploadFile,
    uploadMultipleFiles,
};