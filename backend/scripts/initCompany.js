/**
 * INITIALIZE COMPANY SCRIPT
 * Run this first to create Zoyaraa company
 * Command: node scripts/initCompany.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Company = require('../models/Company');

const initCompany = async () => {
  console.log('\n🚀 INITIALIZING ZOYARAA COMPANY...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/internhub');
    console.log('✅ Connected to MongoDB\n');

    // Check if company already exists
    const existingCompany = await Company.findOne();
    
    if (existingCompany) {
      console.log('⚠️ Company already exists!');
      console.log('Name:', existingCompany.name);
      console.log('Email:', existingCompany.email);
      process.exit(0);
    }

    // Create company
    const company = new Company({
      name: 'Zoyaraa',
      email: 'careers@zoyaraa.com',
      phone: '9876543210',
      website: 'https://www.zoyaraa.com',
      description: 'Zoyaraa is a technology company offering internship opportunities to students.',
      industry: 'Technology',
      size: '51-200',
      foundedYear: 2020,
      address: {
        street: 'Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        pincode: '560038'
      },
      departments: [
        { name: 'Frontend', isActive: true },
        { name: 'Backend', isActive: true },
        { name: 'DevOps', isActive: true },
        { name: 'Marketing', isActive: true },
        { name: 'HR', isActive: true },
        { name: 'Sales', isActive: true },
        { name: 'UI/UX', isActive: true },
        { name: 'Mobile', isActive: true }
      ],
      settings: {
        allowMultipleApplications: true,
        requireResume: true,
        requireCoverLetter: false,
        maxRecruiters: 50,
        internshipDuration: 90
      },
      verificationStatus: 'verified'
    });

    await company.save();
    
    console.log('✅ ZOYARAA COMPANY CREATED SUCCESSFULLY!\n');
    console.log('========================================');
    console.log('🏢 Name:', company.name);
    console.log('📧 Email:', company.email);
    console.log('📞 Phone:', company.phone);
    console.log('📍 Location:', company.address.city, company.address.state);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

initCompany();