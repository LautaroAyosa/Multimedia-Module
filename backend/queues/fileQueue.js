const Queue = require("bull");
const { processAndUploadImages, processAndUploadVideo } = require("../services/s3Service");
const redisConfig = require("../config/redisConfig");

const imageQueue = new Queue("image-processing", redisConfig);
const videoQueue = new Queue("video-processing", redisConfig);

// Process image jobs
imageQueue.process(async (job) => {
    const { file } = job.data;
    file.buffer = Buffer.from(file.buffer, "base64");
    return await processAndUploadImages(file);
});

// Process video jobs
videoQueue.process(async (job) => {
    const { file } = job.data;
    file.buffer = Buffer.from(file.buffer, "base64");
    return await processAndUploadVideo(file);
});

// Add retry options for jobs
const addImageJob = (file) => imageQueue.add({ file }, { attempts: 3, backoff: 5000 }); // Retry 3 times with 5s delay
const addVideoJob = (file) => videoQueue.add({ file }, { attempts: 3, backoff: 5000 });

module.exports = { imageQueue, videoQueue, addImageJob, addVideoJob };