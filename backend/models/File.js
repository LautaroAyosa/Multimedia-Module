const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
    {
        originalName: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        paths: { type: Map, of: String }, // Dynamic key-value pairs for image sizes
        uploadDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);