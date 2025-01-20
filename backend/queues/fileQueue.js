const Queue = require("bull");
const { processAndUploadImages, processAndUploadVideo } = require("../services/s3Service");
const redisConfig = require("../config/redisConfig");
const File = require("../models/File");

// Initialize queues
const imageQueue = new Queue("image-processing", redisConfig);
const videoQueue = new Queue("video-processing", redisConfig);

// Process image jobs
imageQueue.process(async (job) => {
    const { file } = job.data;
    file.buffer = Buffer.from(file.buffer, "base64"); // Deserialize buffer

    const { urls, dimensions, aspectRatio, format } = await processAndUploadImages(file);

    // Save metadata to database
    await File.create({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        paths: urls, // Multiple sizes
        dimensions,
        aspectRatio,
        format,
    });

    console.log(`Image job ${job.id} completed successfully.`);
});

// Process video jobs
videoQueue.process(async (job) => {
    const { file } = job.data;
    file.buffer = Buffer.from(file.buffer, "base64"); // Deserialize buffer

    const { urls, duration, resolution, frameRate, codec, bitrate } = await processAndUploadVideo(file);

    // Save metadata to database
    await File.create({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        paths: urls, // Multiple formats
        duration,
        resolution,
        frameRate,
        codec,
        bitrate,
    });

    console.log(`Video job ${job.id} completed successfully.`);
});

// Queue events
imageQueue.on("failed", (job, err) => {
    console.error(`Image job ${job.id} failed:`, err);
});

videoQueue.on("failed", (job, err) => {
    console.error(`Video job ${job.id} failed:`, err);
});


// Add retry options for jobs
const addImageJob = (file) => imageQueue.add({ file }, { attempts: 3, backoff: 5000 }); // Retry 3 times with 5s delay
const addVideoJob = (file) => videoQueue.add({ file }, { attempts: 3, backoff: 5000 });

module.exports = { imageQueue, videoQueue, addImageJob, addVideoJob };