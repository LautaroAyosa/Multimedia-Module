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

// Process and upload multiple image sizes to S3
const processAndUploadImages = async (file) => {
    try {
        const mimeType = "image/jpeg";
        const timestamp = Date.now();
        const baseFileName = file.originalname.split(".")[0];

        
        // Process and upload all sizes in parallel
        const uploadPromises = Object.entries(imageSizes).map(async ([key, config]) => {
            const processedImage = await sharp(file.buffer)
                .resize(config.resize || {})
                .jpeg({ quality: config.quality || 70, progressive: true })
                .toBuffer();

            const fileName = `uploads/${timestamp}_${baseFileName}_${config.suffix}.jpg`;
            const url = await uploadToS3(processedImage, fileName, mimeType);

            return { key, url };
        });

        const urls = await Promise.all(uploadPromises);
        return Object.fromEntries(urls.map(({ key, url }) => [key, url]));
    } catch (error) {
        console.error("Error processing and uploading images:", error);
        throw error;
    }
};

// Process and upload a video to S3
const processAndUploadVideo = async (file) => {
    try {
        const timestamp = Date.now();
        const baseFileName = file.originalname.split(".")[0];
        const tempDir = path.join(__dirname, "../temp");

        // Ensure the `temp` directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const inputFilePath = path.join(tempDir, `${timestamp}_${file.originalname}`);
        const urls = {};

        // Save file buffer to temp file for FFmpeg processing
        fs.writeFileSync(inputFilePath, file.buffer);

        // Process all video formats in parallel
        const videoPromises = Object.entries(videoConfig.formats).map(async ([format, config]) => {
            const outputFilePath = path.join(tempDir, `${timestamp}_${baseFileName}_${config.suffix}.${config.suffix}`);
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

            fs.unlinkSync(outputFilePath); // Clean up temporary file
            return { format, url };
        });

        // Generate and upload thumbnail
        const thumbnailPromise = (async () => {
            const thumbnailFilePath = path.join(tempDir, `${timestamp}_${baseFileName}_thumbnail.jpg`);
            
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

            fs.unlinkSync(thumbnailFilePath); // Clean up temporary file
            return { format: "thumbnail", url };
        })();

        // Wait for all uploads (video formats and thumbnail) to complete
        const videoResults = await Promise.all([...videoPromises, thumbnailPromise]);
        videoResults.forEach(({ format, url }) => {
            urls[format] = url;
        });

        // Clean up input temp file
        fs.unlinkSync(inputFilePath);

        return urls;
    } catch (error) {
        console.error("Error processing and uploading video:", error);
        throw error;
    }
};

module.exports = {
    processAndUploadImages,
    processAndUploadVideo,
};
