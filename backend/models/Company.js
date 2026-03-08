const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, default: "Zoyaraa" },
  email: { type: String, required: true },
  phone: String,
  website: String,
  address: String,
  description: String,
  logo: String,
  gstNumber: String,
  
  // Who is the HR Admin
  hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  
  // Verification status (auto-verified for script)
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'],
    default: 'verified'
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  verifiedAt: Date,
  
  // Documents (optional for script)
  documents: [{
    type: { type: String },
    url: String,
    filename: String,
    verified: { type: Boolean, default: false }
  }],
  
  createdAt: { type: Date, default: Date.now }
});

// ✅ FIXED pre-save hook
companySchema.pre('save', function(next) {
  if (this.isNew) {
    const Company = mongoose.model('Company');
    Company.countDocuments().then(count => {
      if (count >= 1) {
        next(new Error('Only one company (Zoyaraa) can be registered'));
      } else {
        next();
      }
    }).catch(err => next(err));
  } else {
    next();
  }
});

module.exports = mongoose.model('Company', companySchema);