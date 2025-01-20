// Application setup
require("dotenv").config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const setupQueueMonitoring = require("./monitor/queueMonitor");


// Routes
const uploadRouter = require("./routes/uploadRoutes");


const app = express();
app.use(cors());
app.use(express.json());

app.use("/files", uploadRouter);

setupQueueMonitoring(app);


// Connect to Database
connectDB();



module.exports = app;