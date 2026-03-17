/**
 * Role-based Authorization Middleware
 * Use after authMiddleware to check user roles
 */

// ===== STUDENT ONLY =====
const studentOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student role required.'
    });
  }

  next();
};

// ===== RECRUITER ONLY =====
const recruiterOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'recruiter') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Recruiter role required.'
    });
  }

  next();
};

// ===== HR ONLY =====
const hrOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'hr') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. HR role required.'
    });
  }

  next();
};

// ===== ADMIN ONLY =====
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  next();
};

// ===== RECRUITER OR HR =====
const recruiterOrHrOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'recruiter' && req.user.role !== 'hr') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Recruiter or HR role required.'
    });
  }

  next();
};

// ===== HR OR ADMIN =====
const hrOrAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'hr' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. HR or Admin role required.'
    });
  }

  next();
};

// ===== ALLOWED ROLES (flexible) =====
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  studentOnly,
  recruiterOnly,
  hrOnly,
  adminOnly,
  recruiterOrHrOnly,
  hrOrAdminOnly,
  allowRoles
};