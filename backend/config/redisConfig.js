require("dotenv").config();

const redisConfig = {
    redis: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || null, // Add password if needed
        tls: process.env.REDIS_TLS === "true" ? {} : undefined, // Enable TLS if specified
    },
};

module.exports = redisConfig;