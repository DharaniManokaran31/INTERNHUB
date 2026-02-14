const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../middleware/upload");

const studentController = require("../controllers/studentController");

// ===== PUBLIC ROUTES =====
router.post("/register", studentController.registerStudent);
router.post("/login", studentController.loginStudent);
router.post("/forgot-password", studentController.forgotPassword);
router.post("/reset-password/:token", studentController.resetPassword);

// ===== PROFILE ROUTES =====
router.get("/profile", authMiddleware, studentController.getStudentProfile);
router.put("/profile", authMiddleware, studentController.updateStudentProfile);

// ===== RESUME TEXT DATA ROUTES =====
router.put("/resume", authMiddleware, studentController.updateResume);

// ===== RESUME FILE UPLOAD ROUTES =====
router.post(
  "/resume/upload",
  authMiddleware,
  upload.single("resume"),
  studentController.uploadResumeFile
);

router.delete(
  "/resume/remove",
  authMiddleware,
  studentController.removeResumeFile
);

// ===== CERTIFICATE ROUTES (FULL CRUD) =====

// Get all certificates
router.get(
  "/certificates",
  authMiddleware,
  studentController.getCertificates
);

// Upload new certificate (with file)
router.post(
  "/certificates/upload",
  authMiddleware,
  upload.single("certificate"),
  studentController.uploadCertificateFile
);

// Update certificate details (without file)
router.put(
  "/certificates/:certificateId",
  authMiddleware,
  studentController.updateCertificate
);

// Delete certificate (and its file)
router.delete(
  "/certificates/:certificateId",
  authMiddleware,
  studentController.removeCertificate
);

// ===== PASSWORD & APPLICATIONS ROUTES =====
router.put("/change-password", authMiddleware, studentController.changePassword);
router.get("/applications", authMiddleware, studentController.getStudentApplications);

module.exports = router;