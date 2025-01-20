const videoConfig = {
    formats: {
        mp4: { suffix: "mp4", codec: "libx264", mimeType: "video/mp4", bitrate: "3500k", audioBitrate: "448k" },
        webm: { suffix: "webm", codec: "libvpx", mimeType: "video/webm", bitrate: "1000k", audioBitrate: "128k" },
    },
    thumbnail: {
        suffix: "thumbnail",
        width: 300,
        height: 200,
    },
};

module.exports = { videoConfig };
