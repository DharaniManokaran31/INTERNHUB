const rateLimit = require('express-rate-limit');

const inviteLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 invites per day per HR
  message: {
    success: false,
    message: 'Too many invitations sent from this account. Please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { inviteLimiter };
