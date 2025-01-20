const { imageQueue, videoQueue } = require("../queues/fileQueue");

console.log("File worker started...");

// Listen to image queue events
imageQueue.on("completed", (job, result) => {
    console.log(`Image processing completed: ${job.id}`);
});

imageQueue.on("failed", (job, err) => {
    console.error(`Image processing failed: ${job.id}`, err);
});

// Listen to video queue events
videoQueue.on("completed", (job, result) => {
    console.log(`Video processing completed: ${job.id}`);
});

videoQueue.on("failed", (job, err) => {
    console.error(`Video processing failed: ${job.id}`, err);
});