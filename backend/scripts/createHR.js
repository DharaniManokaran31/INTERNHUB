/**
 * CREATE HR ACCOUNT SCRIPT
 * Ultra-simple version
 * Command: node scripts/createHR.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Recruiter = require('../models/Recruiter');
const Company = require('../models/Company');

const createHR = async () => {
  console.log('\n🚀 CREATING HR ACCOUNT...\n');

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

    // Check if HR already exists
    const existingHR = await Recruiter.findOne({ email: 'dharani31082005@gmail.com' });
    if (existingHR) {
      console.log('⚠️ HR already exists!');
      console.log('Name:', existingHR.fullName);
      console.log('Email:', existingHR.email);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Dharu@2005', salt);

    // Create HR - with minimal fields
    const hr = new Recruiter({
      fullName: 'Dharani',
      email: 'dharani31082005@gmail.com',
      password: hashedPassword,
      phone: '9361637898',
      role: 'hr',
      companyId: company._id,
      company: company.name,
      department: 'HR',
      designation: 'HR Manager',
      isActive: true,
      isInvited: false,
      invitationStatus: 'accepted',
      permissions: {
        canPostInternship: true,
        canInviteRecruiters: true,
        canPublishCertificates: true
      }
    });

    await hr.save();

    console.log('✅ HR ACCOUNT CREATED SUCCESSFULLY!\n');
    console.log('========================================');
    console.log('👤 Name: Dharani');
    console.log('📧 Email: dharani31082005@gmail.com');
    console.log('🔑 Password: Dharu@2005');
    console.log('👑 Role: HR Manager');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

createHR();