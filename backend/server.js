const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Enable mongoose debugging in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Request Logger
app.use((req, res, next) => {
  const logEntry = `[REQUEST] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}\n`;
  console.log(logEntry.trim());
  const logPath = 'E:\\InternHub\\backend\\server.log';
  fs.appendFileSync(logPath, logEntry);
  next();
});

// ===== STATIC FILES =====
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create upload directories if they don't exist
const uploadDirs = [
  './uploads',
  './uploads/resumes',
  './uploads/certificates',
  './uploads/profile-pictures'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// ===== IMPORT ROUTES =====
const studentRoutes = require("./routes/studentRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const companyRoutes = require("./routes/companyRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const dailyLogRoutes = require("./routes/dailyLogRoutes");
const progressRoutes = require("./routes/progressRoutes");
const hrRoutes = require("./routes/hrRoutes");

// ===== PUBLIC ROUTES =====
app.get("/", (req, res) => {
  res.status(200).json({ 
    success: true,
    message: "InternHub Backend is Running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Public certificate verification - FIXED: Check if function exists
try {
  const hrController = require("./controllers/hrController");
  if (hrController && typeof hrController.verifyCertificatePublic === 'function') {
    app.get("/api/public/certificates/verify/:id", hrController.verifyCertificatePublic);
    console.log("✅ Public certificate verification route registered");
  } else {
    console.log("⚠️ verifyCertificatePublic not found, using fallback");
    app.get("/api/public/certificates/verify/:id", (req, res) => {
      res.status(200).json({
        success: true,
        message: "Certificate verification endpoint",
        certificateId: req.params.id,
        note: "This is a placeholder. Implement verifyCertificatePublic in hrController.js"
      });
    });
  }
} catch (error) {
  console.log("⚠️ hrController not loaded yet, using fallback");
  app.get("/api/public/certificates/verify/:id", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Certificate verification endpoint",
      certificateId: req.params.id
    });
  });
}

// ===== API ROUTES =====
app.use("/api/hr", hrRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/recruiters", recruiterRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/daily-logs", dailyLogRoutes);
app.use("/api/progress", progressRoutes);

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Route not found",
    path: req.originalUrl
  });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, 'uploads')}\n`);
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received. Closing server gracefully...');
  try {
    // Close server first
    await new Promise((resolve) => server.close(resolve));
    console.log('✅ Server closed');
    
    // Then close MongoDB connection
    await mongoose.connection.close(false);
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('👋 SIGINT received. Closing server gracefully...');
  try {
    // Close server first
    await new Promise((resolve) => server.close(resolve));
    console.log('✅ Server closed');
    
    // Then close MongoDB connection
    await mongoose.connection.close(false);
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

module.exports = app;