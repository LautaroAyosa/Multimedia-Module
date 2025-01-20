const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME } = require("../config/env");
const { imageSizes } = require("../config/imageConfig");
const { videoConfig } = require("../config/videoConfig");

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

// Upload a file buffer to S3
const uploadToS3 = async (buffer, fileName, mimeType) => {
    const params = {
        Bucket: S3_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: mimeType,
    };

    const result = await s3Client.send(new PutObjectCommand(params));

    return `https://${params.Bucket}.s3.${AWS_REGION}.amazonaws.com/${params.Key}`;
};

// Process and upload images to S3
const processAndUploadImages = async (file) => {
    try {
        const sharpInstance = sharp(file.buffer);
        const metadata = await sharpInstance.metadata();

        const mimeType = "image/jpeg";
        const timestamp = Date.now();
        const baseFileName = file.originalname.split(".")[0];

        const uploadPromises = Object.entries(imageSizes).map(async ([key, config]) => {
            const processedImage = await sharpInstance
                .resize(config.resize || {})
                .jpeg({ quality: config.quality || 70, progressive: true })
                .toBuffer();

            const fileName = `uploads/${timestamp}_${baseFileName}_${config.suffix}.jpg`;
            const url = await uploadToS3(processedImage, fileName, mimeType);

            return [key, url];
        });

        const urls = Object.fromEntries(await Promise.all(uploadPromises));

        return {
            urls,
            dimensions: `${metadata.width}x${metadata.height}`,
            aspectRatio: (metadata.width / metadata.height).toFixed(2),
            format: metadata.format,
        };
    } catch (error) {
        console.error("Error processing and uploading images:", error);
        throw error;
    }
};


// Process and upload a video to S3
const processAndUploadVideo = async (file) => {
    const tempDir = path.join(__dirname, "../temp");
    const timestamp = Date.now();
    const baseFileName = file.originalname.split(".")[0];
    const inputFilePath = path.join(tempDir, `${timestamp}_${file.originalname}`);
    const urls = {};

    // Ensure the `temp` directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
        // Save file buffer to temp file for FFmpeg processing
        fs.writeFileSync(inputFilePath, file.buffer);

        // Process all video formats in parallel
        const videoPromises = Object.entries(videoConfig.formats).map(async ([format, config]) => {
            const outputFilePath = path.join(tempDir, `${timestamp}_${baseFileName}_${config.suffix}.${config.suffix}`);
            try {
                await new Promise((resolve, reject) => {
                    ffmpeg(inputFilePath)
                        .videoCodec(config.codec)
                        .outputOptions(`-b:v ${config.bitrate}`) // Set video bitrate dynamically
                        .outputOptions(`-b:a ${config.audioBitrate}`) // Set audio bitrate dynamically
                        .outputOptions("-preset ultrafast") // Use fast encoding
                        .on("end", resolve)
                        .on("error", reject)
                        .save(outputFilePath);
                });

                const buffer = fs.readFileSync(outputFilePath);
                const url = await uploadToS3(buffer, `uploads/${timestamp}_${baseFileName}_${config.suffix}.${config.suffix}`, config.mimeType);

                return { format, url };
            } finally {
                if (fs.existsSync(outputFilePath)) {
                    fs.unlinkSync(outputFilePath); // Ensure cleanup of temp files
                }
            }
        });

        // Generate and upload thumbnail
        const thumbnailPromise = (async () => {
            const thumbnailFilePath = path.join(tempDir, `${timestamp}_${baseFileName}_thumbnail.jpg`);
            try {
                await new Promise((resolve, reject) => {
                    ffmpeg(inputFilePath)
                        .screenshots({
                            count: 1,
                            folder: tempDir,
                            filename: `${timestamp}_${baseFileName}_thumbnail.jpg`,
                            size: `${videoConfig.thumbnail.width}x${videoConfig.thumbnail.height}`,
                        })
                        .on("end", resolve)
                        .on("error", reject);
                });

                const thumbnailBuffer = fs.readFileSync(thumbnailFilePath);
                const url = await uploadToS3(thumbnailBuffer, `uploads/${timestamp}_${baseFileName}_thumbnail.jpg`, "image/jpeg");

                return { format: "thumbnail", url };
            } finally {
                if (fs.existsSync(thumbnailFilePath)) {
                    fs.unlinkSync(thumbnailFilePath); // Ensure cleanup of temp files
                }
            }
        })();

        // Extract metadata
        const metadata = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputFilePath, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
        const duration = metadata.format.duration;
        const resolution = `${metadata.streams[0].width}x${metadata.streams[0].height}`;
        const frameRate = eval(metadata.streams[0].avg_frame_rate);
        const codec = metadata.streams[0].codec_name;
        const bitrate = metadata.format.bit_rate / 1000;

        // Wait for all uploads (video formats and thumbnail) to complete
        const videoResults = await Promise.all([...videoPromises, thumbnailPromise]);
        videoResults.forEach(({ format, url }) => {
            urls[format] = url;
        });

        return { urls, duration, resolution, frameRate, codec, bitrate };
    } catch (error) {
        console.error("Error processing and uploading video:", error);
        throw error;
    } finally {
        // Clean up the input temp file
        if (fs.existsSync(inputFilePath)) {
            fs.unlinkSync(inputFilePath);
        }
    }
};


module.exports = {
    processAndUploadImages,
    processAndUploadVideo,
};
