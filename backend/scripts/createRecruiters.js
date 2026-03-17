/**
 * CREATE RECRUITERS SCRIPT
 * Using Gmail aliases so all emails go to HR's inbox
 * Run this AFTER creating HR
 * Command: node scripts/createRecruiters.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Recruiter = require('../models/Recruiter');
const Company = require('../models/Company');

// Base HR email - all recruiters will be aliases of this
const BASE_EMAIL = 'dharani31082005@gmail.com';

const recruitersList = [
  // Frontend Department (2)
  {
    fullName: 'Rahul Sharma',
    email: 'dharani31082005+rahul@gmail.com',
    phone: '9876543211',
    department: 'Frontend',
    designation: 'Senior Frontend Developer'
  },
  {
    fullName: 'Priya Patel',
    email: 'dharani31082005+priya@gmail.com',
    phone: '9876543212',
    department: 'Frontend',
    designation: 'Frontend Lead'
  },

  // Backend Department (2)
  {
    fullName: 'Arun Kumar',
    email: 'dharani31082005+arun@gmail.com',
    phone: '9876543213',
    department: 'Backend',
    designation: 'Senior Backend Developer'
  },
  {
    fullName: 'Neha Singh',
    email: 'dharani31082005+neha@gmail.com',
    phone: '9876543214',
    department: 'Backend',
    designation: 'Backend Architect'
  },

  // DevOps (1)
  {
    fullName: 'Vikram Reddy',
    email: 'dharani31082005+vikram@gmail.com',
    phone: '9876543215',
    department: 'DevOps',
    designation: 'DevOps Engineer'
  },

  // Mobile (1)
  {
    fullName: 'Sneha Joshi',
    email: 'dharani31082005+sneha@gmail.com',
    phone: '9876543216',
    department: 'Mobile',
    designation: 'Mobile Developer'
  },

  // UI/UX (1)
  {
    fullName: 'Ankit Desai',
    email: 'dharani31082005+ankit@gmail.com',
    phone: '9876543217',
    department: 'UI/UX',
    designation: 'UI/UX Designer'
  },

  // Marketing (1)
  {
    fullName: 'Kavita Nair',
    email: 'dharani31082005+kavita@gmail.com',
    phone: '9876543218',
    department: 'Marketing',
    designation: 'Marketing Manager'
  },

  // Sales (1)
  {
    fullName: 'Rajesh Gupta',
    email: 'dharani31082005+rajesh@gmail.com',
    phone: '9876543219',
    department: 'Sales',
    designation: 'Sales Lead'
  }
];

const createRecruiters = async () => {
  console.log('\n🚀 CREATING PRE-LOADED RECRUITERS...\n');
  console.log('📧 All emails are aliases of:', BASE_EMAIL);
  console.log('✅ All invitation emails will go to HR\'s inbox (dharani31082005@gmail.com)\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/internhub');
    console.log('✅ Connected to MongoDB\n');

    // Get company
    const company = await Company.findOne();
    if (!company) {
      console.log('❌ No company found! Run initCompany.js first.');
      process.exit(1);
    }

    // Get HR (Dharani)
    const hr = await Recruiter.findOne({ email: BASE_EMAIL, role: 'hr' });
    if (!hr) {
      console.log('❌ HR not found! Run createHR.js first.');
      process.exit(1);
    }

    let created = 0;
    let skipped = 0;

    for (const recruiterData of recruitersList) {
      // Check if already exists
      const existing = await Recruiter.findOne({ email: recruiterData.email });
      
      if (existing) {
        console.log(`⏭️  Skipping ${recruiterData.fullName} - already exists`);
        skipped++;
        continue;
      }

      // Create recruiter (NO PASSWORD - they'll set via invite)
      const recruiter = new Recruiter({
        fullName: recruiterData.fullName,
        email: recruiterData.email,
        phone: recruiterData.phone,
        department: recruiterData.department,
        designation: recruiterData.designation,
        company: company.name,
        companyId: company._id,
        role: 'recruiter',
        addedBy: hr._id,
        isInvited: false,
        invitationStatus: 'pending',
        password: '', // No password initially
        permissions: {
          canPostInternship: true,
          canViewApplicants: true,
          canShortlist: true,
          canAcceptReject: true,
          canMentor: true,
          maxInterns: 3,
          departmentOnly: true,
          canInviteRecruiters: false,
          canPublishCertificates: false
        }
      });

      await recruiter.save();
      console.log(`✅ Created: ${recruiterData.fullName} (${recruiterData.department})`);
      created++;
    }

    console.log('\n========================================');
    console.log('📊 SUMMARY:');
    console.log('✅ Created:', created, 'recruiters');
    console.log('⏭️  Skipped:', skipped, 'existing');
    console.log('👥 Total recruiters:', await Recruiter.countDocuments({ role: 'recruiter' }));
    console.log('========================================\n');
    
    console.log('📌 NEXT STEPS:');
    console.log('1️⃣  HR Login (when frontend is ready):');
    console.log('   📧 dharani31082005@gmail.com');
    console.log('   🔑 Dharu@2005');
    console.log('\n2️⃣  HR will see ALL 9 recruiters in dropdown');
    console.log('\n3️⃣  HR can invite them one by one');
    console.log('\n4️⃣  Invitation emails go to YOUR Gmail inbox');
    console.log('   (dharani31082005+rahul@gmail.com, etc.)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

createRecruiters();