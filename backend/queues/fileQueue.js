const Queue = require("bull");
const { processAndUploadImages, processAndUploadVideo } = require("../services/s3Service");

const redisConfig = { redis: { host: "127.0.0.1", port: 6379 } };

const imageQueue = new Queue("image-processing", redisConfig);
const videoQueue = new Queue("video-processing", redisConfig);

// Process image jobs
imageQueue.process(async (job) => {
    const { file } = job.data;
    file.buffer = Buffer.from(file.buffer, "base64"); // Deserialize buffer
    return await processAndUploadImages(file);
});

// Process video jobs
videoQueue.process(async (job) => {
    const { file } = job.data;
    file.buffer = Buffer.from(file.buffer, "base64"); // Deserialize buffer
    return await processAndUploadVideo(file);
});

module.exports = { imageQueue, videoQueue };
