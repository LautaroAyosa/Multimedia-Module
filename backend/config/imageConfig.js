const imageSizes = {
    original: {
        suffix: "original",
        resize: null, // No resizing, keep original size
        quality: 100, // Full quality
    },
    thumbnail: {
        suffix: "thumbnail",
        resize: { width: 200 }, // Thumbnail size (200px width)
        quality: 80, // Compressed quality
    },
    medium: {
        suffix: "medium",
        resize: { width: 800 }, // Medium size (800px width)
        quality: 80, // Compressed quality
    },
};

module.exports = { imageSizes };