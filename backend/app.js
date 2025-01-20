// Application setup
require("dotenv").config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

// Routes
const uploadRouter = require("./routes/uploadRoutes");


const app = express();
app.use(cors());
app.use(express.json());

app.use("/files", uploadRouter);

// Connect to Database
connectDB();



module.exports = app;