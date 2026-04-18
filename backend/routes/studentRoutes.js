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

// ===== CERTIFICATE ROUTES (MUST BE BEFORE /:studentId) =====
// Get official issued certificates
router.get(
  "/issued-certificates",
  authMiddleware,
  studentController.getIssuedCertificates
);

// Get specific official certificate
router.get(
  "/issued-certificates/:id",
  authMiddleware,
  studentController.getIssuedCertificateById
);

// Get student-uploaded certificates
router.get(
  "/certificates",
  authMiddleware,
  studentController.getCertificates
);

// ===== APPLICATIONS ROUTES =====
router.get("/applications", authMiddleware, studentController.getStudentApplications);

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

// ===== PASSWORD ROUTES =====
router.put("/change-password", authMiddleware, studentController.changePassword);

// ===== GET STUDENT BY ID (at the end for safety) =====
router.get("/:studentId", authMiddleware, studentController.getStudentById);

module.exports = router;