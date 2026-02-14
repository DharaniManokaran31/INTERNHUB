const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ===== ENSURE UPLOAD DIRECTORIES EXIST =====
const uploadDir = './uploads';
const resumeDir = './uploads/resumes';
const certificateDir = './uploads/certificates';

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(resumeDir)) fs.mkdirSync(resumeDir, { recursive: true });
if (!fs.existsSync(certificateDir)) fs.mkdirSync(certificateDir, { recursive: true });

// ===== CONFIGURE STORAGE =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'resume') cb(null, resumeDir);
    else if (file.fieldname === 'certificate') cb(null, certificateDir);
    else cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const userId = req.user?.id || req.user?._id || 'anonymous';
    cb(null, `${file.fieldname}-${userId}-${uniqueSuffix}${ext}`);
  }
});

// ===== FILE FILTERS =====
const resumeFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, DOC, DOCX files are allowed'), false);
};

const certificateFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, JPG, JPEG, PNG, WEBP files are allowed'), false);
};

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') return resumeFileFilter(req, file, cb);
  if (file.fieldname === 'certificate') return certificateFileFilter(req, file, cb);
  cb(new Error('Unexpected field. Expected "resume" or "certificate"'), false);
};

// ===== CONFIGURE MULTER =====
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { upload };