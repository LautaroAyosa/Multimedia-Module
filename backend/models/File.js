const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    paths: { type: Object, required: true }, // URLs for different formats/sizes
    dimensions: { type: String }, // e.g., "1920x1080"
    aspectRatio: { type: String }, // e.g., "16:9"
    format: { type: String }, // e.g., "jpeg", "mp4"
    duration: { type: Number }, // Video duration in seconds
    resolution: { type: String }, // e.g., "1920x1080"
    frameRate: { type: Number }, // Frames per second
    bitrate: { type: Number }, // Bitrate in kbps
    codec: { type: String }, // e.g., "H.264"
    uploadDate: { type: Date, default: Date.now },
    // uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Example of relation to another model
}, { timestamps: true });

module.exports = mongoose.model("File", FileSchema);
