const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const { imageQueue, videoQueue } = require("../queues/fileQueue");

const setupQueueMonitoring = (app) => {
    // Create an Express Adapter for the dashboard
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath("/admin/queues");

    // Set up Bull Board with queues
    createBullBoard({
        queues: [
            new BullAdapter(imageQueue),
            new BullAdapter(videoQueue),
        ],
        serverAdapter,
    });

    // Mount the Bull Board routes
    app.use("/admin/queues", serverAdapter.getRouter());
};

module.exports = setupQueueMonitoring;
